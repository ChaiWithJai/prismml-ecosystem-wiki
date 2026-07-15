---
title: 'What we learned running Bonsai 27B on a 24 GB Mac'
description: 'A measured account of model loading, context limits, and memory choices on an M4 Pro Mac with 24 GB of unified memory.'
audience: local-ai-builder
pillar: bonsai-27b
status: published
last_reviewed: 2026-07-15
---

Yes for moderate text work with one loaded runtime. LM Studio reported a 7.94 GiB loaded size at a 4,096 token context on our 24 GB M4 Pro Mac. The machine had enough room for the model, macOS, and the benchmark, but loading a second model server would have reduced the safety margin. {% .lead %}

## The choices that kept the run stable

- Only one Bonsai 27B runtime was loaded.
- The context limit was 4,096 tokens for the controlled speed test.
- Other large applications stayed idle during measurement.
- The existing model files were reused instead of copied.

## Where 24 GB becomes tight

Long context adds cache memory. Vision work adds image processing costs. A second server would also load another model copy or runtime state.

A model that fits at 4K context is not proof that its full 262K context fits. Increase context in steps and watch memory pressure.

## Questions people ask

### Can you run two Bonsai 27B servers on 24 GB?

It may be possible in a narrow setup, but it leaves little room for context and the operating system. We did not use two servers for the controlled test.

### Does the 8.49 GB file equal runtime memory?

No. File size and loaded memory are different measurements, and context adds more memory.

## Sources

- [Ternary Bonsai 27B MLX model card](https://huggingface.co/prism-ml/Ternary-Bonsai-27B-mlx-2bit)
- [PrismML Bonsai 27B whitepaper](https://github.com/PrismML-Eng/Bonsai-demo/blob/main/bonsai-27b-whitepaper.pdf)
- [LM Studio model support documentation](https://lmstudio.ai/docs/app)

## Related Bonsai 27B lessons

- [What Mac do you need for Ternary Bonsai 27B?](/blog/ternary-bonsai-27b-mac-requirements)
- [How the KV cache affects Ternary Bonsai 27B memory](/blog/ternary-bonsai-27b-kv-cache)
- [Why Bonsai 27B speed changes between runs](/blog/ternary-bonsai-27b-runtime-variance)

The benchmark numbers on this page describe one checkpoint, runtime, machine, and test shape. Reproduce the test on the hardware and workload you plan to use before making a product decision.
