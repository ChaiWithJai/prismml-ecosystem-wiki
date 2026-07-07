---
title: "What's the difference between fine-tuning and distillation?"
description: "Fine-tuning adapts a model to a domain with new training data. Distillation trains a small student on a large teacher's probability distributions."
audience: researcher
pillar: foundational-concept
book: inference-engineering
chapter_ref: "Ch. 1, sec. 1.3.3 (pp. 33-35)"
status: draft
last_reviewed: 2026-07-07
---

Fine-tuning adapts a model to a domain with new training data. Distillation trains a small student model on a large teacher model's probability distributions, so the student keeps the teacher's general behavior at a lower cost. Distillation is rarer in practice. When a distill lands on a popular architecture, as DeepSeek-R1 did with Llama and Qwen, it inherits that architecture's performance tooling. {% .lead %}

## Separate the two by their training signal

The clean way to tell these apart is to ask what the model learns from, not what it is for.

In fine-tuning, you take a pretrained model and continue training it on new data from your domain. Philip Kiely's *Inference Engineering* (Ch. 1, sec. 1.3.2) defines it as taking a foundation model and adapting it to a specific use case by introducing new data. The training signal is a set of input and output pairs that you supply. The model's architecture and size stay the same, and only the weight values change.

In distillation, you take a large model, called the teacher, and use it to train a smaller model, called the student. The signal is different. Kiely writes in section 1.3.3 that distillation "shows the student model the teacher model's actual probability distributions", not just its final answers. A probability distribution here is the full set of scores the teacher assigns to every possible next token, not only the token it picked. The student learns to match those scores, so it absorbs how the teacher weighs its options, not just what the teacher said.

This also separates distillation from fine-tuning on synthetic data. If you generate text with a large model and fine-tune a small model on that text, the small model only sees final answers. That is fine-tuning. Distillation gives the student the richer signal underneath each answer.

The goals differ in the same way. Fine-tuning narrows a model to do better in one domain. Distillation copies the teacher's general behavior into a smaller model, and Kiely notes it copies the flaws along with the strengths.

## See why distillation is rarer

Kiely is blunt about usage. "Distillation sees substantially less real-world use than fine-tuning" (sec. 1.3.3). One reason he gives is how model families are made. When a lab releases a family of sizes, the small models are usually trained independently rather than distilled from the large one, because the lab does not want the large model's biases to cap the small ones.

Distillation earns its place when a lab only trains one very large model and wants to make it accessible. That is the DeepSeek-R1 story. In January 2025, DeepSeek released R1 at 671B parameters, and alongside it they released distilled versions built on the most popular open architectures of the time, Llama 3 and Qwen 2.5. Kiely reports that the distills showed similar reasoning behavior to the main model, with worse benchmark scores.

The choice of target architectures did as much for the distills as the training did. Kiely points out in section 1.3 that inference engines vary in how well they support each architecture, so a model on a popular architecture gets the existing performance work for free. A distill onto Llama runs everywhere Llama runs, with every kernel and quantization recipe that already exists for Llama. A distill onto a novel architecture would have started with none of that.

## Work the arithmetic on the R1 distills

Here is what the size gap means in memory, using 2 bytes per parameter for FP16 weights. See the [quantization guide](/docs/technical-guides/quantization) for where these byte counts come from.

- DeepSeek-R1 at 671B parameters needs about 671 x 2 = 1,342 GB for weights alone. No single GPU holds that. At 80 GB per GPU, weights alone need at least 17 GPUs, so serving it means a multi-GPU node before any KV cache.
- The Llama 8B distill needs about 8 x 2 = 16 GB at FP16, which fits one 24 GB card. A 4-bit quantization brings it near 4.5 GB, which fits a laptop.
- That is a parameter reduction of 671 / 8, which is about 84x.

The distill does not keep all of the teacher's intelligence, and the book says so. What it keeps is the teacher's behavior, e.g., R1's habit of writing out a long reasoning trace before answering, at a memory cost 84x smaller.

## Pick the right tool for your goal

Match the method to what you want the small model to be.

- You want a small model that is strong at one narrow task, and you have labeled data for it. Fine-tune. Kiely's example is text to SQL, where a fine-tuned model of a few billion parameters can match general coding models hundreds of times its size on that one task, because the domain is cleanly scoped.
- You want a small model that behaves like a specific large model across general use, and you have access to that teacher. Distill.
- You want the result to run fast on common tools. Whichever method you pick, put it on a popular architecture, because the inference support follows the architecture.

## Try it

Compare a distill against a plain base model of the same size and watch the teacher's fingerprint appear. You need llama.cpp, which can pull models straight from Hugging Face. The two Q4 files total about 9 GB of downloads. Each model runs on a Mac with 16 GB of memory or a GPU with 8 GB of VRAM, and no large GPU is needed. The whole loop takes under 30 minutes on a normal connection.

Run the distill first.

```bash
llama-cli -hf unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:Q4_K_M \
  -p "A train leaves at 3:40 pm and the trip takes 2 hours 35 minutes. When does it arrive?"
```

Then run a base model of the same scale on the same prompt. Qwen2.5-7B-Instruct is the closest match, since the distill was built on it. [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf) also works as a same-scale comparison point.

```bash
llama-cli -hf Qwen/Qwen2.5-7B-Instruct-GGUF:Q4_K_M \
  -p "A train leaves at 3:40 pm and the trip takes 2 hours 35 minutes. When does it arrive?"
```

Repeat with two more problems, e.g., a short logic puzzle and a request to answer in exactly three sentences. For each pair of outputs, note the shape of the response before you judge its correctness. The distill should open with a long reasoning trace inside think tags before it commits to an answer, because that is R1's behavior. The base model answers directly. You are done when you can point at a concrete output habit in the distill, such as the reasoning trace or its closing summary format, that came from the teacher and not from the 7B base.

## Check yourself

1. Both methods update a model's weights with more training. What is the one difference in the training signal? Expected answer: fine-tuning trains on input and output pairs, while distillation trains the student on the teacher's probability distributions over tokens, not just its final answers.
2. You generate 100K answers with a frontier model and train a 7B model on them. Is that distillation? Expected answer: no, that is fine-tuning on synthetic data, because the small model only sees final answers and never the teacher's distributions.
3. You need a small model for one scoped task, e.g., text to SQL, and you have labeled examples. Which method? Expected answer: fine-tuning, because the goal is domain quality, not copying a specific model's general behavior.
4. Why did DeepSeek distill R1 onto Llama and Qwen instead of a shrunken R1 architecture? Expected answer: inference engines already support those popular architectures well, so the distills could use existing performance tooling from day one.

## Next steps

- [Quantization](/docs/technical-guides/quantization) covers the other main way to shrink a model's memory cost, and it composes with both methods here.
- [llama.cpp](/docs/ecosystem/llama-cpp) explains the runtime used in the exercise and how it loads models from Hugging Face.
- [What is the biggest inference optimization?](/blog/model-selection-biggest-inference-optimization) argues that picking a smaller model, by whatever method, beats any runtime trick.

When you can do this, you can distinguish fine-tuning from distillation by their training signals and predict which one suits a given adaptation goal.
