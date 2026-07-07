---
title: "Why don't prefix caching and tensor parallelism help embedding models?"
description: "Embedding models process all tokens in one parallel pass. There is no decode loop to cache for and nothing to split across GPUs. Replicate instead."
audience: inference-engineer
pillar: ecosystem-player
book: inference-engineering
chapter_ref: "Ch. 6, sec. 6.2.2 (p. 162)"
status: draft
last_reviewed: 2026-07-07
---

Embedding models process all tokens in one parallel pass, so there is no decode loop to cache for and nothing worth splitting across GPUs at the 100 MB to 1 GB scale. The right playbook is horizontal replication, one replica per GPU or core, plus aggressive batching and queueing. Optimization menus are modality specific, and copying the LLM playbook onto an encoder wastes effort. {% .lead %}

## Understand what an encoder skips

An LLM serves a request in two phases. Prefill reads the whole prompt in one parallel pass, and then decode generates the output one token at a time in a loop. Most of the famous LLM optimizations exist to make that loop cheaper or to keep it fed.

An embedding model has no loop. It reads the input in one parallel pass, exactly like prefill, and then outputs a single fixed-length vector. There is no second phase. Philip Kiely's *Inference Engineering* (Ch. 6, sec. 6.2.2) draws the conclusion directly. Because embedding models process tokens in parallel, "prefix caching and disaggregation aren't relevant optimizations."

If you have not read about the two phases yet, [What are prefill and decode?](/blog/what-are-prefill-and-decode) covers them first.

## Name the three optimizations that do not transfer

These three techniques are standard for LLM serving, and each one fails on an encoder for an architectural reason.

- **Prefix caching.** For an LLM, the server stores the KV cache from a prompt so the next request with the same prefix can skip recomputing it, and the saved work is reused across the long decode loop. An encoder runs one forward pass, returns a vector, and keeps no KV cache between requests. There is nothing to reuse and no later phase to reuse it in. The [prefix caching guide](/docs/technical-guides/prefix-caching) explains the LLM side.
- **Disaggregated serving.** For an LLM, prefill and decode have different hardware needs, so large deployments split them onto separate workers. An encoder has only the prefill-like phase. With one phase there is nothing to separate.
- **Tensor parallelism.** For an LLM, tensor parallelism splits the weights of each layer across GPUs because one GPU cannot hold the model. Embedding models are small. Kiely notes that given their size, splitting them across GPUs is not effective. The synchronization after every layer costs time, and the model never needed the extra memory.

The general lesson is that an optimization belongs to a bottleneck, not to a model family. The LLM techniques above all target the decode loop or the memory footprint. An encoder has neither problem, so it needs a different menu.

## Do the arithmetic on model size

Here is why tensor parallelism has nothing to work on. A BERT-style encoder with 110M parameters stored in FP16 at two bytes per parameter takes about 220 MB of weights. Even a large LLM-based embedding model at 8B parameters in FP8, one byte per parameter, takes about 8 GB. A single 24 GB GPU holds either one with room to spare.

Now split the 220 MB model across four GPUs with tensor parallelism. Each GPU holds about 55 MB of weights, and after every layer the four GPUs must exchange partial results before the next layer can start. You paid for four GPUs and a synchronization tax to solve a memory problem you never had. These sizes are derived from parameter counts and precision, not measured benchmarks.

Kiely's answer is that high-traffic deployments "should scale horizontally, with each GPU as its own replica." Four GPUs as four independent replicas give you roughly four times the throughput with no communication between them.

## Scale with replicas, batches, and a queue

The encoder playbook has three parts.

1. Run one full copy of the model per GPU, or per CPU core for small models, behind a load balancer. Add replicas to add throughput.
2. Batch aggressively. Kiely points out that embedding models accept much larger batch sizes than other models, and a single request can carry dozens or hundreds of texts in one list. The [batching guide](/docs/technical-guides/batching) covers how the server forms batches.
3. Put a queue in front. Traffic bursts and backfill jobs can exceed even large batch sizes, and Kiely calls a queuing system essential infrastructure for embedding inference. The queue holds excess requests instead of dropping them, and the replicas drain it.

The techniques that do transfer from LLM serving are the ones that target the forward pass itself, e.g., FP8 weight quantization, which the book recommends checking with a cosine similarity of at least 99 percent between original and quantized outputs. Note that this whole post is about encoders. An LLM like [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf) has a decode loop, so the full LLM menu applies to it.

## Try it

This exercise needs no GPU and takes about 20 minutes. Simulate a FIFO queue feeding two replica workers and watch it absorb a burst.

Model one second per tick. Steady traffic is 50 requests per tick. Each replica serves 40 requests per tick, so two replicas serve 80. At tick 10, a 10x burst arrives, 500 requests per tick for 3 ticks, then traffic returns to 50.

```python
queue = 0
capacity = 80  # two replicas at 40 requests per tick
for tick in range(80):
    arrivals = 500 if 10 <= tick < 13 else 50
    queue += arrivals
    served = min(queue, capacity)
    queue -= served
    print(f"tick {tick:2d}  arrivals {arrivals:3d}  served {served:2d}  queue depth {queue}")
```

Run it and check three things. The printed queue depth peaks at 1,260 at tick 12, because the burst delivers 1,500 requests while the replicas serve 80 per tick for 3 ticks, and 1,500 minus 240 is 1,260. No request is ever dropped. After the burst, the queue drains at 30 requests per tick, the 80 served minus the 50 still arriving, so it empties 42 ticks later. Then rerun it with `capacity = 40` to see what one replica does, and the queue never drains at all because arrivals equal capacity.

## Check yourself

1. Why does prefix caching do nothing for an embedding model? Expected answer: prefix caching reuses the KV cache from prefill during later requests and the decode loop, and an encoder runs one forward pass, keeps no KV cache between requests, and has no decode loop.
2. Which three LLM optimizations from this post do not transfer to encoders? Expected answer: prefix caching, because there is no KV cache to reuse, disaggregated serving, because there is only one phase so nothing can be split, and tensor parallelism, because the model fits on one device and splitting adds synchronization cost for no memory benefit.
3. Your embedding service handles 80 requests per second on two replicas and a backfill job sends a 10x burst. What do you change first? Expected answer: nothing about the model. Make sure a queue sits in front so the burst is held rather than dropped, and add replicas if the drain time is too long.
4. A teammate wants to serve a 220 MB encoder with tensor parallelism across four GPUs. What do you propose instead? Expected answer: run four independent replicas, one per GPU, behind a load balancer, which gives about four times the throughput with no per-layer communication.

## Next steps

- [Batching](/docs/technical-guides/batching) covers batch formation, and encoders reward it more than any other model type.
- [Prefix caching](/docs/technical-guides/prefix-caching) explains the LLM-side technique so you can see exactly what an encoder lacks.
- [What are prefill and decode?](/blog/what-are-prefill-and-decode) covers the two LLM phases that this post keeps contrasting against.

When you can do this, you can construct a modality-appropriate scaling plan for an encoder and reject inapplicable LLM techniques with reasons.
