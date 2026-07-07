---
title: "What metrics should I monitor for an LLM inference service?"
description: "Monitor seven families together: volume, sequence sizes, response codes, latency percentiles, replicas, utilization, and queue depth. Sizes explain spikes."
audience: inference-engineer
pillar: foundational-concept
book: inference-engineering
chapter_ref: "Ch. 7, sec. 7.4.3 (p. 203)"
status: draft
last_reviewed: 2026-07-07
---

Monitor seven families together: volume, request and response sizes, response codes, latency percentiles (TTFT, TPS, end-to-end), replica count, utilization, and queue depth. Sequence-length metrics are the inference-specific addition to standard SRE dashboards. Without them, "why is P99 up?" has no answer, because a traffic flood and a long-prompt flood look identical. {% .lead %}

## Learn the seven families

Kiely's Inference Engineering (Ch. 7, sec. 7.4.3) gives a list of what inference observability should measure. Here are the seven families in plain terms.

- **Total volume.** How many requests the deployment receives.
- **Request and response sizes.** The input and output sequence lengths, in tokens, for the requests you process.
- **Response codes.** Counts of 2XX, 4XX, and 5XX codes from the model server.
- **Latency percentiles.** Time to first token, tokens per second, and end-to-end latency, each reported at P50, P90, and P99 rather than as an average.
- **Replica count.** How many instances are serving traffic, and how many are still starting up.
- **Utilization.** How busy the CPU, host memory, GPU, and GPU memory are.
- **Queue depth.** For services that queue work, how many requests are waiting to be processed.

Five of these appear on any web service dashboard. The one that is specific to inference is request and response sizes. A normal web request costs about the same to serve no matter what the user typed. An inference request does not. The prefill work grows with the input length, and the decode work grows with the output length, so a request with a 50,000 token prompt costs far more than one with a 500 token prompt even though both count as one request.

## Read the metrics together, not one at a time

The book's point about this list is that the metrics are interdependent. Kiely writes that a latency spike "could come from request volume, but it could also come from long input sequences", and that seeing the metrics together lets an engineer understand not only what is happening but why.

This is why a single latency alert is not enough. When P99 TTFT climbs, at least three different causes produce the same graph.

- More requests arrived, so batches filled up and requests waited.
- The same number of requests arrived, but the prompts got longer, so each prefill took more compute.
- A replica died, so the remaining replicas absorbed its traffic.

The latency chart looks identical in all three cases. You only tell them apart by cross-referencing volume, input sequence length, and replica count. Each cause also has a different fix. More traffic calls for scaling out, which the [autoscaling guide](/docs/technical-guides/autoscaling) covers. Longer prompts call for a look at what upstream code changed, e.g., a retrieval step that started stuffing more documents into the context. A dead replica calls for a restart and a hardware check.

Response codes and queue depth complete the picture. A rise in 5XX codes alongside a latency spike points at crashing or overloaded replicas. A growing queue with flat utilization points at a stuck consumer rather than a capacity problem.

## Work a staged incident with the numbers

Here is a made-up incident with example dashboard values, so the arithmetic is the point rather than the specific numbers. Your alert fires because P99 end-to-end latency went from 3 seconds to 14 seconds at 10:00.

You open the dashboard and read the other families for the same window.

- Volume: 120 requests per minute before 10:00, 118 after. Flat.
- Replica count: 4 before, 4 after. Flat.
- P99 input length: 1,200 tokens before 10:00, 24,000 tokens after.
- Response codes: still almost all 2XX.
- GPU utilization: up from 55 percent to 95 percent.

Volume and replicas are flat, so this is not a traffic flood and not lost capacity. The input length percentile is the metric that moved. A 24,000 token prompt has 20 times the prefill work of a 1,200 token prompt, because prefill work scales with the input length. That extra compute per request is what pushed utilization to 95 percent and stretched the latency, even though the request count never changed. The next question goes to whoever owns the client code, e.g., did a retrieval pipeline start attaching whole documents instead of snippets at 10:00.

