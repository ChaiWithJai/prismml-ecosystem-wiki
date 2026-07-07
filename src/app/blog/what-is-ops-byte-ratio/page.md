---
title: "What is an ops:byte ratio and why does it matter for GPUs?"
description: "A GPU's ops:byte ratio is peak FLOPS divided by memory bandwidth, about 295 for an H100 in FP16. It predicts memory bound or compute bound before profiling."
audience: researcher
pillar: foundational-concept
book: inference-engineering
chapter_ref: "Ch. 2, sec. 2.4.1 (p. 62)"
status: published
last_reviewed: 2026-07-07
---

Every GPU has an ops:byte ratio, which is its peak FLOPS divided by its memory bandwidth, about 295 for an H100 in FP16. If your algorithm's arithmetic intensity sits below that number you are memory bound. Above it, you are compute bound. This one ratio predicts whether kernel work, bandwidth, or quantization will help before you profile anything. {% .lead %}

## Divide two spec sheet numbers

A GPU has two main resources. Compute is how many floating point operations it can perform per second. Memory bandwidth is how many bytes it can move per second. Kiely's Inference Engineering (Ch. 2, sec. 2.4, p. 61) frames the goal as keeping both busy, so that compute never sits idle waiting for memory and bandwidth never goes unused waiting for compute.

Divide compute by bandwidth and you get the ops:byte ratio. The book's example (sec. 2.4.1, p. 62) is an H100 in FP16. The chip performs 989 teraFLOPS of dense computation and moves 3.35 TB/s. The division is 989 × 10¹² operations per second over 3.35 × 10¹² bytes per second, which is about 295 operations per byte. Kiely reads the number plainly: for balanced FP16 inference on an H100, the system "needs to perform 295 floating point operations for every byte" it accesses.

That is the whole calculation. Both numbers are on the vendor's spec sheet, so you can compute this ratio for any GPU in one minute.

## Compare it to your algorithm's arithmetic intensity

The ops:byte ratio describes the hardware. Arithmetic intensity is the same kind of ratio measured for one algorithm instead. You count the operations the algorithm performs during one run and divide by the bytes it reads and writes during that run. The book gives the equation as intensity = work / memory_traffic (Figure 2.12) and notes the difference in units. The hardware ratio is per second, and intensity is per execution of a function.

Comparing the two numbers tells you which resource runs out first.

- If intensity is above the hardware ratio, the algorithm asks for more operations per byte than the chip can supply. It is compute bound.
- If intensity is below the ratio, the algorithm asks for more bytes per operation than the chip can move. It is memory bound.

Kiely visualizes this with a roofline chart (Figure 2.13). Performance rises along a diagonal bandwidth ceiling as intensity grows, then flattens at a horizontal compute ceiling. The corner sits at the ops:byte ratio.

This comparison is useful because it tells you which fixes can work before you profile. Kiely states that if an operation is bottlenecked on memory bandwidth, "no amount of compute optimization will make the system faster," and the reverse also holds. A memory bound step responds to quantization and to faster memory, because both cut or speed up the bytes moved. A compute bound step responds to a faster chip or fewer operations.

## Work one example for LLM decode

The most useful application for LLM serving is predicting decode speed. During decode, the GPU reads roughly all the model weights once per generated token, and it performs relatively few operations on them (Kiely, sec. 2.4.2). Decode intensity sits far below 295, so decode is memory bound, and the bandwidth ceiling gives you a throughput prediction:

```
max decode TPS ≈ memory bandwidth / model bytes
```

Take an 8B parameter model in FP16 on an H100. The weights are 8 × 10⁹ parameters at 2 bytes each, which is 16 GB. The H100 moves 3.35 TB/s. The ceiling is 3,350 / 16, which is about 209 tokens per second for a single request. A real server lands below this because the KV cache also moves bytes and no kernel hits peak bandwidth, but the ceiling tells you what is even possible before you benchmark.

The same math shows why quantization speeds up decode. Quantize those weights to 4 bits and the file is about 4.5 GB (this is an estimate, since quantized files keep some layers at higher precision). The ceiling rises to roughly 3,350 / 4.5, which is about 740 tokens per second. Nothing about the compute changed. Only the bytes did.

## Try it

Time needed is about 20 minutes. You need any machine that can run llama.cpp. No datacenter GPU is required, and a laptop works because the prediction method is the same at any scale.

1. Look up your chip's memory bandwidth in GB/s and its peak FP16 FLOPS from the vendor spec sheet. Divide FLOPS by bandwidth to get your ops:byte ratio.
2. Download a model with a known file size, e.g., a quantization of [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf) and note the .gguf size in GB.
3. Predict max decode TPS as bandwidth divided by file size. For example, 100 GB/s over a 5 GB file predicts a ceiling of 20 tokens per second.
4. Measure the real number:

```bash
./llama-bench -m bonsai-8b-q4_k_m.gguf -p 0 -n 128
```

The tg (token generation) row is your measured decode TPS. Compare it to your prediction. You pass the check if you land within about 30 percent of the ceiling, or if you can name the overhead that explains the gap, e.g., the KV cache traffic that the simple formula ignores.

## Check yourself

1. An H200 has the same compute as an H100 but higher memory bandwidth. What happens to its ops:byte ratio, and which workloads gain? Expected answer: the ratio goes down because the denominator grew. Memory bound workloads such as decode gain, and compute bound workloads such as prefill do not.
2. Your kernel has an arithmetic intensity of 40 and your GPU's ratio is 295. Will a faster attention kernel that cuts operations help? Expected answer: no. The kernel is memory bound, so cutting operations leaves the bandwidth bottleneck in place. Cut bytes moved instead.
3. Why does the decode TPS prediction use the model's size in bytes rather than its parameter count? Expected answer: the bottleneck is bytes moved per token, and bytes depend on both the parameter count and the precision. Quantization changes bytes without changing parameters.

## Next steps

- Read the [hardware requirements guide](/docs/getting-started/hardware-requirements) to pick a GPU using bandwidth and FLOPS together.
- Read the [prefill and decode concept page](/docs/concepts/prefill-decode) for how the two phases split across this ratio.
- Read [why prefill is compute bound and decode is memory bound](/blog/prefill-compute-bound-decode-memory-bound) for the full attention intensity calculation from the book.

When you can do this, you can compute an ops:byte ratio from a spec sheet and use it to predict decode throughput before benchmarking.
