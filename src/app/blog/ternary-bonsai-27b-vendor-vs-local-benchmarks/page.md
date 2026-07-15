---
title: 'How to compare PrismML benchmarks with local Bonsai 27B tests'
description: 'A guide to separating vendor llama.cpp results, local LM Studio MLX traces, and application quality checks.'
audience: local-ai-builder
pillar: bonsai-27b
status: published
last_reviewed: 2026-07-15
---

Only with clear limits. PrismML reports 18.0 generation tokens per second on an M4 Pro with llama.cpp Metal. Our controlled LM Studio MLX runs measured 21.55 and 22.67 decode tokens per second. The runtime and prompts differ, so the local figures are not proof of a speedup over PrismML's result. {% .lead %}

## Keep three kinds of evidence separate

- Vendor speed tables show the release team's chosen harness and hardware.
- Local traces show what one public checkpoint and runtime did on one machine.
- Application tests show whether the model completes the work you need.

## The comparison that is safe

Both results show that interactive batch one generation is practical on an M4 Pro. They do not identify which runtime is faster under matched conditions.

A direct runtime comparison would need the same model format, prompt tokens, output tokens, context, warmup, and memory state.

## Questions people ask

### Can you average the vendor and local numbers?

No. They are different experiments and should remain separate.

### Which result should an LM Studio user use?

Use the local MLX trace as a starting point, then test on the exact Mac and context you plan to use.

## Sources

- [PrismML Bonsai 27B whitepaper](https://github.com/PrismML-Eng/Bonsai-demo/blob/main/bonsai-27b-whitepaper.pdf)
- [Ternary Bonsai 27B MLX model card](https://huggingface.co/prism-ml/Ternary-Bonsai-27B-mlx-2bit)
- [LM Studio model support documentation](https://lmstudio.ai/docs/app)

## Related Bonsai 27B lessons

- [Ternary Bonsai 27B performance on an M4 Pro Mac](/blog/ternary-bonsai-27b-performance-m4-pro)
- [How we benchmarked Ternary Bonsai 27B](/blog/ternary-bonsai-27b-benchmark-method)
- [Why Bonsai 27B speed changes between runs](/blog/ternary-bonsai-27b-runtime-variance)

The benchmark numbers on this page describe one checkpoint, runtime, machine, and test shape. Reproduce the test on the hardware and workload you plan to use before making a product decision.
