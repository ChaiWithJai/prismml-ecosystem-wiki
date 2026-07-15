---
title: 'Why Ternary Bonsai 27B is called a 1.58 bit model'
description: 'The math behind ternary weights, group scales, ideal 1.71 bits per weight, and current 2 bit deployment formats.'
audience: local-ai-builder
pillar: bonsai-27b
status: published
last_reviewed: 2026-07-15
---

A ternary weight has three possible values. Encoding three states requires log base two of three, which is about 1.585 bits of information. Ternary Bonsai also stores one 16 bit scale for every 128 weights, so PrismML reports an ideal effective cost of about 1.71 bits per weight. {% .lead %}

## The representation

Each group contains 128 values chosen from minus one, zero, and plus one. The runtime multiplies each value by the FP16 scale for that group. The scale restores a useful magnitude without giving every weight its own high precision number.

The ideal calculation is 1.585 bits for the ternary value plus 16 divided by 128 for the shared scale. That produces about 1.71 bits per weight.

## Why the file uses more space

Current kernels store each ternary value in a 2 bit slot. MLX also stores both a scale and a bias per group. The file therefore does not equal the information limit. PrismML describes 5.9 GB as the ideal size, about 7.2 GB as the deployed GGUF size, and 8.49 GB as the current MLX bundle.

## Questions people ask

### Does 1.58 bit mean each weight occupies exactly 1.58 bits in a file?

No. It describes the information needed for three states. Current file layouts use practical packing that adds overhead.

### What does g128 mean?

It means each group of 128 weights shares one scale.

## Sources

- [PrismML Bonsai 27B whitepaper](https://github.com/PrismML-Eng/Bonsai-demo/blob/main/bonsai-27b-whitepaper.pdf)
- [PrismML formats and runtime support](https://docs.prismml.com/download/formats)
- [PrismML Bonsai 27B documentation](https://docs.prismml.com/models/bonsai-27b)

## Related Bonsai 27B lessons

- [What is Ternary Bonsai 27B?](/blog/what-is-ternary-bonsai-27b)
- [How large is Ternary Bonsai 27B?](/blog/ternary-bonsai-27b-model-size)
- [Binary versus Ternary Bonsai 27B](/blog/binary-vs-ternary-bonsai-27b)

The benchmark numbers on this page describe one checkpoint, runtime, machine, and test shape. Reproduce the test on the hardware and workload you plan to use before making a product decision.
