---
title: "What makes long context expensive, and what are chunked prefill and paged KV for?"
description: "KV cache memory grows linearly with sequence length until attention is your top VRAM consumer. Long context starts wherever the cache causes problems."
audience: inference-engineer
pillar: foundational-concept
book: inference-engineering
chapter_ref: "Ch. 5, sec. 5.3.4 (p. 141)"
status: published
last_reviewed: 2026-07-07
---

KV cache memory grows linearly with sequence length until attention is your top VRAM consumer. FlashAttention cuts memory traffic. PagedAttention removes cache fragmentation. Chunked prefill splits a long prompt into pieces that run alongside ongoing decode. "Long context" begins wherever the KV cache starts causing problems on your hardware, so benchmark it rather than assume it. {% .lead %}

## Understand why cost grows with every token you add

The KV cache stores a key vector and a value vector for every token the model has processed, in every layer and every attention head. Each new token adds a fixed number of bytes, so cache size grows linearly with sequence length. The cache lives in GPU memory next to the model weights, and it exists per request, so ten concurrent requests hold ten caches.

Kiely's Inference Engineering (Ch. 5, sec. 5.3.4) points out where this ends up. With long sequences, attention can become "the main consumer of VRAM", and VRAM is the same resource that limits decode. A long prompt also makes prefill slow, because the engine must process every input token before it can emit the first output token. So long context hurts you twice. It eats memory through the cache and it stretches time to first token through prefill.

## Define long context by when it hurts, not by a token count

There is no fixed number of tokens where context becomes long. Kiely writes that a sequence "becomes 'long context' when it generates a KV cache large enough to cause problems" during inference. He adds that the problems can start past common cutoffs like 32K, 64K, or 128K tokens depending on the model, the hardware, the engine, and the traffic.

This definition is useful because it tells you what to do. Do not read a context length off a model card and assume your server handles it. Send large inputs at your own deployment and watch where memory or latency breaks. The book makes the same recommendation for performance benchmarking.

## Match each fix to the problem it targets

The book lists three general fixes for standard attention, and each one targets a different problem.

- **FlashAttention.** Optimized attention kernels that compute the same result with fewer reads from and writes to GPU memory. It targets the memory traffic of the attention computation itself, which grows with sequence length.
- **PagedAttention.** A memory manager that stores the KV cache in fixed size pages instead of one contiguous block per request. It targets fragmentation and duplication. Without it, the engine reserves a worst case contiguous slab per request, and memory sits idle between slabs.
- **Chunked prefill.** A scheduler strategy that splits a long input into chunks and runs them as resources allow. It targets head of line blocking. Without it, one 100K token prompt can occupy the engine and stall every request that is mid decode.

If you cannot name which problem you have, measure first. A fragmentation problem and a blocking problem look similar from the outside because both show up as requests waiting.

## Work the numbers for an 8B model

Use the standard formula for cache size per token:

```
bytes = layers x kv_heads x head_dim x 2 (K and V) x bytes_per_value
```

For Llama 3.1 8B, config.json gives 32 layers, 8 KV heads, and a head dimension of 128. In FP16 that is 32 x 8 x 128 x 2 x 2 = 131,072 bytes, or 128 KiB per token. Now scale the context:

```
4K  tokens x 128 KiB = 512 MiB
32K tokens x 128 KiB = 4 GiB
128K tokens x 128 KiB = 16 GiB
```

The FP16 weights of an 8B model take about 16 GB. So a single request at 128K context holds as much cache as the entire model. On a 24 GB GPU with FP16 weights loaded, roughly 8 GB remains for cache, and one 64K request fills it. At that point the cache, not the weights, decides what your server can hold, which is the crossover the answer above describes.

These are derived figures from the formula, not measurements. Your engine adds buffers on top, so measure your own deployment before you plan capacity.

## Try it

This takes about 25 minutes. No discrete GPU is required. llama.cpp runs on Apple silicon or CPU, and the point of the exercise is to find the cliff on whatever hardware you have. Use [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf) or any 8B GGUF model.

First, predict. Use the formula above to write down the expected cache size at 4K, 8K, 16K, and 32K. Note that llama.cpp defaults the cache to FP16 even when the weights are quantized.

Then measure prefill speed and memory at each context size:

```bash
llama-bench -m bonsai-8b-q4_k_m.gguf -p 4096,8192,16384,32768 -n 16
```

The `pp` rows report prefill tokens per second. Estimated time to first token at each size is the token count divided by that rate, e.g., 32,768 tokens at 500 tokens per second is about 65 seconds. Record it at each step.

For memory, run each size once with `llama-cli` and read the log:

```bash
llama-cli -m bonsai-8b-q4_k_m.gguf -c 32768 -n 8 -p "hi" 2>&1 | grep -i "KV buffer"
```

Also watch overall memory in Activity Monitor or `nvidia-smi`. Write down the context length where behavior changed, e.g., the allocation failed, the machine started swapping, or time to first token became unacceptable for your use case. That length is your long context boundary, and it is a property of your model and hardware pair, not of the model alone.

## Check yourself

1. Why does the book refuse to give a single token count that defines long context? Expected answer: because the definition is operational. Context is long when the KV cache causes problems, and where that happens depends on the model, the hardware, the engine, and the traffic.
2. Your server stalls all ongoing chats whenever one user pastes a huge document. Which of the three fixes targets this? Expected answer: chunked prefill, because it splits the long input into chunks that run alongside decode instead of blocking it.
3. Memory usage climbs even though the sum of active caches should fit in VRAM. Which fix targets this? Expected answer: PagedAttention, because fragmentation from contiguous per request allocations wastes memory that paging reclaims.
4. Using the formula, how much FP16 cache does one 32K request hold for Llama 3.1 8B? Expected answer: 4 GiB, from 32,768 tokens x 128 KiB per token.

## Next steps

- [KV cache technical guide](/docs/technical-guides/kv-cache) covers how the cache is built and evicted in production engines.
- [Prefix caching](/docs/technical-guides/prefix-caching) explains how to reuse cache across requests so long shared prompts stop costing full prefill.
- [FlashAttention vs PagedAttention](/blog/flashattention-vs-pagedattention) compares the two attention fixes in more depth.

When you can do this, you can locate the long context cliff for a given model and hardware pair empirically and name the mitigation that targets it.
