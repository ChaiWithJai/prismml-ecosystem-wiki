---
title: "How do I compare per-token API costs to renting my own GPUs?"
description: "Compute total cost both ways over a week of real traffic, tokens times price versus GPU hours times rate, and add engineering time to the dedicated side."
audience: ml-product-team
pillar: end-user-case-study
book: inference-engineering
chapter_ref: "Ch. 7, sec. 7.4.2 (pp. 201-203)"
status: published
last_reviewed: 2026-07-07
---

Do not reverse engineer a per-token price from GPU rates. Compute the total cost both ways over at least a week of real traffic. On the API side, multiply tokens by price. On the dedicated side, multiply GPU hours by the hourly rate and add engineering time. Dedicated inference turns cost from a straight line of usage into a function of deployment choices such as batch size. {% .lead %}

## Compute the total cost, not a per-token price

Kiely's Inference Engineering (Ch. 7, sec. 7.4.2) says the API bill is easy. It is "a price per million tokens times the number of tokens you use" (p. 201). Double the tokens and you double the bill.

The tempting shortcut is to divide a GPU's hourly rate by the tokens it serves per hour and get your own per-token price to compare against the API's. Kiely warns against this. Given the number of variables on the dedicated side, and the gap between input and output pricing, he says it is more productive to convert your token usage into a total cost and compare totals, instead of trying to reverse engineer a per-token price from what you pay for GPUs (p. 202).

The reason is that a dedicated deployment has no single per-token price. Kiely names the variables that move it:

- Batch sizing. A deployment tuned for throughput packs many requests together, so each token costs less. A deployment tuned for latency does not. Our [batching guide](/docs/technical-guides/batching) explains the tradeoff.
- Traffic patterns. A GPU bills by the hour whether your traffic saturates it or not.
- Sequence lengths. Long inputs and outputs change how many requests fit on each GPU.

So the method is one comparison with two totals. Both totals cover the same window of real traffic, and Kiely says that window should be at least a week to smooth out daily and weekly usage cycles (p. 202).

## Work the book's example

Kiely works both totals for one billing window (Fig. 7.14 and 7.15).

The API side has 1,000 million input tokens at $1.25 per million and 500 million output tokens at $10 per million. That is $1,250 plus $5,000, so $6,250.

The dedicated side has 1,600 GPU hours at $3.50 per hour, which is $5,600.

The raw compute comparison favors dedicated by $650. But Kiely (p. 203) says the cost of engineering time spent building and maintaining the inference system should be added to the GPU cost to form the total cost of ownership. If an engineer whose time costs $15,000 a month spends even ten percent of it on the deployment, that adds $1,500 and flips the comparison back to the API. The API side carries no such line because the provider does that work.

Two more notes on the arithmetic. First, output tokens are $5,000 of the $6,250 API bill, so your input to output ratio moves the API total more than the input price does. Second, the 1,600 GPU hours are paid hours, not busy hours. If your traffic only saturates the fleet half the time, you need roughly twice the paid hours for the same tokens, and the dedicated total in this example becomes $11,200. That single assumption swings the answer by more than every other line combined.

## Vary your weakest assumption

Your estimate is only as good as its most fragile input, so test each one at half and at double its value:

- Utilization. Paid hours divided into busy hours. Halving it doubles the dedicated compute total.
- Throughput per GPU. Tokens served per hour at your sequence lengths and batch sizes. A vendor benchmark number is an estimate until you measure it on your own traffic.
- Engineering time. Teams new to running GPUs usually underestimate this line.

Whichever input moves the total most when doubled is your dominant assumption. Write it down next to the comparison, because that is the number to measure before you trust the answer.

## Try it

Budget under 30 minutes. You do not need a GPU for this exercise, because the dedicated side is an estimate on paper.

1. Pull one week of real token usage from your API provider's usage dashboard, split into input and output tokens.
2. Compute the API cost from your provider's current prices.
3. Pick one GPU SKU and its hourly rental rate. Assume a quantized 8B model such as [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf), which fits on a single 24 GB card in its 4-bit form.
4. Estimate GPU hours for the week and run the comparison:

```python
in_tok_m, out_tok_m = 230.0, 115.0   # YOUR week, millions of tokens
in_price, out_price = 1.25, 10.0     # $ per million tokens
gpu_rate = 3.50                      # $ per GPU hour
tps = 2500                           # output tokens/sec, an ESTIMATE
util = 0.5                           # busy hours / paid hours
eng_week = 375                       # $ of engineering time per week

api = in_tok_m * in_price + out_tok_m * out_price
hours = (out_tok_m * 1e6 / tps) / 3600 / util
dedicated = hours * gpu_rate + eng_week
print(f"API ${api:,.0f} vs dedicated ${dedicated:,.0f} ({hours:,.0f} GPU hours)")

for name, factor in [("util x2", 2), ("util /2", 0.5)]:
    h = hours / factor
    print(f"{name}: dedicated ${h * gpu_rate + eng_week:,.0f}")
```

5. Note which assumption dominates. Rerun with `tps`, `util`, and `eng_week` each doubled and halved, and record which one moves the dedicated total most.

## Check yourself

- Why does Kiely say to compare totals instead of per-token prices? Expected answer, because a dedicated deployment has no single per-token price. Its effective price depends on deployment variables such as batch size, so only a total over the same traffic window is a fair comparison.
- Why a week of traffic instead of a day? Expected answer, because usage moves on daily and weekly cycles, and a single day gives a total that does not represent your load.
- In the book's example, what does adding $1,500 of engineering time per month do? Expected answer, it erases the $650 compute advantage and the API wins the total cost comparison.
- Which single assumption moves your own estimate most, and by how much at 2x? Expected answer, one named input, usually utilization, and the dollar swing from your own sensitivity run.

## Next steps

- [Cost modeling](/docs/technical-guides/cost-modeling) walks through the full comparison spreadsheet, including cache discounts and input to output ratios.
- [Batching](/docs/technical-guides/batching) explains why batch size is the main lever on the dedicated side's throughput.
- [At what token volume does running my own GPU beat a per-token API?](/blog/token-volume-where-own-gpu-beats-api) turns this comparison into a single crossover number.

When you can do this, you can produce a two-sided cost comparison grounded in a week of real traffic, with a sensitivity note on its dominant assumption.
