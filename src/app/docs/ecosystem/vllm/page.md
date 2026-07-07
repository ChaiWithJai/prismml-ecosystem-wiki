---
title: vLLM
status: source_checked
audience: DevRel engineer
owner: Runtime validator
source_tier: primary_links
benchmark_status: not_run
last_reviewed: 2026-07-06
---

vLLM is an open source engine that serves a language model checkpoint as a high-throughput, OpenAI-compatible API. On this page you can learn what makes it fast, see where it sits among the other tools in this map, and find the primary sources to cite when you explain it. {% .lead %}

## Understand what vLLM does

vLLM came out of the Berkeley systems ecosystem, the same group behind Ray, SGLang, and Chatbot Arena. You give it a model checkpoint, and it exposes an inference server that many clients can call at once.

Its speed comes from a few core ideas, all documented in the [Anatomy of vLLM post](https://blog.vllm.ai/2025/09/05/anatomy-of-vllm.html) and the [official docs](https://docs.vllm.ai/):

- **PagedAttention.** The engine stores KV cache entries in fixed-size blocks and allocates and frees the blocks on demand, so long and variable-length sequences do not fragment GPU memory.
- **Continuous batching.** New requests join a running batch at each scheduling step instead of waiting for the current batch to finish, so the GPU stays busy.
- **Prefix caching.** Requests that share a prompt prefix reuse the same KV blocks, so repeated prompts start faster.
- **OpenAI-compatible server.** vLLM exposes the same API that llama.cpp's `llama-server` exposes locally, so you can swap backends without rewriting clients.

If terms like KV cache are new to you, read [the KV cache guide](/docs/technical-guides/kv-cache) first. It explains why the cache takes most of the serving memory, and vLLM's paging design is the reference example it builds on.

## Place it among the other tools

vLLM sits in the runtime and serving layer, between the model formats it consumes and the apps that call it. One example of a full handoff: a quantized checkpoint in AWQ format arrives from the compression layer, vLLM loads it and runs attention kernels from the FlashAttention lineage, and an agent framework downstream calls the resulting endpoint.

| Neighbor | Direction | Handoff |
| --- | --- | --- |
| Compression and formats | upstream | Quantized checkpoints (AWQ/GPTQ, FP8 family) arrive as inputs. Check runtime compatibility for each format rather than assuming it. |
| Kernels and compilers | upstream | vLLM consumes attention kernels (FlashAttention lineage) and adds KV paging on top. |
| Apps, agents, and devices | downstream | Apps and agents call the OpenAI-compatible endpoint it serves. |
| SGLang and Ray Serve | peers | SGLang is the same layer with a different cache strategy (RadixAttention/HiCache). Ray Serve orchestrates distributed serving around engines like vLLM. |

{% callout type="note" title="Datacenter, not edge" %}
vLLM is the wrong tool for the phone, laptop, and browser deployments PrismML targets. For local paths use [Bonsai with llama.cpp](/docs/build-and-run/bonsai-llamacpp). This page covers vLLM because the cost of serving any model, compressed or not, comes down to the same KV cache concepts.
{% /callout %}

## Cite it without overclaiming

When you write or talk about vLLM, cite these sources:

| URL | What it evidences |
| --- | --- |
| [https://docs.vllm.ai/](https://docs.vllm.ai/) | The official documentation: install paths, serving API, supported models and quantization formats. |
| [https://blog.vllm.ai/2025/09/05/anatomy-of-vllm.html](https://blog.vllm.ai/2025/09/05/anatomy-of-vllm.html) | The official engineering walkthrough of the engine internals: KV paging, scheduling, batching. |
| [https://www.lmsys.org/blog/2024-01-17-sglang/](https://www.lmsys.org/blog/2024-01-17-sglang/) | The SGLang side of the cache strategy comparison (RadixAttention). |

{% callout type="warning" title="We have not run this yet" %}
Everything on this page comes from the upstream docs. We have not yet installed vLLM or served a model on our own hardware, so do not publish throughput or latency numbers for vLLM from memory or social posts. We also have not found a primary source that says whether vLLM supports PrismML's Bonsai formats (1-bit/ternary), so treat Bonsai serving as local-only for now.
{% /callout %}

## Next steps

- Read [the KV cache guide](/docs/technical-guides/kv-cache) to understand the memory problem PagedAttention solves.
- See [the supply chain layers](/docs/ecosystem/supply-chain-layers) for where runtime and serving fits in the full map.
- Run [Bonsai with llama.cpp](/docs/build-and-run/bonsai-llamacpp) to try the local counterpart of what vLLM does in the datacenter.
- These engines run on Kubernetes in production. Build that layer yourself in [Kubernetes The Hard Way](/docs/learning-paths/kubernetes-the-hard-way).

See something wrong? [Fix it](/docs/contribute/contributor-guide).
