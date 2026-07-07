// Docs chat worker: runs 1-bit Bonsai 1.7B in the browser via WebGPU.
// Model: onnx-community/Bonsai-1.7B-ONNX (Apache 2.0). No data leaves the device.
import {
  AutoTokenizer,
  AutoModelForCausalLM,
  TextStreamer,
} from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.1'

const MODEL_ID = 'onnx-community/Bonsai-1.7B-ONNX'
let tokenizer = null
let model = null
let loadedDtype = null

async function load(dtype) {
  tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID)
  model = await AutoModelForCausalLM.from_pretrained(MODEL_ID, {
    device: 'webgpu',
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
}

self.onmessage = async (e) => {
  const msg = e.data
  if (msg.type === 'load') {
    try {
      await load('q1')
    } catch (err) {
      self.postMessage({ type: 'status', text: '1-bit build failed here, falling back to 4-bit' })
      try {
        await load('q4')
      } catch (err2) {
        self.postMessage({ type: 'error', message: String(err2) })
        return
      }
    }
    self.postMessage({ type: 'ready', dtype: loadedDtype })
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
      self.postMessage({ type: 'error', message: String(err) })
    }
  }
}
