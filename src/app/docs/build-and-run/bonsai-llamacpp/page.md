---
title: Bonsai With llama.cpp
status: verified
audience: DevRel engineer
owner: Runtime validator
source_tier: primary_links
benchmark_status: partial
last_reviewed: 2026-07-07
---

Bonsai is PrismML's 8B open-weight language model, and llama.cpp is a C++ runtime that runs models like it on a laptop or a single GPU. On this page you can build llama.cpp, load the Bonsai GGUF file, and run your first prompt locally. {% .lead %}

This path has been run on hardware once. On an Apple M4 Pro with 24 GB of RAM, the 1.16 GB `Bonsai-8B-Q1_0.gguf` file loaded in the prebuilt Homebrew `llama-cli` (build b9590) and generated a coherent answer at 65 tokens per second. The full record is at the bottom of this page.

## Get the model and the runtime

You need two things: the Bonsai model file in GGUF format, and a build of PrismML's llama.cpp fork.

- [Bonsai 8B GGUF model card](https://huggingface.co/prism-ml/Bonsai-8B-gguf), which hosts the model file, e.g., `Bonsai-8B-Q1_0.gguf`
- [PrismML llama.cpp fork](https://github.com/PrismML-Eng/llama.cpp), the runtime you will build
- [PrismML Bonsai collection](https://huggingface.co/collections/prism-ml/bonsai) and the [Bonsai demo repo](https://github.com/PrismML-Eng/Bonsai-demo/), if you want the full model family and example code

Download the GGUF file from the model card before you build, and note the exact filename. The commands below assume it sits in the llama.cpp directory.

## Build and run on an NVIDIA GPU (CUDA)

```bash
git clone https://github.com/PrismML-Eng/llama.cpp
cd llama.cpp

cmake -B build -DGGML_CUDA=ON
cmake --build build -j

./build/bin/llama-cli \
  -m Bonsai-8B-Q1_0.gguf \
  -p "Explain quantum computing in simple terms." \
  -n 256 \
  --temp 0.5 \
  --top-p 0.85 \
  --top-k 20 \
  -ngl 99
```

If the build succeeds and the model loads, you should see the prompt followed by generated text in your terminal. That is your success check.

## Build and run on a Mac (Metal)

The default macOS build uses Metal, so no extra flag is needed.

```bash
git clone https://github.com/PrismML-Eng/llama.cpp
cd llama.cpp

cmake -B build
cmake --build build -j

./build/bin/llama-cli \
  -m Bonsai-8B-Q1_0.gguf \
  -p "Explain quantum computing in simple terms." \
  -n 256 \
  --temp 0.5 \
  --top-p 0.85 \
  --top-k 20 \
  -ngl 99
```

## Serve Bonsai as a local API

Once the CLI run works, you can start a local server that speaks the OpenAI-compatible API, so any client library can call your machine.

```bash
./build/bin/llama-server \
  -m Bonsai-8B-Q1_0.gguf \
  --host 0.0.0.0 \
  --port 8080 \
  -ngl 99
```

After the first model download, this whole path can run offline. We have not confirmed that on a device yet.

## Fix common failures

If something breaks, it is usually one of these three problems.

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Build fails | Upstream build instructions changed | Pull the latest fork and re-run cmake |
| Model does not load | Wrong file or unsupported quantization | Re-check the exact filename on the model card |
| Low throughput | GPU path not enabled | Rebuild with the CUDA flag, or check `-ngl` is set |

## Record what you measured

If you note the tokens per second, time to first token, and peak memory from your run, you can share numbers that others can compare against. The [device report schema](/docs/benchmarks/device-report-schema) shows which fields to capture.

## Compare against a recorded run

One run of this recipe has been recorded so far. It was a short single prompt, not the paper's standardized tg128/pp512 protocol, so compare direction rather than exact numbers. The whitepaper reports 85 tokens per second for llama.cpp Metal on an M4 Pro with 48 GB; this run measured 65 tokens per second on the 24 GB M4 Pro.

```markdown
- Date: 2026-07-06
- Device: Mac (Apple M4 Pro, 24 GB RAM), macOS 26.5
- Runtime: llama.cpp b9590 (Homebrew llama-cli, Metal)
- Model file: Bonsai-8B-Q1_0.gguf, 1,158,654,496 bytes (1.16 GB)
- Prompt: "Explain in two sentences why the KV cache grows with context length."
- Settings: -n 128, --single-turn, --seed 42
- Prompt processing: 140 tokens/s
- Generation: 65 tokens/s
- Peak memory: not measured
- Output: coherent two-sentence answer, on topic
```

## Next steps

- [Understand the KV cache](/docs/technical-guides/kv-cache), the mechanism behind the memory and speed numbers you just saw
- [Pick another runtime from the runtime map](/docs/build-and-run/runtime-map) to compare Bonsai across runtimes

See something wrong? [Fix it](/docs/contribute/contributor-guide).
