---
title: 'Ternary Bonsai 27B field guide'
description: 'Run PrismML Ternary Bonsai 27B locally, understand its ternary package, reproduce measured M4 Pro results, and follow the primary sources.'
status: published
last_reviewed: 2026-07-15
---

Ternary Bonsai 27B is the main model covered by these docs. This guide connects the exact public checkpoint, the whitepaper, working local commands, measured M4 Pro traces, and 26 short lessons about what we learned. {% .lead %}

## Start with the exact artifact

The model is derived from Qwen3.6 27B. PrismML represents the language weights with the ternary values minus one, zero, and plus one, plus group scales. The ideal language-weight representation is about 5.9 GB. The current public MLX package is 8.49 GB because packaging, scales, biases, and the vision tower add bytes.

- [Bonsai 27B Hugging Face collection](https://huggingface.co/collections/prism-ml/bonsai-27b)
- [Ternary Bonsai 27B MLX 2-bit checkpoint](https://huggingface.co/prism-ml/Ternary-Bonsai-27B-mlx-2bit)
- [Unpacked checkpoint](https://huggingface.co/prism-ml/Ternary-Bonsai-27B-unpacked)
- [Bonsai 27B whitepaper](https://github.com/PrismML-Eng/Bonsai-demo/blob/main/bonsai-27b-whitepaper.pdf)
- [PrismML announcement](https://prismml.com/news/bonsai-27b)

Our traced file came from revision `70f75f3ad081ab840a42f3304c02c27e7f89bfb7`. Its `model.safetensors` file was 8,490,785,104 bytes with SHA-256 `8acd4597893ea7004e2d7336c3cf6e3157b8896592bbcf066db004021e45846b`.

## Run it on an Apple silicon Mac

Install MLX LM and start its OpenAI-compatible server:

```bash
uv tool install mlx-lm

mlx_lm.server \
  --model prism-ml/Ternary-Bonsai-27B-mlx-2bit \
  --host 127.0.0.1 \
  --port 8080
```

LM Studio 0.4.19 also loaded the checkpoint on our test Mac. Its local API reported the model as `ternary-bonsai-27b-mlx`. A 24 GB machine is enough for moderate text work with one loaded runtime and a controlled 4K context. Long context, vision input, other large applications, or a second model server reduce the margin.

## Read the measured local result

The controlled July 14 run used LM Studio, MLX, an M4 Pro Mac with 24 GB unified memory, and a 4,096 token context. LM Studio reported a 9.03 second load and 7.94 GiB loaded runtime size.

| Measurement                | Controlled run |   Repeat run |
| -------------------------- | -------------: | -----------: |
| Median time to first token |       14.506 s |     13.383 s |
| Median decode rate         |    21.55 tok/s |  22.67 tok/s |
| Median prompt processing   |   101.06 tok/s | 109.54 tok/s |
| Prompt tokens per run      |          1,466 |        1,466 |
| Output tokens per run      |            127 |          127 |

Both runs completed a structured `get_weather` tool call with `{"city":"Lisbon"}` and the `tool_calls` finish reason. This checks one response shape. It does not prove that long agent loops, recovery, or tool choice are reliable.

## Budget reasoning tokens deliberately

The same local server behaved differently at two reasoning budgets:

- At 16 completion tokens, it spent 15 tokens reasoning and returned no final answer.
- At 256 completion tokens, it spent 191 tokens reasoning and returned `42`.

That is an application concern, not a trivia detail. A model can consume a small output budget before it reaches the user-facing answer. Test the reasoning and answer budgets together.

## Keep comparisons honest

PrismML reports 18.0 generation tokens per second on an M4 Pro using llama.cpp Metal. Our local runs used LM Studio and MLX, with different prompts and harness details. They show that interactive local use is practical. They do not prove that MLX is faster than PrismML's llama.cpp path.

For reproducible comparisons, save the checkpoint revision and hash, runtime version, context limit, prompt and output token counts, cache state, model reload state, and every result, including slow runs.

## Read the lessons

The [Bonsai 27B section of the blog](/blog) contains 26 focused answers. Start with these:

- [What is Ternary Bonsai 27B?](/blog/what-is-ternary-bonsai-27b)
- [How to run Ternary Bonsai 27B with MLX](/blog/run-ternary-bonsai-27b-mlx)
- [What we learned running it on a 24 GB Mac](/blog/ternary-bonsai-27b-24gb-memory)
- [How we benchmarked the model](/blog/ternary-bonsai-27b-benchmark-method)
- [Why reasoning-token budgets matter](/blog/ternary-bonsai-27b-reasoning-token-budget)
- [What the ecosystem is saying](/blog/bonsai-27b-ecosystem-reactions)

## Follow the evidence

The full trace and profiling notes live in [Inference The Hard Way](https://github.com/ChaiWithJai/inference-the-hard-way/tree/main/profiles/ternary-bonsai-27b). The [ecosystem roundup](/blog/bonsai-27b-ecosystem-reactions) links directly to The Information, PrismML's launch thread, Khosla team amplification, Together AI, NVIDIA RTX Spark, Ion Stoica, and other public reactions. It labels company claims, investor support, reporting, and local measurements separately.
