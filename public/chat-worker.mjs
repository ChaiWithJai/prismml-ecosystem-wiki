// Docs chat worker: runs 1-bit Bonsai 1.7B in the browser via WebGPU.
// Model: onnx-community/Bonsai-1.7B-ONNX (Apache 2.0). No data leaves the device.
//
// NOTE: transformers.js must be >= 4.x for this model. The 'q1' dtype does not
// exist in 3.x (its dtype enum stops at q4/q4f16/bnb4), and the ONNX exports in
// this repo crash the ONNX Runtime bundled with 3.7.x with a raw WASM exception
// pointer (a bare number like "11520648") on both the webgpu and wasm backends.
// Verified against 4.2.0: q1 on webgpu loads and generates.
import {
  AutoTokenizer,
  AutoModelForCausalLM,
  TextStreamer,
} from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0'

const MODEL_ID = 'onnx-community/Bonsai-1.7B-ONNX'
let tokenizer = null
let model = null
let loadedDtype = null
let loadedDevice = null

// Turn anything a backend throws into something a human can read. ONNX
// Runtime's WASM build throws bare numbers (C++ exception pointers), which
// String() would render as e.g. "11520648".
function describeError(err, device, dtype) {
  const raw = String(err?.message ?? err)
  const detail =
    typeof err === 'number'
      ? `ONNX Runtime aborted with internal code ${raw} (a WASM exception pointer, not a real error message)`
      : raw
  return `[device=${device}, dtype=${dtype}] ${detail}`
}

async function load(device, dtype) {
  tokenizer ??= await AutoTokenizer.from_pretrained(MODEL_ID)
  model = await AutoModelForCausalLM.from_pretrained(MODEL_ID, {
    device,
    dtype,
    progress_callback: (p) => {
      if (p.status === 'progress' && p.total) {
        self.postMessage({
          type: 'progress',
          file: p.file,
          loaded: p.loaded,
          total: p.total,
        })
      }
    },
  })
  loadedDtype = dtype
  loadedDevice = device
}

// The load ladder: fastest first, slowest-but-alive last.
const LOAD_LADDER = [
  { device: 'webgpu', dtype: 'q1', label: '1-bit build on WebGPU' },
  { device: 'webgpu', dtype: 'q4', label: '4-bit build on WebGPU' },
  { device: 'wasm', dtype: 'q4', label: '4-bit build on CPU (WASM) — slower, but it runs' },
]

self.onmessage = async (e) => {
  const msg = e.data
  if (msg.type === 'load') {
    const failures = []
    for (let i = 0; i < LOAD_LADDER.length; i++) {
      const { device, dtype, label } = LOAD_LADDER[i]
      self.postMessage({ type: 'status', text: `Trying the ${label}…` })
      try {
        await load(device, dtype)
        self.postMessage({ type: 'ready', dtype: loadedDtype, device: loadedDevice })
        return
      } catch (err) {
        const reason = describeError(err, device, dtype)
        failures.push(reason)
        const next = LOAD_LADDER[i + 1]
        if (next) {
          self.postMessage({
            type: 'status',
            text: `The ${label} failed here (${reason}). Falling back to the ${next.label}…`,
          })
        }
      }
    }
    self.postMessage({
      type: 'error',
      message: `Every backend failed to start the model. ${failures.join(' | ')}`,
    })
    return
  }

  if (msg.type === 'generate') {
    if (!model || !tokenizer) {
      self.postMessage({ type: 'error', message: 'Model not loaded yet.' })
      return
    }
    try {
      const inputs = tokenizer.apply_chat_template(msg.messages, {
        add_generation_prompt: true,
        return_dict: true,
        enable_thinking: false,
      })
      const inputTokens = inputs.input_ids?.dims?.at(-1) ?? null
      self.postMessage({ type: 'phase', phase: 'prefill', inputTokens })
      let firstTokenAt = null
      let tokens = 0
      const t0 = performance.now()
      const streamer = new TextStreamer(tokenizer, {
        skip_prompt: true,
        skip_special_tokens: true,
        callback_function: (text) => {
          if (firstTokenAt === null) {
            firstTokenAt = performance.now()
            self.postMessage({ type: 'phase', phase: 'decode', ttftMs: firstTokenAt - t0 })
          }
          tokens += 1
          self.postMessage({ type: 'token', text })
        },
      })
      await model.generate({
        ...inputs,
        max_new_tokens: 384,
        do_sample: false,
        streamer,
      })
      const t1 = performance.now()
      self.postMessage({
        type: 'done',
        ttftMs: firstTokenAt ? firstTokenAt - t0 : null,
        tokensPerSecond:
          firstTokenAt && t1 > firstTokenAt ? (tokens / ((t1 - firstTokenAt) / 1000)) : null,
        outputTokens: tokens,
        inputTokens,
        dtype: loadedDtype,
      })
    } catch (err) {
      self.postMessage({
        type: 'error',
        message: describeError(err, loadedDevice ?? 'unknown', loadedDtype ?? 'unknown'),
      })
    }
  }
}
