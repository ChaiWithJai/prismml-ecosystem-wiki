---
title: Bonsai With MLX
status: published
audience: DevRel engineer
owner: Recipe author
source_tier: primary_links
benchmark_status: not_run
last_reviewed: 2026-07-07
---

MLX is Apple's machine learning framework for Apple Silicon Macs, and Bonsai 8B is PrismML's small open-weight language model. On this page you install MLX, download the official 1-bit Bonsai 8B weights, run one prompt on your Mac, and record what you measure. {% .lead %}

{% callout type="warning" title="Not yet run on hardware" %}
These commands come from the upstream MLX docs and the Bonsai model card links; we have not yet run them on a Mac. Steps we could not confirm are marked "inferred". Do not cite this page as proof that Bonsai 8B runs under MLX.
{% /callout %}

## Check what you need

You need an Apple Silicon Mac (any M-series chip). MLX does not run on Intel Macs. You also need Python 3 and enough free disk space and unified memory for the model. We have not confirmed the minimum memory, so read it off the [model card](https://huggingface.co/prism-ml/Bonsai-8B-mlx-1bit) before you download, along with the license.

| You need | Details | Source |
| --- | --- | --- |
| Device | Apple Silicon Mac (M-series) | [MLX project page](https://opensource.apple.com/projects/mlx) |
| Runtime | MLX, installed below | [MLX docs](https://ml-explore.github.io/mlx/) |
| Model | 1-bit Bonsai 8B MLX weights from the official PrismML org | [Model card](https://huggingface.co/prism-ml/Bonsai-8B-mlx-1bit) |

For background on the model itself, see the [Bonsai 8B announcement](https://prismml.com/news/bonsai-8b). The model card lists the 1-bit MLX build at 1.28 GB, and that figure has a verified row in the [claim/source matrix](/docs/prismml/claim-source-matrix).

## Install MLX and download the model

Step 1. Install MLX in a fresh virtual environment, per the [official docs](https://ml-explore.github.io/mlx/).

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install mlx
```

Step 2. Install `mlx-lm` and download the model. This step is inferred. The MLX docs cover the core framework, and `mlx-lm` is the companion package people commonly use to run MLX-format Hugging Face checkpoints. Check the model card for the officially supported load path first, because the 1-bit checkpoint may need a PrismML-specific loader.

```bash
pip install mlx-lm
hf download prism-ml/Bonsai-8B-mlx-1bit
```

## Run one prompt

This command is inferred. If the model card documents its own run command, use that instead.

```bash
mlx_lm.generate \
  --model prism-ml/Bonsai-8B-mlx-1bit \
  --prompt "Explain quantum computing in simple terms." \
  --max-tokens 256
```

If the model responds, you have a working local run. After the model is cached, turn Wi-Fi off and run the same command again, and note whether generation still works offline. If the offline run fails, the loader is probably re-resolving the Hugging Face repo, so point the command at the local download path instead of the repo id.

We do not yet know the recommended sampling settings for Bonsai under MLX. The [llama.cpp recipe](/docs/build-and-run/bonsai-llamacpp) uses temp 0.5, top-p 0.85, and top-k 20, but we have not confirmed those carry over.

## Record what you measured

Write down your numbers so someone else can reproduce the run. Capture:

- **Tokens per second.** Use the number the runtime reports. `mlx_lm.generate` prints generation stats, and if it does not, time the run and divide.
- **Time to first token.** The time from command start to the first generated token.
- **Peak memory.** Unified memory used during generation, from Activity Monitor or the `mlx.core.metal` memory APIs in the MLX docs.
- **Model file size.** The size on disk after download, plus the exact filenames.
- **Offline behavior.** Whether the run worked with Wi-Fi off.

Copy this block and fill it in as you go:

```markdown
- Date:
- Operator:
- Device (chip, e.g. M3 Pro):
- OS:
- RAM (unified memory):
- Runtime + version (mlx / mlx-lm):
- Model: prism-ml/Bonsai-8B-mlx-1bit
- Model file(s) + size on disk:
- Command:
- Prompt:
- Output:
- TTFT:
- Tokens/sec:
- Peak memory:
- Offline mode verified: yes/no
```

## Fix common problems

If a step fails, the table below covers the failures we expect, based on how MLX and 1-bit checkpoints usually behave. When you hit one, note the exact error and your mlx and mlx-lm versions, because that is what the fix usually depends on.

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `mlx_lm` cannot load the checkpoint | Stock `mlx-lm` may not support 1-bit quantization | Check the model card for a PrismML-specific load path or fork |
| Install fails | Intel Mac or unsupported Python version | MLX needs Apple Silicon. Check your chip and Python version against the MLX docs |
| Very low tokens per second | Memory pressure or swap on a low-RAM device | Close other apps, and record your RAM and peak memory alongside the number |
| Works online, fails offline | Loader re-resolving the Hugging Face repo | Point the command at the local download path instead of the repo id |

## Next steps

- [Record your run in a device report](/docs/benchmarks/device-report-schema) so others can reproduce your numbers.
- [Read the MLX ecosystem entry](/docs/ecosystem/mlx) for what MLX is and where it fits.
- [Try the llama.cpp recipe](/docs/build-and-run/bonsai-llamacpp) to run Bonsai on non-Apple hardware.

See something wrong? [Fix it](/docs/contribute/contributor-guide).
