---
title: "What are DeepSeek-R1 distilled models and should I run one locally?"
description: "Small Llama and Qwen students trained on R1's output distributions. The popular target architectures come with existing tooling, so R1-style reasoning fits a laptop."
audience: researcher
pillar: ecosystem-player
book: inference-engineering
chapter_ref: "Ch. 1, sec. 1.3.3 (pp. 33-35)"
status: published
last_reviewed: 2026-07-07
---

They are small Llama and Qwen models trained as students on R1's output distributions, and the architecture choice is the strategic part. By distilling onto popular architectures, DeepSeek gave the students the entire existing performance tooling for those architectures, from llama.cpp quantizations to day-zero vLLM support. You get the teacher's reasoning style in a model that fits on a laptop. {% .lead %}

## Know what an R1 distill actually is

In January 2025, DeepSeek released DeepSeek-R1, a reasoning model with 671B parameters. Almost no one can run a model that size, so alongside it they released distilled versions built on Llama 3 and Qwen 2.5, in sizes from 1.5B to 70B parameters.

Distillation means a large teacher model trains a smaller student model to copy its behavior. Philip Kiely's *Inference Engineering* (Ch. 1, sec. 1.3.3) explains that distillation "shows the student model the teacher model's actual probability distributions", not just its final answers. A probability distribution here is the full set of scores the teacher assigns to every possible next token. The student learns to match those scores, so it picks up how the teacher weighs its options.

So an R1 distill is not a small R1. It keeps the Llama or Qwen architecture it started from, and only its weights changed during distillation. What it learned is R1's behavior, e.g., the habit of writing a long reasoning trace inside think tags before it commits to an answer. Kiely reports that the distills showed reasoning behavior similar to the main R1 model, with worse benchmark scores. The student copies the teacher's flaws along with its strengths.

## See why DeepSeek picked Llama and Qwen

The target architectures were not an accident. Kiely writes in section 1.3 that inference engines vary in how deep their support is for each architecture, and he advises sticking with popular architectures so the performance tooling is there when you need it.

A distill that lands on the Llama architecture runs everywhere Llama runs, on day one. The GGUF conversion scripts in llama.cpp already handle it. The quantization recipes already exist. vLLM and every other serving engine already have tuned kernels for it. If DeepSeek had instead released a shrunken model on the R1 architecture itself, every one of those tools would have needed new support work before anyone could run the model well.

This is the ecosystem lesson in the release. The value of a small open model depends on the architecture it ships on as much as on its weights, because the architecture decides which tools can run it. Kiely notes that at the time of the book's publication, the R1 distills were still among the most popular distilled models on Hugging Face.

## Work the memory arithmetic before you download

Here is what the size gap means in memory, using 2 bytes per parameter for FP16 weights. The [quantization guide](/docs/technical-guides/quantization) explains where these byte counts come from.

- DeepSeek-R1 at 671B parameters needs about 671 x 2 = 1,342 GB for weights alone. At 80 GB per GPU, that is at least 17 GPUs before any KV cache.
- The Qwen 1.5B distill needs about 1.5 x 2 = 3 GB at FP16. A 4-bit quantization cuts that to roughly 1 GB, which is an estimate that includes format overhead. That fits on almost any laptop sold in the last decade.
- The parameter ratio is 671 / 1.5, which is about 447x.

The 1.5B distill is far weaker than R1, and no arithmetic changes that. What you are buying for 1 GB is the teacher's reasoning style, not its intelligence.

## Decide whether to run one locally

Run one locally if you want to study reasoning behavior, prototype against a reasoning model offline, or see distillation with your own eyes. The 1.5B and 7B sizes run on ordinary hardware and cost nothing per token.

Do not expect frontier answers. On hard problems the small distills produce long deliberation traces and still land on wrong answers, because the trace is inherited behavior and the underlying capability is that of a small model. If you need R1's actual quality, use the full model through an API. If you need a general local model at this scale rather than a reasoning specialist, a plain instruct model such as [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf) or Qwen2.5-Instruct is often the better pick.

## Try it

Compare a distill against a plain base model of the same size and watch the teacher's behavior show through. You need llama.cpp, which pulls models straight from Hugging Face. The two files total about 2 GB of downloads, and both models run on a CPU or any machine with 8 GB of memory. No GPU is needed at this size. The whole loop takes under 30 minutes.

Run the distill first.

```bash
llama-cli -hf unsloth/DeepSeek-R1-Distill-Qwen-1.5B-GGUF:Q4_K_M \
  -p "A store sells pens in packs of 4 for $3. How much do 22 pens cost, if single pens are $1 each?"
```

Then run the base model the distill was built on, at the same quantization.

```bash
llama-cli -hf Qwen/Qwen2.5-1.5B-Instruct-GGUF:Q4_K_M \
  -p "A store sells pens in packs of 4 for $3. How much do 22 pens cost, if single pens are $1 each?"
```

Repeat with two more reasoning problems, e.g., a short logic puzzle and a multi-step date calculation. For each pair of outputs, note the shape of the response before you judge correctness. The distill should open with a reasoning trace inside think tags, question its own steps, and sometimes backtrack, because those are R1's habits. The base model answers directly. Also note where the distill fails the teacher's standard, e.g., a long careful trace that still ends in the wrong total. You are done when you can point at one inherited behavior and one clear failure.

## Check yourself

1. An R1 distill has "R1" in its name. What architecture does it actually use? Expected answer: the Llama or Qwen architecture it was distilled onto. Distillation changes the weights, not the architecture.
2. What did the student models train on that plain fine-tuning on R1's answers would not provide? Expected answer: R1's probability distributions over tokens, not just its final answers.
3. Why did the distills work with llama.cpp and vLLM immediately at release? Expected answer: those tools already supported the Llama and Qwen architectures, so the distills inherited that support instead of waiting for new integration work.
4. Your 1.5B distill writes a long reasoning trace and still gets the answer wrong. What does that tell you? Expected answer: the trace is behavior copied from the teacher, and behavior does not carry the teacher's full capability. The model is still a 1.5B model.

## Next steps

- [llama.cpp](/docs/ecosystem/llama-cpp) explains the runtime used in the exercise and how it loads GGUF models from Hugging Face.
- [Quantization](/docs/technical-guides/quantization) covers the byte arithmetic behind the 4-bit download sizes above.
- [What's the difference between fine-tuning and distillation?](/blog/fine-tuning-vs-distillation) goes deeper on the training signal that separates the two methods.

When you can do this, you can compare a distilled model against its size-matched base and explain the ecosystem rationale for the target architecture.
