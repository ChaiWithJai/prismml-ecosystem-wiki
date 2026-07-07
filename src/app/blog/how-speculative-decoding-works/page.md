---
title: "How does speculative decoding generate more than one token per forward pass?"
description: "Decode is memory-bandwidth-bound, so a small speculator drafts tokens and the target validates them in one pass. It lifts TPS and ITL, never TTFT."
audience: inference-engineer
pillar: foundational-concept
book: inference-engineering
chapter_ref: "Ch. 5, sec. 5.2 (pp. 129-131)"
status: draft
last_reviewed: 2026-07-06
---

Decode is limited by memory bandwidth, which leaves compute sitting idle. Speculative decoding uses that idle compute. A small speculator drafts several tokens ahead, and the target model validates all of them in one forward pass. Kiely compares validation to checking a finished sudoku instead of solving one. The catch is that speculation improves tokens per second and inter-token latency only, never time to first token, and only when spare compute exists. {% .lead %}

## Understand why validation is cheaper than generation

During decode, the model generates one token per forward pass, and each pass reads every weight from memory. At low batch sizes the GPU spends most of each pass waiting on those reads, so the compute units sit idle. Kiely's Inference Engineering (Ch. 5, sec. 5.2) points out that this idle compute is the resource speculation spends.

The mechanism has three steps:

1. A speculator generates one or more draft tokens.
2. The target model runs one forward pass over all the drafts at once and checks whether each one matches what it would have generated.
3. The target model accepts the valid prefix of the drafts and generates one more token itself.

If N drafts are accepted, the pass produces N + 1 tokens instead of 1. Checking a batch of drafts in one pass costs about the same memory traffic as generating a single token, because the weights are read once either way. The extra work is compute, and compute was idle. Kiely's sudoku comparison captures the asymmetry. Solving the puzzle is hard, and checking a finished one is easy. Generating a token is the solve, and validating a draft is the check.

## Work the arithmetic on acceptance rate

Kiely lists three factors that set the speedup: draft token cost, draft sequence length, and token acceptance rate. He also notes that acceptance is high early in the draft sequence and drops the deeper you go, and that one rejection throws away every draft after it.

Here is a worked example. These numbers are illustrative, not benchmarks. Suppose each draft token is accepted with probability 0.7, drafts after a rejection are discarded, and one draft token costs 10 percent of a target forward pass.

At draft length 5, the expected number of accepted drafts is 0.7 + 0.49 + 0.34 + 0.24 + 0.17, which is about 1.94. Add the token the target generates itself and each pass yields about 2.94 tokens. The pass costs 1.0 for the target plus 0.5 for five drafts, so 1.5 units of time. That is about 2.94 / 1.5, or roughly 2.0 times the tokens per unit time.

At draft length 10, the expected accepted count only rises to about 2.27, because tokens 6 through 10 each survive only if all five before them did. Each pass yields about 3.27 tokens but now costs 2.0 units. That is about 1.6 times baseline, worse than draft length 5. This is why Kiely tells you to aim for short draft sequences with a high acceptance percentage. Past some length, every added draft costs full price and is almost never accepted.

## Know what speculation cannot fix

Kiely is blunt on the limits: "Speculative decoding only improves TPS/ITL, not TTFT." Prefill is already compute bound, so there is no idle compute to spend, and the first token comes out no sooner.

The same logic caps speculation at high batch sizes. When many requests share the GPU, decode itself becomes compute bound, and there are no spare cycles for validation. Kiely notes that inference engines must dynamically disable speculation as batch size grows. Acceptance rate also moves with sampling settings. Higher temperature makes the target's choices harder to predict, so more drafts are rejected.

{% callout type="note" %}
Draft-target speculation, the variant in this post's exercise, uses a separate small model as the speculator. Kiely's rule of thumb is that the draft model should be at least ten times smaller than the target by parameter count, and ideally from the same family so the tokenizers match.
{% /callout %}

## Try it

Run draft-target speculation in llama.cpp with a 0.5B draft model and a 7B target from the same family, e.g., Qwen2.5 0.5B drafting for Qwen2.5 7B. Recent llama.cpp builds use `-md` for the draft model and `--draft-max` for the draft length. Older builds call the length flag `--draft`.

```bash
# Same prompt at three draft lengths
for n in 2 5 10; do
  llama-cli \
    -m qwen2.5-7b-instruct-q4_k_m.gguf \
    -md qwen2.5-0.5b-instruct-q4_k_m.gguf \
    --draft-max $n \
    -n 256 --temp 0 \
    -p "Write a step-by-step explanation of how a hash map handles collisions." \
    2>&1 | grep -Ei "drafted|accept|eval time|tokens per second"
done
```

llama.cpp prints the number of drafted and accepted tokens, so you can compute acceptance rate as accepted divided by drafted. Record tokens per second and acceptance rate at each draft length, then chart tokens per second against acceptance rate. Also run once with no draft model to get your baseline. Use temperature 0 first, then repeat at 0.8 and watch the acceptance rate fall.

{% callout type="warning" %}
Both models must fit in memory at once. If the 7B target already fills your GPU, the draft model spills and the run slows down for a reason that has nothing to do with speculation.
{% /callout %}

## Check yourself

1. What was your acceptance rate at draft lengths 2, 5, and 10? Expected answer: three numbers you read from your own runs, and the rate should fall as the draft gets longer.
2. At which draft length did tokens per second peak, and why did longer drafts stop paying? Expected answer: the peak is usually at a short length, because late draft tokens are rarely accepted but still cost a full draft pass each.
3. Did speculation change your time to first token? Expected answer: no. Prefill is compute bound, so speculation has no idle compute to use there.
4. What happened to acceptance rate when you raised temperature to 0.8? Expected answer: it dropped, because the target's sampled choices became harder for the draft model to predict.

## Next steps

- [Speculative decoding guide](/docs/technical-guides/speculative-decoding) for the algorithm variants past draft-target, such as EAGLE and n-gram speculation.
- [llama.cpp in the ecosystem](/docs/ecosystem/llama-cpp) for setup, quantization choices, and the rest of the local toolchain.

When you can do this, you can configure draft-model speculation locally and identify the acceptance-rate regime where it is net-positive.
