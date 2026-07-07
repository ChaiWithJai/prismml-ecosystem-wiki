---
title: SGLang
status: published
audience: DevRel engineer
owner: Runtime validator
source_tier: primary_links
benchmark_status: not_run
last_reviewed: 2026-07-07
---

SGLang is an open source server for running large language models on GPUs at high throughput, built by the LMSYS team at Berkeley. On this page you can learn what makes its caching design different, see how it fits next to vLLM and llama.cpp, and find the official install path. {% .lead %}

## What SGLang does

When a model server handles a prompt, it first computes an internal state called the KV cache for every token in the prompt. That step is called prefill, and it is expensive. SGLang is built around reusing that work instead of repeating it. Two design ideas define it:

- **RadixAttention** ([LMSYS blog post](https://www.lmsys.org/blog/2024-01-17-sglang/)). SGLang keeps KV cache entries in a radix tree keyed by token sequences. When a new request shares a prefix with an earlier one, e.g., the same system prompt, few-shot examples, or chat history, SGLang reuses the cached state for that prefix automatically instead of recomputing it.
- **HiCache** ([design doc](https://docs.sglang.ai/advanced_features/hicache_design.html)). The KV cache extends past GPU memory into host memory and storage. A reusable prefix that gets evicted from the GPU can come back from a slower tier instead of being recomputed from scratch.

For example, an agent that sends the same 2,000-token system prompt with every request only pays the prefill cost for that prompt once. Every later request starts from the cached state and only computes the new tokens.

The LMSYS launch post quotes speedup multipliers, but those numbers apply to the workloads and hardware they measured. We do not repeat them here because we have not reproduced them.

## Know when to reach for it

SGLang serves an OpenAI-compatible endpoint, so it slots in where you would otherwise put vLLM. The useful contrasts:

- **vLLM** is the peer GPU server. Its PagedAttention manages KV cache memory in fixed-size blocks. RadixAttention is a different idea, and it is about reuse across requests rather than memory layout. Neither approach is simply better, and this page only claims the mechanism difference.
- **llama.cpp, MLX, Ollama, and LM Studio** are the local single-device paths. Pick them for laptops and small machines, and pick SGLang or vLLM when you have a GPU server and many concurrent requests. To try the local path, see [Run Bonsai with llama.cpp](/docs/build-and-run/bonsai-llamacpp).
- SGLang consumes checkpoints and quantized formats from upstream. Whether PrismML Bonsai 1-bit and ternary formats load in SGLang is unconfirmed. Check the [Bonsai 8B GGUF model card](https://huggingface.co/prism-ml/Bonsai-8B-gguf) against SGLang's supported formats before you plan a demo on it.
- RadixAttention manages the cache. It is not a new attention kernel, and SGLang still runs on top of standard attention kernels.

Workloads with heavy prefix sharing benefit most, e.g., multi-turn chat, agent loops, and batch evaluation over a fixed prompt template.

## Install and verify it yourself

We have not yet run SGLang on hardware in this project. Start from the official install instructions at [https://docs.sglang.ai/](https://docs.sglang.ai/) rather than copying commands from an older tutorial, because server flags and install extras change between releases.

A quick way to confirm the prefix cache is working once you have a server up:

1. Launch the server with a small open model and note the exact command, model ID, and GPU.
2. Send the same long-prefix prompt twice through the OpenAI-compatible endpoint.
3. Compare the time to first token for both requests. The second should be faster because the prefix comes from cache.

We have not confirmed SGLang's license or minimum GPU requirement here. Check the official docs for both before you commit to it.

{% callout type="warning" title="Do not publish numbers before a run" %}
Any throughput, speedup, or cache hit rate figure for SGLang must come from a run you recorded or cite the exact source URL it was taken from. Multipliers in blog posts are specific to the workloads they measured.
{% /callout %}

## Sources

| URL | What it covers |
| --- | --- |
| [https://docs.sglang.ai/](https://docs.sglang.ai/) | Official docs, with the install path, server usage, and supported features |
| [https://www.lmsys.org/blog/2024-01-17-sglang/](https://www.lmsys.org/blog/2024-01-17-sglang/) | RadixAttention design and launch claims |
| [https://docs.sglang.ai/advanced_features/hicache_design.html](https://docs.sglang.ai/advanced_features/hicache_design.html) | HiCache hierarchical KV cache architecture |

## Next steps

- Read [how the KV cache works](/docs/technical-guides/kv-cache) to understand what RadixAttention is reusing.
- See [where runtimes sit in the supply chain](/docs/ecosystem/supply-chain-layers) to place SGLang among its neighbors.
- Run a model locally first with the [Bonsai llama.cpp recipe](/docs/build-and-run/bonsai-llamacpp) if you do not have a GPU server.
- These engines run on Kubernetes in production. Build that layer yourself in [Kubernetes The Hard Way](/docs/learning-paths/kubernetes-the-hard-way).

See something wrong? [Fix it](/docs/contribute/contributor-guide).
