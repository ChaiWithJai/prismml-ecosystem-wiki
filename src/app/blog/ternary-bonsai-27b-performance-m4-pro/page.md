---
title: 'Ternary Bonsai 27B performance on an M4 Pro Mac'
description: 'Published M4 Pro speed, what the numbers measure, and a reproducible local MLX profile for Ternary Bonsai 27B.'
audience: local-ai-builder
pillar: bonsai-27b
status: published
last_reviewed: 2026-07-15
---

PrismML reports 18.0 tokens per second for 128 token generation and 125 tokens per second for 512 token prompt processing on an M4 Pro using llama.cpp Metal. Our controlled LM Studio 0.4.19 MLX trace used three runs. It measured a 21.55 tokens per second median decode rate and 14.506 second median time to first token for a 1,466-token prompt. {% .lead %}

## What the vendor number measures

Token generation and prompt processing are different phases. Generation reads the model weights for each new token and is often limited by memory bandwidth. Prompt processing handles many input tokens in parallel and depends more on compute.

PrismML's table uses batch size one, no vision tower, no draft model, and standardized generation of 128 tokens after prompt processing of 512 tokens.

## How we profile it locally

The Inference The Hard Way profile records the model artifact size, server process memory, time to first token, output token rate after the first token, and tool call shape. It saves the raw output with timestamps so each published number has evidence.

The completed trace used LM Studio 0.4.19+2 with its MLX runtime 1.10.0 on an M4 Pro MacBook Pro with 24 GB of unified memory. A controlled reload took 9.03 seconds, LM Studio reported a 7.94 GiB loaded footprint, and a structured OpenAI-style tool call passed.

Earlier reruns ranged from 16.30 to 22.58 median decode tokens per second as prompt cache, context, and memory state changed. The 21.55 result followed an explicit 4K reload. Each run began with different text so LM Studio could not reuse the prompt cache.

A July 15 repeat of the same three prompt profile measured 22.67 median decode tokens per second and 13.383 seconds to first token. We keep both controlled runs because the difference shows normal local runtime variation.

An LM Studio MLX result is not a direct reproduction of a llama.cpp Metal benchmark. The prompts and runtimes differ, so the local result is not a controlled speedup claim.

## Questions people ask

### Is 18 tokens per second the MLX speed?

No. The whitepaper identifies that M4 Pro row as llama.cpp with Metal. MLX needs its own measurement.

### Why can prompt processing be much faster than generation?

Prompt processing reuses each weight read across many input tokens. Generation produces one token at a time and reads the weights again for each step.

## Sources

- [PrismML Bonsai 27B whitepaper](https://github.com/PrismML-Eng/Bonsai-demo/blob/main/bonsai-27b-whitepaper.pdf)
- [PrismML MLX guide](https://docs.prismml.com/run/mlx)
- [PrismML Bonsai 27B documentation](https://docs.prismml.com/models/bonsai-27b)

## Related Bonsai 27B lessons

- [How to run Ternary Bonsai 27B with MLX](/blog/run-ternary-bonsai-27b-mlx)
- [How the KV cache affects Ternary Bonsai 27B memory](/blog/ternary-bonsai-27b-kv-cache)
- [Ternary Bonsai 27B limitations and verification checklist](/blog/ternary-bonsai-27b-limitations)

The benchmark numbers on this page describe one checkpoint, runtime, machine, and test shape. Reproduce the test on the hardware and workload you plan to use before making a product decision.
