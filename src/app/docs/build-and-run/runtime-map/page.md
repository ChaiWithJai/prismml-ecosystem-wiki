---
title: Runtime Map
status: published
audience: DevRel engineer
owner: Runtime validator
source_tier: mixed
benchmark_status: not_run
last_reviewed: 2026-07-07
---

A runtime is the program that loads a PrismML model's weights and generates text on your hardware, e.g., llama.cpp on a laptop. Use this page to pick the runtime that fits your machine and jump to the steps for running it. {% .lead %}

The most reliable path today is llama.cpp. It runs GGUF model files as a local command line tool or a small local server, and we have a written recipe for it that comes from the upstream docs. We have not yet run that recipe on hardware, so treat the steps as source-checked rather than proven. If you are on a Mac, MLX is the Apple Silicon path, and the [Bonsai with MLX recipe](/docs/build-and-run/bonsai-mlx) is a draft that has not been run on hardware yet. Draft recipes also exist for [Ollama](/docs/build-and-run/bonsai-ollama) and [LM Studio](/docs/build-and-run/bonsai-lmstudio).

## Pick a runtime

Each row tells you whether you can run a PrismML model there today.

| Runtime | What it is | Can you run PrismML on it today? |
| --- | --- | --- |
| llama.cpp | Local command line tool and server for GGUF models. | Yes. Follow the [Bonsai on llama.cpp recipe](/docs/build-and-run/bonsai-llamacpp). The commands come from the upstream docs; we have not yet run them on hardware. |
| MLX | Apple's framework for running models on Apple Silicon. | Probably. Follow the [Bonsai with MLX recipe](/docs/build-and-run/bonsai-mlx). It is a draft, and we have not run it on hardware. |
| Ollama | Local model runner with a simple install and pull workflow. | Unknown. The [Bonsai with Ollama recipe](/docs/build-and-run/bonsai-ollama) is a draft, and we have not checked whether Ollama can load the current Bonsai GGUF files without conversion. |
| LM Studio | Desktop app for downloading and chatting with local models. | Unknown. The [Bonsai with LM Studio recipe](/docs/build-and-run/bonsai-lmstudio) is a draft, and we have not checked the import flow or model compatibility. |
| Browser (WebGPU) | Running a model inside a web page using the GPU. | Not yet. We have only seen social and search mentions, and we have not found an official demo repo or model artifact. |
| iOS (mlx-swift) | Running a model on an iPhone or iPad. | Not yet. We have only seen source references, with no device run recorded. |
| vLLM / SGLang | Server-side engines for serving models to many users at once. | Not applicable for a laptop. We list them for context and have not confirmed PrismML compatibility. |

## How we rate the evidence

When a row says "yes" or "not yet", that judgment rests on how much evidence we have. We rate each runtime on a five step scale.

- **discovery.** We have only seen social or search mentions.
- **source_checked.** Official docs or repos show a working path.
- **locally_run.** Someone ran one prompt and recorded the environment.
- **benchmarked.** Someone captured standardized latency, throughput, memory, and task results.
- **maintained.** The page has an owner and recent passing evidence.

Right now llama.cpp sits at source_checked and every other runtime sits at discovery or below. No runtime on this page has benchmark numbers yet, so this page makes no speed or memory claims.

This scale rates the evidence for a recipe, and the [device report schema](/docs/benchmarks/device-report-schema) uses its own benchmark_status values for a recorded run. The two roughly line up, so locally_run matches a benchmark_status of partial, and benchmarked matches reproducible.

## Next steps

- [Run Bonsai on llama.cpp](/docs/build-and-run/bonsai-llamacpp). This is the most reliable recipe today, and the commands are checked against the upstream docs.
- [Run Bonsai with MLX](/docs/build-and-run/bonsai-mlx) if you are on an Apple Silicon Mac. The recipe is a draft and has not been run on hardware.
- [Run Bonsai with Ollama](/docs/build-and-run/bonsai-ollama). The recipe is a draft and has not been run on hardware.
- [Run Bonsai with LM Studio](/docs/build-and-run/bonsai-lmstudio). The recipe is a draft and has not been run on hardware.

See something wrong? [Fix it](/docs/contribute/contributor-guide).
