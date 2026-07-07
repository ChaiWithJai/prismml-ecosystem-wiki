---
title: "What is disaggregated serving (prefill/decode separation) and when is it worth it?"
description: "Disaggregation runs prefill and decode on separate engines linked by KV cache transfer. It only pays off at large scale, roughly 100M+ tokens per day."
audience: inference-engineer
pillar: foundational-concept
book: inference-engineering
chapter_ref: "Ch. 5, secs. 5.5-5.5.2 (pp. 148-150)"
status: published
last_reviewed: 2026-07-07
---

Disaggregation runs compute-bound prefill and memory-bound decode on separate engines connected by KV cache transfer, letting each pool scale to its own bottleneck. It only pays off at large scale, roughly 100M or more tokens per day, models of 100B or more parameters, and prefill-heavy traffic. Below those thresholds, plain horizontal replication uses hardware better. {% .lead %}

## Understand what disaggregation separates

A normal serving setup runs both inference phases on the same GPUs. Prefill processes the input and is limited by compute. Decode generates output tokens one at a time and is limited by memory bandwidth. If those phases are new to you, read [what are prefill and decode](/blog/what-are-prefill-and-decode) first.

Kiely's Inference Engineering (Ch. 5, sec. 5.5) explains why sharing the node breaks down under load. At light traffic the two phases coexist, because one wants compute and the other wants memory. Under heavy traffic with large batches, they start competing for the same resources, and a burst of prefill work stalls every user who is mid-generation.

Disaggregation splits the phases onto separate engines. Kiely (sec. 5.5.1) describes it as a three-step process:

1. A prefill engine processes the input, builds the KV cache, and computes the first token.
2. The prefill engine sends the KV cache to a decode engine over the hardware interconnect.
3. The decode engine generates every remaining token.

Each pool can now be sized and tuned for its own bottleneck. Kiely notes that the compute-bound prefill engine can run a lower tensor parallelism degree than the memory-bound decode engine, which you cannot do when both phases share one engine. Real systems run several of each, written as xPyD, e.g., 5P3D means five prefill engines and three decode engines.

## Apply the three thresholds

Disaggregation adds engineering work and a KV cache transfer step, so it has to earn its cost. Kiely (sec. 5.5.2) gives three conditions, and all of them should hold:

1. **Volume.** You serve roughly 100 million to 1 billion tokens per day, with the lower end applying to larger models.
2. **Model size.** The model has at least 100 billion parameters.
3. **Traffic shape.** Traffic is prefill-heavy, with long input sequences.

If volume or model size fails, Kiely says you are likely "wasting money on extra hardware for minimal performance gains" (p. 150). If only the traffic shape fails, spend the GPUs on horizontal replicas instead, because decode engines handle short sequences and prefix cache hits more efficiently. His example of a workload that passes all three is a frontier model behind a code editor, where many developers send large chunks of code as context all day.

The reason small deployments lose is simple. A disaggregated setup dedicates whole GPUs to each phase. If your traffic cannot keep both pools busy, some of that hardware sits idle, while the same GPUs running full replicas would all serve requests.

## Work through one audit

Here is the three-threshold test applied to a made-up but realistic workload. Treat every number as an assumption you would replace with your own measurements.

An internal code assistant serves 400 developers. Each developer sends about 150 requests per working day. A request carries about 6,000 input tokens of code context and returns about 400 output tokens.

- Daily volume is 400 x 150 = 60,000 requests. Tokens per request are 6,000 + 400 = 6,400. Total is 60,000 x 6,400 = 384 million tokens per day. That clears the 100 million floor.
- The team serves a 480B parameter model. That clears the 100B floor.
- The input to output ratio is 6,000 / 400 = 15 to 1, so the traffic is prefill-heavy.

All three thresholds pass, so disaggregation is justified. Now shrink one variable. If the same team served [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf) instead, threshold two fails, and the right move is horizontal replicas of a single-GPU engine. If the assistant were a chat product with 300 input and 800 output tokens per request, threshold three fails, and replicas again win.

## Try it

Audit a workload you know against the three thresholds. This takes under 30 minutes and needs no GPU, only your serving logs or provider dashboard.

1. Pull one normal day of request counts and token counts. Most gateways log input and output tokens per request. If you only have request counts, multiply by your average tokens per request:

   ```sh
   # example: sum token columns from a CSV request log
   awk -F, 'NR>1 {inp+=$3; outp+=$4} END {print inp+outp, "tokens/day,", inp/outp, "input:output"}' requests.csv
   ```

2. Write down three numbers: total tokens per day, the parameter count of the model you serve, and the input to output token ratio.
3. Compare each number to its threshold: 100M or more tokens per day, 100B or more parameters, and a ratio well above 1.
4. Write a one-paragraph go or no-go decision. Cite all three numbers. If the answer is no-go, name what you would do instead, e.g., add replicas or enable prefix caching.

Check your paragraph: it should state a number for each threshold, and the no-go case should name the alternative.

## Check yourself

1. Why do prefill and decode interfere when they share a node under heavy load? Prefill is compute-bound and decode is memory-bound, so at light load they coexist. With large batches they compete for the same resources, and prefill bursts stall in-flight decode work.
2. What travels between the two engine pools, and why is the interconnect a concern? The KV cache for each request moves from the prefill engine to the decode engine. It is large, so a slow interconnect can erase the gains from specialization.
3. A team serves 40M tokens per day on a 70B model and wants disaggregation for latency. What do you tell them? Both the volume and model size thresholds fail, so the extra hardware would give minimal gains. Add horizontal replicas instead.
4. What does 3P1D mean? Three prefill engines and one decode engine serving a single model deployment. The ratio does not have to be one to one, and it can change with traffic.

## Next steps

- Read the concept page on [prefill and decode](/docs/concepts/prefill-decode) for the two-phase model that disaggregation builds on.
- Read the ecosystem page on [NVIDIA Dynamo](/docs/ecosystem/dynamo), which handles conditional disaggregation, prefill queueing, and KV cache transfer in production.
- Read [why prefill is compute-bound and decode is memory-bound](/blog/prefill-compute-bound-decode-memory-bound) for the hardware reason each pool needs different tuning.
- Kiely's Inference Engineering, Ch. 5, secs. 5.5 to 5.5.3 covers conditional disaggregation and Dynamo in more depth.

When you can do this, you can apply the three-threshold test to decide whether disaggregated serving is justified for a given workload.
