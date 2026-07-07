---
title: "How should product teams think about accuracy vs. speed trade-offs in AI?"
description: "Accuracy versus speed is a product decision. The PM names the quality bar per feature, and the engineer finds the fastest configuration that clears it."
audience: ml-product-team
pillar: foundational-concept
book: both
chapter_ref: "Nika, Ch. 6 preview (chapter map); Kiely, Ch. 5, sec. 5.1"
status: draft
last_reviewed: 2026-07-07
---

Accuracy versus speed is a product decision expressed through technical dials, chiefly model size and quantization level. The PM names the quality bar for each feature, because a chat reply tolerates more error than a legal summary. The engineer then finds the fastest configuration that clears that bar. Neither role can set the operating point alone. {% .lead %}

## Name the quality bar per feature

The mistake teams make is treating accuracy and speed as one global setting for the whole product. They are per-feature settings. A casual chat feature can absorb an occasional clumsy sentence, because the user reads the reply, shrugs, and rephrases. A legal summary cannot absorb a wrong clause, because the user acts on it without checking the source. Same model, same company, two different quality bars.

Naming the bar is product work, not engineering work. Marily Nika's Building AI-Powered Products treats model development (Ch. 6 in her chapter map) as a phase the PM stays inside, not one the PM hands off. The PM's part of the trade-off is a sentence like "for this feature, an error costs the user X, so the model must be right at least Y percent of the time on our eval set." Without that sentence, the engineer has no target and will optimize for whatever benchmark is handy.

## Know the dials the engineer turns

Once the bar is named, the engineer has two main dials:

- **Model size.** A smaller model reads fewer weights per token, so it produces tokens faster and costs less to serve. It is also, on average, less capable.
- **Quantization level.** Storing the weights in fewer bits makes the same model faster. Kiely's Inference Engineering (Ch. 5, sec. 5.1) reports that dropping a single level of precision generally offers "30 to 50 percent better performance" for LLMs, and that the risk is that quantization "can materially reduce the model's output quality."

Kiely's standard for production quantization is "zero perceptible quality loss" (sec. 5.1.3), verified by comparing the quantized model against the original on perplexity, a public benchmark, and your own evals. Note what that standard requires. Someone has to define what "perceptible" means for each feature, and that someone is the PM. The engineer measures the loss. The PM says whether the user would notice or care.

Both dials also come in smaller steps than on or off. Kiely points out that quantization is a spectrum, e.g., you can quantize only the weights and leave the attention layers at full precision. So the frontier of available operating points is dense, and the question is never "fast or accurate." It is "which point on the frontier does this feature need."

## Work through the arithmetic

Here is why the speed side of the dial is so large, using derived arithmetic rather than a benchmark. Token generation is limited by memory bandwidth, because the hardware reads the model weights once per token. An 8B model at 16-bit precision stores about 16 GB of weights. The same model at 4-bit stores roughly 4.5 GB once you include the format's overhead. That is about 3.5 times less data to read per token, so as a rough estimate the 4-bit version can generate tokens around 3 times faster on the same hardware. The exact number depends on the machine, so treat 3x as an estimate to verify, not a spec.

Now translate that into user consequences. Suppose the 16-bit model generates 12 tokens per second on your hardware and a typical reply is 150 tokens. The reply takes 150 divided by 12, which is about 12.5 seconds. At 3 times the speed, the 4-bit version takes about 4 seconds. For a chat feature, 12.5 seconds is an abandoned conversation and 4 seconds is usable, so if the 4-bit model's errors stay within the chat bar, you ship 4-bit. For a legal summary that a lawyer waits 30 seconds for anyway, the 8 saved seconds buy the user almost nothing, so you spend the speed budget on accuracy and serve the higher precision.

{% callout type="note" %}
The public [Bonsai 8B model card](https://huggingface.co/prism-ml/Bonsai-8B-gguf) is a concrete example of the small end of this frontier. It exists because some features clear their quality bar with a small model, and for those features the extra speed and lower cost are free wins.
{% /callout %}

## Pick the operating point together

The handoff between the two roles looks like this. The PM writes the quality bar per feature and names the user consequence behind it. The engineer builds the frontier, meaning a short table of configurations with measured accuracy and measured tokens per second for the task. Then both look at the table and pick a row per feature. The PM alone would pick a row without knowing what it costs to serve. The engineer alone would pick a row without knowing what an error does to the user. The row is a joint decision, and it should be written down with one line of rationale so the next person who touches the config knows why it is set where it is.

{% callout type="warning" %}
Do not let the rationale be a benchmark number. "Q4 because MMLU only dropped 0.4" explains nothing to the next PM. "Q4 because chat users abandon after 5 seconds and our eval showed no visible reply quality change" survives a re-read a year later.
{% /callout %}

## Try it

This takes under 30 minutes with llama.cpp. No GPU is required, because llama.cpp runs on a CPU or on Apple Silicon. Absolute speeds will be lower than on a GPU server, but the shape of the trade-off is the same.

Download one small model at three quantization levels:

```bash
brew install llama.cpp

curl -LO https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q2_k.gguf
curl -LO https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf
curl -LO https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q8_0.gguf
```

Pick one task, e.g., summarize the same three paragraphs of a contract. Run it at each level and note the tokens per second that llama.cpp prints:

```bash
llama-cli -m qwen2.5-0.5b-instruct-q2_k.gguf -f your-prompt.txt
llama-cli -m qwen2.5-0.5b-instruct-q4_k_m.gguf -f your-prompt.txt
llama-cli -m qwen2.5-0.5b-instruct-q8_0.gguf -f your-prompt.txt
```

Score each output yourself against a simple rubric, e.g., how many of the five key facts survived. Plot accuracy against tokens per second, which gives you a three-point frontier. Mark the point you would ship for a chat feature and the point you would ship for a legal summary, with one line of rationale each. The rationale must name a user consequence, not a score.

## Check yourself

- Who names the quality bar, and who finds the configuration? The PM names the bar per feature, because it depends on what an error costs the user. The engineer finds the fastest configuration that clears it.
- Your two chosen operating points came out identical. What went wrong? Either the two features truly have the same error cost, which is rare, or you scored against a generic rubric instead of each feature's user consequence. Recheck the rationale lines.
- A teammate says "we should just always run Q8 to be safe." What is the counterargument? Safety is per feature. For the chat feature, Q8's extra latency is a cost users feel on every message, and it buys quality below the bar the feature needs.
- Does each of your two rationale lines name a user consequence rather than a benchmark number? If one cites only a score, rewrite it.

## Next steps

- Read the [quantization guide](/docs/technical-guides/quantization) for what each level actually changes in the model.
- Read the [intelligence density concept page](/docs/concepts/intelligence-density) for how model size relates to capability per byte.
- Before you ship a lower precision, run the acceptance test in [How do I verify a quantized model hasn't lost quality?](/blog/verify-quantized-model-quality).

When you can do this, you can construct an accuracy and speed frontier for one task and select per-feature operating points with documented rationale.
