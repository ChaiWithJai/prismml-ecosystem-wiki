---
title: Ollama
status: source_checked
audience: DevRel engineer
owner: Runtime validator
source_tier: primary_links
benchmark_status: not_run
last_reviewed: 2026-07-06
---

Ollama is a tool that downloads, runs, and serves language models on your own laptop or workstation with one command. On this page you can learn what Ollama does, how it compares to llama.cpp, MLX, and LM Studio, and what we know so far about running Bonsai on it. {% .lead %}

## Understand what Ollama does

Ollama is a local model runtime and manager published at [ollama.com](https://ollama.com/). It exposes a local HTTP API that applications call to generate text, chat, and manage models on your machine, per the [official API introduction](https://docs.ollama.com/api/introduction).

Three properties make it useful for local work with small models:

- One tool covers download, run, and serve, so you do one step instead of three.
- The API stays up as a local endpoint, so agents, scripts, and benchmark harnesses can call it instead of running a CLI command for each prompt.
- It loads packaged model files in the GGUF format (defined in [weights on disk](/docs/technical-guides/weights-on-disk)), so it can run whatever quantized files the compression tools produce.

We only cite Ollama's official site and API docs here. Claims beyond those two pages, e.g., which GPU backends and operating systems it supports, are left out until we can point at the official page that states them.

## Compare it with the other local runtimes

Ollama's peers are [llama.cpp](/docs/build-and-run/bonsai-llamacpp), which you build from source for the most control, MLX, which is native to Apple Silicon, and LM Studio, which is a GUI app. Ollama is easier to script than a GUI and needs less setup than a source build, so it is the fastest way to get a model answering prompts locally.

It also connects to the layers around it. Upstream, it consumes quantized model files, e.g., the [Bonsai 8B GGUF](https://huggingface.co/prism-ml/Bonsai-8B-gguf) from the official model card, and it inherits inference kernels from its underlying engine, so kernel improvements show up as tokens per second and memory changes. Downstream, local agents, editors, and demos call its API, and you can point a benchmark script at the same endpoint to measure time to first token, tokens per second, and peak memory, then compare against llama.cpp and MLX on the same machine.

## Know what is verified and what is not

{% callout type="warning" title="We have not run Bonsai on Ollama yet" %}
Nobody has recorded a Bonsai run on Ollama on real hardware. Do not present `ollama run` with a Bonsai model as working in talks or docs until someone runs it and records the device, model file, command, and results. Two things are still unknown: whether stock Ollama loads Bonsai 8B's 1-bit GGUF quantization or needs the PrismML llama.cpp fork's kernels, and whether the local API is compatible with the OpenAI API format.
{% /callout %}

Everything above comes from these official sources:

- [ollama.com](https://ollama.com/), the product home.
- [docs.ollama.com/api/introduction](https://docs.ollama.com/api/introduction), the API documentation.
- [huggingface.co/prism-ml/Bonsai-8B-gguf](https://huggingface.co/prism-ml/Bonsai-8B-gguf), the Bonsai 8B GGUF model card, which is the file an Ollama setup would load.

{% callout type="note" title="Unconfirmed context" %}
Research notes from X place Ollama in the contributor conversation around local runtime recipes for compressed models. That is unconfirmed, so treat any specific compatibility or performance claim from those threads as a rumor until an official page states it.
{% /callout %}

## Next steps

- Try the [Bonsai with Ollama recipe](/docs/build-and-run/bonsai-ollama). It is a draft, so expect gaps.
- Run the verified path first with the [Bonsai on llama.cpp recipe](/docs/build-and-run/bonsai-llamacpp).

See something wrong? [Fix it](/docs/contribute/contributor-guide).
