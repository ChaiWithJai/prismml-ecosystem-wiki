---
title: 'What is Ternary Bonsai 27B?'
description: 'A direct guide to PrismML Ternary Bonsai 27B, its Qwen3.6 base, 1.71 bit representation, model size, capabilities, and limits.'
audience: local-ai-builder
pillar: bonsai-27b
status: published
last_reviewed: 2026-07-15
---

Ternary Bonsai 27B is PrismML's low bit version of Qwen3.6 27B. Its language weights use three values, minus one, zero, and plus one, with a shared scale for each group of 128 weights. PrismML reports about 95 percent of the full precision benchmark average at an ideal 5.9 GB language model size. {% .lead %}

## What changed from Qwen3.6 27B

The base architecture stays the same. It has 64 blocks, a hybrid of linear attention and full attention, a vision encoder, and a 262,144 token context limit. PrismML changed how the language weights are represented and added low bit runtime kernels.

The language model uses ternary weights across embeddings, attention projections, MLP projections, and the output head. The vision tower is handled separately at 4 bit precision.

## What the size numbers mean

The ideal ternary representation is about 5.9 GB. The current deployed GGUF model is about 7.2 GB because each ternary value sits in a 2 bit slot. The current MLX bundle is 8.49 GB because MLX stores a scale and bias for each group and includes the vision tower in the file.

These figures describe different packages. They should not be used as if they were the same measurement.

## Questions people ask

### Is Ternary Bonsai 27B a new base model?

No. PrismML says it is derived from Qwen3.6 27B and keeps the base architecture.

### Is it actually 1.58 bits on disk?

Its three value alphabet has an information cost of about 1.585 bits per weight. Group scales bring the ideal effective cost to about 1.71 bits. Current deployed files use more space because of packing and container details.

## Sources

- [PrismML Bonsai 27B announcement](https://prismml.com/news/bonsai-27b)
- [PrismML Bonsai 27B documentation](https://docs.prismml.com/models/bonsai-27b)
- [PrismML Bonsai 27B whitepaper](https://github.com/PrismML-Eng/Bonsai-demo/blob/main/bonsai-27b-whitepaper.pdf)
- [Qwen3.6 27B base model card](https://huggingface.co/Qwen/Qwen3.6-27B)

## Related Bonsai 27B lessons

- [Why Ternary Bonsai 27B is called a 1.58 bit model](/blog/ternary-bonsai-27b-bits-per-weight)
- [How large is Ternary Bonsai 27B?](/blog/ternary-bonsai-27b-model-size)
- [How good is Ternary Bonsai 27B?](/blog/ternary-bonsai-27b-quality-benchmarks)

The benchmark numbers on this page describe one checkpoint, runtime, machine, and test shape. Reproduce the test on the hardware and workload you plan to use before making a product decision.
