---
title: llama.cpp
status: source_checked
audience: DevRel
owner: Runtime validator
source_tier: primary_links
benchmark_status: not_run
last_reviewed: 2026-07-06
---

llama.cpp is an open source C/C++ runtime that runs GGUF model files on your own computer, on CPU, NVIDIA CUDA, or Apple Metal. On this page you can learn what it does, see how to build and run it with Bonsai 8B, and find the full recipe. {% .lead %}

## What it is

llama.cpp is maintained at [ggml-org/llama.cpp](https://github.com/ggml-org/llama.cpp). Three things make it the first runtime to try:

- It reads GGUF model files, which is the format PrismML uses for compressed releases such as [Bonsai 8B GGUF](https://huggingface.co/prism-ml/Bonsai-8B-gguf).
- It builds with plain CMake on macOS, Linux, and Windows, so you can go from clone to prompt on one machine.
- It ships a command line tool (`llama-cli`) and a local server (`llama-server`) that speaks the same HTTP API as OpenAI, so apps built for that API can talk to a model on your machine.

llama.cpp serves one user on one device. If you need to serve many users at once, use vLLM or SGLang instead.

PrismML maintains a fork at [PrismML-Eng/llama.cpp](https://github.com/PrismML-Eng/llama.cpp). The Bonsai instructions in this wiki build from that fork, not from upstream. We do not yet know whether upstream llama.cpp can load the Bonsai 1-bit GGUF files, so stay on the fork until someone records a successful upstream run.

## Run Bonsai with it

The shortest path is to clone the fork, build it, and run one prompt. These commands come from the [Bonsai with llama.cpp recipe](/docs/build-and-run/bonsai-llamacpp) and match the upstream build docs, but we have not yet recorded a run on hardware.

```bash
git clone https://github.com/PrismML-Eng/llama.cpp
cd llama.cpp
cmake -B build            # add -DGGML_CUDA=ON on NVIDIA hardware
cmake --build build -j
./build/bin/llama-cli -m Bonsai-8B-Q1_0.gguf \
  -p "Explain quantum computing in simple terms." -n 256 -ngl 99
```

Download `Bonsai-8B-Q1_0.gguf` from the [official model card](https://huggingface.co/prism-ml/Bonsai-8B-gguf) before you run the last command. On macOS the build uses Metal by default, so you do not need any extra flags.

You know it worked when the model streams an answer to your prompt. For a stronger check, turn networking off after the model download and run the prompt again. If it still answers, the model is running on your machine.

The recipe uses the sampling flags `--temp 0.5 --top-p 0.85 --top-k 20`. We have not yet confirmed these against the model card, so treat them as a starting point.

{% callout type="warning" title="Fork vs upstream" %}
Do not silently swap the PrismML fork for upstream. Record which repo and commit you built, because Bonsai quantization support may differ between them.
{% /callout %}

## Serve it as a local API

`llama-server` exposes the model over a local HTTP endpoint, so you can point an OpenAI client library at your own machine. We have not yet verified which routes the server provides, so check the server docs in the repo before you build on it. The [recipe](/docs/build-and-run/bonsai-llamacpp) includes a `llama-server` path.

If you want a packaged experience instead of building from source, Ollama and LM Studio run the same GGUF files.

## What we have not verified

We list open items plainly so you know what to trust:

- No one has recorded a build and run on hardware yet. The commands above are checked against the upstream docs only.
- We do not know whether upstream llama.cpp loads Bonsai 1-bit GGUF files or whether the fork is required.
- We have not read the llama.cpp license or the Bonsai 8B GGUF weight license, so this page makes no license claims.
- We have not listed which quantization files besides `Bonsai-8B-Q1_0.gguf` exist on the model card.

Third-party posts on X describe PrismML as focused on edge and single-user inference efficiency. That framing is unconfirmed, so rely on the official repos and the model card instead.

## Sources

| URL | What it shows |
| --- | --- |
| [ggml-org/llama.cpp](https://github.com/ggml-org/llama.cpp) | Upstream project, build system, CLI and server binaries, GGUF support. |
| [PrismML-Eng/llama.cpp](https://github.com/PrismML-Eng/llama.cpp) | Fork used by the current Bonsai build path. |
| [prism-ml/Bonsai-8B-gguf](https://huggingface.co/prism-ml/Bonsai-8B-gguf) | Official GGUF release of Bonsai 8B, the exact model filename, and the license. |
| [PrismML-Eng/Bonsai-demo](https://github.com/PrismML-Eng/Bonsai-demo/) | Official PrismML demo pairing Bonsai with a local runtime. |

## Next steps

- [Run Bonsai with llama.cpp](/docs/build-and-run/bonsai-llamacpp) walks the full path with an environment record and success checks.
- [KV cache](/docs/technical-guides/kv-cache) explains what the runtime does with memory while it generates tokens.

See something wrong? [Fix it](/docs/contribute/contributor-guide).
