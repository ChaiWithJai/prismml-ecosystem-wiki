---
title: 'How to run Ternary Bonsai 27B with MLX'
description: 'Install MLX LM, download Ternary Bonsai 27B, generate text, and avoid the most common Apple silicon setup errors.'
audience: local-ai-builder
pillar: bonsai-27b
status: published
last_reviewed: 2026-07-15
---

Install the current mlx-lm package, then pass the Hugging Face model ID to mlx_lm.generate or mlx_lm.server. We loaded and generated from the model with stock mlx-lm 0.31.3 on an M4 Pro Mac. The first run downloads the 8.49 GB MLX bundle. {% .lead %}

## Install and generate

Run the command on an Apple silicon Mac. The files are cached after the first download, so later starts should reuse them.

PrismML's written MLX guide still mentions its fork, while the current Hugging Face model page gives the stock install shown above. The stock path worked in our July 14, 2026 test with mlx-lm 0.31.3.

```bash
uv tool install mlx-lm

mlx_lm.generate \
  --model prism-ml/Ternary-Bonsai-27B-mlx-2bit \
  --prompt "Explain KV cache growth in one paragraph."
```

## Check the result

- Confirm the model ID is exactly `prism-ml/Ternary-Bonsai-27B-mlx-2bit`.
- Watch free disk space during the first download.
- Record package versions when you benchmark because MLX performance can change between releases.
- Use a short prompt first, then increase context after the model is stable.

## Questions people ask

### Do I need PrismML's MLX fork?

Not on our tested setup. Stock mlx-lm 0.31.3 loaded the model and returned a completion on an M4 Pro Mac. Record your version because PrismML's written guide and current Hugging Face instructions do not agree.

### Why does the first request take so long?

The first run may still be downloading files or loading 8.49 GB of model data into memory. Wait for the download and model load to finish before measuring response speed.

## Sources

- [PrismML MLX guide](https://docs.prismml.com/run/mlx)
- [PrismML Bonsai 27B documentation](https://docs.prismml.com/models/bonsai-27b)
- [Ternary Bonsai 27B MLX model card](https://huggingface.co/prism-ml/Ternary-Bonsai-27B-mlx-2bit)

## Related Bonsai 27B lessons

- [What Mac do you need for Ternary Bonsai 27B?](/blog/ternary-bonsai-27b-mac-requirements)
- [How to serve Ternary Bonsai 27B through an OpenAI compatible API](/blog/ternary-bonsai-27b-openai-api)
- [Ternary Bonsai 27B performance on an M4 Pro Mac](/blog/ternary-bonsai-27b-performance-m4-pro)

The benchmark numbers on this page describe one checkpoint, runtime, machine, and test shape. Reproduce the test on the hardware and workload you plan to use before making a product decision.
