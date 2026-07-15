---
title: 'How large is Ternary Bonsai 27B?'
description: 'A clear comparison of ideal, GGUF, and MLX sizes for Ternary Bonsai 27B, including optional vision and speculative decoding files.'
audience: local-ai-builder
pillar: bonsai-27b
status: published
last_reviewed: 2026-07-15
---

PrismML reports three useful size figures. The ideal ternary language representation is about 5.9 GB. The deployed GGUF language model is about 7.2 GB. The current MLX safetensors bundle is 8.49 GB and includes the vision tower. Runtime memory rises above file size when you add buffers and context. {% .lead %}

## Do not mix the package sizes

The 5.9 GB figure is an information based target. It assumes native ternary packing at about 1.71 bits per weight. Current kernels place each ternary value in a 2 bit slot, which raises the deployed GGUF language model to about 7.2 GB.

The MLX package stores a scale and bias for each group and includes the vision tower in the same file. PrismML reports 8.49 GB for that bundle.

## Optional components

GGUF releases can add a vision projection file and a DSpark draft model. Those files serve separate jobs. Text inference only needs the language model. Vision needs the projection file. Speculative decoding needs the draft model and is not enabled by default on Apple silicon in the whitepaper tests.

## Questions people ask

### Why does Hugging Face show a different size?

Repository totals can include metadata, configuration files, split weights, or optional components. Check the exact artifact and runtime format.

### Is disk size the same as peak memory?

No. Peak memory includes loaded weights, runtime buffers, activations, and the context cache.

## Sources

- [PrismML Bonsai 27B whitepaper](https://github.com/PrismML-Eng/Bonsai-demo/blob/main/bonsai-27b-whitepaper.pdf)
- [PrismML Bonsai 27B documentation](https://docs.prismml.com/models/bonsai-27b)
- [Ternary Bonsai 27B MLX model card](https://huggingface.co/prism-ml/Ternary-Bonsai-27B-mlx-2bit)
- [PrismML Bonsai 27B collection on Hugging Face](https://huggingface.co/collections/prism-ml/bonsai-27b)

## Related Bonsai 27B lessons

- [Why Ternary Bonsai 27B is called a 1.58 bit model](/blog/ternary-bonsai-27b-bits-per-weight)
- [What Mac do you need for Ternary Bonsai 27B?](/blog/ternary-bonsai-27b-mac-requirements)
- [How the KV cache affects Ternary Bonsai 27B memory](/blog/ternary-bonsai-27b-kv-cache)

The benchmark numbers on this page describe one checkpoint, runtime, machine, and test shape. Reproduce the test on the hardware and workload you plan to use before making a product decision.
