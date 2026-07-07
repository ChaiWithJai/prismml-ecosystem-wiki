---
title: "How much VRAM do I need to run an LLM?"
description: "VRAM must hold the model weights plus roughly 50 percent headroom for KV cache and activations. Forgetting that headroom causes OOM crashes at long context."
audience: inference-engineer
pillar: foundational-concept
book: inference-engineering
chapter_ref: "Ch. 3, sec. 3.1.2 Memory and Caches"
status: draft
last_reviewed: 2026-07-06
---

VRAM must hold the model weights plus roughly 50 percent headroom for the KV cache and activations, so weights fitting is not enough. Forgetting KV cache headroom is the most common capacity planning failure. It shows up as OOM crashes, or as mysteriously slow inference once your users send long context. {% .lead %}

## Start from the rule in the book

Philip Kiely's *Inference Engineering* (Ch. 3, sec. 3.1.2) states the rule directly. The VRAM should hold "the model weights, plus at least 50 percent headroom for KV cache", and he adds that long context and high batch sizes need more than that. He also names the two failure modes. If the weights alone do not fit, the model fails to load with an out of memory error. If the weights fit but the headroom does not, inference is slow or crashes later with the same error.

The second failure is the one that surprises people. The model loads fine, the demo works, and then the server crashes in production. The gap between "it loads" and "it runs" is the KV cache.

## Compute the weights first

The weights number is easy. Multiply the parameter count by the bytes per parameter.

- FP16 uses 2 bytes per parameter. A 7B model needs about 14 GB for weights.
- FP8 uses 1 byte per parameter. The same model needs about 7 GB.
- A 4-bit quantization such as Q4_K_M uses roughly 0.56 bytes per parameter, so the same model needs about 4 GB.

Many people stop here, see that 14 GB fits on a 24 GB card, and conclude that they are done. That is the mistake.

## Add the KV cache

The KV cache stores the attention keys and values for every token in the context, so the server does not recompute them on each new token. Its size grows linearly with context length. The formula per token is 2 (one for keys, one for values) times the layer count, times the KV head count, times the head dimension, times the bytes per value.

Here is the worked example for a Llama-2 style 7B model with 32 layers, 32 KV heads, a head dimension of 128, and FP16 cache values.

- Per token: 2 x 32 x 32 x 128 x 2 bytes = 524,288 bytes, which is 0.5 MB per token.
- At 2K context: 2,048 x 0.5 MB = 1 GB.
- At 32K context: 32,768 x 0.5 MB = 16 GB.

Now put the budget together for a 24 GB card.

- FP16 weights at 32K context: 14 GB + 16 GB = 30 GB. This does not fit. It OOMs even at batch size 1.
- Q4 weights at 32K context: 4 GB + 16 GB = 20 GB. This fits, but only 4 GB is left for activations and everything else, and a second concurrent request doubles the cache demand.

Two things soften this in practice, and you should know both. First, models with grouped query attention have fewer KV heads. A model with 8 KV heads instead of 32 cuts the cache to 0.125 MB per token, so 32K context needs 4 GB instead of 16 GB. Second, most servers can quantize the cache itself to 8 bits, which halves it again. But the shape of the problem does not change. The cache still grows linearly with context and with batch size, and at some context length it no longer fits on any card.

{% callout type="warning" title="Batch size multiplies the cache" %}
The arithmetic above is for one request. Ten concurrent requests at 32K context each need ten separate KV caches. This is why a server that handles one long chat fine can crash the moment real traffic arrives.
{% /callout %}

Kiely also notes in the same section that memory bandwidth, not memory size, is the bottleneck for decode at low to medium batch sizes. Size decides whether you can run the model at all, and bandwidth decides how fast the tokens come out. This post is about the first question.

## Try it

Watch the failure happen on your own machine. You need llama.cpp and any 7B or 8B GGUF file. The [Bonsai llama.cpp recipe](/docs/build-and-run/bonsai-llamacpp) gets you a working setup if you do not have one.

Load the model at a small context and note the memory use. On macOS, watch the process in Activity Monitor or with `top`. On Linux with a GPU, use `nvidia-smi`.

```bash
llama-server -m ./model-q4_k_m.gguf -c 2048
```

Record the resident memory. Then stop the server and reload at a long context.

```bash
llama-server -m ./model-q4_k_m.gguf -c 32768
```

The difference between the two readings is the KV cache allocation plus a small compute buffer. Now keep doubling the context until the load fails or the machine starts swapping. That context length is the failure point for this model on this hardware. Before each run, predict the memory use with the formula above, and check your prediction against the reading. The whole loop takes under 30 minutes.

## Check yourself

1. A 7B model at FP16 on a 24 GB card. How much room is left for KV cache after the weights load? Expected answer: 24 - 14 = 10 GB, minus a compute buffer, so 32K context at 0.5 MB per token (16 GB) does not fit.
2. The same model quantized to Q4. Does 32K fit now? Expected answer: weights drop to about 4 GB, so about 20 GB is free and the 16 GB cache fits, with little margin.
3. Your model uses grouped query attention with 8 KV heads instead of 32. What happens to the cache budget? Expected answer: the cache shrinks by 4x, to 0.125 MB per token, so 32K context needs about 4 GB.
4. A teammate says "the model is 14 GB and the card is 16 GB, so we are fine." What do you ask? Expected answer: at what context length and what batch size, because the KV cache is not in that 14 GB.

## Next steps

- [KV cache](/docs/technical-guides/kv-cache) explains where the cache comes from and why servers keep it at all.
- [Hardware requirements](/docs/getting-started/hardware-requirements) maps common cards and Macs to the model sizes they can hold.
- [What are the three layers of an inference stack?](/blog/three-layers-of-an-inference-stack) places this memory budget inside the runtime layer, which is one of three layers you have to get right.

When you can do this, you can produce a weights plus KV memory budget for any model and hardware pair and identify the failure point before you ever load the model.
