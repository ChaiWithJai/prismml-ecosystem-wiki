---
title: "When should I use a draft model vs EAGLE vs n-gram speculation?"
description: "Draft-target is easiest but has the highest overhead, EAGLE is the general-purpose go-to, and n-gram lookup wins on code tasks where output mirrors input."
audience: inference-engineer
pillar: ecosystem-player
book: inference-engineering
chapter_ref: "Ch. 5, secs. 5.2.1-5.2.4 (pp. 131-136)"
status: published
last_reviewed: 2026-07-07
---

Draft-target speculation is the easiest to set up but has the highest overhead. EAGLE, a purpose-built speculator that reads the target model's hidden states, is the general-purpose choice. N-gram lookup beats both on code-like tasks where the output mirrors the input. No speculator is best everywhere, so match the algorithm to the workload. {% .lead %}

## Start with draft-target when you need speculation today

Draft-target is the original method. A small draft model guesses the next few tokens, and the target model validates them in one forward pass. Kiely's Inference Engineering (Ch. 5, sec. 5.2.1, pp. 131 to 132) says it is a good choice when you want something quick to set up without any training or fine-tuning. You pick a model from the same family as the target, at least ten times smaller by parameter count so the tokenizers and behaviors match, and you are running.

The cost is overhead. Kiely calls draft-target the method with the most overhead of any speculative decoding approach. The engine must hold the draft model's weights, activations, and KV cache in memory. It must spend compute on draft model prefill. It must also coordinate two models so they do not compete for resources, though engines like TensorRT-LLM handle that orchestration for you.

## Reach for EAGLE as the general-purpose default

An off-the-shelf draft model such as Qwen 0.5B was built to be a good standalone model on cheap hardware, not to speculate for a large target on a server GPU. Kiely notes that these draft models run inefficiently and get a low acceptance rate (sec. 5.2.3, p. 133).

EAGLE fixes this by training a speculator from scratch for the job. During inference the target model accumulates context in its hidden states between layers, and a normal draft model never sees any of it. EAGLE takes three of those hidden states as input, one from an early layer, one from a middle layer, and one from a late layer, and outputs draft tokens. It is often under one billion parameters, drafts sequences of up to eight tokens, and gets a very high acceptance rate. It also attaches to the same module as the target model, so one forward pass runs both and there are no round trips to the CPU like draft-target needs.

Kiely calls EAGLE the go-to speculation algorithm for general use among engineers who have the means to train EAGLE heads, and inference engines support it well. Its predecessor Medusa (sec. 5.2.2) grafted two to four extra decoder heads onto the target model itself, but its draft length and acceptance rate were limited, and Kiely says it is not widely used in production today.

## Use n-gram lookup when the output copies the input

N-gram speculation has no draft model at all. During prefill, the engine builds a dictionary of token sequences it saw in the input. During decode, it looks up the last generated token in the dictionary, and any stored suffix becomes the draft. The target validates that draft as normal. Drafting is a dictionary lookup, so it is close to free, and the sequences can exceed ten tokens where EAGLE tops out around eight.

The catch is that the dictionary only contains sequences from the input. Acceptance is high only when the output repeats the input. Kiely writes that n-gram speculation is mostly used for code completion and code revision, and that "within this specific domain, it easily outperforms EAGLE" (sec. 5.2.4, p. 135). A close relative, Lookahead Decoding, builds the dictionary during inference instead, which handles less repetitive context but spends extra compute to generate the n-grams.

## Work the copy-ratio arithmetic

Here is a worked example. Every number in it is illustrative, not a benchmark. Suppose a code revision task produces 400 output tokens, and 300 of them sit inside spans copied straight from the input file.

With n-gram lookup and a draft length of 10, assume near-total acceptance inside copied spans and near-zero acceptance elsewhere. Each pass inside a copied span yields 10 accepted drafts plus 1 generated token, so the 300 copied tokens take about 300 / 11, or 28 passes. The 100 novel tokens get no useful drafts, so they take about 100 passes. That is roughly 128 forward passes instead of 400, about a 3.1x cut, and the drafting itself cost almost nothing.

