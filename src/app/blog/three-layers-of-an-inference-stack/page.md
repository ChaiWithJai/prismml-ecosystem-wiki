---
title: "What are the three layers of an inference stack?"
description: "Production inference is three layers: the runtime for single-GPU model performance, the infrastructure for scaling and uptime, and the tooling on top."
audience: inference-engineer
pillar: foundational-concept
book: inference-engineering
chapter_ref: "Ch. 0, Inference (pp. 17-21)"
status: draft
last_reviewed: 2026-07-06
---

Production inference is three cooperating layers, and not only GPUs plus weights. The runtime makes one model fast on one GPU-backed instance. The infrastructure scales that model across clusters and clouds while keeping it up. The tooling is the developer abstraction on top of both. When someone says "the model is slow", start by asking which of the three layers owns the problem. {% .lead %}

## Name the three layers

Philip Kiely's *Inference Engineering* (Ch. 0, pp. 17-21) opens with a warning. You cannot take model weights, rent some GPUs, and expect the result to be fast and reliable at production scale. Kiely argues that doing inference well requires three layers that must work together.

- **Runtime.** The software that runs one model on one GPU-backed instance as fast as the hardware allows. This includes CUDA, PyTorch, and inference engines such as vLLM, SGLang, and TensorRT-LLM. It also includes techniques such as batching, KV caching, quantization, and speculative decoding.
- **Infrastructure.** The systems that scale the model across replicas, clusters, regions, and clouds while keeping uptime high. This includes routing, load balancing, autoscaling, and capacity management.
- **Tooling.** The interface that engineers use to work with the other two layers. This includes your deploy scripts, your configuration format, and whatever abstraction sits between an engineer and the GPUs.

Each layer has a different failure mode, and that is why the split is useful for diagnosis.

## Understand why runtime work is never enough

The runtime layer answers one question. How many tokens per second can one instance produce, and at what latency? Kiely lists the main techniques, e.g., batching weaves many requests together token by token so one GPU serves more users at once.

But Kiely is direct about the limit of this layer. No matter how fast a single model server is, it will eventually receive more traffic than it can handle. He writes that at that point "This is not a CUDA problem or a PyTorch problem" but a systems problem for the infrastructure layer.

The infrastructure problems also change with scale. At small scale the problem is autoscaling, which means knowing when to add or remove replicas and doing it quickly. Kiely says that past a few hundred GPUs the problem becomes capacity, so teams spread workloads across regions and cloud providers. That spreading creates silos, where one cluster starves while another sits idle, and the end state is a global system that treats all GPUs as one pool.

The tooling layer then decides how much of this an engineer has to see. Kiely describes two extremes. One extreme is a black box where you hand over weights and get back an API. The other extreme gives you only raw compute, network, and disk. He argues the right developer experience is in the middle, with enough control to run production inference confidently and enough abstraction to work productively.

## Work one failure through the layers

Here is a worked example with derived numbers, not benchmarks. Suppose your runtime produces 30 output tokens per second per request on your hardware. Treat that number as an assumption for the arithmetic.

A typical response in your app is 600 output tokens. So one response takes 600 / 30 = 20 seconds of decode time. Your users see 20 seconds and that feels acceptable for your use case.

Then traffic grows from 5 concurrent requests to 50. Your single replica batches up to 16 requests before quality of service drops, so 34 requests now wait in a queue. A user at the back of the queue waits for slots to free up before their 20 seconds even starts, so their total time can pass 60 seconds.

Which layer owns this? Not the runtime, because each request still decodes at 30 tokens per second once it starts. Not the tooling, because your deploy scripts did exactly what you asked. The infrastructure owns it, because nothing added a second replica when the queue formed. The fix is autoscaling, not a faster kernel.

Now flip the case. If every request is slow even at 3 concurrent users, the runtime owns it, e.g., you may be running unquantized weights that do not fit well on your GPU. And if requests are fast but your team keeps shipping the wrong model version, the tooling owns it, because the abstraction let a human make a bad deploy too easily.

## Try it

Draw your current serving setup, or a hypothetical one, as a three-layer diagram. A home lab counts. In a llama.cpp setup, llama.cpp is the runtime, Docker Compose plus nginx is the infrastructure, and your Makefile is the tooling.

1. Take a blank page or a text file and write three headings: runtime, infrastructure, tooling.
2. Under each heading, list what you actually run at that layer. For a home lab that could be:

```text
runtime:        llama.cpp (server mode, one GPU or CPU)
infrastructure: docker compose + nginx reverse proxy
tooling:        Makefile with `make deploy` and `make logs`
```

3. Label one known weakness per layer, e.g., "runtime: no quantization tuning", "infrastructure: one replica, no failover", "tooling: no rollback target in the Makefile".

This should take under 30 minutes, and the diagram is worth keeping in your repo.

## Check yourself

Answer these for one recent latency or reliability issue you have seen.

1. Which single layer owned it? Expected answer: one of runtime, infrastructure, or tooling, with a one sentence reason.
2. Why did the runtime not own it? Expected answer: per-request speed on a warm, unloaded instance was fine, or it was not.
3. Why did the infrastructure not own it? Expected answer: replicas, routing, and capacity behaved correctly under the traffic at the time, or they did not.
4. Why did the tooling not own it? Expected answer: no human misused a deploy or configuration abstraction to cause it, or one did.

If you cannot assign the issue to one layer, that is usually a sign you never found the root cause.

## Next steps

- Read the concept page on the inference stack at [/docs/concepts/inference-stack](/docs/concepts/inference-stack).
- Run your first request end to end with [/docs/getting-started/first-inference](/docs/getting-started/first-inference), then place each piece of that walkthrough into one of the three layers.

When you can do this, you can classify a described serving failure into runtime, infrastructure, or tooling within one minute.
