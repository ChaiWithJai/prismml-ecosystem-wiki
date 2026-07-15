---
title: 'Binary versus Ternary Bonsai 27B'
description: "Choose between PrismML's 1 bit and ternary Bonsai 27B models based on memory, quality, speed, and device limits."
audience: local-ai-builder
pillar: bonsai-27b
status: published
last_reviewed: 2026-07-15
---

Use Ternary Bonsai 27B when quality is the main goal and a laptop has enough memory. Use Binary Bonsai 27B when the smallest footprint is required, especially on a phone. PrismML reports 80.49 for ternary and 76.11 for binary on its 15 benchmark thinking average. {% .lead %}

## The main tradeoff

- Ternary uses minus one, zero, and plus one. Its ideal language model size is about 5.9 GB.
- Binary uses minus one and plus one. Its deployed language model size is about 3.9 GB.
- Ternary retains 94.6 percent of PrismML's FP16 benchmark average.
- Binary retains 89.5 percent of the same benchmark average.

## Choose for the device

PrismML positions ternary as the laptop quality option and binary as the phone footprint option. The ternary model is too large for the per app memory budget PrismML cites for the iPhone 17 Pro Max. The binary model leaves more room for context and runtime buffers.

## Questions people ask

### Is ternary always faster?

No. Binary moves fewer weight bytes and can decode faster when memory bandwidth is the limit. Runtime and kernel support also affect speed.

### Is binary good enough for tool use?

PrismML reports lower agentic and tool calling scores for binary than ternary. Test your own tools and failure cases before choosing it for an automated workflow.

## Sources

- [PrismML Bonsai 27B announcement](https://prismml.com/news/bonsai-27b)
- [PrismML Bonsai 27B whitepaper](https://github.com/PrismML-Eng/Bonsai-demo/blob/main/bonsai-27b-whitepaper.pdf)
- [PrismML Bonsai 27B documentation](https://docs.prismml.com/models/bonsai-27b)
- [PrismML Bonsai 27B collection on Hugging Face](https://huggingface.co/collections/prism-ml/bonsai-27b)

## Related Bonsai 27B lessons

- [How good is Ternary Bonsai 27B?](/blog/ternary-bonsai-27b-quality-benchmarks)
- [How large is Ternary Bonsai 27B?](/blog/ternary-bonsai-27b-model-size)
- [Ternary Bonsai 27B limitations and verification checklist](/blog/ternary-bonsai-27b-limitations)

The benchmark numbers on this page describe one checkpoint, runtime, machine, and test shape. Reproduce the test on the hardware and workload you plan to use before making a product decision.
