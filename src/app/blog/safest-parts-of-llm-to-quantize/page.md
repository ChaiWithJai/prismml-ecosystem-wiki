---
title: "Which parts of an LLM are safest to quantize: weights, activations, KV cache, or attention?"
description: "Quantization risk runs from weights (safest) to activations, then KV cache, then attention. Treat them as four separate dials, not one switch."
audience: inference-engineer
pillar: foundational-concept
book: inference-engineering
chapter_ref: "Ch. 5, sec. 5.1.2 (pp. 126-127)"
status: published
last_reviewed: 2026-07-07
---

Quantization sensitivity forms a ladder from least to most risky: weights first, then activations, then KV cache, and attention last. Softmax is almost always left in original precision. Treat quantization as four separate dials with a default ordering, not one switch you flip for the whole model. {% .lead %}

## Order the four targets by sensitivity

Kiely's Inference Engineering (Ch. 5, sec. 5.1.2) lists the components of a model from least to most sensitive to quantization. Lowering the precision of a more sensitive component risks more quality loss for the same memory savings.

1. **Weights.** The linear layers are the least sensitive part of the model, so quantize them first. This is also where most of the memory is, so it is the biggest win.
2. **Activations.** The intermediate outputs of activation functions are only somewhat sensitive. The activation functions themselves are rarely quantized because they are a tiny fraction of the model.
3. **KV cache.** The cached keys and values from the attention calculation are moderately sensitive. Quantizing them frees memory for longer contexts and more concurrent requests.
4. **Attention.** The attention layers are highly sensitive, and Kiely singles out "equations like softmax" as the part to protect. All but the most aggressive schemes run softmax in the original precision.

The ordering matters because it gives you a procedure. Start at weights, check quality, and only move down the list if you still need memory back. Do not turn all four dials at once, because then you cannot tell which one broke the output.

## Understand why errors compound at the bottom of the list

Weight quantization introduces one rounding error per weight, and that error is applied the same way to every token. The model also has billions of weights, so no single weight carries much of the output. This is why weights tolerate 4-bit formats.

The KV cache is different. The cached entry for each token is read by every later token in the sequence. A rounding error written into the cache at token 50 feeds into the attention result for token 51, and that result feeds into token 52. Kiely's point is that precision errors in the cache compound from token to token instead of staying local.

Attention is the worst case for the same reason plus one more. Attention scores pass through softmax, which turns small input differences into large probability differences, so attention needs more dynamic range than a 4-bit or 8-bit format provides. Over a sequence of thousands of tokens, the book notes, these errors accumulate quickly.

Even within a safe component you can be selective. Kiely notes that the input and output layers of the network are more sensitive than the middle layers, so quantization schemes often leave the first and last layers in original precision even when every other linear layer is 4-bit.

## Work through the KV cache arithmetic

Here is what the KV cache dial buys you on a concrete model. Take an 8B model with 32 layers, 8 KV heads, and a head dimension of 128, e.g., [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf). Each token stores one key vector and one value vector per layer:

```text
values per token = 2 x 32 layers x 8 heads x 128 dims = 65,536
FP16 (2 bytes each):  65,536 x 2      = 131,072 bytes = 128 KiB per token
q8_0 (8.5 bits each): 65,536 x 1.0625 =  69,632 bytes =  68 KiB per token
```

At an 8,192-token context, the FP16 cache is 8,192 x 128 KiB, which is 1 GiB. The q8_0 cache is 544 MiB. One dial returned 480 MiB without touching the weights. These numbers are derived from the shapes above, not benchmarks, so your model's config may differ.

The tradeoff is that the saving comes from the moderately risky rung. Kiely writes that a common production setup quantizes select linear layers, activations, and often the KV cache with a high dynamic range 8-bit format like FP8 or MXFP8, and leaves the attention layer alone even then. See the [KV cache guide](/docs/technical-guides/kv-cache) for how the cache is laid out and why it grows with context length.

## Try it

This takes about 20 minutes. You need llama.cpp and one GGUF model with 4-bit weights, e.g., the Q4_K_M file from [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf). No GPU is required. An 8B model at 4 bits runs on a laptop with about 8 GB of free RAM, and Apple silicon or a CUDA GPU just makes it faster.

Put an article of a few hundred words in `article.txt` with a line like "Summarize this article in five bullet points:" at the top. Then run the same prompt with two KV cache settings:

```bash
# Run 1: 4-bit weights, F16 KV cache (the default).
llama-cli -m Bonsai-8B-Q4_K_M.gguf -f article.txt \
  --temp 0 --seed 1 -n 256 > kv-f16.txt

# Run 2: same everything, but the K half of the cache at q8_0.
llama-cli -m Bonsai-8B-Q4_K_M.gguf -f article.txt \
  --temp 0 --seed 1 -n 256 --cache-type-k q8_0 > kv-q8.txt

diff kv-f16.txt kv-q8.txt
```

Temperature 0 and a fixed seed make the runs comparable, so any diff comes from the cache precision. On a short summarization prompt the outputs are often identical or differ in a few word choices, which is what "moderately sensitive" looks like in practice. If you want to push further, quantize the V half too with `--cache-type-v q8_0`, which in llama.cpp also requires the flash attention flag `-fa on`.

## Check yourself

1. Order the four quantization targets from safest to riskiest, and name the one part that is almost never quantized. Expected: weights, then activations, then KV cache, then attention, and softmax stays in original precision.
2. Why does a rounding error in the KV cache do more damage than the same error in a weight? Expected: a weight error is applied the same way to every token, but a cache error is read by every later token, so it feeds into each following attention result and compounds across the sequence.
3. Your 8B model fits in memory, but you cannot serve the context lengths you need. Which dial do you turn, and what do you check after? Expected: quantize the KV cache, e.g., to an 8-bit format, because context memory is cache memory. Then rerun a quality check on long prompts, since long sequences are where cache errors accumulate.
4. A teammate proposes shipping a build with weights, activations, cache, and attention all at 4-bit because it benchmarked fastest. What is wrong with that? Expected: it turned all four dials at once, including the riskiest one. Attention at 4 bits lacks the dynamic range softmax needs, and with every dial turned there is no way to isolate which change caused a quality drop.

## Next steps

- [Quantization guide](/docs/technical-guides/quantization) for number formats, granularity, and how to pick a precision per component.
- [KV cache guide](/docs/technical-guides/kv-cache) for how cache size scales with context and batch size.
- [How do you verify a quantized model didn't get worse?](/blog/verify-quantized-model-quality) for the quality check you should run after each dial.

When you can do this, you can order the four quantization targets by risk and apply them incrementally with a quality check at each step.
