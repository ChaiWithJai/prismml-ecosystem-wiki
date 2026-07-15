---
title: 'How to fine tune Ternary Bonsai 27B'
description: 'Choose between MLX QLoRA adapters and the unpacked FP16 checkpoint when adapting PrismML Ternary Bonsai 27B.'
audience: local-ai-builder
pillar: bonsai-27b
status: published
last_reviewed: 2026-07-15
---

Start with a LoRA or QLoRA adapter instead of changing all 27 billion ternary weights. MLX LM supports adapter training on quantized models, and the packed Bonsai checkpoint already loads with stock mlx-lm 0.31.3. Treat this as an adapter experiment until a short training run, held-out evaluation, and adapter inference test pass on the exact checkpoint. {% .lead %}

## The practical local path

When the model is quantized, MLX LM uses QLoRA: the packed base stays frozen and training updates small adapter matrices. Begin with short examples, a small batch, and a short sequence length on a 24 GB Mac.

Keep the adapter separate for the first evaluation. Fusing and requantizing can change the ternary operating point and should not be treated as equivalent to PrismML's quantization-aware training recipe.

```bash
uv tool install 'mlx-lm[train]'

mlx_lm.lora \
  --model prism-ml/Ternary-Bonsai-27B-mlx-2bit \
  --train \
  --data ./data \
  --adapter-path ./adapters/bonsai-27b \
  --iters 100
```

## When the unpacked model helps

The unpacked repository contains FP16 safetensors for stock Hugging Face training frameworks. It is useful for cloud LoRA, SFT, DPO, or GRPO experiments that need a conventional checkpoint, but PrismML says it is about 54 GB and provides none of the packed model's local memory benefit.

PrismML has not published a complete 27B ternary training and repacking pipeline in its public demo repository. A full-weight fine tune is therefore a research project, not a routine export step. Ask PrismML for its QAT and packing workflow before promising a new 1.71 bits-per-weight release.

## Questions people ask

### Can I fine tune the packed 2 bit weights directly?

QLoRA keeps the packed base frozen and trains adapters around it. That is different from updating and re-ternarizing every base weight.

### Will a fused adapter remain a true ternary model?

Do not assume so. Fusion and requantization need a measured quality check and a compatible packing path.

## Sources

- [MLX LM LoRA and QLoRA documentation](https://github.com/ml-explore/mlx-lm/blob/main/mlx_lm/LORA.md)
- [Ternary Bonsai 27B MLX model card](https://huggingface.co/prism-ml/Ternary-Bonsai-27B-mlx-2bit)
- [Ternary Bonsai 27B unpacked FP16 model card](https://huggingface.co/prism-ml/Ternary-Bonsai-27B-unpacked)
- [PrismML Bonsai demo repository](https://github.com/PrismML-Eng/Bonsai-demo)
- [Qwen3.6 27B base model card](https://huggingface.co/Qwen/Qwen3.6-27B)

## Related Bonsai 27B lessons

- [How good is Ternary Bonsai 27B?](/blog/ternary-bonsai-27b-quality-benchmarks)
- [Qwen3.6 27B versus Ternary Bonsai 27B](/blog/qwen36-27b-vs-ternary-bonsai-27b)
- [Ternary Bonsai 27B limitations and verification checklist](/blog/ternary-bonsai-27b-limitations)

The benchmark numbers on this page describe one checkpoint, runtime, machine, and test shape. Reproduce the test on the hardware and workload you plan to use before making a product decision.
