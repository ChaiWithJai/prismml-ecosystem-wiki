---
title: "Why should I report P99 latency instead of average?"
description: "LLM response times are right-skewed, so mean latency hides tail outliers that destroy trust. Measure P50, P90, and P99, and treat the tail as its own work."
audience: ml-product-team
pillar: foundational-concept
category: performance
book: inference-engineering
chapter_ref: "Ch. 1, sec. 1.4.1 (pp. 36-37)"
status: draft
last_reviewed: 2026-07-06
---

LLM response times are right-skewed, so mean latency hides the tail outliers that destroy user trust. One in ten requests taking several seconds is a churn problem that is invisible in averages. Measure P50, P90, and P99 separately, and treat driving the tail down as its own workstream. {% .lead %}

## Understand why the average lies

Most LLM requests finish in a narrow band of times. A few take much longer because of a long prompt, a cold cache, a retry, or a queue that backed up. When you plot the response times, the curve rises fast, peaks, and then trails off to the right in a long tail. Statisticians call this a right-skewed distribution.

The mean sits above the median in this shape because every slow outlier pulls the mean up. So the average tells you neither what a typical user sees nor what your slowest users see. It is a blend of both, and it moves when either one moves.

Kiely's Inference Engineering (Ch. 1, sec. 1.4.1) makes this point directly. The naive approach of looking at a mean does not tell the whole story, and the book notes that it is "not good enough for most interactions to feel snappy" if one in every ten takes several seconds.

## Read percentiles as user counts

A percentile answers a plain question about your users.

- P50 is the median. Half of all requests are slower than this.
- P90 means 1 in every 10 requests is slower than this.
- P99 means 1 in every 100 requests is slower than this.

This framing turns a chart into a product decision. If your app serves 10,000 requests a day and your P99 is 8 seconds, then about 100 people today waited 8 seconds or longer. Those people do not know your average is fine. They know your product felt broken.

## Work through the arithmetic

Here is a made up but honest example. Suppose you collect 10 response times in seconds:

```
0.8, 0.9, 0.9, 1.0, 1.0, 1.1, 1.1, 1.2, 1.3, 9.7
```

Nine requests cluster around 1 second and one request took 9.7 seconds.

- The mean is 19.0 / 10 = 1.9 seconds.
- The median (P50) is about 1.05 seconds.
- The P90 is 9.7 seconds, because 1 request in 10 is at or above it.

If you report only the mean of 1.9 seconds, you understate the typical experience by almost double and you hide the 9.7 second request entirely. The mean is a number that no user actually experienced. The P50 tells you what a typical user saw, and the P90 tells you what your unluckiest 10 percent saw.

## Treat the tail as its own workstream

The causes of a slow median and the causes of a slow tail are usually different. A slow median often comes from the model itself, e.g., the model is too large for your latency budget. A slow tail often comes from the system around the model, e.g., queueing under load, retries, cold starts, or a few very long prompts.

Kiely's book argues that good performance work reduces P90 and P99 latencies on top of the average, because that is what makes the experience reliable. So put the tail on your dashboard as its own line, give it its own target, and investigate it with different tools than you use for the median. The book also distinguishes inference time from end to end time. If your on-GPU time is fast but your P99 is slow, the problem is in your infrastructure, not your model.

{% callout type="note" %}
Report P50, P90, and P99 together. P50 is the typical experience, P90 is the common bad day, and P99 is the experience that drives support tickets. One number cannot do the job of three.
{% /callout %}

{% callout type="warning" %}
Do not average percentiles across services or time windows. The average of two P99 values is not a P99. Compute percentiles from the raw samples, or use a histogram that preserves the distribution.
{% /callout %}

## Try it

Collect 100 latency samples from any endpoint you can reach and compute the four numbers in a spreadsheet. This takes under 30 minutes.

1. Pick an endpoint. Any public API or your own service works.
2. Collect 100 samples with curl:

```bash
for i in $(seq 1 100); do
  curl -s -o /dev/null -w "%{time_total}\n" https://example.com/
done > latencies.txt
```

3. Paste the column into a spreadsheet and compute:

```
Mean:  =AVERAGE(A1:A100)
P50:   =PERCENTILE(A1:A100, 0.50)
P90:   =PERCENTILE(A1:A100, 0.90)
P99:   =PERCENTILE(A1:A100, 0.99)
```

4. Note the gap between the mean and the P50. If the mean sits above the P50, you have a right tail. Look at the raw samples and find the requests that created it.

## Check yourself

1. Your mean is 1.9 seconds and your P50 is 1.05 seconds. Why does the mean sit above the median? Expected answer: the distribution has a right tail, and the slow outliers pull the mean up while the median ignores them.
2. Your P99 is 8 seconds on 10,000 daily requests. What user experience is hiding in that number? Expected answer: about 100 users a day wait 8 seconds or longer, no matter how good the average looks.
3. Your median is fast but your P99 is slow. Where do you look first? Expected answer: the system around the model, e.g., queueing, retries, or cold starts, rather than the model itself.

## Next steps

- Read the [observability guide](/docs/technical-guides/observability) to set up percentile dashboards for your own endpoints.
- Read the [benchmarking guide](/docs/technical-guides/benchmarking) to measure latency in a repeatable way before and after a change.

When you can do this, you can compute latency percentiles from raw samples and identify when a distribution's tail, not its center, is the product problem.
