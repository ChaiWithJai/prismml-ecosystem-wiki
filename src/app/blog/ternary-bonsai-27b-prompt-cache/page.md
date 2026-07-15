---
title: 'How prompt caching changes Bonsai 27B benchmarks'
description: 'Why repeated prompts can make local Bonsai 27B tests look faster and how to design a trace that exposes cache effects.'
audience: local-ai-builder
pillar: bonsai-27b
status: published
last_reviewed: 2026-07-15
---

Yes. A runtime can reuse work from a prior prompt when the next request shares the same beginning. That can reduce time to first token and can change the memory state around generation. Use different prompt prefixes, record warmup separately, and reload the model when you need a clean comparison. {% .lead %}

## What we observed

Earlier local reruns produced median decode rates from 16.30 to 22.58 tokens per second. Prompt reuse was one cause, but context size and memory pressure also changed between those runs.

The reported controlled run followed an explicit 4K reload. Each measured prompt began with different text, so the server could not reuse the full prompt prefix.

## A safer test pattern

- Run one warmup and exclude it from the median.
- Change the first words of every measured prompt.
- Record the context limit and model load event.
- Keep other applications idle during the run.

## Questions people ask

### Is prompt caching bad?

No. It is useful in applications. It only becomes a problem when a benchmark hides that it reused work.

### Does a different prompt remove every cache effect?

No. The runtime can still retain model and memory state. A reload gives a stronger boundary.

## Sources

- [LM Studio model support documentation](https://lmstudio.ai/docs/app)
- [Ternary Bonsai 27B MLX model card](https://huggingface.co/prism-ml/Ternary-Bonsai-27B-mlx-2bit)

## Related Bonsai 27B lessons

- [Why Bonsai 27B speed changes between runs](/blog/ternary-bonsai-27b-runtime-variance)
- [How we benchmarked Ternary Bonsai 27B](/blog/ternary-bonsai-27b-benchmark-method)
- [Ternary Bonsai 27B performance on an M4 Pro Mac](/blog/ternary-bonsai-27b-performance-m4-pro)

The benchmark numbers on this page describe one checkpoint, runtime, machine, and test shape. Reproduce the test on the hardware and workload you plan to use before making a product decision.