Now flip one number. If input length had stayed flat and volume had jumped from 120 to 600 requests per minute, the same latency graph would mean a traffic flood, and the fix would be more replicas, not a client-side investigation. One latency chart, two opposite responses, and only the sequence-length metric tells you which one you are in.

One more note from the same section. Kiely advises against building inference monitoring as its own silo. Send these metrics into the observability and alerting tools your team already uses, e.g., Grafana or Datadog, so inference data sits next to the rest of the application.

## Try it

This takes under 30 minutes and does not need a GPU. [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf), PrismML's open-weight 1-bit model, runs on a laptop CPU or Apple Silicon through llama.cpp. Start a server with the [llama.cpp recipe](/docs/build-and-run/bonsai-llamacpp).

```bash
llama-server -m Bonsai-8B-Q1_0.gguf --port 8080
```

Save this as `monitor.py` and run it with `python3 monitor.py`. It sends 50 requests, logs TTFT, output length, and status code for each one, and prints a P50 and P99 summary.

```python
import json, time, requests, statistics

URL = "http://127.0.0.1:8080/v1/completions"
prompts = [f"Explain topic {i} in one paragraph." for i in range(50)]
rows = []

for p in prompts:
    payload = {"prompt": p, "max_tokens": 150, "stream": True}
    start = time.perf_counter()
    ttft, tokens, status = None, 0, None
    with requests.post(URL, json=payload, stream=True) as r:
        status = r.status_code
        for line in r.iter_lines():
            if not line.startswith(b"data: ") or line == b"data: [DONE]":
                continue
            chunk = json.loads(line[len(b"data: "):])
            if chunk["choices"][0].get("text"):
                if ttft is None:
                    ttft = time.perf_counter() - start
                tokens += 1
    rows.append({"ttft": ttft, "tokens": tokens, "status": status})

ttfts = sorted(r["ttft"] for r in rows if r["ttft"] is not None)
lens = sorted(r["tokens"] for r in rows)
codes = {}
for r in rows:
    codes[r["status"]] = codes.get(r["status"], 0) + 1

def pct(xs, q):
    return xs[min(len(xs) - 1, int(q * len(xs)))]

print(f"requests:       {len(rows)}")
print(f"status codes:   {codes}")
print(f"TTFT P50/P99:   {pct(ttfts, 0.50)*1000:.0f} ms / {pct(ttfts, 0.99)*1000:.0f} ms")
print(f"out len P50/P99: {pct(lens, 0.50)} / {pct(lens, 0.99)} tokens")
```

Then stage a long-prompt flood. Change a few of the prompts to include several thousand tokens of pasted text and run the script again. Watch P99 TTFT move while the request count stays at 50. That is the exact signature from the incident above.

## Check yourself

1. P99 latency spikes. Which two metrics do you cross-reference first to distinguish more traffic from longer inputs? Expected answer: total request volume and input sequence length. If volume rose and lengths are flat, it is traffic. If volume is flat and lengths rose, it is longer prompts.
2. Which of the seven families would not appear on an ordinary web service dashboard, and why does inference need it? Expected answer: request and response sizes. The cost of serving an inference request grows with its token counts, so two requests are not interchangeable units of work the way they are for a typical web endpoint.
3. Queue depth is growing but GPU utilization is low. What does that combination suggest? Expected answer: requests are not reaching the replicas, e.g., a stuck consumer or a routing problem, rather than a shortage of compute.

## Next steps

- [Observability](/docs/technical-guides/observability) shows how to export these metrics from a production deployment.
- [Autoscaling](/docs/technical-guides/autoscaling) covers the response when the diagnosis is genuinely more traffic, and how replica count and queue depth drive scaling decisions.
- [Why report P99 latency, not the average](/blog/why-report-p99-latency-not-average) explains the percentile choice this post takes for granted.

When you can do this, you can instrument an inference service with the seven metric families and diagnose a staged latency incident from the dashboard alone.
