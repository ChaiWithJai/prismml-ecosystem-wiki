---
title: "What does 'intelligence density' actually measure — and why isn't it just tokens per second?"
description: "Intelligence density measures usable capability per GB of memory, per watt, and per dollar, not raw speed or parameter count or tokens per second."
audience: ml-product-team
pillar: foundational-concept
book: transcript-theme
chapter_ref: "Theme 1: Intelligence density (capability per GB/watt/dollar)"
status: draft
last_reviewed: 2026-07-06
---

Intelligence density measures usable capability per GB of memory, per watt, and per dollar, not raw speed or parameter count. A 3B model that passes your evals on a laptop can be denser than a 70B model behind an API, because density is always relative to a workload, a hardware envelope, and a budget. {% .lead %}

## Define density as capability divided by a resource

Density is a ratio. The numerator is capability, which means the fraction of your eval set the model passes for one specific workload. The denominator is a resource you actually pay for. The three denominators that come up most are these.

- GB of memory. This is the memory the model occupies while it runs, which sets whether it fits on the device you have.
- Watts. This is the power the machine draws while the model works, which sets battery life on a laptop and the electricity bill on a server.
- Dollars. This is what you pay per unit of work, either as API fees or as hardware cost spread over its useful life.

Each ratio answers a different question. Capability per GB tells you what fits on the device. Capability per watt tells you what the device can sustain. Capability per dollar tells you what the budget allows. A model can rank well on one ratio and poorly on another, so you pick the denominator that matches your constraint before you compare anything.

The numerator is the part people skip. Parameter count is not capability, and a leaderboard score is not capability for your workload. Capability is your eval pass rate on your task. A model that fails your evals has a density of zero no matter how small or cheap it is, because zero divided by anything is zero.

## Separate density from tokens per second

Tokens per second is a speed. It tells you how fast a given model produces output on given hardware. It says nothing about whether the output is usable, and it says nothing about what the speed costs you in memory, power, or money.

Two examples show the gap.

- A small model can emit 80 tokens per second and fail your summarization eval on most inputs. Its speed is high and its density is zero, because the numerator is zero.
- A 70B model behind an API can emit 60 tokens per second and pass your eval. Its speed is fine, but its density in dollars can still be low for you, because you pay per token for capability you do not need on this task.

Speed also hides the denominator. A serving stack can raise tokens per second by adding GPUs, which raises watts and dollars at the same time. The speed number goes up while density in watts and dollars goes down. If you only track tokens per second, you cannot see that trade.

Density is also why parameter count is a weak argument in a model review. The theme this post draws on, capability per GB, per watt, and per dollar, treats the model as a means to a workload rather than as an object with a size. The question is never "is 70B better than 3B". The question is "which model passes the eval at the lowest cost in the resource we are short on".

## Work the numbers for on-device summarization

Here is the arithmetic for a made-up but realistic comparison. Every number below is an input to the formula, not a benchmark claim, so rerun it with your own measurements.

The workload is summarizing meeting notes on an employee laptop with 16 GB of RAM, of which you can spare about 6 GB for a model.

- Model A is a 3B model quantized to 4 bits. Its weights occupy about 2 GB. Suppose it passes 42 of your 50 eval prompts, a pass rate of 0.84.
- Model B is an 8B model quantized to 4 bits. Its weights occupy about 5 GB. Suppose it passes 45 of 50, a pass rate of 0.90.

Capability per GB for Model A is 0.84 divided by 2, which is 0.42. For Model B it is 0.90 divided by 5, which is 0.18. Model B is more capable in absolute terms and a public leaderboard would rank it higher, but Model A is more than twice as dense for this workload. If the laptop is the constraint, Model A wins, and the 6 GB you saved is free for the rest of the application.

Now add a 70B model behind an API that passes 48 of 50, a pass rate of 0.96. It occupies zero GB on the laptop, so capability per GB does not apply. The right denominator is dollars. If it costs an estimated 40 dollars per month per user at your usage, and Model A costs nothing per request after setup, then Model A delivers 0.84 of the capability at close to zero marginal cost. Whether the extra 0.12 of pass rate is worth 40 dollars per user is a product decision, and density is the number that puts that decision on the table.

Quantization is the main lever on the GB denominator, because it shrinks the weights without retraining. The [quantization guide](/docs/technical-guides/quantization) covers how far you can push it before the numerator starts to drop.

{% callout type="note" %}
Density has no single ranking. The same three models rank one way per GB, another way per dollar, and another way per watt. State your denominator before you argue about which model is best, or the argument is about nothing.
{% /callout %}

## Try it

Score two local models on capability per GB for one workload. Budget 30 minutes.

First, write 10 prompts for on-device summarization into a file, one prompt per line. Decide what counts as a pass before you run anything, e.g., the summary keeps every action item from the input.

```bash
# Install llama.cpp (macOS)
brew install llama.cpp

# Download a 3B and an 8B instruct model in 4-bit GGUF format
# from Hugging Face, then run your prompts through each:
while IFS= read -r p; do
  llama-cli -m model-3b-q4_k_m.gguf -p "$p" -n 256 --temp 0 -no-cnv
done < prompts.txt

while IFS= read -r p; do
  llama-cli -m model-8b-q4_k_m.gguf -p "$p" -n 256 --temp 0 -no-cnv
done < prompts.txt

# Use the GGUF file size as the resident weight memory in GB:
ls -lh model-3b-q4_k_m.gguf model-8b-q4_k_m.gguf
```

Count the passes for each model and divide the pass rate by the file size in GB. That gives you two capability-per-GB scores. Then look up where the same two models sit on a public leaderboard and compare the two orderings.

## Check yourself

1. Did your density ranking and the leaderboard ranking disagree for at least one pair? If they agree everywhere, your workload is probably too close to what the leaderboard measures, so try a narrower task.
2. Can you explain the disagreement in terms of your constraint, e.g., "the 8B model scores higher on the leaderboard, but at 5 GB it delivers less capability per GB than the 3B model, and GB is what my laptop is short on"?
3. Can you say which denominator applies to your product, and why? If you cannot name the resource you are short on, you cannot compute a density, and any model comparison you make is really a parameter count comparison.

## Next steps

- [Intelligence density](/docs/concepts/intelligence-density) covers the concept in the docs, including the watt denominator this post only touched.
- [Quantization](/docs/technical-guides/quantization) explains how to shrink the GB denominator and how to check that the pass rate survives.
- [Why is model selection the biggest inference optimization?](/blog/model-selection-biggest-inference-optimization) makes the related argument that the smallest model passing your evals beats any runtime trick.

When you can do this, you can compute a capability-per-GB score for a concrete workload and use it to challenge a model choice that is based on parameter count.
