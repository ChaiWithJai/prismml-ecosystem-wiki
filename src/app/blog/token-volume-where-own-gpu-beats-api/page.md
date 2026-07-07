---
title: "At what token volume does running my own GPU beat a per-token API?"
description: "Compare monthly tokens times per-token price to GPU hours times rental rate plus engineering time. Most teams should stay on the API longer than pride suggests."
audience: ml-product-team
pillar: end-user-case-study
book: inference-engineering
chapter_ref: "Ch. 1, sec. 1.1 (pp. 26-27); Ch. 7, sec. 7.4.2"
status: draft
last_reviewed: 2026-07-06
---

There is a computable crossover. Multiply your monthly tokens by the per-token price, and compare that to GPU hours times the rental rate for a quantized model serving the same load, plus engineering time on the dedicated side. For most teams the honest math says stay on the API longer than pride suggests. At sustained high volume it flips decisively. {% .lead %}

## Compare the two bills

Kiely's Inference Engineering (Ch. 1, sec. 1.1) describes two ways to add a model to your product. With shared inference you send traffic to a public API and pay per million tokens. With a dedicated deployment you rent GPUs and pay per hour whether tokens flow or not.

The API bill is easy to predict because it is a straight line. Double your tokens and you double the cost. Kiely (Ch. 7, sec. 7.4.2) points out that the dedicated bill depends on many variables instead, and he names three:

- Batch sizing. A deployment tuned for throughput packs many requests onto one GPU, so each token costs less. A deployment tuned for latency does not.
- Traffic patterns. A GPU that sits idle overnight still bills by the hour.
- Sequence lengths. Long inputs and outputs change how many requests fit per GPU.

So the comparison is a line against a step function. The API line starts at zero. The dedicated line starts at the cost of your first GPU plus the people who run it. The crossover is the token volume where the lines meet. Kiely's advice on timing is blunt. "Only switch once there is a clear and immediate business need" (Ch. 1, p. 27).

## Work one example with the book's numbers

Kiely (Fig. 7.14 and 7.15) works both bills for one month of traffic.

The API side is 1,000 million input tokens at $1.25 per million and 500 million output tokens at $10 per million. That is $1,250 plus $5,000, so $6,250 for the month.

The dedicated side is 1,600 GPU hours at $3.50 per hour, which is $5,600 for the month.

At this volume the raw compute bill already favors dedicated by $650. But Kiely (p. 203) adds that the cost of engineering time spent building and maintaining the inference system belongs in the total cost of ownership. Suppose one engineer with a loaded cost of $15,000 a month spends a quarter of their time on the deployment. That adds $3,750 a month and flips the answer back to the API by about $3,100. At this volume you would need the engineering cost to fall below $650 a month for dedicated to win, and a quarter of an engineer is a low estimate for a team running its first GPU fleet.

This is why the honest crossover sits higher than a crossover computed from GPU hours alone. In this example the dedicated compute bill is about 90 percent of the API bill, and both bills scale in step with traffic, so the margin per month is thin. That $650 margin has to pay for the $3,750 of labor, which takes almost six times this traffic before the two totals match.

## Account for idle capacity

The 1,600 GPU hours in the example are hours you pay for, not hours the GPU is busy. If your traffic peaks during business hours and you keep the fleet up around the clock, you might pay for 1,600 hours and serve tokens during 700 of them.

Put utilization in the model as its own input. The dedicated cost per million tokens is the hourly rate divided by the millions of tokens served per paid hour, not per busy hour. Dropping utilization from 100 percent to 40 percent multiplies your effective cost per token by 2.5 and pushes the crossover 2.5 times higher. Autoscaling and scale to zero narrow this gap, but they are engineering work, which moves cost into the labor line instead.

The full model is four terms:

- API cost = input tokens x input price + output tokens x output price
- Dedicated cost = paid GPU hours x hourly rate + engineering hours x loaded rate
- Paid GPU hours = tokens served / (throughput per GPU x utilization)
- Crossover = the monthly token count where the two costs are equal

## Try it

Build your own break-even point in under 30 minutes. Use one API model and one GPU SKU running a quantized 8B model.

1. Write down the current input and output prices per million tokens for one API model you could actually use.
2. Write down the hourly rental rate for one GPU SKU that fits a quantized 8B model. Our [quantization guide](/docs/technical-guides/quantization) covers which precision fits which card.
3. Estimate the tokens per second one such GPU serves for your traffic shape. Measure it if you can. If you use a vendor number, mark it as an estimate in the sheet.
4. Run the model below with your numbers.

```python
in_price, out_price = 1.25, 10.0      # $ per million tokens
gpu_rate = 3.50                        # $ per GPU hour
tps = 2500                             # output tokens/sec, YOUR estimate
util = 0.5                             # busy hours / paid hours
eng_monthly = 3750                     # $ of engineering time per month

for m_out in [50, 100, 250, 500, 1000, 2000]:   # millions of output tokens
    m_in = m_out * 2                             # your input:output ratio
    api = m_in * in_price + m_out * out_price
    hours = (m_out * 1e6 / tps) / 3600 / util
    dedicated = hours * gpu_rate + eng_monthly
    print(f"{m_out}M out: API ${api:,.0f} vs dedicated ${dedicated:,.0f}")
```

5. State the crossover as one number, tokens per month, and write it next to your current monthly volume.

## Check yourself

- Does your sheet have a utilization input? Expected answer, yes, and cutting it from 1.0 to 0.4 should raise the crossover by 2.5 times. If the crossover does not move, the input is not wired in.
- Does your sheet have an engineering line item? Expected answer, yes, and setting it to zero should visibly lower the crossover. In the book's example, removing $3,750 of labor swings the monthly comparison by more than the entire compute gap.
- Can you state the crossover as a single number of tokens per month, and say whether your current volume is above or below it? Expected answer, one number and one word, above or below.

## Next steps

- [Cost modeling](/docs/technical-guides/cost-modeling) walks through the full spreadsheet with cache discounts and input to output ratios.
- [Quantization](/docs/technical-guides/quantization) explains why a quantized 8B is the usual starting point for a first dedicated deployment.
- [Shared LLM API versus dedicated deployment](/blog/shared-llm-api-vs-dedicated-deployment) covers the non-cost reasons to switch, such as latency control and custom models.

When you can do this, you can build a defensible API versus dedicated break-even model with utilization and labor included.
