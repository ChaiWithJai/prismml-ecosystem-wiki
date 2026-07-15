---
title: 'Why Bonsai 27B speed changes between runs'
description: 'A trace based explanation of the 16.30 to 22.67 token per second spread seen on one M4 Pro Mac.'
audience: local-ai-builder
pillar: bonsai-27b
status: published
last_reviewed: 2026-07-15
---

Context size, prompt cache state, model reloads, and system memory pressure can all change a local result. Our observed median decode rates ranged from 16.30 to 22.67 tokens per second. The two controlled 4K runs measured 21.55 and 22.67 tokens per second. {% .lead %}

## The repeat run

On July 15, the same three prompt profile measured a 13.383 second median time to first token and a 22.67 token per second median decode rate. Each prompt had 1,466 input tokens and used 127 output tokens.

The result is close to the July 14 controlled run, which measured 14.506 seconds and 21.55 tokens per second. We report both instead of choosing the faster one.

## How to compare runs

- Use the same runtime and model revision.
- Use the same context limit and prompt token count.
- State whether the model was reloaded.
- Keep every run, including slow results.

## Questions people ask

### Which number should I expect?

On this machine and setup, about 21 to 23 decode tokens per second is the best supported controlled range.

### Why keep the 16.30 result?

It shows what can happen after a different context and memory state. That is useful for real applications.

## Sources

- [Ternary Bonsai 27B MLX model card](https://huggingface.co/prism-ml/Ternary-Bonsai-27B-mlx-2bit)
- [LM Studio model support documentation](https://lmstudio.ai/docs/app)
- [PrismML Bonsai 27B whitepaper](https://github.com/PrismML-Eng/Bonsai-demo/blob/main/bonsai-27b-whitepaper.pdf)

## Related Bonsai 27B lessons

- [Ternary Bonsai 27B performance on an M4 Pro Mac](/blog/ternary-bonsai-27b-performance-m4-pro)
- [How prompt caching changes Bonsai 27B benchmarks](/blog/ternary-bonsai-27b-prompt-cache)
- [How we benchmarked Ternary Bonsai 27B](/blog/ternary-bonsai-27b-benchmark-method)

The benchmark numbers on this page describe one checkpoint, runtime, machine, and test shape. Reproduce the test on the hardware and workload you plan to use before making a product decision.
