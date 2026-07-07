---
title: "What are prefill and decode in LLM inference?"
description: "LLM inference has two phases. Prefill computes attention over the whole input and fills the KV cache. Decode then generates one token per forward pass."
audience: researcher
pillar: foundational-concept
book: inference-engineering
chapter_ref: "Ch. 2, sec. 2.2 (pp. 46-49)"
status: published
last_reviewed: 2026-07-07
---

LLM inference has two phases. Prefill computes attention over the whole input in parallel and fills the KV cache. Decode then generates the output one token per forward pass. These two phases account for nearly all inference time and resources, so almost every serving technique, from batching to speculation, is an attack on one of them. {% .lead %}

## Understand what each phase does

An LLM generates new tokens one at a time based on every previous token. Before it can generate anything, it has to process the tokens you gave it. That split is the whole idea.

Prefill is the input pass. The engine tokenizes your prompt, then runs one large forward pass that computes attention for every input token at once. The attention keys and values for each token are stored in the KV cache, so the model never has to recompute them. Kiely's Inference Engineering (Ch. 2, sec. 2.2) defines prefill as the phase that processes the input sequence to calculate attention for each input token and store those values in a KV cache.

Decode is the output loop. Each forward pass produces one vector of logits, one value per token in the model's vocabulary. The engine normalizes the logits into probabilities, samples one token, appends it to the sequence, and runs the next pass. The loop ends when the model emits a stop token or hits a token limit.

Kiely is blunt about why this split is the one to learn. The KV cache generation in prefill and the token generation in decode "take the overwhelming majority of the time and resources during inference" (Ch. 2, p. 49). Everything else in a serving stack, e.g., tokenization or sampling arguments, is cheap by comparison.

## See why the two phases behave differently

The phases stress the hardware in different ways, and this is the fact that the rest of inference engineering builds on.

Prefill is parallel. All input tokens go through the model together, so the GPU does a small number of very large matrix multiplications. The limit is usually raw compute.

Decode is serial. One forward pass yields one token, and the pass cannot start until the previous token exists. Each pass also reads the model weights and the whole KV cache from memory to produce a single token. The limit is usually memory bandwidth, not compute.

So a long prompt costs you in prefill, and a long answer costs you in decode, and the two costs do not trade against each other on the same hardware limit. Continuous batching, KV cache paging, and speculative decoding each exist to attack one phase. If you can name which phase a request spends its time in, you can name which technique would help it.

## Work through the arithmetic

Take two requests to the same local model. Treat the throughput numbers below as estimates for a small model on a laptop, not benchmarks. The point is the ratio, not the exact figures.

Assume the machine prefills at about 500 tokens per second and decodes at about 25 tokens per second.

- Request A has 4,000 input tokens and 50 output tokens. Prefill takes about 4,000 / 500 = 8 seconds. Decode takes about 50 / 25 = 2 seconds. Prefill is 80 percent of the wall clock.
- Request B has 100 input tokens and 1,000 output tokens. Prefill takes about 100 / 500 = 0.2 seconds. Decode takes about 1,000 / 25 = 40 seconds. Decode is over 99 percent of the wall clock.

Same model, same machine, and the dominant cost flips entirely with the prompt shape. This is why a summarization service and a story generator tune different parts of the same engine.

## Try it

You can confirm the arithmetic on your own machine in under 30 minutes with llama.cpp, which prints per-phase timings after every run.

1. Get a model and build or install llama.cpp. Any small instruct model in GGUF format works.
2. Run a request with a long prompt and a short answer. Put a few thousand words of text in a file and ask for a tiny completion:

   ```sh
   ./llama-cli -m model.gguf -f long-article.txt -n 16
   ```

3. Run a request with a short prompt and a long answer:

   ```sh
   ./llama-cli -m model.gguf -p "Write a 500 word story about a lighthouse keeper." -n 700
   ```

4. In the timing block at the end of each run, record the "prompt eval time" line and the "eval time" line, and note which one dominates in each run.

{% callout type="note" %}
In llama.cpp output, "prompt eval time" is prefill and "eval time" is decode. The tokens per second figure on the prefill line should be far higher than on the decode line, because prefill processes tokens in parallel.
{% /callout %}

## Check yourself

Answer these before you look at your timings.

1. Which run will be prefill-heavy, and why? The long-article run, because it has thousands of input tokens and only 16 output tokens, so almost all the work is the input pass.
2. Which line will show the higher tokens per second? The prompt eval line, because prefill computes many tokens in one parallel pass while decode produces one token per pass.
3. Your prompt has 2,000 tokens and you request 2,000 output tokens. Which phase takes more wall-clock time? Decode, by a wide margin. The token counts match, but decode runs one forward pass per token while prefill handles all 2,000 in parallel.
4. What does the KV cache save you during decode? Recomputing attention keys and values for every earlier token on every pass. Without it, each decode step would redo the work of a full prefill.

## Next steps

- Read the concept page on [prefill and decode](/docs/concepts/prefill-decode) for how the two phases show up in a serving stack.
- Read the technical guide on the [KV cache](/docs/technical-guides/kv-cache) to see what prefill actually writes and why its size limits batch depth.
- Kiely's Inference Engineering, Ch. 2, sec. 2.2 covers the same ground with the sampling arguments (temperature, top-k, top-p) that act on each decode pass.

When you can do this, you can attribute observed inference time to prefill versus decode for any prompt shape.
