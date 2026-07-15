---
title: 'How to add Ternary Bonsai 27B to LM Studio'
description: 'Sideload PrismML Ternary Bonsai 27B into LM Studio without downloading a second copy, and understand the memory limit on a 24 GB Mac.'
audience: local-ai-builder
pillar: bonsai-27b
status: published
last_reviewed: 2026-07-15
---

LM Studio 0.4.19 loaded and generated from the exact PrismML MLX checkpoint as a Qwen3.5 family, 27B, 2 bit model. On our 24 GB M4 Pro test machine, a controlled reload took 9.03 seconds and LM Studio reported 7.94 GiB loaded. We reused the existing Hugging Face cache instead of downloading the 8.49 GB weights again. {% .lead %}

## Use the MLX checkpoint

Use prism-ml/Ternary-Bonsai-27B-mlx-2bit on Apple silicon. The ordinary GGUF runtime in LM Studio is not enough for this ternary GGUF today because PrismML documents custom Q2_0 group-128 kernels in its llama.cpp fork.

LM Studio's current MLX runtime is the more direct route. Its model index read the checkpoint as qwen3_5 with 2 bit affine quantization and the full 262,144 token model limit.

## Avoid a duplicate download

A directory symlink was not discovered on our machine. A real model directory containing file symlinks was discovered and avoided a second 8.49 GB transfer.

The first CLI prompt after loading generated at 22.40 tokens per second. A controlled profile with three runs measured a 21.55 tokens per second median decode rate. The OpenAI-compatible server on port 1234 also returned a correct structured tool call.

A second controlled run measured 22.67 median decode tokens per second. In the same trace, a 16 token output limit produced reasoning only. A 256 token limit used 191 reasoning tokens and then returned the correct final answer.

Do not load two copies of the model at once on a 24 GB Mac. Two runtimes leave too little room for macOS, context, and temporary buffers.

```bash
mkdir -p ~/.lmstudio/models/prism-ml/Ternary-Bonsai-27B-mlx-2bit

# Link each file from the existing Hugging Face snapshot into that folder.
# Then resolve the exact repository once so LM Studio refreshes its model index:
lms get https://huggingface.co/prism-ml/Ternary-Bonsai-27B-mlx-2bit --mlx

lms load ternary-bonsai-27b-mlx --context-length 4096 --estimate-only -y
```

## Questions people ask

### Is Ternary Bonsai 27B in LM Studio's featured catalog?

It did not appear as a featured model in our search. Supplying the exact Hugging Face URL allowed LM Studio to resolve and index the MLX checkpoint.

### Should I use the unpacked FP16 checkpoint in LM Studio?

No for normal local use. PrismML says the unpacked checkpoint is about 54 GB and removes the memory and bandwidth advantages of the packed ternary model.

### Why did a short completion return no final answer?

The model can spend the whole token budget on reasoning. In our API check, 16 completion tokens produced reasoning only, while a 256-token budget reached the final answer. Budget and inspect reasoning tokens separately.

## Sources

- [LM Studio model support documentation](https://lmstudio.ai/docs/app)
- [LM Studio model import documentation](https://lmstudio.ai/docs/app/advanced/import-model)
- [Ternary Bonsai 27B MLX model card](https://huggingface.co/prism-ml/Ternary-Bonsai-27B-mlx-2bit)
- [PrismML formats and runtime support](https://docs.prismml.com/download/formats)
- [Ternary Bonsai 27B unpacked FP16 model card](https://huggingface.co/prism-ml/Ternary-Bonsai-27B-unpacked)

## Related Bonsai 27B lessons

- [How to run Ternary Bonsai 27B with MLX](/blog/run-ternary-bonsai-27b-mlx)
- [What Mac do you need for Ternary Bonsai 27B?](/blog/ternary-bonsai-27b-mac-requirements)
- [How Ternary Bonsai 27B fits into ODS](/blog/ternary-bonsai-27b-ods)

The benchmark numbers on this page describe one checkpoint, runtime, machine, and test shape. Reproduce the test on the hardware and workload you plan to use before making a product decision.
