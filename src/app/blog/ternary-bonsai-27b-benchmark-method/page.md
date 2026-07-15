---
title: 'How we benchmarked Ternary Bonsai 27B'
description: 'The exact local test method, prompts, runtime, traces, and limits behind our M4 Pro Ternary Bonsai 27B results.'
audience: local-ai-builder
pillar: bonsai-27b
status: published
last_reviewed: 2026-07-15
---

We loaded the exact PrismML MLX checkpoint in LM Studio 0.4.19 on a 24 GB M4 Pro Mac. We used a 4,096 token context, sent three different 1,466 token prompts, recorded time to first token and decode speed, and saved the full streamed responses. We also tested a structured tool call and two output token budgets. {% .lead %}

## What the test records

- The model revision and SHA 256 hash of the weight file.
- The runtime version, context limit, load time, and reported loaded size.
- Time to first token for each prompt.
- Output tokens per second after the first token.
- The response shape for reasoning and tool calls.

## What the test does not prove

This is one machine and one runtime. It does not reproduce PrismML's llama.cpp test because the runtime and prompt shape differ.

The prompt speed figure includes the HTTP request, chat template, queue, prompt processing, and first output token. It is not a pure prompt processing benchmark.

## Questions people ask

### Why use three prompts?

A repeated identical prompt can use cached prompt state. Different prompt prefixes make that less likely.

### Where are the raw results?

The Inference The Hard Way repository stores the trace files beside the profile code.

## Sources

- [Ternary Bonsai 27B MLX model card](https://huggingface.co/prism-ml/Ternary-Bonsai-27B-mlx-2bit)
- [PrismML Bonsai 27B whitepaper](https://github.com/PrismML-Eng/Bonsai-demo/blob/main/bonsai-27b-whitepaper.pdf)
- [LM Studio model support documentation](https://lmstudio.ai/docs/app)

## Related Bonsai 27B lessons

- [Ternary Bonsai 27B performance on an M4 Pro Mac](/blog/ternary-bonsai-27b-performance-m4-pro)
- [Why Bonsai 27B speed changes between runs](/blog/ternary-bonsai-27b-runtime-variance)
- [How prompt caching changes Bonsai 27B benchmarks](/blog/ternary-bonsai-27b-prompt-cache)

The benchmark numbers on this page describe one checkpoint, runtime, machine, and test shape. Reproduce the test on the hardware and workload you plan to use before making a product decision.
