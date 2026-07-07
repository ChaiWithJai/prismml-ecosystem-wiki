---
title: "When is scale-to-zero a bad idea for AI apps?"
description: "Scale-to-zero needs fast cold starts and robust queueing, and it suits dev and periodic workloads. If you need it to afford a latency-sensitive app, use per-token APIs."
audience: ml-product-team
pillar: end-user-case-study
book: inference-engineering
chapter_ref: "Ch. 7, sec. 7.2.4 (p. 192)"
status: draft
last_reviewed: 2026-07-07
---

Scale-to-zero needs fast cold starts plus robust queueing, and it suits dev environments and periodic workloads. An internal agent used 9 to 5 in one timezone is the good case. But if you need scale-to-zero to afford a latency-sensitive app with light random traffic, the temptation itself is the signal. You should still be on per-token APIs. {% .lead %}

## Understand what scale-to-zero actually does

Scale-to-zero is an autoscaling feature. When a deployment gets no traffic, the system shuts down every replica, and you stop paying for GPUs. When a request arrives, the system starts a replica back up and serves it. Philip Kiely's *Inference Engineering* (Ch. 7, sec. 7.2.4) lists two prerequisites for this to work at all.

- **Fast cold starts.** A user may be waiting live while the replica comes up, so the time from zero replicas to first response has to be short. See [how to make cold starts faster](/blog/make-model-cold-starts-faster) for what that takes.
- **Robust queueing.** The system has to hold incoming requests until a replica is live, instead of dropping them or returning errors.

If your platform is missing either one, the question of whether scale-to-zero fits your workload does not come up. The first request after an idle period either fails or takes so long that users treat the feature as broken.

## Match the traffic shape to the provisioning mode

Kiely is direct that even with both prerequisites, scale-to-zero does not fit every workload. The deciding input is the shape of your traffic over a day, not your preference for a lower bill. There are three shapes to recognize.

- **Predictable idle windows.** Traffic arrives in a block, e.g., an internal agent that one office uses during business hours, or a batch job that runs every night. The idle hours are long and known. Scale-to-zero fits, because the cold starts land at predictable moments and few users are waiting.
- **Steady traffic with dips.** Requests arrive all day and never stop for long. Scale-to-zero buys you nothing, because the replica count never reaches zero. Set a minimum replica count and let the autoscaler handle the peaks. The [autoscaling guide](/docs/technical-guides/autoscaling) covers those settings.
- **Light, unscheduled traffic.** A few requests arrive at random times, and each user expects a fast response. This is the shape where scale-to-zero looks tempting and is wrong, because every request risks landing on zero replicas and paying a cold start.

Development environments are a separate good case. Kiely notes that testing traffic is bursty and nobody cares how long the first request takes, so dev deployments should scale to zero by default.

## Read the temptation as a maturity signal

The third shape deserves its own point, because Kiely turns the cost question around. If your app is latency sensitive, gets light unscheduled traffic, and the only way you can afford a dedicated GPU is to shut it off between requests, he writes that this is probably a sign "your AI application is not yet ready for dedicated infrastructure" and should stay on pay-per-token APIs until it grows.

The logic is about what you pay for when nothing happens. A per-token API charges you nothing during idle time and serves the next request with no cold start, because the provider keeps the model warm across all their customers. A dedicated deployment with scale-to-zero charges you nothing during idle time but makes your user pay the cold start in waiting time. At low traffic, the API gives you the same bill and a better product. Dedicated infrastructure wins only when your token volume is high enough that per-token pricing costs more than the GPUs. The [cost modeling guide](/docs/technical-guides/cost-modeling) shows how to find that crossover for your own volume.

## Work the numbers for the good case

Here is the internal agent case with the arithmetic written out. Suppose one team in one timezone uses an agent from 9 to 5 on weekdays, served by one GPU replica running [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf). The GPU price below is an assumption for the example, not a quote.

```text
Always-on:       24 h/day x 7 days           = 168 GPU hours/week
Scale-to-zero:    8 h/day x 5 days + startup ~=  41 GPU hours/week
Saved:           (168 - 41) / 168            ~=  76 percent

At an assumed $2.00/GPU hour:
Always-on:       168 x $2.00 = $336/week
Scale-to-zero:    41 x $2.00 ~=  $82/week
```

The cost falls by an estimated three quarters, and the price of that saving is one cold start each morning, felt by whoever sends the first request. If that person waits 30 extra seconds once a day, the trade is clearly good. Now flip the traffic shape. If the same requests arrived at random through the whole week instead of in a 9 to 5 block, most requests would land on a cold replica, and the same feature would make the app feel broken. The traffic shape decided, not the feature.

## Try it

This takes under 30 minutes and needs no GPU. It is a paper exercise on your own data.

1. Pick one AI feature you run or plan to run. Pull its request timestamps for the last week from your logs or analytics. If it does not exist yet, write down your honest guess of when requests would arrive.
2. Bucket the requests by hour and sketch the counts, e.g., with a spreadsheet chart or `sort | uniq -c` on the truncated timestamps.
3. Classify the shape: a block with long known idle windows, steady with dips, or light and random.
4. Assign the mode: scale-to-zero for the block, a minimum replica count for steady, and a per-token API for light and random when latency is sensitive.
5. Write one sentence of justification that names the shape, e.g., "Traffic is a 9 to 5 weekday block, so scale-to-zero saves an estimated 76 percent of GPU hours for one cold start per morning."

You have done the exercise correctly when your sentence would force a different decision if the traffic shape changed.

## Check yourself

1. What two prerequisites does scale-to-zero rely on? Expected answer: fast cold starts, because a user may be waiting live, and robust queueing, so requests are held until a replica is live.
2. An internal document agent gets traffic only from a London office during business hours. Which mode, and why? Expected answer: scale-to-zero. The idle window is long and predictable, so the saving is large and the cold start lands on one known request per day.
3. A consumer app gets a few latency-sensitive requests at random hours, and dedicated GPUs only pencil out if they scale to zero. Which mode? Expected answer: neither scale-to-zero nor min replicas. The workload is not ready for dedicated infrastructure, so use a per-token API until traffic grows.
4. Why does needing scale-to-zero to afford the app signal anything? Expected answer: it means idle time dominates your GPU bill, which means your token volume is below the point where dedicated hardware beats per-token pricing.

## Next steps

- [Autoscaling](/docs/technical-guides/autoscaling) covers concurrency targets, minimum replicas, and when scale-to-zero is safe to enable.
- [Cost modeling](/docs/technical-guides/cost-modeling) shows how to compute the token volume where dedicated GPUs beat per-token APIs.
- [At what token volume does your own GPU beat an API?](/blog/token-volume-where-own-gpu-beats-api) works the crossover arithmetic in detail.

When you can do this, you can match a traffic shape to the right provisioning mode and recognize scale-to-zero as a maturity signal.
