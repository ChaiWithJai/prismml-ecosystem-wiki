---
title: "Can 1-bit models do tool calling?"
description: "Yes, but not unconstrained. An independent benchmark found Bonsai 8B 1-bit scored 0% raw and 92% with grammar-constrained decoding. The capability is in the weights; the reliability comes from where you put the constraint."
audience: inference-engineer
pillar: foundational-concept
book: transcript-theme
chapter_ref: "Community benchmark (r/LocalLLaMA, 2026-07) + our docs chat design notes"
status: published
last_reviewed: 2026-07-07
---

Yes, but not unconstrained. An independent community benchmark ran Bonsai 8B 1-bit on 30 CPU tool-calling cases: 0% valid tool calls raw, 92% with grammar-constrained decoding, the best score in the test from a 1.16 GB file half the size of its nearest rival. The semantic capability is in the weights. The reliability comes from where you put the constraint. {% .lead %}

{% callout type="note" title="What this evidence is" %}
The numbers come from a single Reddit benchmark: 30 deterministic cases, temperature 0, one run, the author's own harness, posted with the author's own caveat that it is "a signal, not a leaderboard." By this site's [source policy](/docs/sources/source-policy) that is community evidence, not a published benchmark. We cite it because it is, as far as we can tell, the first independent tool-calling eval of a 1-bit Bonsai model, and because its shape matches what we found building the [docs chat](/docs/build-and-run/docs-chat).
{% /callout %}

## Read what the benchmark actually found

The test compared six small models on tool-call generation with llama.cpp on CPU, each run twice: raw, and with a GBNF grammar that constrains decoding to valid tool-call JSON.

| Model (quant, size) | Raw | With grammar |
| --- | --- | --- |
| Bonsai 8B Q1_0 (1.16 GB) | 0% | 92% |
| Granite 4.1 3B Q4_K_M (2.0 GB) | 72% | 88% |
| Qwen2.5-Coder 7B | 68% | 84% |
| Qwen2.5-Coder 3B | 0% | 84% |
| Qwen3 8B | 0% | 84% |
| BitNet b1.58 2B | 0% | 44% |

Two things stand out. First, raw format discipline does not track capability: three capable models scored 0% raw, and the grammar rescued all of them except BitNet. Second, once format is externally guaranteed, the 1-bit Bonsai outscored everything, including models with twice its footprint. The grammar did not add intelligence. It removed a failure mode so the intelligence could show.

## Understand why aggressive quantization breaks format first

A tool call fails if one token is wrong: a missing brace, a stray word before the JSON, a hallucinated argument name. Generation samples one token at a time, so producing 200 structurally perfect tokens in a row is a chain of independent chances to slip. Quantization noise raises the per-token slip rate slightly, and the chain multiplies it. Semantic quality degrades gracefully with quantization; format validity degrades catastrophically, because format is the one task where a single token ruins everything.

Grammar-constrained decoding fixes this at the sampler. At every step, the runtime masks out every token that would violate a formal grammar, so the model can only choose among continuations that keep the output valid. The model still picks which tool and which arguments; the grammar guarantees the envelope. llama.cpp ships this as [GBNF grammars](https://github.com/ggml-org/llama.cpp/blob/master/grammars/README.md); server APIs expose the same idea as structured outputs or JSON mode.

{% concept-diagram name="constraint-ladder" /%}

## Compare it with how our docs chat is constrained

Our [Ask the docs chat](/chat) runs 1-bit Bonsai 1.7B in the browser over WebGPU, and it uses no grammar at all — not by preference, but because grammar-constrained decoding is not available in transformers.js today. That forced us to put the constraint in the harness instead, and the design generalizes:

- **Constrain the input, not just the output.** Retrieval picks two pages and extracts only the paragraphs that match the question, so the model reasons over a few thousand characters of curated context instead of an open field.
- **Shape the prompt for the failure mode.** Our eval showed the model missed answers when the question came after the excerpts. Question-first ordering fixed it. That is a constraint on attention, applied with zero tokens of overhead.
- **Demand abstention.** The system prompt makes "The docs do not cover that yet" the required output when context is missing. In our gold-question runs the model never invented a number; its failure mode was abstaining too eagerly, which is the failure mode you want.
- **Verify outside the model.** Every answer links its source pages, so the reader can check the claim in one click. The UI is part of the constraint system.

The tasks differ, and that is the point. Tool calling needs a formally valid artifact, so the constraint belongs at the sampler. Grounded question answering needs faithful prose, so the constraint belongs in the context, the prompt, and the verification loop. Same 1-bit model family, different constraint placement, both usable.

## Pick your constraint by your task

| Your task | Where the constraint goes | Tooling |
| --- | --- | --- |
| Tool calling, agents, structured extraction | Sampler: grammar or structured outputs | llama.cpp GBNF, server JSON mode, outlines-style libraries |
| Grounded Q&A over documents | Harness: retrieval, prompt order, abstention rule, source links | Any runtime; see [our design notes](/docs/learning-paths/designing-the-docs-chat) |
| Browser or WebGPU deployment | Harness only, until grammar support lands in web runtimes | transformers.js; watch for structured-output support upstream |
| Anything user-facing | Both, plus an eval with gold cases before you ship | 20 to 30 deterministic cases at temperature 0 is enough to catch a 0%-raw surprise |

The commenter on the benchmark asked whether this scales to bigger models and to mixed reasoning-plus-tool-use workloads. The honest answer is that nobody has published that yet for 1-bit models; the [contributor guide](/docs/contribute/contributor-guide) explains how to submit a run if you measure it first.

## Try it

Reproduce the shape of the finding on your machine in about 20 minutes with any GGUF model:

```bash
# 1. A tool-call prompt, raw
llama-cli -m Bonsai-8B-Q1_0.gguf --single-turn -n 200 \
  -p 'Call get_weather with city="Tokyo". Reply with JSON only: {"tool": ..., "args": {...}}'

# 2. The same prompt, grammar-constrained to JSON
llama-cli -m Bonsai-8B-Q1_0.gguf --single-turn -n 200 \
  --grammar-file grammars/json.gbnf \
  -p 'Call get_weather with city="Tokyo". Reply with JSON only: {"tool": ..., "args": {...}}'
```

Run each five times. Count how many raw outputs parse as JSON versus grammar-constrained ones. The gap you see is the benchmark's whole story in miniature.

## Check yourself

1. Why does quantization hurt format validity more than answer quality? (Expected: format fails on any single bad token, so per-token error compounds across the sequence; semantic quality averages out.)
2. Does a GBNF grammar make a model smarter? (Expected: no. It masks invalid tokens so existing capability is not disqualified by formatting slips.)
3. Why does our browser chat not use a grammar? (Expected: transformers.js has no grammar-constrained decoding yet, so the constraint moved to retrieval, prompt order, abstention, and source links.)

## Next steps

- [How the docs chat was designed](/docs/learning-paths/designing-the-docs-chat), the harness-side constraint story in full.
- [Verify quantized model quality](/blog/verify-quantized-model-quality), the eval discipline that catches a 0%-raw surprise before your users do.
- [What do TTFT and tokens per second measure?](/blog/what-do-ttft-and-tps-measure) if you are benchmarking the same models for speed.

When you can do this, you can decide where a constraint belongs for any small-model deployment and defend the choice with a 30-case eval instead of a vibe.
