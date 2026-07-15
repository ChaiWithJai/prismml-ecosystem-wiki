---
title: 'Ternary Bonsai 27B limitations and verification checklist'
description: 'Known limits in quality, runtime support, packaging, Apple silicon speculative decoding, long context, and independent evidence.'
audience: local-ai-builder
pillar: bonsai-27b
status: published
last_reviewed: 2026-07-15
---

Ternary Bonsai 27B does not match full precision quality on every task, current ternary files are larger than the 5.9 GB ideal, GGUF needs PrismML's ternary runtime path, and speculative decoding is not yet a default speed win on Apple silicon. Most launch benchmarks also come from PrismML, so independent tests are still needed. {% .lead %}

## Known limits

- PrismML reports larger gaps in vision, instruction following, and agentic tool use than in math.
- The current deployed ternary format uses 2 bit slots, so it does not reach the ideal 5.9 GB package.
- Ternary GGUF support is not yet available in every llama.cpp based application.
- The DSpark draft model improves CUDA throughput in the whitepaper but is not enabled by default on Apple silicon.
- Long context support depends on cache format and available memory, not only the stated 262K limit.

## Verification checklist

- Record the exact model revision, runtime version, and hardware.
- Measure artifact size and peak memory separately.
- Report time to first token and decode speed separately.
- Test tool call syntax and full tool loops.
- Use application tasks and keep the failures, not only the successful outputs.
- Label PrismML claims and local measurements in separate tables.

## Questions people ask

### Is the model production ready?

That depends on the task and failure cost. Run an application specific evaluation before letting it take actions or handle sensitive data.

### What is the most important number to verify locally?

For interactive use, measure both available memory at your real context length and output token rate after the first token. A model that loads can still be too slow or run out of memory later.

## Sources

- [PrismML Bonsai 27B whitepaper](https://github.com/PrismML-Eng/Bonsai-demo/blob/main/bonsai-27b-whitepaper.pdf)
- [PrismML formats and runtime support](https://docs.prismml.com/download/formats)
- [PrismML Bonsai 27B documentation](https://docs.prismml.com/models/bonsai-27b)
- [PrismML Bonsai 27B announcement](https://prismml.com/news/bonsai-27b)

## Related Bonsai 27B lessons

- [Ternary Bonsai 27B performance on an M4 Pro Mac](/blog/ternary-bonsai-27b-performance-m4-pro)
- [How good is Ternary Bonsai 27B?](/blog/ternary-bonsai-27b-quality-benchmarks)
- [Binary versus Ternary Bonsai 27B](/blog/binary-vs-ternary-bonsai-27b)

The benchmark numbers on this page describe one checkpoint, runtime, machine, and test shape. Reproduce the test on the hardware and workload you plan to use before making a product decision.
