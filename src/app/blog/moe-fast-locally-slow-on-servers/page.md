---
title: "Why are MoE models fast locally but not on servers?"
description: "MoE models activate a fraction of parameters per token, so batch-1 local inference is cheap. Batched server traffic activates nearly all experts."
audience: inference-engineer
pillar: foundational-concept
book: inference-engineering
chapter_ref: "Ch. 2, sec. 2.2.4 (pp. 53-54)"
status: draft
last_reviewed: 2026-07-07
---

MoE models activate only a fraction of their parameters per token, e.g., 22B of 235B, which makes single-request local inference cheap. But batched server traffic activates nearly all experts across the batch, and that erases the advantage unless you add expert parallelism. The same architecture helps on a laptop and hurts on a shared server. {% .lead %}

## Separate resident memory from per-token compute

A mixture of experts (MoE) model replaces the one large feed-forward matrix in each transformer block with many smaller matrices called experts. A small router picks a few experts for each token at each layer, and only those experts do work for that token.

This creates two different numbers, and the whole question turns on keeping them apart.

- Resident memory is the total parameter count. Every expert must sit in RAM or VRAM, because the router may pick any of them for the next token. This number never shrinks.
- Per-token compute is the active parameter count. Only the chosen experts are read and multiplied for a given token.

Philip Kiely's *Inference Engineering* (Ch. 2, sec. 2.2.4) uses Qwen3-235B-A22B as the example. The model has 235 billion total parameters, and 22 billion are activated per request. The name encodes both numbers.

## See why batch 1 favors MoE

When you run a model locally, you decode one request at a time. Decode at batch 1 is limited by memory bandwidth, not by arithmetic, because each step reads the weights once to produce one token.

For a dense model, each token reads all the weights. For an MoE model, each token reads only the attention weights, the router, and the chosen experts. Fewer bytes read per token means more tokens per second on the same hardware. This is why Kiely writes that MoE models are "highly efficient for single-request local inference".

The cost is that you still pay full resident memory. A machine that runs the model at all must hold every expert, even though each token touches few of them.

## See why a batched server loses the advantage

A production server does not decode one request at a time. It batches many requests and decodes one token for each of them in the same step.

Each token picks its own experts, and different tokens pick different ones. Kiely's warning is that in batched inference, different requests activate different experts, so you "should expect almost all of the model parameters to be active" unless you shard the experts across GPUs with expert parallelism (his section 5.4.2). Once the batch touches nearly every expert per step, the server reads nearly all the weights per step anyway, so the bandwidth saving that made the model fast locally is gone. What remains is a model that costs 235B parameters of memory while a dense competitor with similar quality might cost far less.

Expert parallelism is the fix. It places whole experts on different GPUs, so each GPU reads only its own experts and the batch's work spreads across the machines. The [parallelism guide](/docs/technical-guides/parallelism) covers how to turn it on.

## Work one example

These figures are derived from the model's published architecture, not measured benchmarks.

- Qwen3-235B-A22B has 235B total parameters and 22B active per token. In FP8, at one byte per parameter, the resident weights are about 235 GB no matter the batch size.
- At batch 1, each decode step reads about 22 GB of weights instead of 235 GB. That is roughly 10.7 times fewer weight bytes per token than a dense 235B model, so decode is roughly that much faster on the same memory bandwidth.
- Kiely notes the router picks 8 of 128 experts at each of the model's 94 layers. Assume for a moment that routing is uniform, which real routing is not, so treat this as an estimate. For one token, a given expert at a given layer sits idle with probability 120/128, which is about 0.94.
- With a batch of 32 tokens per step, that expert sits idle with probability 0.94 to the power of 32, which is about 0.13. So about 87 percent of the experts at each layer do work in every step.
- At batch 64 the idle probability falls to about 0.02, so about 98 percent of experts are active per step.

At batch 1 the server reads 22 GB per step. At batch 64 it reads close to the full 235 GB per step. The per-token saving has almost vanished, and the memory bill never went away.

## Try it

This takes about 20 minutes with [Ollama](https://ollama.com) installed. You are reproducing the batch-1 case, where MoE wins, and measuring what it costs in memory. Pick an MoE model and a dense model with a similar active parameter count. Qwen3-30B-A3B has about 3B active parameters, so a dense 3B model is a fair partner.

```bash
ollama run qwen3:30b-a3b --verbose "Explain the KV cache in three sentences."
ollama run llama3.2:3b --verbose "Explain the KV cache in three sentences."
```

The `--verbose` flag prints the eval rate in tokens per second. While a model is loaded, run `ollama ps` in another terminal to see its memory footprint. Expect the MoE model to need roughly 20 GB of RAM or VRAM at 4-bit, while the dense 3B model needs about 2 GB. Those sizes are estimates from parameter count and quantization, so record your own numbers. If your machine cannot fit the 30B MoE, [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf) is a dense model that fits in about 5 GB and still shows the dense side of the comparison. The [hardware requirements guide](/docs/getting-started/hardware-requirements) maps model sizes to machines.

Then write one paragraph explaining the gap you measured. The check is that your paragraph keeps resident memory, meaning all experts loaded, separate from per-token compute, meaning only the active experts read. If the two numbers blur together in your explanation, rewrite it.

## Check yourself

1. An MoE model has 235B total and 22B active parameters. How much memory does it need at batch 1 in FP8, and how many weight bytes does one decode step read? Expected answer: about 235 GB resident, because every expert must be loaded, but each step reads only about 22 GB, which is why batch 1 is fast.
2. Why does batching erase the MoE speed advantage? Expected answer: each token in the batch picks its own experts, so a large batch activates nearly all experts per step, and the server reads close to the full weights per step just like a dense model.
3. What is the infrastructure prerequisite for serving a large MoE model efficiently? Expected answer: expert parallelism, which shards whole experts across GPUs so each GPU reads only its local experts and the batch's expert traffic spreads out.
4. Your teammate proposes an MoE architecture for a 7B model that serves one user on a laptop. Is MoE the right call? Expected answer: probably not, because Kiely notes models under 32B, and especially under 8B, tend to run efficiently as dense models, and the extra total parameters raise the memory bill.

## Next steps

- [Parallelism](/docs/technical-guides/parallelism) covers expert parallelism flags for the major inference engines.
- [Hardware requirements](/docs/getting-started/hardware-requirements) maps resident model size to the machines that can hold it.
- [Tensor vs pipeline vs expert parallelism](/blog/tensor-vs-pipeline-vs-expert-parallelism) covers when expert parallelism beats the other strategies.

When you can do this, you can predict how an MoE model's advantage changes between batch-1 and batched serving and state the infrastructure prerequisite for server-side MoE.