Now run EAGLE on the same task with a draft length of 4 and a uniform 0.7 acceptance per draft token. A draft at position k only survives if every earlier draft did, so the expected accepted count is 0.7 + 0.49 + 0.343 + 0.24, about 1.77 tokens, and each pass yields about 2.77 tokens. The 400 tokens take about 144 passes, plus the cost of running the speculator itself. N-gram wins here.

Flip the workload to open prose with a copy ratio near zero. The n-gram dictionary almost never fires, so n-gram speculation gives back plain decode at 400 passes. EAGLE still gives about 144. Same two algorithms, opposite winner, and the copy ratio is the whole difference.

## Try it

This takes about 20 minutes on a laptop, CPU is fine, no GPU needed. You need llama.cpp built from source, because prompt lookup decoding ships as the `llama-lookup` example binary. Any GGUF model works, e.g., [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf) or a Qwen2.5 7B quant.

Put a function of 40 or more lines in a file, then wrap it in an editing prompt:

```bash
cat > /tmp/revise.txt <<'EOF'
Revise this Python code to add type hints. Return the full revised code.

<paste your 40+ line function here>
EOF

# Baseline, no speculation
llama-cli -m bonsai-8b-q4_k_m.gguf -f /tmp/revise.txt -n 512 --temp 0 \
  2>&1 | grep -Ei "tokens per second|eval time"

# Prompt lookup (n-gram) decoding, same prompt
llama-lookup -m bonsai-8b-q4_k_m.gguf -f /tmp/revise.txt -n 512 --temp 0 \
  2>&1 | grep -Ei "drafted|accept|tokens per second|eval time"
```

Record tokens per second for both runs, and the accepted and drafted counts that `llama-lookup` logs. Then rerun both commands with a prompt that has no code to copy, e.g., "Write a short story about a lighthouse keeper," and record the numbers again. The revision prompt should show a clear speedup and the story prompt should show little or none, because the story output does not repeat the input.

## Check yourself

1. Why does draft-target have the highest overhead when the draft model is the smallest part of the setup? Expected answer: the engine must hold a second model's weights, activations, and KV cache in memory, spend compute on draft prefill, and orchestrate two models per step. EAGLE avoids most of this by running in the target's own forward pass, and n-gram has no model at all.
2. What does EAGLE receive as input that a normal draft model never sees, and why does that raise acceptance? Expected answer: hidden states from an early, a middle, and a late layer of the target. Those states describe what the target is about to generate, so the speculator predicts the target's actual next tokens instead of guessing from text alone.
3. Your workload is summarizing news articles into three fresh sentences. Which speculator do you expect to win, and why not n-gram? Expected answer: EAGLE or another learned speculator. The summary rephrases the input rather than copying spans from it, so the copy ratio is low and the n-gram dictionary rarely produces an accepted draft.
4. In the worked example, why did n-gram beat EAGLE on the code revision task despite EAGLE's better model? Expected answer: 75 percent of the output was copied spans where n-gram acceptance was near 1 with a draft length of 10, and its draft cost was near zero. EAGLE's 0.7 acceptance over length 4 yields fewer tokens per pass and it still pays to run a speculator.

## Next steps

- [Speculative decoding guide](/docs/technical-guides/speculative-decoding) for the shared draft-and-validate mechanism and engine support for each algorithm.
- [llama.cpp ecosystem page](/docs/ecosystem/llama-cpp) for building from source and where the example binaries live.
- [What determines whether speculative decoding actually speeds things up?](/blog/what-determines-speculative-decoding-speedup) for the three factors that this post's arithmetic is built on.

When you can do this, you can match speculation algorithms to workload characteristics and demonstrate the n-gram win on an editing task.
