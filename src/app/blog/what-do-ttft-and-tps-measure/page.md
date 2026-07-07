---
title: "What do TTFT and TPS actually measure for LLMs?"
description: "TTFT measures the compute-bound prefill phase and TPS the bandwidth-bound decode. Per-user TPS, system TPS, and inter-token latency are different numbers."
audience: inference-engineer
pillar: foundational-concept
book: inference-engineering
chapter_ref: "Ch. 1, sec. 1.4 (pp. 35-36)"
status: draft
last_reviewed: 2026-07-06
---

TTFT measures the compute-bound prefill phase, and TPS measures the bandwidth-bound decode phase. But TPS is an ambiguous term. Perceived per-user TPS, total system TPS, and inter-token latency are three different numbers, and vendors conflate them constantly. Precise terms keep you from buying the wrong optimization. {% .lead %}

## Separate the two phases before you measure

An LLM answers a request in two phases. In the prefill phase, the model reads your whole prompt at once and produces the first output token. This phase is limited by how much arithmetic the chip can do, which is why people call it compute bound. In the decode phase, the model produces the rest of the tokens one at a time. Each step has to pull the full model weights from memory, so this phase is limited by memory bandwidth, not arithmetic.

TTFT, or time to first token, is the clock time from sending the request until the first output token arrives. It measures the prefill phase. TPS, or tokens per second, describes how fast tokens arrive after the first one. It measures the decode phase.

Kiely's Inference Engineering (Ch. 1, sec. 1.4) pairs the two in a table. TTFT is "based on compute-bound prefill" and TPS is "based on bandwidth-bound decode". The book also notes that these two metrics fit user-facing streaming systems like chatbots. For a request where nobody reads the stream, e.g., a tool call inside an agent, you should measure total response time instead, because the individual tokens are not useful on their own.

## Name the three numbers people call TPS

Kiely points out that TTFT is a clear term but TPS is not, because it can describe latency for one user or throughput for a whole service. The book splits it into three precise terms.

- **Perceived TPS.** The tokens per second one user sees after the first token arrives. This is a latency number. It tells you how fast the answer feels.
- **Total TPS.** The tokens per second the whole inference service generates across every concurrent request. This is a throughput number. It tells you about cost and capacity, not about any single user's experience.
- **Inter-token latency (ITL).** The gap between one token and the next for one user. It is the inverse of perceived TPS. Kiely gives the conversion directly, an "ITL of 10 milliseconds equates to 100 tokens per second per user".

{% callout type="warning" %}
When a vendor says "500 TPS" without a qualifier, you do not know which of these three numbers they mean. A total TPS of 500 across 50 users is a perceived TPS of about 10, which reads as slow to every one of those users.
{% /callout %}

## Work one example with real numbers

Suppose you stream one request and record timestamps. The first token arrives 0.5 seconds after you sent the request, the response contains 300 tokens, and the last token arrives at 8.0 seconds.

- TTFT is 0.5 seconds. That is the prefill cost plus network time.
- The decode window is 8.0 minus 0.5, so 7.5 seconds, and it produced 299 tokens after the first one.
- ITL is 7.5 divided by 299, which is about 25 milliseconds per token.
- Perceived TPS is 299 divided by 7.5, which is about 40 tokens per second.

Now suppose the server batches 32 users at the same time and each one sees roughly this speed. Total TPS is 32 times 40, which is about 1,280 tokens per second. A vendor can honestly print "1,280 TPS" for this server while every user experiences 40. Both numbers are true, and they answer different questions. If your users complain that answers feel slow, buying more total TPS through bigger batches can make the problem worse, because larger batches usually raise ITL. So you need the precise term before you know which optimization to pay for.

One more caveat from the same section of the book. Response times for LLMs are right skewed, so a mean hides slow outliers. Measure percentiles like P50 and P99, not just the average, when you run this for real.

## Try it

You need a local OpenAI-compatible endpoint. The [llama.cpp recipe](/docs/build-and-run/bonsai-llamacpp) gets a [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf) server (PrismML's open-weight 1-bit model, Apache 2.0) running in a few minutes, e.g.:

```bash
llama-server -m Bonsai-8B-Q1_0.gguf --port 8080
```

Save this as `measure.py` and run it with `python3 measure.py`. It streams one prompt and reports the three numbers.

```python
import json, time, requests

URL = "http://127.0.0.1:8080/v1/completions"
payload = {"prompt": "Explain what a KV cache is in two sentences.",
           "max_tokens": 200, "stream": True}

start = time.perf_counter()
stamps = []
with requests.post(URL, json=payload, stream=True) as r:
    for line in r.iter_lines():
        if not line.startswith(b"data: ") or line == b"data: [DONE]":
            continue
        chunk = json.loads(line[len(b"data: "):])
        if chunk["choices"][0].get("text"):
            stamps.append(time.perf_counter())

ttft = stamps[0] - start
decode = stamps[-1] - stamps[0]
print(f"tokens received: {len(stamps)}")
print(f"TTFT:            {ttft * 1000:.0f} ms")
print(f"mean ITL:        {decode / (len(stamps) - 1) * 1000:.1f} ms")
print(f"perceived TPS:   {(len(stamps) - 1) / decode:.1f}")
```

Two notes on reading the output. Each streamed chunk from llama.cpp is roughly one token, so counting chunks is a fair approximation for this exercise. And this script measures perceived TPS for one user. To estimate total TPS, run several copies of the script at once and add up the token counts over the same wall-clock window.

## Check yourself

A vendor tells you their endpoint does "500 TPS". Before you believe it applies to your users, you should be able to ask these questions and know why each one changes the answer.

1. Is that perceived TPS per user or total TPS across the whole service? Expected answer: total TPS divided by concurrent users gives the per-user speed, so 500 total TPS at 50 users is about 10 perceived TPS.
2. At what concurrency and batch size was it measured? Expected answer: a batch of one gives the best per-user number and the worst throughput, so a number without a stated batch size is not comparable to your workload.
3. What were the prompt and output lengths, and is the number a mean or a percentile? Expected answer: long prompts raise TTFT, and a mean hides the P99 outliers that your users will notice.

If you can also state the conversion between ITL and perceived TPS from memory, e.g., 25 ms of ITL is 40 tokens per second, you have the vocabulary down.

## Next steps

- [Prefill and decode](/docs/concepts/prefill-decode) explains why one phase is compute bound and the other is bandwidth bound.
- [Benchmarking](/docs/technical-guides/benchmarking) shows how to turn these single-request measurements into runs that other people can compare against.
- [Run Bonsai with llama.cpp](/docs/build-and-run/bonsai-llamacpp) is the fastest way to get an endpoint for the exercise above.

When you can do this, you can measure and correctly label TTFT, per-user TPS, system TPS, and ITL on a live endpoint.
