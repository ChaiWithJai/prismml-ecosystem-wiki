---
title: "Is a bigger model ever cheaper? Rethinking cost per unit of capability"
description: "Occasionally yes. When a bigger model's pass rate removes retries or human review, its cost per successful task can undercut a cheap model that fails often."
audience: ml-product-team
pillar: end-user-case-study
book: transcript-theme
chapter_ref: "Theme 1: Intelligence density (capability per GB/watt/dollar)"
status: published
last_reviewed: 2026-07-07
---

Occasionally yes. When a bigger model's pass rate removes retries, human review, or a second pipeline stage, its cost per successful task can undercut a cheaper model that fails often. The right unit is cost per unit of capability delivered, not cost per token. Quantized mid-size models that fit your hardware win this math surprisingly often. {% .lead %}

## Price the success, not the token

A per-token price tells you what one attempt costs. It does not tell you what one finished task costs, because a failed attempt still bills you for its tokens and then bills you again for whatever cleans up the failure. If the small model fails 30 percent of the time and the big model fails 2 percent of the time, the per-token comparison hides the largest cost in the pipeline.

This is the dollar denominator of intelligence density, the theme this post draws on, which scores a model by capability per GB, per watt, and per dollar. The numerator is capability delivered, meaning tasks that pass your success check. A cheap attempt that fails delivers zero capability, so it makes the density worse, not better. The [intelligence density concept page](/docs/concepts/intelligence-density) covers the other two denominators.

## Add retries and fallbacks to the formula

Cost per successful task has three parts.

- The cost of one attempt, which is tokens per attempt times the price per token.
- The expected number of attempts, which grows as the pass rate drops. With a retry cap of three, the expected attempt count is 1 plus the failure rate plus the failure rate squared.
- The fallback cost, which is what you pay when every retry fails, e.g., a human reviews the item. Multiply that cost by the probability that all attempts fail.

So the formula is:

```
cost per task = (cost per attempt x expected attempts)
              + (P(all attempts fail) x fallback cost)
```

The fallback term is where small models lose. Human review at even a few dollars per item costs far more than any saving on tokens, because token costs are fractions of a cent and people are not.

## Work the numbers for invoice extraction

Here is the arithmetic for a made-up but realistic pipeline. Every number is an input to the formula, not a benchmark claim, so rerun it with your own measurements.

The task is extracting fields from an invoice into JSON. Success means the output validates against your schema and passes your field checks. A failed item retries up to three times, and if all three attempts fail, a person fixes it at an estimated 2 dollars of labor per item.

- Model S is small and cheap. Suppose one attempt costs $0.0004 and the pass rate on your eval set is 0.70.
- Model L is large and 10x more expensive per token. Suppose one attempt costs $0.004 and the pass rate is 0.98.

For Model S, the expected attempt count is 1 + 0.30 + 0.09, which is 1.39, so attempts cost 1.39 times $0.0004, which is about $0.00056. The probability that all three attempts fail is 0.30 cubed, which is 0.027. The fallback term is 0.027 times 2 dollars, which is $0.054. Total: about $0.055 per task.

For Model L, the expected attempt count is 1 + 0.02 + 0.0004, which is about 1.02, so attempts cost about $0.0041. The probability that all three attempts fail is 0.02 cubed, which is 0.000008, so the fallback term is about $0.00002. Total: about $0.0041 per task.

Model S is 10x cheaper per token and about 13x more expensive per finished task, because 2.7 percent of its items fall through to a person. The per-token ranking and the per-task ranking point in opposite directions.

## Know when the mid-size model wins anyway

The example above compares two API prices. A third option often beats both. A quantized mid-size model, e.g., [Bonsai 8B in GGUF format](https://huggingface.co/prism-ml/Bonsai-8B-gguf), fits on hardware you already own, so its marginal cost per attempt is close to zero. If its pass rate on your eval is close to the big model's, its cost per successful task is almost entirely the fallback term, and it wins the density math outright. That is why fit-to-hardware models win this comparison so often. The [cost modeling guide](/docs/technical-guides/cost-modeling) shows how to spread hardware cost over its useful life so the comparison stays honest.

{% callout type="note" %}
The pass rates above are inputs you must measure, not properties of model size. A bigger model is not always more accurate on your task, and the formula only rewards it when it is.
{% /callout %}

## Try it

Compute cost per successful task for a small and a large model on one task. Budget 30 minutes. This runs on a laptop CPU, no GPU needed, though the 8B model needs about 5 GB of free RAM.

First, write 10 inputs for a task with a checkable success rule, e.g., extraction that must validate against a JSON schema. Decide the pass rule before you run anything.

```bash
# Install llama.cpp (macOS)
brew install llama.cpp

# Download a small and a mid-size instruct model in 4-bit GGUF
# format from Hugging Face, then run your inputs through each:
while IFS= read -r p; do
  llama-cli -m model-small-q4_k_m.gguf -p "$p" -n 256 --temp 0 -no-cnv
done < inputs.txt

while IFS= read -r p; do
  llama-cli -m model-8b-q4_k_m.gguf -p "$p" -n 256 --temp 0 -no-cnv
done < inputs.txt
```

Count the passes for each model. For local runs, use each model's published API price as the cost per attempt so the comparison is fair, or use your amortized hardware cost. Then apply the formula: expected attempts is 1 plus failure rate plus failure rate squared, and the fallback term is the failure rate cubed times your honest estimate of cleanup cost. Compare the two totals against the two per-token prices.

## Check yourself

1. Do your two rankings, cost per token and cost per successful task, disagree? If they agree, can you explain why, e.g., both models pass nearly everything, so retries and fallbacks never fire?
2. In the invoice example, why does Model S lose despite a 10x price advantage? Expected answer: 2.7 percent of its items reach the 2 dollar human fallback, and the $0.054 fallback cost is far larger than the $0.003 saved on tokens.
3. What single measured number would flip your result? Expected answer: the small model's pass rate. If it rises enough that the fallback term shrinks below the token saving, the small model wins again.

## Next steps

- [Intelligence density](/docs/concepts/intelligence-density) explains capability per GB, per watt, and per dollar, of which this post worked the dollar case.
- [Cost modeling](/docs/technical-guides/cost-modeling) covers amortizing hardware and pricing retries in production pipelines.
- [What does 'intelligence density' actually measure?](/blog/what-is-intelligence-density) works the GB denominator the same way this post works dollars.

When you can do this, you can compute cost per successful task including retries and use it to challenge a model comparison that is based on price per token.
