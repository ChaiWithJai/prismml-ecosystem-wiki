---
title: "How do I verify a quantized model hasn't lost quality?"
description: "Production-ready quantization means zero perceptible quality loss, verified three ways: perplexity deltas, standard benchmarks, and domain-specific evals."
audience: ml-product-team
pillar: foundational-concept
book: inference-engineering
chapter_ref: "Ch. 5, sec. 5.1.3 (p. 128)"
status: published
last_reviewed: 2026-07-07
---

Production-ready quantization means zero perceptible quality loss, and you verify that three ways: a perplexity comparison, a standard benchmark, and an evaluation on your own domain prompts. The differences should be indistinguishable from run-to-run noise. This is the acceptance test to demand before you ship a cheaper quantized endpoint, and it is cheap enough to run on a laptop. {% .lead %}

## Set the acceptance standard first

Quantization stores model weights in fewer bits, so the model uses less memory and runs faster and cheaper. The question is whether the smaller numbers changed what the model says. Kiely's Inference Engineering (Ch. 5, sec. 5.1.3) sets the bar plainly. The standard for production is "zero perceptible quality loss", and after quantizing you test the output quality against the original precision.

The book gives three checks and says to run all three:

- **Perplexity.** Compute the perplexity of the quantized model on a fixed text and compare it to the original.
- **Standard benchmarks.** Run a public benchmark such as MMLU or SWE-bench on both versions and compare the scores.
- **Custom evals.** Run your own product evaluation suite, the prompts that look like your traffic, on both versions and compare.

In every check you are looking for the same thing. Kiely writes that you want a difference in scores that is "indistinguishable from noise". Models are not deterministic, so even the same model scores slightly differently between runs. The quantized model passes when its gap from the original is no larger than that run-to-run wobble.

## Understand what perplexity tells you

Perplexity is the cheapest of the three checks and the one to run first. You do not ask the model to generate anything. You feed it a fixed text and measure how well it predicts each next token. A lower score means the model expected the text. A higher score means the model was surprised by it, which is a bad sign for a model whose whole job is predicting tokens.

Perplexity is useful because it is fast, repeatable, and sensitive to small shifts in the weights. It is limited because it says nothing about your product. A model can hold its perplexity and still get worse at the one task your users care about. That is why the book pairs it with a benchmark and with your own evals. The custom eval is the check that matches your traffic, so it is the one that should carry the ship decision when the checks disagree.

## Work through the arithmetic

Here is a made up but honest example with realistic numbers. You quantize a 7B model from F16 to Q4 and run perplexity on the same wikitext slice for both. Before looking at any results, you write down a threshold, e.g., "ship only if the perplexity increase is under 1 percent and within the run-to-run spread."

- The F16 model scores 6.23.
- You run the F16 model twice more and get 6.22 and 6.24, so the run-to-run spread is about 0.02, which is about 0.3 percent.
- The Q4 model scores 6.28.

The delta is 6.28 minus 6.23, which is 0.05, or a 0.8 percent increase. That passes your 1 percent line but sits outside the 0.3 percent run-to-run spread. So perplexity alone says "probably fine, not clearly noise." Now the other two checks settle it. If MMLU moves by less than its own run-to-run spread and your domain prompts read the same in a side by side comparison, you ship. If your domain eval drops, you do not ship, no matter how small the perplexity delta was.

The point of writing the threshold down first is that a number you pick after seeing the results will always drift toward the answer you wanted. A pre-committed number keeps the decision honest.

{% callout type="note" %}
Quantization is a scale, not a yes or no choice. If Q4 fails your test, you can quantize less aggressively, e.g., use an 8-bit format instead of 4-bit, or quantize only the weights and leave the rest of the model at full precision. Kiely's book ranks model components from least to most sensitive: weights, then activations, then the KV cache, then attention.
{% /callout %}

{% callout type="warning" %}
Do not accept "the outputs look the same to me" as the acceptance test. Eyeballing a few generations misses small shifts that show up clearly in perplexity and in eval scores. Use eyeballing as a final sanity check on top of the numbers, never instead of them.
{% /callout %}

## Try it

This takes under 30 minutes on a laptop with llama.cpp installed. You will compare the F16 and Q4 versions of one small model on the same text.

First, write your threshold down, e.g., "I ship the Q4 model only if its perplexity is less than 1 percent above F16."

Then get the tools, the test text, and both versions of a small model:

```bash
brew install llama.cpp

# Wikitext-2 test slice
curl -LO https://huggingface.co/datasets/ggml-org/ci/resolve/main/wikitext-2-raw-v1.zip
unzip wikitext-2-raw-v1.zip

# One small model in two precisions
curl -LO https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-fp16.gguf
curl -LO https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf
```

Run perplexity on both:

```bash
llama-perplexity -m qwen2.5-0.5b-instruct-fp16.gguf -f wikitext-2-raw/wiki.test.raw
llama-perplexity -m qwen2.5-0.5b-instruct-q4_k_m.gguf -f wikitext-2-raw/wiki.test.raw
```

Each run prints a final PPL value. Compute the percent increase from F16 to Q4 and compare it to the threshold you wrote down. Then send both models 3 to 5 prompts from your own product domain and read the answers side by side. Write a one paragraph ship or no-ship decision that cites your threshold, the measured delta, and what you saw on the domain prompts.

## Check yourself

- Did you write your perplexity threshold before running anything? If you picked the number after seeing the results, the test was not honest. Redo it with a committed number.
- What are the three checks, and which one should decide a close call? Perplexity, a standard benchmark, and a custom eval on your own prompts. The custom eval decides, because it is the only check that matches your traffic.
- Your Q4 model shows a 0.5 percent perplexity increase and your F16 run-to-run spread is 0.6 percent. Ship or investigate? Ship, pending the other two checks. The delta is inside the noise of the original model.
- Does your written decision cite a number and a domain prompt comparison? If it only says the outputs looked fine, it is an opinion, not an acceptance test.

## Next steps

- Read the [quantization guide](/docs/technical-guides/quantization) for how the number formats and component choices trade quality for speed.
- Read the [benchmarking guide](/docs/technical-guides/benchmarking) for how to run the benchmark half of this test without fooling yourself.
- If the reason you are quantizing is to move off a shared API onto your own endpoint, read [Shared LLM API or dedicated deployment?](/blog/shared-llm-api-vs-dedicated-deployment) first, because that decision comes before the precision decision.

When you can do this, you can execute a three-part quantization acceptance test and render a documented ship decision.
