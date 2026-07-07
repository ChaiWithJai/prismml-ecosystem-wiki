---
title: KV Cache
status: migrated
audience: DevRel engineer
owner: Technical writer
source_tier: course_material
benchmark_status: not_run
last_reviewed: 2026-07-06
---

The KV cache is the block of memory where a language model stores the keys and values it has already computed for past tokens, so it does not recompute them for every new token. On this page you will learn why the cache exists, how to estimate its size for a given model and context length, and why a small weight file can still use gigabytes of memory at long context. {% .lead %}

{% system-model highlight="kv" /%}

## Understand why the cache exists

Attention requires every new token to look at the keys and values of all previous tokens. Without a cache, the model would recompute those keys and values for the whole growing sequence at every step. The KV cache stores them once. Each new step computes keys and values only for the newest token and reads the past from memory.

This is why generation stays fast as the sequence grows, and it is also why memory use grows with every token you generate.

## Estimate the cache size

Cache memory per token depends on the model's architecture. The formula multiplies five numbers: 2 (one copy for keys, one for values), the number of layers, the number of KV heads, the head dimension, and the bytes per element.

Here is a worked example with the constants for a Qwen3-8B-class model (36 layers, 8 KV heads, head dimension 128), which match the published [Qwen3-8B model card](https://huggingface.co/Qwen/Qwen3-8B). Bonsai 8B is based on Qwen3-8B (see the [claim/source matrix](/docs/prismml/claim-source-matrix)), so these constants apply to it. These numbers come from the course [Inference The Hard Way](https://chaiwithjai.github.io/inference-the-hard-way/); we have not measured them on hardware for this site.

```text
bytes/token = 2 (K and V) x layers x kv_heads x head_dim x bytes_per_element
            = 2 x 36 x 8 x 128 x 2
            = 147,456 bytes
            = about 144 KB per token
```

At 65,536 tokens:

```text
65,536 x 144 KB = about 9.2 GB
```

The exact number changes with the architecture. The point to remember is that cache memory scales with context length, layers, KV heads, head dimension, and element width.

{% kv-cache-diagram /%}

## Explain why compression does not shrink the cache

Quantizing or compressing a model makes the weight file smaller, but the KV cache is separate memory that the runtime allocates while it generates. If compression makes the weights much smaller, the cache can become the next memory limit. When a builder asks why a 4 GB model file still uses 12 GB of memory at long context, the answer is usually the cache. You can use the formula above to show them the arithmetic for their model.

If you need a short version to say out loud:

```text
The KV cache stores each token's keys and values so attention never recomputes
the past. It grows with context length. Compressed weights can make the model
file smaller, but long context can still be dominated by cache memory.
```

## Go deeper

- [Inference The Hard Way](https://chaiwithjai.github.io/inference-the-hard-way/) covers this arithmetic in full and is the course this page draws from.
- The [vLLM docs](https://docs.vllm.ai/) describe paged KV management, which is how production servers keep the cache from fragmenting memory.

## Next steps

- Read [Prefill vs decode](/docs/technical-guides/prefill-vs-decode) to see how the cache is built during prefill and read during decode.
- If you want to see cache growth on your own machine, run [Bonsai in llama.cpp](/docs/build-and-run/bonsai-llamacpp) and watch the reported cache allocation at two context lengths.

See something wrong? [Fix it](/docs/contribute/contributor-guide).
