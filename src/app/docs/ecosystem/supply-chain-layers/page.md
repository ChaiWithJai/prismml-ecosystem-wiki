---
title: Supply Chain Layers
status: published
audience: DevRel
owner: Ecosystem librarian
source_tier: mixed
benchmark_status: not_applicable
last_reviewed: 2026-07-07
---

The ML supply chain is the chain of tools and decisions that take a small model from raw data to a product running on a real device. On this page you can see the nine layers of that chain, learn what question each layer answers, and find the tools that live in each one. {% .lead %}

{% supply-chain-diagram /%}

## Understand the nine layers

Every tool in this ecosystem sits in one layer of the chain. For example, llama.cpp is a runtime. It answers the question "how does inference run on my machine?", and it sits downstream of the compression layer that produced the GGUF file it loads. When you know which layer a tool belongs to, you know what job it does and which tools sit next to it.

| Layer | Question it answers | Tools and players in this layer |
| --- | --- | --- |
| Problems and users | What work should the model do, and how do we judge success? | Domain owners, benchmark authors, Arena-style evaluators. |
| Data and features | What raw data, features, embeddings, prompts, and labels feed the system? | Feature stores, data pipelines, vector stores, Ray Data-style pipelines. |
| Model architecture | Which backbone fits the workload? | Transformers, state space models, hybrid models, Liquid-style models, PrismML Bonsai. |
| Training and post-training | How is the model adapted or aligned? | Unsloth, TRL, OpenRLHF, Axolotl, LLaMA-Factory. |
| Compression and formats | How does the model fit into memory and onto devices? | GGUF, MLX, AWQ/GPTQ, FP8/MXFP4/NVFP4, PrismML 1-bit/ternary. |
| Kernels and compilers | What makes the math fast enough? | CUDA, Triton, CUTLASS, FlashAttention, Metal, MLX kernels. |
| Runtime and serving | How does inference run reliably and cheaply? | llama.cpp, MLX, Ollama, LM Studio, vLLM, SGLang, Ray Serve. |
| Apps, agents, devices | Where does the model run for users? | Phones, laptops, browsers, local agents, robots, enterprise apps. |
| Evaluation and feedback | How do we know it works and improves? | Human preference workflows, Arena-style evals, regression suites. |

## Watch where the layers pull against each other

The layers are not independent. A choice in one layer changes what is possible in the next, and the tradeoffs below come up again and again when you read benchmark claims or plan a local deployment.

- **Compression vs quality.** Smaller weights need less memory, but you still have to measure what the compression did to quality and task scope.
- **Weight size vs KV cache.** With 1-bit weights, the KV cache can become the largest use of memory at long context.
- **Prefill vs decode.** A speedup can apply to generation but not prompt processing, so check which phase a claim measures.
- **Runtime support vs model release.** A model is not broadly usable until the runtimes people actually run, e.g., llama.cpp or Ollama, support it.
- **Social excitement vs evidence.** Social posts are useful for discovering a tool, but treat their numbers as unconfirmed until a documented run backs them up.

## Next steps

- Run a model through the runtime layer yourself with the [Bonsai on llama.cpp recipe](/docs/build-and-run/bonsai-llamacpp).
- Then read the [KV cache guide](/docs/technical-guides/kv-cache) to understand the memory tradeoff you just saw in action.

See something wrong? [Fix it](/docs/contribute/contributor-guide).
