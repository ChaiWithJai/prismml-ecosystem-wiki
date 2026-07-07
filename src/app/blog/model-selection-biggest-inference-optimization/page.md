---
title: "Why is model selection the biggest inference optimization?"
description: "Smaller models are always faster and cheaper, so the smallest model that passes your evals beats any runtime trick. Eval design comes before serving."
audience: researcher
pillar: foundational-concept
book: inference-engineering
chapter_ref: "Ch. 1, secs. 1.3-1.3.2 (pp. 31-33)"
status: published
last_reviewed: 2026-07-07
---

All else equal, smaller models are always faster and cheaper, so choosing the smallest model that passes your evals beats any runtime trick. A model swap can outdo months of kernel work, which makes eval design upstream of every serving decision and the highest-leverage skill in the stack. {% .lead %}

## Understand why size wins before any runtime trick

Every inference optimization works within limits set by the model you picked. Kiely's Inference Engineering (Ch. 1.3) argues that when hardware, runtime, and optimizations are held equal, a model with fewer parameters is always faster and cheaper to run than a model with more parameters. This is not an empirical finding that could go the other way on your workload. It follows from arithmetic.

A decoder generates one token at a time, and each token requires reading every weight from memory. An 8B model quantized to 4 bits is about 5 GB of weights. A 70B model at the same precision is about 40 GB. On a machine with 100 GB/s of memory bandwidth, the ceiling is roughly 20 tokens per second for the 8B model and roughly 2.5 tokens per second for the 70B model. These are upper bounds, not benchmarks, but the ratio holds because it comes from the sizes themselves.

Now compare that ratio to what runtime work buys. A better attention kernel or a smarter batching scheduler typically improves throughput by tens of percent. The model swap above is an 8x change. That is why Kiely puts model choice ahead of the runtime engine and the speculation algorithm. Months of kernel engineering cannot recover the gap between a 70B model and an 8B model that both do the job.

## Make evals the gate, not the afterthought

The catch in "the smallest model that works" is the word "works". You cannot know which models work without measuring them on your task. Kiely (Ch. 1.3.1) defines evals as the practice of systematically measuring model intelligence, and separates them from public benchmarks like MMLU, which measure common tasks rather than your product.

Public benchmarks are useful for shortlisting candidates, but Kiely notes they have become saturated and even gamed, and cites Goodhart's Law as the reason. On measuring your own task, he writes that "there is no substitute for directly measuring how a model performs for your application".

This ordering is the whole point of this post. If evals decide which model passes, and the model decides your latency and cost floor, then eval design sits upstream of every serving decision. A researcher who can build a sharp 20-prompt eval set has more control over production cost than one who can shave 10 percent off a kernel.

{% callout type="note" %}
Kiely (Ch. 1.3.2) gives text-to-SQL as the extreme case. General coding models with hundreds of billions of parameters write good SQL, but the task is constrained enough that a fine-tuned model of a few billion parameters can match them on that one task. He is explicit that most domains will not support a reduction that large.
{% /callout %}

## Work the numbers on a model swap

Here is the arithmetic for a made-up but realistic workload, with every input stated so you can rerun it with your own numbers.

Suppose your service handles 1 million requests per day, each producing 400 output tokens. That is 400 million output tokens per day. If a 70B model and an 8B model both pass your eval, the 8B model reads one eighth the weights per token, so on the same hardware it needs roughly one eighth the GPU time for decode. A fleet that cost you 8 GPUs now costs you 1, or the same 8 GPUs now serve 8 times the traffic at lower latency per request.

The same logic applies if you buy tokens instead of GPUs. Per-token prices scale with model size because the provider faces the same arithmetic. The exact ratio varies by provider, so treat the 8x above as an estimate for this example rather than a market fact.

The decision procedure is short.

1. Write the eval set and the pass threshold before you test anything.
2. Score the candidate models against it.
3. Pick the smallest model that passes.
4. Only then spend time on quantization, batching, and kernels.

Kiely adds one constraint at step 3. Stick with popular model architectures, because inference engines vary in how well they support each architecture, and an exotic model can lock you out of the optimizations you wanted the small model for.

## Try it

Build a 10-prompt eval set for one task you care about, then score a small model and a larger one in llama.cpp. Budget 30 minutes.

First, write 10 prompts for your task into a file, one prompt per line, and write down your pass threshold before running anything. For example, "passes" might mean 8 of 10 outputs are correct by your own judgment.

```bash
# Install llama.cpp (macOS)
brew install llama.cpp

# Download one small and one larger instruct model in GGUF format,
# e.g. a 3B and a 14B from Hugging Face, then run each prompt:
while IFS= read -r p; do
  llama-cli -m small-3b-q4_k_m.gguf -p "$p" -n 256 --temp 0 -no-cnv
done < prompts.txt

while IFS= read -r p; do
  llama-cli -m larger-14b-q4_k_m.gguf -p "$p" -n 256 --temp 0 -no-cnv
done < prompts.txt

# Measure speed on your hardware:
llama-bench -m small-3b-q4_k_m.gguf -m larger-14b-q4_k_m.gguf
```

Score both models against your threshold and record the tokens per second from llama-bench. Then write one paragraph deciding whether the smaller model passes, citing your scores and your threshold.

## Check yourself

1. Did your pass threshold exist in writing before you ran either model? If you wrote it after seeing outputs, the eval is measuring your reaction to the models rather than the task.
2. Does your written decision cite the threshold and the scores, e.g., "the 3B model scored 9 of 10 against a threshold of 8, so it passes"? A decision that says the small model "felt fine" fails this check.
3. Can you state the speed and cost difference you observed, e.g., the tokens per second from llama-bench for each model?
4. If the small model failed, can you say which prompts it failed on? Those prompts tell you whether fine-tuning could close the gap, per Kiely's text-to-SQL example.

## Next steps

- [Benchmarking guide](/docs/technical-guides/benchmarking) covers how to measure latency and throughput properly once you have picked a model.
- [llama.cpp in the ecosystem](/docs/ecosystem/llama-cpp) explains where llama.cpp fits and how to get models for it.

When you can do this, you can construct a task-specific eval set and use it to justify selecting a smaller model, citing accuracy, latency, and cost.
