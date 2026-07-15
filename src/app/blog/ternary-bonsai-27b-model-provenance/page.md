---
title: 'How to verify the exact Ternary Bonsai 27B model'
description: 'Record the Hugging Face revision, file size, hash, and runtime name before comparing Bonsai 27B results.'
audience: local-ai-builder
pillar: bonsai-27b
status: published
last_reviewed: 2026-07-15
---

Record the Hugging Face repository, immutable revision, exact weight file size, and SHA 256 hash. Our trace used prism-ml/Ternary-Bonsai-27B-mlx-2bit at revision 70f75f3ad081ab840a42f3304c02c27e7f89bfb7. The model.safetensors file was 8,490,785,104 bytes with SHA 256 8acd4597893ea7004e2d7336c3cf6e3157b8896592bbcf066db004021e45846b. {% .lead %}

## Why the model name is not enough

A repository can change while keeping the same name. A runtime can also give the model a shorter local identifier. The revision and hash connect a result to one exact file.

Format also matters. The MLX bundle, GGUF file, ideal ternary size, and unpacked FP16 checkpoint are different artifacts.

## What to save with every result

- Repository and revision.
- File name, byte count, and hash.
- Runtime and version.
- Hardware, memory, context, and prompt shape.

## Questions people ask

### Does a local LM Studio model ID prove the checkpoint?

No. It is a local name. Save the source repository and file hash too.

### Why publish the full hash?

It lets another tester confirm that both machines used the same bytes.

## Sources

- [Ternary Bonsai 27B MLX model card](https://huggingface.co/prism-ml/Ternary-Bonsai-27B-mlx-2bit)
- [PrismML Bonsai 27B collection on Hugging Face](https://huggingface.co/collections/prism-ml/bonsai-27b)
- [Ternary Bonsai 27B unpacked FP16 model card](https://huggingface.co/prism-ml/Ternary-Bonsai-27B-unpacked)

## Related Bonsai 27B lessons

- [How to resume the Ternary Bonsai 27B download](/blog/ternary-bonsai-27b-download-resume)
- [How large is Ternary Bonsai 27B?](/blog/ternary-bonsai-27b-model-size)
- [How we benchmarked Ternary Bonsai 27B](/blog/ternary-bonsai-27b-benchmark-method)

The benchmark numbers on this page describe one checkpoint, runtime, machine, and test shape. Reproduce the test on the hardware and workload you plan to use before making a product decision.
