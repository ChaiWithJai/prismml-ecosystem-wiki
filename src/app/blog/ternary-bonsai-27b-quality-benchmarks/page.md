---
title: 'How good is Ternary Bonsai 27B?'
description: "Read PrismML's benchmark claims by category, compare them with FP16 Qwen3.6 27B, and understand what still needs independent testing."
audience: local-ai-builder
pillar: bonsai-27b
status: published
last_reviewed: 2026-07-15
---

PrismML reports an 80.49 average across 15 thinking mode benchmarks for Ternary Bonsai 27B. Its FP16 Qwen3.6 27B reference averaged 85.07, so PrismML describes ternary as retaining 94.6 percent of the benchmark average. {% .lead %}

## Where the model stays strongest

In PrismML's category averages, ternary scored 93.40 for math, 85.96 for coding, 76.96 for knowledge and reasoning, 74.01 for agentic tool calling, and 65.19 for vision. The full precision reference scored 95.33, 88.74, 83.15, 80.00, and 72.61 in those categories.

The quality gap is not uniform. Vision, instruction following, and some agentic tasks lose more than math and coding in the vendor table.

## How to read the result

These are PrismML results from a shared EvalScope and vLLM harness on H100 GPUs. They are useful launch evidence, but they are not an independent evaluation. Test the prompts, tools, languages, and failure costs that match your application.

## Questions people ask

### Does 95 percent retention mean every answer is 95 percent as good?

No. It is a ratio of aggregate benchmark averages. Individual tasks can show larger or smaller gaps.

### Is ternary better than every 4 bit model?

No. PrismML's Q4_K_XL reference scored closer to FP16 but used 17.6 GB. Ternary is positioned as a smaller quality and footprint tradeoff.

## Sources

- [PrismML Bonsai 27B whitepaper](https://github.com/PrismML-Eng/Bonsai-demo/blob/main/bonsai-27b-whitepaper.pdf)
- [PrismML Bonsai 27B press release](https://prismml.com/news/prismml-releases-bonsai-27b)
- [Qwen3.6 27B base model card](https://huggingface.co/Qwen/Qwen3.6-27B)

## Related Bonsai 27B lessons

- [Binary versus Ternary Bonsai 27B](/blog/binary-vs-ternary-bonsai-27b)
- [Qwen3.6 27B versus Ternary Bonsai 27B](/blog/qwen36-27b-vs-ternary-bonsai-27b)
- [Ternary Bonsai 27B limitations and verification checklist](/blog/ternary-bonsai-27b-limitations)

The benchmark numbers on this page describe one checkpoint, runtime, machine, and test shape. Reproduce the test on the hardware and workload you plan to use before making a product decision.
