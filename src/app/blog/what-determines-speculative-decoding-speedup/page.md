---
title: "What determines whether speculative decoding actually speeds things up?"
description: "Three factors set the speedup: draft cost, draft length, and acceptance rate. One rejection discards the rest of the draft, so short accurate drafts win."
audience: researcher
pillar: foundational-concept
book: inference-engineering
chapter_ref: "Ch. 5, secs. 5.2-5.2.1 (pp. 130-131)"
status: draft
last_reviewed: 2026-07-07
---

Three factors set the speedup: draft token cost, draft sequence length, and token acceptance rate. One rejected draft token discards every draft after it, so short drafts that the target usually accepts beat long speculative ones. Sampling temperature, workload predictability, and batch pressure all act through these three numbers, so you can measure a speculation setup instead of guessing about it. {% .lead %}

## Name the three factors

Kiely's Inference Engineering (Ch. 5, sec. 5.2, p. 130) lists exactly three factors behind the performance uplift of any speculative decoding strategy:

1. Draft token cost, the time it takes to generate one draft token.
2. Draft sequence length, the number of draft tokens generated per forward pass.
3. Token acceptance rate, the percentage of draft tokens the target model accepts.

Every speedup and every regression you will ever see from speculation decomposes into these three numbers. The tokens gained per pass come from acceptance rate and draft length, and the time spent per pass comes from draft cost and draft length. Nothing else enters the equation.

Kiely adds one rule that shapes everything downstream. Acceptance is high early in the draft sequence and drops the deeper you go, and once one draft token is rejected, every token after it in the sequence is thrown away too. A draft is only useful up to its first mistake. His advice on p. 131 is to "aim for short, high-percentage sequences" because drafting has overhead even when it is cheap.

## Work the arithmetic on a temperature change

Here is a worked example. These numbers are illustrative, not benchmarks. Suppose one draft token costs 5 percent of a target forward pass, the draft length is 4, and each draft token is accepted with probability p, given that all earlier drafts were accepted.

The expected number of accepted drafts is p + p² + p³ + p⁴, because a draft at position k only survives if every draft before it did. The target then generates one more token itself, so each pass yields that sum plus 1. Each pass costs 1.0 for the target plus 4 × 0.05 = 0.2 for the drafts, so 1.2 time units.

At p = 0.8, the expected accepted count is 0.8 + 0.64 + 0.512 + 0.41 ≈ 2.36. Each pass yields about 3.36 tokens for 1.2 units of time, which is about 2.8 times the one token per unit that plain decode gives.

Now raise the temperature so the target's sampled choices get harder to predict, and suppose acceptance falls to p = 0.5. The expected accepted count drops to 0.5 + 0.25 + 0.125 + 0.0625 ≈ 0.94. Each pass yields about 1.94 tokens for the same 1.2 units, which is about 1.6 times baseline. Draft cost and draft length did not move at all, yet the speedup fell from 2.8x to 1.6x. Acceptance rate alone explains the whole gap.

One more step shows why the draft should stay short. Keep p = 0.5 and stretch the draft to 8 tokens. The expected accepted count only rises to about 1.0, because tokens 5 through 8 almost never survive four earlier coin flips. The pass now costs 1.4 units for about 2.0 tokens, which is about 1.4 times baseline. The longer draft made things worse.

## Trace every tuning knob back to one of the three numbers

The three factors turn speculation tuning into measurement. Whatever knob you touch, ask which number it moves.

- Temperature moves acceptance rate. Kiely calls it the big factor (p. 131). Higher temperature spreads the target's token distribution, so the draft's guesses match less often.
- Workload moves acceptance rate. Kiely notes that even subject matter changes acceptance when the draft model knows one domain better than another. Structured output such as code or JSON is easier to predict than open prose.
- Draft model choice moves draft cost and acceptance rate together. A good draft model has high acceptance while staying cheap, and Kiely's rule of thumb (sec. 5.2.1) is at least ten times smaller than the target by parameter count, ideally from the same family so the tokenizers match.
- Batch size decides whether the trade exists at all. Speculation spends idle compute, and at high batch sizes decode is already compute bound, so engines must disable speculation dynamically.

So when a speculation run disappoints, do not retune blindly. Log accepted and drafted counts, compute the acceptance rate, and check which of the three numbers moved.

## Try it

This takes about 20 minutes on any machine that can run a 7B model, with or without a GPU. You need two models from the same family, e.g., Qwen2.5 0.5B drafting for Qwen2.5 7B, and both must fit in memory at once. Run the same prompt with speculation on at temperature 0.0 and at 1.2. Before the second run, write down your prediction for the direction of the acceptance rate change.

```bash
for t in 0.0 1.2; do
  llama-cli \
    -m qwen2.5-7b-instruct-q4_k_m.gguf \
    -md qwen2.5-0.5b-instruct-q4_k_m.gguf \
    --draft-max 4 \
    -n 256 --temp $t \
    -p "Explain how a B-tree splits a full node during insertion." \
    2>&1 | grep -Ei "drafted|accept|tokens per second"
done
```

Recent llama.cpp builds use `-md` for the draft model and `--draft-max` for the draft length. llama.cpp logs drafted and accepted token counts, so acceptance rate is accepted divided by drafted. Record tokens per second and acceptance rate at both temperatures, then explain the tokens per second gap using only the three factors. Draft cost and draft length were identical across the runs, so any gap you see must come from acceptance rate, and your logs should show it falling at 1.2.

## Check yourself

1. Which of the three factors changed between your two runs, and how do you know? Expected answer: only acceptance rate, because the draft model and draft length were fixed, and the logged acceptance count fell at temperature 1.2.
2. Why does a rejected token at position 2 waste the drafts at positions 3 and 4 even if they were correct guesses? Expected answer: validation accepts only the prefix that matches what the target would have generated. After a rejection the target's next token differs from the draft's context, so everything after it is off the target's path.
3. Your acceptance rate is 0.5. Should you raise the draft length from 4 to 8 to get more tokens per pass? Expected answer: no. The expected accepted count barely rises, because late tokens survive only if all earlier ones did, and each extra draft token still costs full draft price.
4. A colleague reports that speculation stopped helping once traffic grew. Which factor is the likely cause? Expected answer: none of the three directly. High batch size removes the idle compute that pays for validation, so the engine disables speculation. The three factors set the size of the win only when spare compute exists.

## Next steps

- [Speculative decoding guide](/docs/technical-guides/speculative-decoding) for the algorithm variants and how each one trades draft cost against acceptance rate.
- [Benchmarking guide](/docs/technical-guides/benchmarking) for how to measure tokens per second without fooling yourself.
- [How does speculative decoding generate more than one token per forward pass?](/blog/how-speculative-decoding-works) for the mechanism this post takes as given.

When you can do this, you can attribute a speculation speedup or regression to draft cost, draft length, or acceptance rate with measured evidence.
