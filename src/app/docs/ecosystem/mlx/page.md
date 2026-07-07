---
title: MLX (Apple)
status: published
audience: DevRel engineer
owner: Runtime validator
source_tier: primary_links
benchmark_status: not_run
last_reviewed: 2026-07-07
---

MLX is Apple's open source machine learning framework for Apple Silicon, and it is the native way to run PrismML Bonsai models on a Mac. On this page you can learn what MLX does, find the Bonsai model files it needs, and decide between MLX and the llama.cpp path. {% .lead %}

## Understand what MLX gives you

Apple's machine learning research team publishes MLX as an official open source project ([project page](https://opensource.apple.com/projects/mlx)). The [official docs](https://ml-explore.github.io/mlx/) describe its design:

- An array API similar to NumPy, with higher level packages for neural networks and optimizers.
- Lazy computation with dynamic graph construction.
- Unified memory. Arrays live in shared memory, so operations can run on the CPU or the GPU without explicit data transfers.
- Front ends in Python, C++, and Swift.

For running a compressed model like Bonsai 8B 1-bit, the useful part is that MLX is a first party Mac runtime. You do not need CUDA or a translation layer, and you do not manage GPU offload flags the way you do on NVIDIA hardware, because the CPU and GPU share the same memory.

## Get the model files

PrismML publishes a dedicated MLX artifact for Bonsai 8B at [Bonsai 8B MLX 1-bit](https://huggingface.co/prism-ml/Bonsai-8B-mlx-1bit). This is a separate file from the [GGUF release](https://huggingface.co/prism-ml/Bonsai-8B-gguf) that llama.cpp uses. Each runtime reads its own format, so a model ships as one artifact per runtime rather than one universal file.

Before you install, check the model card for two things we have not yet confirmed: which macOS versions and Apple Silicon chips the artifact supports, and whether loading it requires mlx-lm or PrismML specific code. We also do not yet know how the MLX artifact compares to the GGUF file in disk size or runtime memory.

{% callout type="warning" title="Not yet run on hardware" %}
We have not run Bonsai 8B on MLX yet. The links here come from the official docs and the model card. Take install commands, speed figures, and memory figures from those sources or from a completed device report, not from this page.
{% /callout %}

## Choose between MLX and llama.cpp

MLX runs only on Apple Silicon. llama.cpp runs on most platforms, uses the GGUF format, and has a working recipe at [Bonsai with llama.cpp](/docs/build-and-run/bonsai-llamacpp). Ollama and LM Studio also run GGUF models on a Mac. If you only have a Mac and want the first party path, use MLX. If you want one setup that works across machines, use llama.cpp.

If you want to compare the two, run the same Bonsai 8B prompt set on MLX and on llama.cpp with Metal on the same machine, and record time to first token, tokens per second, and peak memory. Record the chip, the RAM, and the macOS version with your numbers, and confirm the model still runs offline after the download.

Posts on X associate PrismML models with edge deployment and single request inference, which is the workload MLX on a laptop serves. Those posts are unconfirmed, so do not cite them as claims.

## Next steps

- Run the model yourself with the [Bonsai with MLX](/docs/build-and-run/bonsai-mlx) recipe.
- Prefer a cross platform setup? Follow [Bonsai with llama.cpp](/docs/build-and-run/bonsai-llamacpp).

See something wrong? [Fix it](/docs/contribute/contributor-guide).
