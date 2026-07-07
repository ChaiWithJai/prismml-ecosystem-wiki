---
title: Whitepaper Benchmarks
status: published
audience: DevRel
owner: Docs librarian
source_tier: primary
benchmark_status: published
last_reviewed: 2026-07-07
---

The 1-bit Bonsai 8B whitepaper reports how a 1.15 GB model scores against full-precision models ten times its size, and how fast and efficiently it runs on real hardware. On this page you will learn what each benchmark measures, what the paper found, and how to reproduce the numbers yourself. {% .lead %}

Every number on this page comes from the paper: [1-bit Bonsai 8B: End-to-end 1-bit language model deployment](/whitepaper/1-bit-bonsai-8b-whitepaper.pdf) (PrismML, March 31, 2026). Read it alongside this page; this page is the plain-English tour.

## See the headline result

The paper's central claim is about the tradeoff between model size and capability. Bonsai 8B keeps 70.5 average benchmark score while shrinking from 16.38 GB (FP16) to 1.15 GB on disk. That moves the score-per-gigabyte frontier, as the scatter below shows.

{% frontier-diagram /%}

## Understand the six benchmarks

The paper evaluates six skill categories. If you explain Bonsai to a developer, these are the six things the scores actually mean.

| Benchmark | What it measures | Bonsai 8B | Qwen 3 8B (16.38 GB) |
| --- | --- | --- | --- |
| MMLU-Redux | Knowledge: multiple-choice questions across school and professional subjects | 65.7 | 83 |
| MuSR | Reasoning: multi-step problems told as short stories | 50 | 55 |
| GSM8K | Math: grade-school word problems solved step by step | 88 | 93 |
| HumanEval+ | Coding: write a Python function that passes hidden tests | 73.8 | 82.3 |
| IFEval | Instruction following: obey precise formatting rules | 79.8 | 81.5 |
| BFCLv3 | Tool calling: produce a correct function call | 65.7 | 81 |

Read the table honestly: Bonsai 8B gives up points against its own full-precision base model, most visibly on knowledge (MMLU-Redux) and tool calling (BFCLv3). What it buys with those points is a model 1/14 the size that beats or matches several 16 GB models overall (it outscores LFM2 8B, Llama 3.1 8B, GLM 4 9B, and Hermes 3 8B on average).

## Explain intelligence density

The paper's most useful concept for the ecosystem is intelligence density: how much capability a model delivers per gigabyte. The paper defines it as the model's error exponent, D = -log(Pe) / N, where Pe treats the average benchmark score as a success probability and N is the size in GB. The definition rewards the hard climb at the top of the scale, because moving from 90 to 99 is worth more than moving from 50 to 55.

By this measure the three Bonsai models lead every model in the 1.2B to 9B comparison, and not by a little:

| Model | Intelligence density (1/GB) | Size | Average score |
| --- | --- | --- | --- |
| 1-bit Bonsai 1.7B | 2.832 | 0.24 GB | 49.6 |
| 1-bit Bonsai 4B | 1.744 | 0.57 GB | 62.7 |
| 1-bit Bonsai 8B | 1.060 | 1.15 GB | 70.5 |
| Qwen 3 0.6B (next best) | 0.549 | 1.19 GB | 48.0 |
| Qwen 3 8B | 0.096 | 16.38 GB | 79.3 |

## Read the speed and energy numbers

The paper reports throughput as tg128 (tokens per second while generating 128 tokens) and pp512 (tokens per second while processing a 512-token prompt). The speedups compare against the FP16 build of the same model on the same machine.

| Platform | Backend | Generation (tok/s) | Speedup vs FP16 |
| --- | --- | --- | --- |
| RTX 4090 | llama.cpp CUDA | 368 | 6.2x |
| Mac M4 Pro | MLX | 131 | 8.4x |
| Mac M4 Pro | llama.cpp Metal | 85 | 5.4x |
| RTX 3060 Laptop | llama.cpp CUDA | 81 | 23x, because FP16 does not fit in its VRAM |
| iPhone 17 Pro Max | MLX Swift | 44 | 3.2x vs 4-bit, because FP16 does not fit on the phone |

Energy per generated token drops 4x to 6x on Mac and desktop GPU (for example 0.074 mWh/token vs 0.415 on M4 Pro with MLX). The paper is explicit that the iPhone energy figure is estimated from Xcode Power Profiler and battery drain, not hardware-metered. Quote it with that caveat.

{% callout title="Why speed improves at all" %}
1-bit weights do not make the math easier; they make the memory traffic smaller. Generation speed at batch size 1 is limited by how fast weights stream through memory, so a 14x smaller weight file means fewer bytes per token. The [bandwidth ledger guide](/docs/technical-guides/bandwidth-ledger) walks through this arithmetic.
{% /callout %}

## Check what you need to reproduce them

Pick the environment that matches what you want to verify.

| Environment | What you can verify | What you need |
| --- | --- | --- |
| Your laptop or desktop | Throughput, memory, offline behavior | Apple Silicon Mac (16 GB RAM comfortable) or an NVIDIA GPU; about 2 GB disk for the [1.15 GB GGUF](https://huggingface.co/prism-ml/Bonsai-8B-gguf); the [llama.cpp recipe](/docs/build-and-run/bonsai-llamacpp) |
| A notebook (Colab or Jupyter) | Single benchmarks, e.g. GSM8K, on a rented GPU | A GPU runtime, [EvalScope](https://github.com/modelscope/evalscope), and the model card's [eval results folder](https://huggingface.co/prism-ml/Bonsai-8B-gguf/tree/main/.eval_results) to compare against |
| Cloud GPUs | The paper's full evaluation matrix | The paper used EvalScope v1.4.2 with the vLLM 0.15.1 backend on NVIDIA H100s, greedy decoding at temperature 0, thinking mode disabled |

The paper's methodology appendix lists the exact scoring rules per benchmark (rule-based first, LLM recall fallback only when parsing fails) and the fairness guarantees: identical infrastructure, generation parameters, dataset revisions, and judge configuration for all twelve models.

## Quote the numbers without overclaiming

Three habits keep you accurate when you present these results:

- Name the baseline. "8.4x faster" means versus FP16 of the same model on the same M4 Pro, not versus every other 8B model.
- Keep quality and speed claims separate. The speed table does not say Bonsai matches Qwen 3 8B in quality; the benchmark table shows exactly where it does not.
- Say which numbers are estimated. The iPhone energy figure and anything sourced from social posts stay labeled as estimates until measured.

## Next steps

- [Run Bonsai on your machine](/docs/build-and-run/bonsai-llamacpp) and compare your tokens per second against the paper's platform table.
- [Record what you measure](/docs/benchmarks/device-report-schema) so the ecosystem gets one more comparable data point.
- [Read the whitepaper itself](/whitepaper/1-bit-bonsai-8b-whitepaper.pdf) for the methodology appendices this page summarizes.

See something wrong? [Fix it](/docs/contribute/contributor-guide).
