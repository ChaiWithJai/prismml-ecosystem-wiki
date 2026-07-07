---
title: Blog
---

A book club of one, in public. Each post takes an idea from Philip Kiely's Inference Engineering or Marily Nika's Building AI-Powered Products, tests it against running models on real hardware, and turns it into something you can practice in under 30 minutes. Every post ends with an exercise and a self-check. {% .lead %}

## Foundational concepts

The ideas under every inference decision, from the KV cache to quantization.

- [What are the three layers of an inference stack?](/blog/three-layers-of-an-inference-stack)
- [Should I use a shared LLM API or a dedicated deployment?](/blog/shared-llm-api-vs-dedicated-deployment)
- [Why is model selection the biggest inference optimization?](/blog/model-selection-biggest-inference-optimization)
- [What do TTFT and TPS actually measure for LLMs?](/blog/what-do-ttft-and-tps-measure)
- [Why should I report P99 latency instead of average?](/blog/why-report-p99-latency-not-average)
- [What are prefill and decode in LLM inference?](/blog/what-are-prefill-and-decode)
- [How does the KV cache make attention linear instead of quadratic?](/blog/kv-cache-linear-attention)
- [Why is LLM prefill compute-bound but decode memory-bound?](/blog/prefill-compute-bound-decode-memory-bound)
- [Why are GPUs faster than CPUs for AI inference?](/blog/why-gpus-beat-cpus-for-inference)
- [How much VRAM do I need to run an LLM?](/blog/how-much-vram-to-run-an-llm)
- [Why does quantization make LLM inference faster in both prefill and decode?](/blog/why-quantization-speeds-up-inference)
- [How do I verify a quantized model hasn't lost quality?](/blog/verify-quantized-model-quality)
- [How does speculative decoding generate more than one token per forward pass?](/blog/how-speculative-decoding-works)
- [Why do API providers charge less for cached input tokens?](/blog/why-cached-input-tokens-cost-less)
- [Why does batch size trade latency for throughput in LLM serving?](/blog/batch-size-latency-throughput-tradeoff)
- [What does 'intelligence density' actually measure — and why isn't it just tokens per second?](/blog/what-is-intelligence-density)

## Ecosystem players

The runtimes, engines, and platforms that serve small models, compared honestly.

- [vLLM vs SGLang vs TensorRT-LLM — which inference engine should I pick?](/blog/vllm-vs-sglang-vs-tensorrt-llm)
- [What do FlashAttention and PagedAttention actually optimize?](/blog/flashattention-vs-pagedattention)
- [Why is Apple Silicon good for running LLMs locally?](/blog/why-apple-silicon-runs-llms-well)
- [Ollama vs llama.cpp — which should I use for local inference?](/blog/ollama-vs-llama-cpp)
- [How do I benchmark an LLM server properly?](/blog/how-to-benchmark-an-llm-server)

## End-user case studies

How real teams in regulated and cost-sensitive settings adopt local AI.

- [What does a hospital CTO actually ask before running a model on-prem?](/blog/hospital-cto-on-prem-ai-questions)
- [Should I run AI on-device or in the cloud? The eight-factor tradeoff](/blog/on-device-vs-cloud-ai-inference)
- [At what token volume does running my own GPU beat a per-token API?](/blog/token-volume-where-own-gpu-beats-api)
- [What does an AI product manager actually do day to day?](/blog/what-does-an-ai-product-manager-do)

More posts land in waves; the full plan covers 87 pieces across these three tracks.
