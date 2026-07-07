---
title: "Why does batch size trade latency for throughput in LLM serving?"
description: "Bigger batches raise total tokens per second during memory-bound decode, but each user's stream slows. Continuous batching softens that penalty."
audience: inference-engineer
pillar: foundational-concept
book: inference-engineering
chapter_ref: "Ch. 7, sec. 7.2.1 (pp. 186-188)"
status: published
last_reviewed: 2026-07-07
---

Bigger batches raise total tokens per second by keeping the GPU busy during memory-bound decode, but each individual user's stream slows down. Continuous batching, also called in-flight batching, swaps requests at the token level to soften that penalty versus static batching. This is the cleanest framing of the serving frontier between latency and throughput. {% .lead %}

## Understand why one batch shares one weight read

Decode is memory bound. For every token it generates, the GPU reads the full set of model weights from memory and does one small multiply per request. The compute units finish their work long before the memory system finishes moving bytes, so at batch size 1 the GPU spends most of each step waiting on memory.

Batching fills that idle compute. When eight requests sit in one batch, the GPU still reads the weights once per step, but that one read now produces eight tokens instead of one. The cost of the read is shared, so aggregate tokens per second goes up.

The penalty lands on each user. Each decode step now carries eight requests' worth of compute and eight requests' worth of KV cache reads, so the step takes longer than it did at batch 1. Every user in the batch receives their next token a little later. Kiely's Inference Engineering (Ch. 7, sec. 7.2.1) states the rule directly: "Batch sizing trades off latency for throughput." Kiely's advice is to test several batch sizes against your own model, hardware, latency target, and budget, because no single batch size fits all four.

## Work through the ceiling arithmetic

You can derive the shape of the tradeoff from memory bandwidth alone. These numbers are ceilings from arithmetic, not benchmarks.

Take an 8 billion parameter model in FP16. The weights are about 16 GB. Every decode step reads all of them. On a GPU with 3.35 TB/s of memory bandwidth, the most decode steps you can run per second is 3350 divided by 16, which is about 209 steps per second.

- At batch 1, each step yields 1 token. The ceiling is about 209 tokens per second in total, and the one user gets all 209.
- At batch 4, each step yields 4 tokens. The ceiling is about 836 tokens per second in total. Each user's rate stays near 209 in this ideal model, because the weight read still dominates the step time.
- At batch 8, the total ceiling is about 1,672 tokens per second, again with each user near 209.

Real servers fall short of these ceilings, and the gap grows with batch size. Each added request adds compute and adds its own KV cache reads, so steps slow down and per-user tokens per second drops below the ideal number. The pattern to expect is that total throughput keeps climbing as you add requests, while per-user speed keeps falling. Your job is to find the batch size where total throughput is high and per-user latency is still inside your budget. That pair of numbers is your operating point.

## Pick a batching mode

Kiely's Inference Engineering (Ch. 7, sec. 7.2.1) lists three ways a server can form batches.

- **Static batching.** The server waits until the batch is full before it starts inference. Early requests sit in the queue while later ones trickle in, so early requests pay a long wait for nothing.
- **Dynamic batching.** The server starts when the batch is full or when a timer runs out. The timer caps the queue wait, but a request that arrives just after a batch launches still waits for the next one.
- **Continuous batching.** The server runs inference nonstop and swaps requests in as slots open up. Requests join and leave at the token level, so a new request does not wait for the current batch to finish.

Kiely notes that engines like vLLM, SGLang, and TensorRT-LLM implement continuous batching, and that TensorRT-LLM calls it in-flight batching. Compared to static batching, it removes most of the queue time without giving up the shared weight read, which is why it is the default in modern serving stacks.

{% callout type="note" %}
Batch size also feeds your autoscaler. Kiely points out that the autoscaler's concurrency target and the replica's batch size should match. When every replica runs at its maximum concurrency, the system scales up, and when replicas keep launching half-full batches, it scales down.
{% /callout %}

## Try it

Measure the tradeoff on your own machine with llama.cpp. This takes under 30 minutes with a model you already have.

Start a server with 4 parallel slots. The `-np` flag sets how many requests decode at once, and the context is split across slots.

```bash
llama-server -m ./model.gguf -c 16384 -np 4 --port 8080
```

Write 20 short prompts, one per line, in `prompts.txt`. Then run them one at a time and record the total wall time.

```bash
time while IFS= read -r p; do
  curl -s http://localhost:8080/v1/completions \
    -H "Content-Type: application/json" \
    -d "{\"prompt\": \"$p\", \"max_tokens\": 128}" > /dev/null
done < prompts.txt
```

Now run the same 20 prompts with 4 in flight at once.

```bash
time xargs -P 4 -I {} curl -s http://localhost:8080/v1/completions \
  -H "Content-Type: application/json" \
  -d '{"prompt": "{}", "max_tokens": 128}' \
  -o /dev/null < prompts.txt
```

Compare the two total times to see the throughput gain. Then wrap each curl in its own `time`, or read the per-request timings from the server log, to see the per-request latency cost. Restart the server with `-np 8` and run the concurrent test again to get a third point on the curve.

## Check yourself

1. Why does batching raise throughput during decode? Expected answer: decode is memory bound, and one read of the weights now produces one token for every request in the batch, so the cost of moving bytes is shared.
2. What are your aggregate tokens per second and your per-user tokens per second at batch sizes 1, 4, and 8 on your own server? Expected answer: your three measured pairs from the exercise, with aggregate rising and per-user falling as the batch grows.
3. At which batch size did per-user latency cross your acceptable line? Expected answer: the specific size from your run, stated against a latency budget you wrote down before testing.
4. Why does continuous batching beat static batching on latency at the same batch size? Expected answer: requests join at the token level as slots open, so a new request does not wait in a queue for a full batch to form or finish.

## Next steps

- Read the [batching guide](/docs/technical-guides/batching) for how to set batch limits in a production server.
- Read the [autoscaling guide](/docs/technical-guides/autoscaling) to tie your chosen concurrency target to replica scaling.
- Read [why is LLM prefill compute-bound but decode memory-bound?](/blog/prefill-compute-bound-decode-memory-bound) for the arithmetic behind the shared weight read.

When you can do this, you can measure the batch-size frontier on a local server and choose an operating point against a stated latency budget.
