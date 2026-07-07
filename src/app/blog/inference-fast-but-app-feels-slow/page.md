---
title: "Inference is fast but my app feels slow — what do I check?"
description: "Track on-GPU inference time and end-to-end time. When inference is fast but end-to-end is slow, the fix is in infrastructure, not the model."
audience: inference-engineer
pillar: foundational-concept
book: inference-engineering
chapter_ref: "Ch. 1, sec. 1.4.2 (p. 37)"
status: draft
last_reviewed: 2026-07-07
---

Track two numbers. The first is on-GPU inference time, and the second is end-to-end time including network and queueing. When inference is fast but end-to-end is slow, the fix is in infrastructure such as proxies, queues, and cold replicas, not in the model. This one comparison tells you where to spend your optimization effort. {% .lead %}

## Measure the two numbers separately

End-to-end latency is the time from the moment your app sends a request until the full response arrives. Inference time is only the part the model spends generating tokens on the GPU. Everything else is overhead. The overhead includes network transit, TLS handshakes, time spent waiting in a queue, and time spent starting a replica that was scaled to zero.

Kiely's Inference Engineering (Ch. 1, sec. 1.4.2) makes this the second key distinction in latency metrics, after percentiles. The book defines inference time as the on-GPU time required to generate tokens, and end-to-end time as the measurement that also counts network latency and queue time. Both are useful. Inference time tells you whether your model performance work is paying off. End-to-end time tells you what your users actually experience.

Most teams only look at one of the two. A dashboard that only shows server-side inference time can look healthy while users wait three seconds for every answer. A dashboard that only shows end-to-end time cannot tell you whether the model or the infrastructure is slow.

## Compute the overhead and route the fix

Once you have both numbers for the same request, subtract them. The difference is your infrastructure overhead. Kiely gives the routing rule directly. When inference is fast but end-to-end is slow, "turn your attention to infrastructure rather than model performance optimization".

Here is a worked example. The numbers are hypothetical, but the arithmetic is what you would do with your own logs.

- The server logs say a request spent 0.12 seconds in prefill and 1.60 seconds in decode, so inference time is 1.72 seconds.
- The client measured 2.90 seconds from send to last byte.
- The overhead is 2.90 minus 1.72, which is 1.18 seconds.
- The overhead share is 1.18 divided by 2.90, which is about 41 percent of end-to-end latency.

At 41 percent, quantizing the model or tuning the batch size cannot fix most of what the user feels. Even if you cut inference time in half, end-to-end time only drops from 2.90 to about 2.04 seconds. The bigger win is in the 1.18 seconds of overhead. Common suspects, roughly in the order to check them:

- **Queue wait.** The request sat in a queue because every replica was busy. Look for a queue depth or scheduler wait metric on your serving layer.
- **Cold replicas.** The platform scaled to zero and had to load model weights before serving. Cold starts show up as a slow P99 while the P50 stays fine, which is one reason to [report percentiles, not averages](/blog/why-report-p99-latency-not-average).
- **Proxies and gateways.** Each hop adds time, and a proxy that buffers the response instead of streaming it hides your fast first token entirely.
- **Network transit.** Distance and TLS setup add fixed cost per request. This one you can bound with a simple ping or a TLS timing tool.

If instead the overhead is small, e.g., 5 percent, the model is your bottleneck and you should work on inference itself. The [inference stack](/docs/concepts/inference-stack) doc breaks down which layer owns which kind of fix.

## Try it

The exercise is to add two timestamps to one request path and compute the overhead as their difference. It takes under 30 minutes and needs no GPU, because llama.cpp runs on a CPU or on Apple silicon. Start a local server with [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf), PrismML's open-weight model, using the [llama.cpp recipe](/docs/build-and-run/bonsai-llamacpp):

```bash
llama-server -m Bonsai-8B-Q1_0.gguf --port 8080
```

llama.cpp reports its own server-side timings in every response, so the server timestamp is free. Save this as `overhead.py` and run it with `python3 overhead.py`.

```python
import time, requests

URL = "http://127.0.0.1:8080/completion"
payload = {"prompt": "Explain what a proxy does in two sentences.",
           "n_predict": 150}

start = time.perf_counter()
r = requests.post(URL, json=payload).json()
total_ms = (time.perf_counter() - start) * 1000

t = r["timings"]
inference_ms = t["prompt_ms"] + t["predicted_ms"]
overhead_ms = total_ms - inference_ms

print(f"end-to-end:  {total_ms:.0f} ms")
print(f"inference:   {inference_ms:.0f} ms")
print(f"overhead:    {overhead_ms:.0f} ms "
      f"({overhead_ms / total_ms * 100:.0f}% of end-to-end)")
```

On localhost the overhead should be small, since there is no real network and no queue. Now point `URL` at your production endpoint, or add a hop such as an nginx proxy in front of the local server, and run it again. The overhead number grows and the inference number does not. That gap is the thing this post is about. If your production server does not return timings in the response, log the inference duration server side and join the two records by request ID. The [observability guide](/docs/technical-guides/observability) shows how to set that up.

## Check yourself

1. Your model dashboard shows P50 inference time of 800 ms, but users report two-second waits. What number do you need before you change anything? Expected answer: the client-side end-to-end time for the same requests. Without it you cannot tell whether the missing 1,200 ms is infrastructure overhead or a measurement gap.
2. End-to-end P50 is 3.0 seconds and server-side inference is 2.8 seconds. Should you tune your load balancer? Expected answer: no. Overhead is only about 7 percent, so the model is the bottleneck and the fix is inference work such as a smaller model or quantization.
3. P50 end-to-end looks fine but P99 is ten times worse, while inference time is stable at both percentiles. What is a likely suspect? Expected answer: queueing or cold starts. Both add large, occasional delays outside the model, which inflates the tail without moving inference time.

## Next steps

- [The inference stack](/docs/concepts/inference-stack) maps which layer, from hardware to gateway, owns each kind of latency.
- [Observability](/docs/technical-guides/observability) covers logging inference time server side and joining it with client-side traces.
- [Why report P99 latency, not average](/blog/why-report-p99-latency-not-average) explains the percentile half of Kiely's chapter 1 metrics advice.

When you can do this, you can decompose end-to-end latency into model and infrastructure components and route the fix to the right layer.
