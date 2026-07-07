---
title: "Ollama vs llama.cpp — which should I use for local inference?"
description: "llama.cpp is the runtime and Ollama is tooling wrapped around it. Ship a feature with Ollama's defaults, or tune flags, quants, and benchmarks with llama.cpp."
audience: inference-engineer
pillar: ecosystem-player
book: transcript-theme
chapter_ref: "Theme 2: end users vs ecosystem members; Kiely Ch. 0 tooling layer"
status: draft
last_reviewed: 2026-07-06
---

Ollama and llama.cpp sit on different layers of the same stack, so this is not a fair fight between two rivals. llama.cpp is the runtime that loads a GGUF file and produces tokens. Ollama is tooling wrapped around that runtime, and it adds model management, an API server, and defaults that work without tuning. Ship a feature with Ollama. Tune flags, quantization formats, or benchmarks with llama.cpp directly. Most of the debate comes from layer confusion, not from a capability gap. {% .lead %}

## Place each tool on the stack

An inference stack has three layers. The runtime runs one model on one machine as fast as the hardware allows. The infrastructure scales that model across machines. The tooling is the interface an engineer uses to work with the other two. Kiely's *Inference Engineering* (Ch. 0) argues that the tooling layer exists to give an engineer enough control to run inference confidently and enough abstraction to work productively.

On that map, llama.cpp is a runtime. It compiles to a binary, loads a quantized model file, and exposes every knob the engine has, e.g., how many layers to place on the GPU.

Ollama is tooling. For GGUF models it runs a llama.cpp engine under the hood. On top of that engine it adds:

- A model registry, so `ollama pull llama3.1:8b` fetches weights, the chat template, and default parameters as one named package.
- A local API server that speaks a stable HTTP interface, so your application code does not care which engine sits below.
- Lifecycle management, e.g., Ollama loads a model on first request and unloads it after five minutes of idle time by default.

So the question "Ollama or llama.cpp" is really "do I want the runtime bare, or with tooling around it".

## Decide who you are on this project

The same split shows up in how people relate to an ecosystem. An end user consumes a tool to ship something else. An ecosystem member works on the tool layer itself, reads its source, files issues, and tunes its internals.

- If you are an end user of local inference, Ollama is the tooling built for you. You trade control for convenience, and on most days that trade is correct because the defaults are fine and your job is the feature.
- If you are acting as an ecosystem member, you want llama.cpp directly. You need to pin the exact build, choose the quantization type of the KV cache, and hold every flag constant while you measure one change.

The switch point in a project is concrete. You start with Ollama to prove the feature works at all. You move to a bare `llama-server` the first time you need a setting that Ollama does not expose, or the first time you need a benchmark number you can defend.

## Work through the cost of the convenience

Here is a worked example with derived numbers, not benchmarks. Suppose your model file is 4.7 GB on disk, which is a common size for an 8B model at 4-bit quantization. Suppose your SSD reads at 3 GB/s. Treat both numbers as assumptions for the arithmetic.

Loading the file into memory takes 4.7 / 3, which is about 1.6 seconds, plus engine startup on top. With a bare `llama-server`, you pay that once when you start the process, and the model then stays resident until you stop it. Your first request after startup is fast.

With Ollama's default lifecycle, the model unloads after five minutes idle. If your app gets one request every ten minutes, every request pays the load again, so every user waits the extra 1.6 seconds and more before the first token. That is not Ollama being slow. That is a tooling default chosen for a laptop that runs many models, applied to a service that runs one. Ollama lets you change it with the `keep_alive` setting, and knowing that this knob exists is exactly the layer awareness this post is about.

{% callout type="note" %}
When two tools wrap the same runtime, a speed difference between them is usually a settings difference, e.g., context length, GPU layer count, or model residency. Before you blame either tool, print the effective settings from both and compare them.
{% /callout %}

## Try it

Run the same GGUF model through Ollama and through a bare `llama-server`, then compare what you can control. This takes under 30 minutes with a model you already have.

1. Pull and time the Ollama path. The first `run` includes model load.

```bash
ollama pull llama3.1:8b
time ollama run llama3.1:8b "Reply with one word."
ollama show llama3.1:8b --parameters
```

2. Find the GGUF blob Ollama downloaded, or use any GGUF file you have, and serve it bare. On macOS, `brew install llama.cpp` provides `llama-server`.

```bash
llama-server -m /path/to/model.gguf -c 4096 -ngl 99 --port 8080
time curl -s http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Reply with one word."}],"max_tokens":5}'
```

3. Read `llama-server --help` next to the Ollama parameter list. Write down three settings you can control in one tool but not the other, e.g., the KV cache quantization type per server flag, a sampler that only one side exposes, or the idle unload time.
4. Note the time to first token for both paths, once cold and once warm, and note which differences come from settings rather than from the engine.

## Check yourself

1. Which layer of the three-layer stack does each tool occupy? Expected answer: llama.cpp is a runtime and Ollama is tooling that wraps a runtime, and neither is infrastructure.
2. At what point in a project would you switch from Ollama to a bare `llama-server`? Expected answer: when you need a setting Ollama does not expose, or when you need benchmark numbers with every flag pinned.
3. Your service on Ollama shows a slow first token every ten minutes. What do you check first? Expected answer: the `keep_alive` idle unload, because the model is reloading from disk, and the runtime itself is not the problem.

## Next steps

- Read the ecosystem pages on [Ollama](/docs/ecosystem/ollama) and [llama.cpp](/docs/ecosystem/llama-cpp) for the settings each one exposes.
- Read the concept page on the [inference stack](/docs/concepts/inference-stack) for the full three-layer map.
- Read [What are the three layers of an inference stack?](/blog/three-layers-of-an-inference-stack) to practice placing failures, not just tools, on the same map.

When you can do this, you can place a local inference tool on the runtime and tooling axis and choose one based on how much control you need versus how much convenience you want.
