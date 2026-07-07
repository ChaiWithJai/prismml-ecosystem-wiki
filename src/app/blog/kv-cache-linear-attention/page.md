---
title: "How does the KV cache make attention linear instead of quadratic?"
description: "The KV cache stores key/value pairs for prior tokens so each decode step computes attention only for the new token. The cost is GPU memory."
audience: inference-engineer
pillar: foundational-concept
book: inference-engineering
chapter_ref: "Ch. 2, sec. 2.2.3 (pp. 52-53)"
status: draft
last_reviewed: 2026-07-06
---

Attention is quadratic in sequence length, but the KV cache stores key/value pairs for every prior token so each decode step only computes attention for the new token, which is linear time. The cost is GPU memory. KV cache size is the hidden budget that caps your batch size and context length. {% .lead %}

## Understand why attention starts out quadratic

Attention relates each token to every token before it. To produce token number n, the model compares that token's query against n prior keys. If you recomputed everything from scratch at every step, generating a sequence of length n would take on the order of n squared comparisons in total, because step 1 does 1 comparison, step 2 does 2, and so on up to n.

Kiely's Inference Engineering (Ch. 2, sec. 2.2.3) states the problem plainly. Because attention checks the current token against every previous token, it is "a quadratic-time equation with respect to sequence length". As context grows, attention slows.

## See what the cache removes

The keys and values for a token never change once the model has computed them. Token 5's key is the same whether you are generating token 6 or token 6,000. So there is no reason to recompute it.

The KV cache stores the key and value vectors for every token the model has already processed, in every layer and every attention head. During prefill the model computes keys and values for the whole prompt and writes them into the cache. During each decode step the model computes keys and values for one new token, appends them, and reads everything else from the cache. Each step is now one query against n stored keys, so the work per step grows linearly with context instead of the whole history being recomputed.

Kiely notes that the cache lives on GPU memory by default. That is the trade. You buy linear compute by spending memory, and the memory bill grows with every token in every active request.

## Compute the cache size for an 8B model

The formula is a straight multiplication:

```
bytes = layers x kv_heads x head_dim x 2 x bytes_per_value x tokens
```

The 2 is there because you store both a key and a value per head per layer.

{% callout type="warning" title="Use KV heads, not query heads" %}
Most modern 8B models use grouped query attention, so the number of KV heads is smaller than the number of attention heads. Llama 3.1 8B has 32 query heads but only 8 KV heads. Read `num_key_value_heads` from the model's config.json, not `num_attention_heads`, or your estimate will be 4x too high.
{% /callout %}

For Llama 3.1 8B, config.json gives 32 layers, 8 KV heads, and a head dimension of 128. In FP16 each value takes 2 bytes. Per token that is:

```
32 layers x 8 kv_heads x 128 head_dim x 2 (K and V) x 2 bytes
= 131,072 bytes = 128 KiB per token
```

At an 8K context (8,192 tokens):

```
8,192 tokens x 128 KiB = 1 GiB
```

One request at 8K context holds 1 GiB of cache before you count the model weights. Eight concurrent requests at 8K hold 8 GiB. This is why the cache, not the weights, is usually what caps batch size on a fixed GPU.

With a quantized cache the per value size drops. An 8 bit cache format stores about 1 byte per value, so the same 8K context takes about 0.5 GiB. A 4 bit format takes about 0.25 GiB. These quantized figures are estimates because formats like q8_0 carry a small amount of scale metadata on top of the raw values.

## Try it

This takes about 20 minutes with llama.cpp and any 8B GGUF model.

First, predict. Using the formula above, write down your expected cache size at 2K, 8K, and 32K context in FP16.

Then measure. Run the model at each context size and read what llama.cpp allocates:

```bash
llama-cli -m llama-3.1-8b-instruct-q4_k_m.gguf -c 2048 -n 8 -p "hi" 2>&1 | grep -i "KV buffer\|kv_cache"
llama-cli -m llama-3.1-8b-instruct-q4_k_m.gguf -c 8192 -n 8 -p "hi" 2>&1 | grep -i "KV buffer\|kv_cache"
llama-cli -m llama-3.1-8b-instruct-q4_k_m.gguf -c 32768 -n 8 -p "hi" 2>&1 | grep -i "KV buffer\|kv_cache"
```

The log reports the cache allocation in MiB. Note that llama.cpp defaults the cache to FP16 even when the weights are quantized, so your FP16 prediction is the right one to compare against.

Now quantize the cache and rerun the 8K case:

```bash
llama-cli -m llama-3.1-8b-instruct-q4_k_m.gguf -c 8192 -n 8 -p "hi" \
  --cache-type-k q8_0 --cache-type-v q8_0 -fa on 2>&1 | grep -i "KV buffer\|kv_cache"
```

Flash attention (`-fa on`) is required to quantize the V cache. The reported size should land near half of your FP16 number.

## Check yourself

1. How many bytes does one token of KV cache take for Llama 3.1 8B in FP16? Expected answer: 128 KiB, from 32 x 8 x 128 x 2 x 2.
2. You grow context from 2K to 32K. What happens to the cache size? Expected answer: it grows 16x, linearly with tokens, from 256 MiB to 4 GiB per request.
3. Your hand calculation says 1 GiB at 8K but llama.cpp reports 1.07 GB. Is your math wrong? Expected answer: no. The log may print GB (powers of 10) while you computed GiB (powers of 2), and quantized formats add scale metadata. Anything within about 20 percent means your model of the memory is correct.
4. Why does a 70B model with the same 8 KV heads and head dimension of 128 still use much more cache per token? Expected answer: it has 80 layers instead of 32, and layers multiply directly into the formula.

## Next steps

- [KV cache technical guide](/docs/technical-guides/kv-cache) covers cache reuse and eviction in production engines.
- [Prefill and decode](/docs/concepts/prefill-decode) explains the two phases that build and consume the cache.

When you can do this, you can compute KV cache memory for any model, context, and precision combination and verify it against observed usage.
