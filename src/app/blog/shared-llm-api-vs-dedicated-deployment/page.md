---
title: "Should I use a shared LLM API or a dedicated deployment?"
description: "Start on pay-per-token shared APIs. Switch to dedicated GPUs only when scale economics, specialization, or multi-model orchestration creates a clear need."
audience: ml-product-team
pillar: foundational-concept
book: inference-engineering
chapter_ref: "Ch. 1, sec. 1.1 (pp. 26-27)"
status: published
last_reviewed: 2026-07-07
---

Start on pay-per-token shared APIs. Switch to dedicated GPUs only when one of three forces creates a clear business need: scale economics (your token volume beats per-token pricing), specialization (fine-tuned models, latency or uptime guarantees), or multi-model orchestration. Until one of those applies, inference engineering is not yet on your roadmap. {% .lead %}

## Understand the two ways to serve a model

There are two ways to put an AI model behind your product.

- **Shared inference.** You send traffic to a public API endpoint and pay per million tokens. You need an API key and nothing else.
- **Dedicated deployment.** You rent GPUs (or buy them) and run an inference service that serves only your application. You pay per hour of GPU time whether traffic arrives or not.

Kiely's *Inference Engineering* (Ch. 1, sec. 1.1) opens with this split and notes that it is not the same question as closed versus open models. Plenty of shared endpoints serve open models, and some labs offer dedicated setups for closed ones. The book's summary of the shared side is blunt: zero overhead, no cold starts, minimal engineering work. The costs are also blunt. Your bill scales linearly with usage, the provider's uptime caps your uptime, and you have no control over latency or rate limits.

## Know the three triggers for going dedicated

Kiely gives three reasons a product eventually moves to dedicated deployments.

- **Scale.** You process enough volume that paying per GPU is cheaper than paying per million tokens.
- **Specialization.** You run a custom or fine-tuned model, or you have latency or uptime requirements the shared API cannot promise.
- **Orchestration.** Your product chains multiple models in multi-step pipelines and you need to cut network latency and deployment complexity.

The book adds a warning worth keeping. The switch puts you in charge of your own inference engineering, which gives you control but "adds to your engineering surface area and increases the floor of your monthly spend" (Kiely, Ch. 1). A shared API bill can drop to zero in a quiet month. A rented GPU cannot. So Kiely's advice, and ours, is to switch only when there is a clear and immediate business need.

## Compute your break-even token volume

The scale trigger is the only one you can put a number on today, so do that first. Here is the arithmetic with example prices. These are illustrative numbers, so replace them with live prices before you decide anything.

Suppose a shared API serves an 8B-class model at a blended price of $0.30 per million tokens. Suppose you can rent one mid-range GPU that runs a quantized 8B model for $1.20 per hour.

- GPU cost per month: $1.20 x 24 x 30.4 = about $875.
- Break-even volume: $875 / $0.30 per million = about 2.9 billion tokens per month.

Then check that one GPU can actually carry that volume. If your serving stack sustains an estimated 1,500 tokens per second under load, one GPU produces about 3.9 billion tokens in a month of continuous traffic. So the break-even is feasible on a single card, but only if your traffic is steady. If your users all arrive during business hours, the GPU sits idle half the day and your effective break-even roughly doubles. Kiely's prerequisite questions in Ch. 1 include usage patterns for exactly this reason.

Also count the people. A dedicated deployment needs someone to own quantization, monitoring, and upgrades. If that work costs you a quarter of an engineer, add that salary to the GPU side of the ledger before you call it cheaper.

{% callout type="note" %}
2.9 billion tokens per month is roughly 100 million tokens per day. Most products searching for product-market fit are orders of magnitude below this, which is why Kiely says most AI products start on pay-per-token APIs.
{% /callout %}

## Try it

Build a one-tab break-even spreadsheet in under 30 minutes.

1. Open a blank sheet. Make one row for a shared API model your product could use. Paste the provider's live input and output price per million tokens, then compute a blended price from your own input-to-output ratio.
2. Make one row for a rented GPU SKU that can run a quantized 8B model, e.g., an L4 or A10G from any cloud's public price page. Compute its monthly cost as `price_per_hour * 730`.
3. Add a throughput cell with your estimate of sustained tokens per second on that GPU, and a capacity cell of `tokens_per_second * 2,628,000` for monthly capacity.
4. Compute the crossover: `monthly_gpu_cost / blended_price_per_million` gives break-even tokens per month.
5. In one final cell, state your product's current monthly token volume next to the crossover.

If you prefer a script over a sheet, this one line gives you the crossover:

```python
gpu_hr, blended_per_m = 1.20, 0.30  # replace with live prices
print(f"break-even: {gpu_hr * 730 / blended_per_m:,.0f} million tokens/month")
```

State your result as one sentence, e.g., "Our crossover is 2.9B tokens per month and we currently run 40M, so shared wins."

## Check yourself

- What is your break-even token volume, from live prices? Expected answer: a specific number, e.g., "about 2.9 billion tokens per month at today's prices".
- Which of the three triggers applies to your product today, if any? Expected answer: one of scale, specialization, or orchestration, with one sentence of evidence, or "none yet".
- Your traffic runs only during business hours. What does that do to your break-even? Expected answer: the GPU sits idle the rest of the day, so the effective break-even roughly doubles unless you can batch offline work into the idle hours.
- A teammate wants dedicated GPUs because "APIs are expensive". What do you ask first? Expected answer: our monthly token volume versus the crossover, plus who will own the deployment.

## Next steps

- Work through [cost modeling](/docs/technical-guides/cost-modeling) to extend the one-tab sheet into a full unit-economics model.
- Read [hardware requirements](/docs/getting-started/hardware-requirements) to pick a realistic GPU SKU for the dedicated side of your comparison.
- Read Ch. 1 of Kiely's *Inference Engineering* for the prerequisite questions (model requirements, latency budget, unit economics, usage patterns) that come before any deployment choice.

When you can do this, you can compute a break-even token volume from live prices and defend a shared-vs-dedicated decision in one paragraph.
