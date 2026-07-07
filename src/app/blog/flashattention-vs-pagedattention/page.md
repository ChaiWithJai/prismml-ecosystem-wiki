---
title: "What do FlashAttention and PagedAttention actually optimize?"
description: "FlashAttention removes redundant memory reads and writes, and PagedAttention pages the KV cache. Both are lossless implementation work, not new math."
audience: researcher
pillar: ecosystem-player
book: inference-engineering
chapter_ref: "Ch. 2, sec. 2.5 (pp. 67-68)"
status: draft
last_reviewed: 2026-07-06
---

FlashAttention and PagedAttention are lossless implementation work, not new math. FlashAttention removes redundant memory reads and writes inside the attention kernel. PagedAttention splits the KV cache into pages so it no longer needs one contiguous block of GPU memory. Contrast that with new algorithms like sliding window attention, which trade quality for sub-quadratic complexity. Once you know which category a technique is in, you know whether to expect quality regressions. {% .lead %}

## Separate implementations from algorithms

Kiely's Inference Engineering (Ch. 2, sec. 2.5) argues that there are two strategies for optimizing attention. The first is to write better kernels that compute the same math with less wasted memory traffic. The second is to change the math itself so it scales in better than quadratic time. Kiely writes that implementation improvements "are lossless (do not affect quality) and make inference feasible for long sequences" on today's hardware.

This split is the useful part for a researcher. A lossless implementation can never change the model's outputs beyond floating point noise, so you can adopt it without an evaluation run. A new algorithm changes what the model computes, so you have to measure quality before and after. When a vendor announces an attention speedup, your first question should be which of the two bins it falls in.

## Count the reads and writes FlashAttention removes

The standard attention implementation writes its intermediate matrices to GPU memory and then reads them back one step later. Kiely works this out for a decode step with a 128 dimension head over 4,096 tokens. The score matrix S and the probability matrix P are each 4096 x 4096, which is about 32 MiB each in FP16. The book sums every read and write in the three step algorithm and gets a total memory movement of 8N² + 8Nd bytes against 4N²d + 3N² floating point operations. That works out to an arithmetic intensity of 62 operations per byte, far below the H100's ratio of about 295, so the kernel is memory bound.

Here is the arithmetic on where those bytes go. With N = 4096 and d = 128, the 8N² term is about 134 MB and the 8Nd term is about 4 MB. So roughly 97 percent of the memory traffic in the naive kernel is the round trip of S and P, matrices that no one needs after the kernel finishes. FlashAttention keeps those intermediates in on-chip memory and never writes them to the GPU's main memory at all. The math is identical, and the wasted 134 MB of traffic per head is gone.

{% callout type="note" %}
The 62 ops per byte figure comes from the book's worked exercise. The 97 percent split is my own division of the two terms in that formula, not a measured benchmark.
{% /callout %}

## See what PagedAttention pages

PagedAttention solves a different problem. The KV cache holds the key and value vectors for every previous token, and it grows as the model generates. Kiely notes that KV caches quickly fill GPU memory and take time to read. The classic failure is fragmentation. Each request needs a contiguous region sized for a length you do not know in advance, so the server over-reserves, and free memory ends up scattered in unusable gaps between requests.

PagedAttention, the core idea inside [vLLM](/docs/ecosystem/vllm), splits each request's KV cache into fixed size blocks and finds them through a lookup table. The cache for one request can then live in scattered blocks across the GPU. This is bookkeeping, not math. The attention output is unchanged, and the win shows up as more concurrent requests fitting on the same card. If the mechanics of the cache itself are new to you, start with the [KV cache guide](/docs/technical-guides/kv-cache).

## Sort techniques into the two bins

Kiely lists the algorithmic side of the ledger in the same section. Each of these changes what attention computes, so each can affect output quality.

- Sliding window attention only attends to the previous w tokens, which turns the cost from O(N²) into O(Nw).
- Linear attention replaces the quadratic softmax step with a linear time approximation.
- Compressed attention periodically compresses older context and attends over the compressed form.
- Multi-latent attention approximates attention in a smaller latent space.

The book adds one honest caveat. When a lossy algorithm like sliding window attention is applied during training rather than bolted on at inference, the model learns around it and quality holds up well. The category still tells you what to check. A lossless implementation needs no quality evaluation, and a lossy algorithm always needs one.

## Try it

llama.cpp ships FlashAttention behind a flag, so you can measure the lossless claim on your own machine in a few minutes. Use any GGUF model you already have and a long prompt file, e.g., a few thousand tokens of text.

```bash
# Baseline, flash attention off
./llama-cli -m model.gguf -f longprompt.txt -n 64 -fa off

# Flash attention on
./llama-cli -m model.gguf -f longprompt.txt -n 64 -fa on
```

Read the timing block that llama.cpp prints at the end of each run. The prompt eval time is your time to first token. Record the delta between the two runs, and note that the generated text should be essentially identical, because this is an implementation change and not an algorithm change. On some CPU-only or older GPU setups the flag does little or nothing, and that is itself a useful result, since kernel-level optimizations only pay off when the hardware they target is present.

## Check yourself

1. FlashAttention makes prefill faster. Can it change the model's outputs? Expected answer: no, beyond floating point noise, because it computes the same math with less memory traffic.
2. Sort these five into lossless implementation versus lossy algorithm: FlashAttention, PagedAttention, sliding window attention, linear attention, multi-latent attention. Expected answer: the first two are lossless implementations, and the last three are lossy algorithms because each changes what attention computes.
3. A serving framework claims it fits 3x more concurrent requests in the same VRAM with no quality change. Which technique in this post does that sound like, and why is the no quality change claim plausible? Expected answer: PagedAttention, because paging the KV cache changes memory layout and not the attention output.
4. In the book's decode example, memory movement is 8N² + 8Nd bytes. Which term does FlashAttention attack? Expected answer: the 8N² term, the round trip of the S and P intermediate matrices.

## Next steps

- [The KV cache guide](/docs/technical-guides/kv-cache) explains the structure that PagedAttention pages.
- [The vLLM ecosystem page](/docs/ecosystem/vllm) covers the server built around PagedAttention.
- [Why is prefill compute bound and decode memory bound?](/blog/prefill-compute-bound-decode-memory-bound) covers the bottleneck analysis that explains why removing memory traffic helps at all.

When you can do this, you can classify attention optimizations by category and predict whether each one can affect output quality.
