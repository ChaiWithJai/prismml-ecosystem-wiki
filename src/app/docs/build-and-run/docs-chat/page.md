---
title: Ask The Docs Chat Agent
status: verified
audience: DevRel
owner: Runtime validator
source_tier: primary_links
benchmark_status: partial
last_reviewed: 2026-07-06
---

The docs chat agent is 1-bit Bonsai 1.7B answering questions about this documentation, running entirely in your browser over WebGPU. On this page you learn how to use it, what quality bar it is held to, and where it will fail you. {% .lead %}

Open it at [Ask the docs](/chat). The first use downloads the 290 MB 1-bit model once from [onnx-community/Bonsai-1.7B-ONNX](https://huggingface.co/onnx-community/Bonsai-1.7B-ONNX) (Apache 2.0); after that it loads from cache and works offline. Nothing you type leaves your device, because there is no server to send it to.

## Know how it answers

The agent does not browse. Before each answer it searches [/llms-full.txt](https://yourwildcard.ai/llms-full.txt), the same machine-readable bundle coding agents use, picks the two most relevant pages, extracts the paragraphs that match your question, and instructs the model to answer only from those excerpts and to say "The docs do not cover that yet" otherwise. Every answer lists its source pages as links.

## Watch the inference trace

While the model works, the chat shows each stage of the inference chain as it happens: retrieve, assemble, prefill, and decode, each labeled with the design decision behind it and the number your own machine just measured, e.g. prompt tokens, time to first token, and tokens per second. After the answer, "How this answer was made" reopens the trace, ending with the whitepaper's intelligence density benchmark (2.832 per GB for 1-bit Bonsai 1.7B, the highest in its comparison).

Most chat products hide this surface. We label it instead, because the moment you are watching a model think is the moment you are most curious about why a 290 MB model can think at all. The stages map one-to-one to the [technical guides](/docs/technical-guides/kv-cache), so the trace doubles as a table of contents for the deep track.

## Hold it to a support bar

Support products in this category, e.g. Fin by Intercom, publish resolution rates and hold their bots to two rules: never invent facts, and hand off honestly when unsure. We apply the same two rules, in this order of importance:

1. **No invented numbers.** An answer that fabricates a file size or benchmark score is worse than no answer.
2. **Grounded resolution.** The answer resolves the question using only what the docs say, with sources linked.

The current gold-question results, run through the same prompt template on Bonsai 8B locally (llama.cpp, M4 Pro, greedy, seed fixed):

| Question | Result |
| --- | --- |
| How big is the Bonsai 8B GGUF file? | Grounded: found 1.15 GB, flagged its verification status |
| What license are the Bonsai models under? | Grounded: Apache 2.0, cited the model card evidence |
| Energy per token on M4 Pro with MLX? | Grounded after a prompt fix: 0.074 mWh/token (the first prompt ordering missed it and abstained) |
| Does compressing weights shrink the KV cache? | Grounded: correct no, with the right mechanism |

Across all runs the model never invented a number; its failure mode was abstaining when the answer was present, which is the failure mode you want. The in-browser model is the smaller 1.7B, so expect more abstaining than the 8B shows here. The eval prompts and method live in [the design story](/docs/learning-paths/designing-the-docs-chat).

## Expect these limits

- A 1.7B model misreads dense tables more often than an 8B. Check the linked sources before quoting a number onward.
- Retrieval is keyword-based over page text. Questions using words the docs do not use can miss the right page.
- The first load needs a WebGPU browser (recent Chrome, Edge, or Safari) and a 290 MB download.
- It answers about these docs only. It is not a general assistant.

## Next steps

- [Try it](/chat) and compare the tokens per second your GPU reports against the [whitepaper's platform table](/docs/prismml/whitepaper-benchmarks).
- [Read how it was designed](/docs/learning-paths/designing-the-docs-chat) with the two Hard Way courses.

See something wrong? [Fix it](/docs/contribute/contributor-guide).
