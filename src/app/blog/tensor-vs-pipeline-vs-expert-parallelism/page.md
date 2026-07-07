---
title: "Tensor vs pipeline vs expert parallelism: which should I use for LLM inference?"
description: "Tensor parallelism is the low-latency default within a node, expert parallelism scales MoE throughput across nodes, and pipeline parallelism is a last resort."
audience: inference-engineer
pillar: foundational-concept
book: inference-engineering
chapter_ref: "Ch. 5, secs. 5.4.1-5.4.3 (pp. 143-147)"
status: published
last_reviewed: 2026-07-07
---

Tensor parallelism is the low-latency default within a node. Expert parallelism scales MoE throughput cheaply across nodes. Pipeline parallelism is a last resort for multi-node dense models, because its step-by-step stages leave GPUs idle. The decision is driven by your interconnect, not just your model size. TP needs NVLink-class bandwidth, and EP tolerates InfiniBand. {% .lead %}

## Learn the three strategies

Philip Kiely's *Inference Engineering* (Ch. 5, sec. 5.4) defines the three forms of model parallelism.

- Tensor parallelism (TP) splits the tensors inside each layer across GPUs. Every GPU works on every layer at the same time.
- Pipeline parallelism (PP) splits the layers across GPUs. Each GPU holds a stage and passes its output to the next.
- Expert parallelism (EP) shards the experts of a mixture of experts (MoE) model across GPUs. Each expert lives whole on a single GPU.

The book's tradeoff table is blunt about pipeline parallelism. It is "not recommended due to poor latency and utilization" because the stages run one after another, so most GPUs sit idle while one stage works. TP and EP are the two strategies you should actually reach for, and PP survives only as a bridge between nodes.

## Match the strategy to the interconnect

The reason there are three strategies is that they need different amounts of communication between GPUs.

TP is the chattiest. After every layer, the partial results from all GPUs are combined in an all-reduce before the next layer can start. A model has dozens of layers, so this happens dozens of times per token. Inside a node, NVLink and NVSwitch make this cheap. Between nodes, InfiniBand is much slower than NVLink, and the per-layer synchronization becomes the bottleneck. This is why the book says TP is "not suitable for multi-node".

EP communicates far less. The router that picks experts is small, so it is copied onto every GPU rather than shared. GPUs only talk when a token needs an expert on another GPU, and there is no per-layer collection of results. Kiely notes that because of this lower overhead, EP scales well to multi-node deployments and to systems with limited interconnect bandwidth.

PP communicates the least of all, one handoff per stage boundary. That is why it still has a job on slow links. But the serial stages waste utilization, so you only accept PP when nothing better crosses the gap.

This gives a short decision tree.

1. Does the model fit on one GPU? Then use no model parallelism at all. [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf) fits on a single consumer GPU, so none of this post applies to it.
2. Does it fit in one node? Use TP across the node, e.g., TP8 on eight GPUs. NVLink absorbs the per-layer synchronization, and the split gives the lowest latency per user.
3. Does it need more than one node and the model is dense? Use TP inside each node and PP between nodes, e.g., TP8PP2. This keeps the chatty traffic on NVLink and sends only stage handoffs over InfiniBand.
4. Does it need more than one node and the model is MoE? Try EP across all GPUs, e.g., EP16, because expert routing tolerates InfiniBand. For a multi-node MoE model, the book says TP8PP2 gives lower latency per user and EP16 gives higher total throughput, so pick by which metric you are paid on.

## Work one example

Here is the sizing arithmetic from the book's DeepSeek example (Fig. 5.11), which sets up why parallelism is needed at all.

- DeepSeek-V3.1 has 671B parameters. In FP8, one byte per parameter, the weights alone are about 671 GB.
- Kiely multiplies by 1.8 to leave room for the KV cache, which gives about 1208 GB of required VRAM.
- Round up to the next real instance size. A node of eight B200 GPUs has 1440 GB, so the minimum is one full node, or TP8.

Now suppose traffic grows and you add a second node, for 16 GPUs total. DeepSeek is an MoE model, so both multi-node options are open. EP16 places whole experts on each GPU and routes tokens over InfiniBand, which raises total throughput. TP8PP2 keeps TP inside each node and pipelines between the two, which keeps per-user latency lower. Neither number here is a benchmark. The GB figures are derived from parameter count and precision, and the 1.8 multiplier is the book's planning estimate, not a measurement.

{% callout type="note" title="Multi-node is often the wrong buy" %}
Kiely adds that unless the model and KV cache force you across nodes, a second node is usually better spent on horizontal scaling, meaning independent replicas behind a load balancer, than on one parallelized deployment.
{% /callout %}

## Try it

You do not need 16 GPUs to practice this. The exercise is on paper and takes under 20 minutes.

Draw the decision tree with two questions. The first split is dense versus MoE. The second split is fits in one node versus needs multiple nodes. Then place these three deployments on it, with one line of justification each that names an interconnect constraint.

- TP8. One node, either architecture. The per-layer all-reduce stays on NVLink, so it is cheap.
- EP16. Multi-node MoE. Expert routing sends single tokens between GPUs and never collects per-layer results, so InfiniBand bandwidth is enough.
- TP8PP2. Multi-node dense. TP traffic would choke InfiniBand, so TP stays inside each node and only stage handoffs cross it.

If you do have two GPUs with NVLink or PCIe between them, you can also run the single-node case for real. vLLM splits a model with one flag.

```bash
vllm serve meta-llama/Llama-3.1-70B-Instruct --tensor-parallel-size 2
```

Watch `nvidia-smi` while it serves. Both GPUs should show similar utilization at the same time, which is the signature of TP. Under PP you would see them take turns. The [parallelism guide](/docs/technical-guides/parallelism) lists the equivalent flags for other engines.

## Check yourself

1. Why is TP a poor fit across nodes? Expected answer: TP runs an all-reduce after every layer, and InfiniBand is much slower than NVLink, so the synchronization dominates and decode slows down.
2. Why does EP tolerate InfiniBand when TP does not? Expected answer: the router is replicated on every GPU, tokens only cross the link when they need a remote expert, and EP never collects results after each layer.
3. You serve a multi-node MoE model. When do you pick TP8PP2 over EP16? Expected answer: when per-user latency is the goal. EP16 wins on total system throughput.
4. A teammate proposes PP2 for a dense model that fits in one node. What do you say? Expected answer: use TP instead, because within a node NVLink handles TP's communication and PP wastes utilization on serial stages.

## Next steps

- [Parallelism](/docs/technical-guides/parallelism) covers TP, PP, and EP flags for the major inference engines.
- [Hardware requirements](/docs/getting-started/hardware-requirements) maps interconnects, NVLink versus PCIe versus InfiniBand, to the strategies they support.
- [How much VRAM do I need to run an LLM?](/blog/how-much-vram-to-run-an-llm) covers the memory budget that decides whether you need parallelism at all.

When you can do this, you can select a parallelism strategy for a given model architecture and interconnect and defend it in one sentence.
