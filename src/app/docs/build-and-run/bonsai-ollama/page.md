---
title: Bonsai 8B With Ollama
status: published
audience: DevRel engineer
owner: Runtime validator
source_tier: primary_links
benchmark_status: not_run
last_reviewed: 2026-07-07
---

Ollama is a free desktop tool that runs open-weight language models on your own machine, and Bonsai 8B is PrismML's small 1-bit quantized model. On this page you can import the Bonsai 8B GGUF file into Ollama, run one prompt from the command line and one through the local API, and record what happened. {% .lead %}

{% callout type="warning" title="Not yet run on hardware" %}
These commands come from the upstream Ollama docs; we have not yet run them against Bonsai 8B. Ollama documents the GGUF import path, but Bonsai's 1-bit quantization may not load in stock Ollama. The [llama.cpp recipe](/docs/build-and-run/bonsai-llamacpp) uses a PrismML fork of llama.cpp, and Ollama ships its own copy of llama.cpp. So the first thing to test is whether the model loads at all.
{% /callout %}

## Check what you need

You need a macOS, Linux, or Windows machine. A GPU is optional because Ollama falls back to CPU ([ollama.com](https://ollama.com/)).

You also need the model file, `Bonsai-8B-Q1_0.gguf`, from the [Bonsai 8B GGUF model card](https://huggingface.co/prism-ml/Bonsai-8B-gguf). Confirm the exact filename and size on the model card. Expect to need roughly the file size plus context overhead in RAM. Posts on X cite "1.15 GB" for 1-bit Bonsai 8B, but that figure is unconfirmed and needs a primary source.

Check the license on the model card before you redistribute anything. The Bonsai Image 4B release used Apache 2.0, but do not assume the same license applies to Bonsai 8B.

There is no known `ollama pull` name for Bonsai 8B in the Ollama library. Until PrismML or a maintainer publishes one, the Modelfile import path below is the documented route.

## Import the model and run a prompt

Steps 1 and 2 follow the official Ollama docs. The Modelfile parameters in step 3 come from the sampling flags in the [llama.cpp recipe](/docs/build-and-run/bonsai-llamacpp), not from an Ollama-specific PrismML doc.

1. Install Ollama from [ollama.com](https://ollama.com/) and confirm the daemon runs with `ollama --version`.
2. Download the GGUF file from the [model card](https://huggingface.co/prism-ml/Bonsai-8B-gguf) and note its exact filename and size in bytes.
3. Write a Modelfile next to the downloaded file:

```text
FROM ./Bonsai-8B-Q1_0.gguf
PARAMETER temperature 0.5
PARAMETER top_p 0.85
PARAMETER top_k 20
```

4. Create and run the model:

```bash
ollama create bonsai-8b -f Modelfile
ollama run bonsai-8b "Explain quantum computing in simple terms."
```

If `ollama run` prints a sensible answer, the model loaded and you have a working local setup.

5. Call the local API ([API docs](https://docs.ollama.com/api/introduction)):

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "bonsai-8b",
  "prompt": "Explain quantum computing in simple terms.",
  "stream": false
}'
```

6. Disconnect from the network and repeat step 4 to confirm the model runs offline.

## Record what you measured

If the run works, write down enough detail that someone else can reproduce it. Copy this block and fill it in as you go:

```markdown
- Date:
- Operator:
- Device:
- OS:
- CPU:
- GPU:
- RAM / VRAM:
- Runtime: Ollama <version>
- Model file (name + size on disk):
- Quantization / format:
- Modelfile contents:
- Command:
- Prompt:
- Output:
- TTFT:
- Tokens/sec (from `ollama run --verbose` or API `eval_count` / `eval_duration`):
- Peak memory (RAM and VRAM if GPU used):
- Offline mode verified: yes/no
```

You can get tokens per second and time to first token straight from the API response fields `eval_count`, `eval_duration`, and `prompt_eval_duration`, with no extra tooling ([API docs](https://docs.ollama.com/api/introduction)).

## Fix common problems

If `ollama create` rejects the GGUF, Ollama's bundled llama.cpp probably does not support Bonsai's 1-bit quantization. Save the Ollama version and the full error text, then fall back to the [llama.cpp recipe](/docs/build-and-run/bonsai-llamacpp), which uses PrismML's patched fork.

If the model loads but the output is garbage, the Modelfile is probably missing the right chat template. Check the model card for a prompt template and add a `TEMPLATE` directive.

If throughput is low, the model may be running on CPU only or not fitting in VRAM. Run `ollama ps` and check GPU utilization.

If the API returns connection refused, the Ollama daemon is not running. Start the app or run `ollama serve`, and confirm it listens on port 11434.

## Sources

- [Ollama](https://ollama.com/)
- [Ollama API docs](https://docs.ollama.com/api/introduction)
- [Bonsai 8B GGUF model card](https://huggingface.co/prism-ml/Bonsai-8B-gguf)
- [PrismML Bonsai collection](https://huggingface.co/collections/prism-ml/bonsai)
- [1-bit Bonsai 8B announcement](https://prismml.com/news/bonsai-8b)

## Next steps

- [Record your run in a device report](/docs/benchmarks/device-report-schema) so others can compare results.
- [Read the Ollama ecosystem entry](/docs/ecosystem/ollama) for background on the runtime itself.
- [Try the llama.cpp recipe](/docs/build-and-run/bonsai-llamacpp) if the GGUF does not load here.

See something wrong? [Fix it](/docs/contribute/contributor-guide).
