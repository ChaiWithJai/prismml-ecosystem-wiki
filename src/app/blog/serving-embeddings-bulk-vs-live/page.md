---
title: "How do I serve embeddings for both bulk indexing and live search?"
description: "Embedding traffic splits into high-throughput backfills and low-latency lookups. One deployment tuned for both satisfies neither, so run two serving profiles."
audience: inference-engineer
pillar: ecosystem-player
book: inference-engineering
chapter_ref: "Ch. 6, sec. 6.2 (p. 160)"
status: published
last_reviewed: 2026-07-07
---

Embedding traffic splits into high-throughput backfills and low-latency lookups, and one deployment tuned for both satisfies neither. The batch-and-queue config that maximizes indexing throughput wrecks P99 lookup latency. At sufficient traffic these become two systems that share weights, which is the feature store pattern applied to inference. {% .lead %}

## Split the traffic before you pick a config

Kiely's Inference Engineering (sec. 6.2) says embedding workloads come in exactly two traffic profiles. The first is the high-throughput backfill, e.g., indexing millions of documents into a vector database. No one is waiting on any single vector, so the only number that counts is vectors finished per GPU-hour. The second is the low-latency lookup. A person typed a search query and is watching the screen, so the query must be embedded before retrieval can even start, and every millisecond of that shows up in what the person feels.

Kiely's advice is direct. When you need both profiles and have enough traffic, "it's better to build a separate system for each type of usage" (Inference Engineering, sec. 6.2).

The reason one config cannot serve both is batching. A GPU embeds far more sentences per second when it processes hundreds of them together, and the book notes that embedding models accept much larger batches than other model types because they are small and they process tokens in parallel. But a big batch only forms if requests wait in a queue until it fills, and a queue is exactly what a live search query cannot afford. Our [batching guide](/docs/technical-guides/batching) explains the mechanism.

## Run two profiles of the same weights

The two systems load the same model. Only the serving config differs.

- **Backfill profile.** Large maximum batch size, a deep queue, and no latency target. Scale it by adding whole replicas when the queue grows, because the book notes that embedding models are too small for multi-GPU parallelism to help, so each GPU runs as its own replica. Spin it up for the job and scale it to zero after. Our [autoscaling guide](/docs/technical-guides/autoscaling) covers both directions.
- **Lookup profile.** Small maximum batch size, a short queue timeout so a lone query is embedded immediately instead of waiting for company, and an alert on P99 latency. Keep it always on, sized for peak query traffic rather than for the queue depth of the last backfill.

If this split sounds familiar, it is the same one a feature store makes for features. A feature store computes features in bulk offline and serves single rows online from the same definitions. Here the shared definition is the model weights, and the two paths are the two serving profiles. Sharing the weights is not optional, because the book warns that vectors from different embedding models cannot be compared, and the same caution applies to serving stacks that quantize or truncate the model differently on each path. If the backfill path used FP8 weights and the lookup path used FP16, you would be comparing query vectors against index vectors from a slightly different model. Verify the two paths agree by embedding the same inputs through both and checking cosine similarity, which Kiely suggests should be at least 99 percent.

The book adds that LLM-based embedding models, generally at or under 8B parameters, now beat the older BERT-style ones on quality. That size class is the same as a small chat model like [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf), so the serving toolbox is the one you already use for small LLMs, e.g., vLLM, TEI, or TensorRT-LLM.

## Work the arithmetic on one backfill

The speeds below are made up to show the arithmetic. Measure your own before deciding anything.

Suppose you must index 20 million product descriptions, a GPU costs $2 per hour, your live search budget for the embedding step is 50 ms, and you measure these two speeds on your hardware:

- At batch size 1, the model embeds 200 sentences per second, and each sentence returns in 1/200 = 5 ms.
- At batch size 256, the model embeds 4,000 sentences per second.

The backfill costs are then:

- Batch size 1: 20,000,000 / 200 = 100,000 seconds, which is about 27.8 GPU-hours, or $55.60.
- Batch size 256: 20,000,000 / 4,000 = 5,000 seconds, which is about 1.4 GPU-hours, or $2.80.

The lookup profile config overpays for the backfill by 20 times, which is the ratio of the two measured speeds at any GPU price. Now run the mistake the other way. On the batch config, one batch of 256 takes 256 / 4,000 = 64 ms of compute alone, and that is already past the 50 ms budget before the query spends a single millisecond in the queue waiting for 255 companions. At low traffic the queue wait dominates and the query either sits until a timeout fires or ships in a padded batch. Either way, P99 is gone. One config cannot win both numbers, which is why sec. 6.2 recommends two systems.

## Try it

You can see both regimes in about 15 minutes with sentence-transformers. A GPU makes the gap wider, but a laptop CPU shows the same shape, just with smaller numbers and a longer run.

```bash
pip install sentence-transformers datasets
```

Save this as `embed_bench.py`:

```python
import time
from sentence_transformers import SentenceTransformer
from datasets import load_dataset

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
sentences = load_dataset("ag_news", split="train[:10000]")["text"]

for bs in [1, 32, 256]:
    start = time.perf_counter()
    model.encode(sentences, batch_size=bs)
    total = time.perf_counter() - start
    throughput = len(sentences) / total
    per_item_ms = (bs / throughput) * 1000
    print(f"batch={bs:4d}  {throughput:8.0f} sent/s  {per_item_ms:7.1f} ms per batch")
```

```bash
python embed_bench.py
```

The per-batch time is the compute floor a live query pays if it lands in a batch that size. Plot throughput against it, or just read the two columns. Throughput keeps climbing as the batch grows, and somewhere along the way the per-batch time crosses 50 ms. Note where. Everything left of that point is lookup territory and everything right of it is backfill territory.

## Check yourself

1. Why can one embedding deployment not serve backfills and lookups well at the same time? Expected answer: high throughput requires large batches and a queue, and a live query cannot wait in a queue or share a 64 ms batch, so any one config sacrifices one side.
2. In the worked example, what does running the 20 million document backfill on the lookup config cost versus the batch config? Expected answer: $55.60 versus $2.80, a 20 times overpay, and the multiple is the ratio of your own two measured speeds.
3. From your benchmark run, at which batch size did per-batch latency pass a 50 ms budget even though throughput was still rising? Expected answer: your measured number. The point is that the crossing exists, so throughput alone cannot pick the batch size for the lookup path.
4. Both profiles share weights. What must you verify, and how? Expected answer: that both paths produce the same vectors, by embedding identical inputs through each and checking cosine similarity of at least 99 percent, per Kiely.

## Next steps

- [Batching](/docs/technical-guides/batching) explains why throughput and latency pull against each other.
- [Autoscaling](/docs/technical-guides/autoscaling) covers scaling the backfill fleet to zero and holding the lookup fleet at peak.
- [What's the difference between online and offline inference?](/blog/online-vs-offline-inference) works the same split for a transcription workload.

When you can do this, you can configure and justify separate serving profiles for backfill and lookup embedding workloads.
