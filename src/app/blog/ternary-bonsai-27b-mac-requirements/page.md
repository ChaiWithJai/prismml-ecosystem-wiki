---
title: 'What Mac do you need for Ternary Bonsai 27B?'
description: 'Memory, storage, chip, and context requirements for running Ternary Bonsai 27B with MLX on Apple silicon.'
audience: local-ai-builder
pillar: bonsai-27b
status: published
last_reviewed: 2026-07-15
---

Use an Apple silicon Mac with enough free unified memory for the 8.49 GB MLX bundle, runtime buffers, the operating system, and the growing context cache. A 24 GB Mac can run the model for normal local use, but long contexts need more memory. Keep at least 12 GB of free disk for the download and temporary files. {% .lead %}

## Memory is the main limit

Loading the model is only the first memory cost. The server also needs activations, runtime buffers, and a cache for prior tokens. PrismML reports a measured MLX peak of 9.2 GB at 4,000 tokens, 9.6 GB at 10,000 tokens, and 15.5 GB at 100,000 tokens when the cache remains at FP16.

Those figures are vendor measurements. Your result will vary with the runtime version, other open apps, and the context length.

## A practical setup

- Apple silicon is required for MLX.
- 24 GB unified memory is a workable starting point for text use and moderate context.
- 32 GB or more gives more room for long documents and other applications.
- Close memory heavy apps before a long benchmark so the result is easier to interpret.

## Questions people ask

### Can a 16 GB Mac run it?

The weights may fit, but the remaining memory margin is small. Context, runtime buffers, and other apps can force compression or failure. A 24 GB machine is a safer minimum for useful testing.

### Does the whole 262K context fit on 24 GB?

PrismML says a 4 bit KV cache can reduce the full context cache to about 4.3 GB, but support and total peak memory depend on the runtime. Test the context you need instead of assuming the maximum is available.

## Sources

- [PrismML Bonsai 27B documentation](https://docs.prismml.com/models/bonsai-27b)
- [PrismML MLX guide](https://docs.prismml.com/run/mlx)
- [PrismML Bonsai 27B whitepaper](https://github.com/PrismML-Eng/Bonsai-demo/blob/main/bonsai-27b-whitepaper.pdf)

## Related Bonsai 27B lessons

- [How to run Ternary Bonsai 27B with MLX](/blog/run-ternary-bonsai-27b-mlx)
- [How large is Ternary Bonsai 27B?](/blog/ternary-bonsai-27b-model-size)
- [How the KV cache affects Ternary Bonsai 27B memory](/blog/ternary-bonsai-27b-kv-cache)

The benchmark numbers on this page describe one checkpoint, runtime, machine, and test shape. Reproduce the test on the hardware and workload you plan to use before making a product decision.
