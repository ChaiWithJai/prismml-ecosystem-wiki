---
title: "Why do multi-GPU LLM deployments need NVLink or InfiniBand?"
description: "NVLink within a node is an order of magnitude faster than InfiniBand between nodes. Interconnects vary by provider, so verify what you are getting."
audience: inference-engineer
pillar: ecosystem-player
book: inference-engineering
chapter_ref: "Ch. 3, sec. 3.3.1 Multi-GPU Instances (pp. 84-86)"
status: draft
last_reviewed: 2026-07-07
---

Multi-GPU inference sits on a bandwidth hierarchy. NVLink within a node is about an order of magnitude faster than InfiniBand between nodes, and InfiniBand is in turn far faster than commodity Ethernet. Interconnects also vary by cloud provider, even for the same GPU. A weaker link than you expected is a silent bottleneck for tensor parallelism, so verify what you are actually getting. {% .lead %}

## Learn the hierarchy

Philip Kiely's *Inference Engineering* (Ch. 3, sec. 3.3.1) describes how GPUs are wired together. The standard unit is a node, which contains eight GPUs. Within a node, two systems connect them.

- NVLink is a one-to-one link between GPUs. The book lists it at up to 1800 GB/s on Blackwell and 900 GB/s on Hopper.
- NVSwitch sits on top of NVLink and gives every GPU in the node an all-to-all path to every other GPU.

Between nodes, the standard is InfiniBand. Kiely lists it at up to 400 Gb/s per network interface controller, and notes that Ethernet tops out at 100 Gb/s per controller. So each hop outward is a large drop, and the book's advice is to keep these relative bandwidths in mind, because an interconnect that is "an order of magnitude faster than InfiniBand" can carry far more traffic before it is the bottleneck.

The same cliff continues inside the GPU. An H100 moves data between its cores and VRAM at 3.35 TB/s, and its 50 MB of on-chip L2 cache is faster still. Activations that leave the chip pay more at every step: L2, then VRAM, then NVLink, then InfiniBand.

## Work the numbers

The units hide how steep the cliff is, because memory is quoted in gigabytes per second and networking in gigabits per second. Convert everything to GB/s for one Hopper node.

- InfiniBand: 400 Gb/s divided by 8 bits per byte is 50 GB/s per controller.
- NVLink on Hopper: 900 GB/s, which is 900 / 50 = 18 times the InfiniBand figure.
- H100 VRAM: 3350 GB/s, which is about 3.7 times NVLink and 67 times InfiniBand.
- Ethernet: 100 Gb/s is 12.5 GB/s, a quarter of the InfiniBand figure.

These are the book's spec numbers per link, not measured throughput, and a node has multiple network controllers, so total node-to-node bandwidth is higher than the per-link figure. But the ratios are the point. Traffic that is cheap on NVLink is roughly 18 times more expensive per link once it crosses InfiniBand.

This is why the parallelism strategies split the way they do. Tensor parallelism combines partial results across GPUs after every layer, so it wants NVLink and stays inside a node. Pipeline and expert parallelism send far less between GPUs, so they tolerate InfiniBand between nodes. The [tensor vs pipeline vs expert parallelism](/blog/tensor-vs-pipeline-vs-expert-parallelism) post walks through that decision. A model like [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf) fits on one GPU, so it needs none of this. The hierarchy starts to bind when the model or its KV cache outgrows a single GPU.

## Verify what your provider sells

The book warns that instances vary by provider even when the GPU is the same. Kiely writes that "not every cloud provider uses InfiniBand". Some providers use their own interconnects, and some offer InfiniBand on certain GPU types but not others. Even the GPU itself can differ. An A100 comes in PCIe and SXM form factors, and the SXM variant has five percent higher memory bandwidth.

The failure mode is quiet. If you run tensor parallelism across GPUs that are connected by PCIe instead of NVLink, or across nodes on plain Ethernet, nothing crashes. The per-layer synchronization just waits on the slow link, and your tokens per second drop while the invoice stays the same. Kiely's advice when provisioning is to check what interconnect the instance provides and what bandwidth it delivers, before you commit to a parallelism plan.

NVIDIA also sells a way around the node boundary. The NVL72 GB200 system puts 72 Blackwell GPUs and 36 Grace CPUs in one rack with NVLink among all of them, so the NVLink domain extends past eight GPUs. Most cloud instances are not this, which is one more reason to read the instance page rather than assume.

## Try it

This exercise takes about 20 minutes and needs no GPU, only a browser.

1. Open the H100 instance documentation for two cloud providers, e.g., the AWS p5 instance page and the Google Cloud A3 machine family page.
2. For each provider, find two numbers: the GPU-to-GPU interconnect within the instance (NVLink or PCIe, and its stated bandwidth) and the node-to-node network (InfiniBand, EFA, or Ethernet, and its stated bandwidth).
3. Record them in a two-row table. Watch the units, and convert Gb/s to GB/s by dividing by 8 so the rows are comparable.

| Provider | GPU-to-GPU type and GB/s | Node-to-node type and GB/s |
| --- | --- | --- |
| Provider A | | |
| Provider B | | |

4. For each row, write one sentence predicting which parallelism strategies the instance supports well. NVLink within the node supports tensor parallelism. A fast node-to-node fabric supports expert or pipeline parallelism across nodes. A slow one confines you to a single node.

If the page does not state a bandwidth, that is a finding too. Ask the provider before you deploy.

## Check yourself

1. Roughly how much faster is NVLink than InfiniBand, per link on Hopper? Expected answer: about 18 times. 900 GB/s versus 400 Gb/s, which is 50 GB/s.
2. List the bandwidth hops an activation crosses from fastest to slowest. Expected answer: on-chip cache (L2), then VRAM at about 3.35 TB/s on an H100, then NVLink at 900 to 1800 GB/s, then InfiniBand at about 50 GB/s per controller, then Ethernet at about 12.5 GB/s.
3. Why does tensor parallelism need NVLink while expert parallelism tolerates InfiniBand? Expected answer: tensor parallelism combines results across all GPUs after every layer, so it sends a lot of data. Expert parallelism only sends a token to a remote GPU when it needs an expert there.
4. Two providers both sell "8x H100" instances. Why might they perform differently for tensor parallelism? Expected answer: the interconnect can differ. One may use SXM GPUs with NVLink and NVSwitch, and the other PCIe GPUs, and node-to-node fabrics differ too, so check the stated interconnect and bandwidth.

## Next steps

- [Parallelism](/docs/technical-guides/parallelism) maps each strategy to the interconnect it needs.
- [Hardware requirements](/docs/getting-started/hardware-requirements) lists the interconnects on common instance types.
- [Tensor vs pipeline vs expert parallelism](/blog/tensor-vs-pipeline-vs-expert-parallelism) turns this bandwidth hierarchy into a deployment decision tree.

When you can do this, you can verify interconnect specs across providers and predict which parallelism strategies each instance supports.
