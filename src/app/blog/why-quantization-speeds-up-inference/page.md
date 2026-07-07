---
title: "Why does quantization make LLM inference faster in both prefill and decode?"
description: "Halving precision doubles effective FLOPS for prefill and memory bandwidth for decode, but overhead cuts real gains to 30 to 50 percent per step."
audience: inference-engineer
pillar: foundational-concept
book: inference-engineering
chapter_ref: "Ch. 5, sec. 5.1 (p. 120)"
status: draft
last_reviewed: 2026-07-06
---

Halving precision doubles the effective Tensor Core FLOPS for compute-bound prefill, and it doubles the effective memory bandwidth for memory-bound decode. It is one lever that pulls both phases at once. Overhead means real gains run 30 to 50 percent per precision step, not the theoretical 2x, which is why benchmarks never match the spec-sheet math. {% .lead %}

## Understand why one lever pulls both phases

Prefill and decode hit different hardware limits. Prefill processes every prompt token at once, so it is limited by how fast the GPU can do matrix math. Decode produces one token at a time, and each token needs the GPU to read every model weight from memory, so decode is limited by memory bandwidth.

Most optimizations help one phase. Quantization helps both, because cutting the number of bits per weight changes both limits at the same time.

- In prefill, the matrix math runs on lower-precision Tensor Cores, and those cores do twice the operations per second at each step down in precision.
- In decode, each weight is half the size, so the GPU reads the whole model in half the time. The bandwidth did not change, but the data did.

Kiely's Inference Engineering (Ch. 5, sec. 5.1) makes this the core case for quantization. It improves both time to first token and tokens per second, and it frees up headroom for other techniques like speculation and prefix caching.

## Work through the decode arithmetic

Decode speed has a hard ceiling that you can compute by hand. Each generated token requires one full read of the model weights, so the ceiling is memory bandwidth divided by model size. Take a 7B parameter model on a GPU with 1,000 GB/s of memory bandwidth. These are ceilings from arithmetic, not benchmark results.

| Format | Approx. bits per weight | Model size | Decode ceiling |
| --- | --- | --- | --- |
| FP16 | 16 | 14 GB | ~71 tokens/s |
| Q8_0 | 8.5 | 7.4 GB | ~135 tokens/s |
| Q4_K_M | ~4.8 | 4.2 GB | ~238 tokens/s |

The ratios in the table are the theoretical best case. Q8_0 to Q4_K_M is a 1.76x ceiling, not 2x, because Q4_K_M stores about 4.8 bits per weight once you count its scale factors, not 4.

## Expect 30 to 50 percent per step, not 2x

Kiely writes that working with quantized data adds overhead, so a single step down in precision "generally offers 30 to 50 percent better performance" for LLMs. The gap between that and the theoretical 2x comes from work the spec sheet does not count.

- The GPU must store scale factors and apply them to map each low-precision value back toward its original range. Finer-grained formats store more scale factors, which eats into the size savings.
- Not everything is quantized. Attention math like softmax usually stays in the original precision because it is the most sensitive part of the model, and activations often move through memory at higher precision too.
- On many stacks, prefill does not get the full Tensor Core benefit. llama.cpp, for example, dequantizes weights before the matmul in many paths, so prefill gains come mostly from reduced memory traffic rather than faster math. This is why prefill and decode usually speed up by different amounts in the exercise below.

{% callout type="note" %}
Speed is only half the tradeoff. Kiely's ordering of quantization risk goes from weights (safest) to activations, then the KV cache, then attention (riskiest), because attention errors compound from token to token. Check output quality with perplexity or an eval before you ship a quantized model. See the [quantization guide](/docs/technical-guides/quantization) for the quality side.
{% /callout %}

## Try it

Measure the real per-phase speedup yourself with llama-bench. You need llama.cpp installed and one model in both Q8_0 and Q4_K_M, e.g., a 7B or 8B instruct model from Hugging Face in GGUF format. The run takes a few minutes.

```bash
# Prompt processing (pp) approximates prefill.
# Token generation (tg) approximates decode.
llama-bench -m model-Q8_0.gguf -m model-Q4_K_M.gguf -p 512 -n 128
```

The output reports tokens per second for the pp512 and tg128 tests for each file. Compute two ratios:

```text
prefill speedup = pp512 t/s at Q4_K_M / pp512 t/s at Q8_0
decode speedup  = tg128 t/s at Q4_K_M / tg128 t/s at Q8_0
```

Compare each ratio to the theoretical 2x for a full precision step, and to the 1.76x ceiling you get from the actual bits per weight (8.5 vs 4.8). Keep everything else fixed between runs, and run each test more than once. Kiely's benchmarking advice applies here: change one variable at a time and average repeated runs.

## Check yourself

1. Your measured decode speedup is 1.5x, not 2x. Name two reasons. Expected: Q4_K_M is really about 4.8 bits per weight once scale factors are counted, and the GPU spends extra compute applying those scale factors during dequantization. Anything else the run reads at full precision, like the KV cache, also dilutes the gain.
2. Why did decode likely speed up more than prefill in your run? Expected: decode is memory bound, so smaller weights cut its main cost directly. Prefill is compute bound, and if the kernel dequantizes before the matmul, the math runs at the same precision as before, so prefill only gains from reduced memory traffic.
3. Would you expect a bigger or smaller decode gain from Q8_0 to Q4_K_M on a GPU with more memory bandwidth? Expected: about the same ratio. Both runs scale with bandwidth, so the ratio stays near the size ratio of the two files.

## Next steps

- [Quantization guide](/docs/technical-guides/quantization) for formats, granularity, and quality checks.
- [Benchmarking guide](/docs/technical-guides/benchmarking) for building a baseline before you optimize.
- [Why is prefill compute bound and decode memory bound?](/blog/prefill-compute-bound-decode-memory-bound) for the two limits this post builds on.

When you can do this, you can measure per-phase quantization speedups and explain the gap from theoretical gains.
