---
title: "Why is LLM prefill compute-bound but decode memory-bound?"
description: "Prefill loads weights once for big matrix-matrix math. Decode reloads all weights per token for small vector-matrix math, so decode is memory bound."
audience: inference-engineer
pillar: foundational-concept
book: inference-engineering
chapter_ref: "Ch. 2, sec. 2.4.2 (pp. 63-66)"
status: draft
last_reviewed: 2026-07-06
---

Prefill loads the model weights once and multiplies large matrices, so it performs many operations for every byte it reads from memory. Decode reloads all the weights for each new token to do one small vector times matrix multiply, so it performs few operations per byte. In the book's worked example, a decode attention step reaches about 62 operations per byte, and an H100 can support 295. {% .lead %}

## Compare arithmetic intensity to the GPU's ops:byte ratio

A GPU has two main resources. Compute is how many floating point operations it can do per second. Memory bandwidth is how many bytes it can move per second. Divide the first by the second and you get the GPU's ops:byte ratio. Kiely's Inference Engineering (Ch. 2, sec. 2.4.1) works this out for an H100 in FP16. The chip does 989 teraFLOPS of dense compute against 3.35 TB/s of memory bandwidth, which gives a ratio of about 295.

Arithmetic intensity is the same ratio measured for one algorithm instead of for the hardware. You count the total operations the algorithm performs and divide by the total bytes it reads and writes. Then you compare the two numbers.

- If the algorithm's intensity is above the GPU's ratio, the GPU runs out of compute first. The algorithm is compute bound.
- If the intensity is below the ratio, the GPU runs out of bandwidth first. The algorithm is memory bound.

Prefill and decode land on opposite sides of this line. In prefill, the model reads the weights once and multiplies whole matrices of input tokens against them, so each byte loaded feeds many operations. In decode, the model reads every weight again for each single token, and each token only needs one vector times matrix multiply, so each byte loaded feeds few operations. This is why prefill sets your time to first token and decode sets your tokens per second.

## Work through the decode attention example

Kiely's Inference Engineering (Ch. 2, sec. 2.4.2, pp. 63-66) makes this concrete with one decode attention step. The setup is a 128-dimensional attention head (d = 128) over a sequence of 4096 tokens (N = 4096), using the plain attention algorithm with no optimizations and FP16 values at two bytes each.

The matrices have these sizes. Q, K, and V are each N by d. The score matrix S and the softmax output P are each N by N. The output O is N by d. The algorithm runs in three steps, and each step loads data from memory, computes, and writes the result back. Summing the reads and writes gives the total memory traffic, and summing the multiply and add work gives the total compute.

- Total memory traffic is 8N² + 8Nd bytes. With these numbers that is about 138 million bytes.
- Total compute is 4N²d + 3N² operations. With these numbers that is about 8.6 billion operations.

Divide the two and you get about 62 operations per byte. The H100 can support 295. The book puts it plainly: this example "illustrates the general principle that decode is memory bound." The GPU spends most of the step waiting on memory, and its compute units sit idle.

{% callout type="note" %}
Kiely notes that "calculating arithmetic intensity like this is an academic exercise, not a routine task" for inference engineers, but doing it once builds intuition you will use every time you size hardware.
{% /callout %}

The prefill version of the same math looks different because prefill processes all input tokens in one pass. The weight reads stay roughly the same, but the compute multiplies by the full sequence length, so the intensity rises far above the hardware ratio and the step becomes compute bound.

## Use the split to pick the right optimization

Once you know which side of the line a phase sits on, you know which fixes can help it and which cannot.

- **Batching.** Batching helps decode because many requests share one read of the weights, so the compute per byte goes up. Kiely notes that batching makes decode less memory bound for exactly this reason.
- **Quantization.** Quantization shrinks each weight, so decode moves fewer bytes per token. It helps decode more than prefill because decode's cost is bytes moved, not operations done.
- **Disaggregation.** Some systems run prefill and decode on separate machines, because the two phases want different hardware. A compute-heavy phase and a bandwidth-heavy phase do not share one box well.

If you optimize compute for a memory-bound step, nothing improves. The book states this directly for bottlenecks in general, and decode is the most common place people learn it the hard way.

## Try it

Redo the book's calculation for your own model. You need the head dimension d from your model's config file and two context lengths. This runs in any Python shell in under a minute.

```python
def intensity(N, d):
    mem = 8 * N**2 + 8 * N * d      # bytes moved, FP16
    ops = 4 * N**2 * d + 3 * N**2   # floating point operations
    return ops / mem

for N in (4096, 32768):
    print(N, round(intensity(N, 128), 1))
```

Swap in your own d and your own two context lengths. Then look up your GPU's dense FP16 FLOPS and memory bandwidth, divide them to get its ops:byte ratio, and state which side each result lands on. On an H100 the ratio is about 295, so both of the values above land on the memory-bound side.

## Check yourself

1. Why does quantization help decode more than prefill? Expected answer: decode's cost is the bytes of weights it moves per token, and quantization cuts those bytes. Prefill is limited by operations, and quantization does not remove operations.
2. A decode attention step has an intensity of 62 and your GPU's ops:byte ratio is 295. Which resource is idle? Expected answer: compute is idle, because the step hits the bandwidth limit long before the compute limit.
3. What does batching change in the intensity calculation? Expected answer: it raises the operations performed per byte of weights read, because one weight read now serves many requests.

## Next steps

- Read the [prefill and decode concept page](/docs/concepts/prefill-decode) for how the two phases fit into a serving stack.
- Read the [quantization guide](/docs/technical-guides/quantization) to act on the bytes-moved insight from this post.

When you can do this, you can compute arithmetic intensity for an attention step and predict whether it is compute bound or memory bound on given hardware.
