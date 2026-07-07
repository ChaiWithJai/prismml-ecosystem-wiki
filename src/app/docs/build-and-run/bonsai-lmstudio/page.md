---
title: Bonsai With LM Studio
status: published
audience: DevRel engineer
owner: Recipe author
source_tier: primary_links
benchmark_status: not_run
last_reviewed: 2026-07-07
---

LM Studio is a free desktop app that downloads and runs local language models behind a graphical chat interface, with no command line required. On this page you load Bonsai 8B, PrismML's [1-bit small model](https://prismml.com/news/bonsai-8b), into LM Studio, run a prompt with the network disconnected, and save your settings so someone else can repeat the run. {% .lead %}

{% callout type="warning" title="Not yet run on hardware" %}
These steps come from the official LM Studio and PrismML docs. We have not yet run them on a device. Where the docs do not spell out a step, we say so with the word "inferred". If you complete a run, please record what happened.
{% /callout %}

## Before you start

You need four things:

- A desktop machine. LM Studio runs on macOS, Windows, and Linux. Check the exact OS and hardware requirements in the [LM Studio app docs](https://lmstudio.ai/docs/app) before you start.
- The latest LM Studio release from [lmstudio.ai](https://lmstudio.ai/). Note the version number, because you will record it later.
- The Bonsai 8B GGUF file from the [model card](https://huggingface.co/prism-ml/Bonsai-8B-gguf). The llama.cpp recipe uses the filename `Bonsai-8B-Q1_0.gguf`, so confirm that name against the model card.
- Enough disk space and RAM for the model. We do not have a confirmed file size yet. An [X post by Vinod Khosla](https://x.com/vkhosla/status/2039168431065563399) mentioned a 1.15 GB 1-bit Bonsai 8B, but that number is unconfirmed, so check the size on the model card.

One risk to know about before you invest time. Bonsai uses [1-bit, also called ternary, quantization](https://prismml.com/news/ternary-bonsai), which means each weight is stored in about one bit instead of 16. PrismML maintains its own [fork of llama.cpp](https://github.com/PrismML-Eng/llama.cpp) to run these files, and LM Studio bundles the standard llama.cpp engine. The standard engine may or may not load the file. If it refuses, that is a useful result too, and the troubleshooting section below tells you what to capture.

## Run Bonsai in LM Studio

1. Download and install LM Studio from [lmstudio.ai](https://lmstudio.ai/). Write down the version string.
2. Get the model file. There are two paths:
   - Search for `prism-ml/Bonsai-8B-gguf` inside the app. This is inferred, because LM Studio's search reads from Hugging Face, so confirm it against [the app docs](https://lmstudio.ai/docs/app).
   - Or download the file from the [model card](https://huggingface.co/prism-ml/Bonsai-8B-gguf) in a browser and import it through the local models directory. The exact import path is also inferred, so confirm it in the docs.
3. Load the model in a chat session. If the engine rejects the 1-bit file, copy the exact error text and add it as a compatibility note to the [llama.cpp recipe](/docs/build-and-run/bonsai-llamacpp).
4. Run one prompt. Use the same prompt as the llama.cpp recipe so the two runs can be compared:

   ```text
   Explain quantum computing in simple terms.
   ```

5. Match the sampling settings from the [llama.cpp recipe](/docs/build-and-run/bonsai-llamacpp) wherever the UI exposes them. Set temperature to 0.5, top-p to 0.85, top-k to 20, and max tokens to 256.
6. Check offline behavior. After the model has fully downloaded, disconnect from the network and run the prompt again. Note whether it works.
7. Export your settings. LM Studio stores configuration per model. Save it as a preset or config export and attach it to your results. The export mechanism is inferred, so confirm it in [the app docs](https://lmstudio.ai/docs/app). We also do not yet know what format the export takes or whether it moves cleanly between LM Studio versions, so note what you find.
8. Optionally, test the local server. If your LM Studio version exposes an OpenAI-compatible server, start it and run one `curl` completion. Note the host, port, and response.

If you want to compare against a reference setup, the [PrismML Bonsai demo repo](https://github.com/PrismML-Eng/Bonsai-demo/) shows how PrismML runs the model.

## Record your results

Copy this block before you start, fill it in as you go, and file it as a [device report](/docs/benchmarks/device-report-schema).

```markdown
- Date:
- Operator:
- Device:
- OS:
- CPU / GPU:
- RAM / VRAM:
- LM Studio version:
- Model file and size on disk:
- Quantization / format:
- Prompt:
- Output:
- TTFT:
- Tokens/sec (from LM Studio's stats readout):
- Peak memory:
- Offline mode verified: yes/no
- Settings export attached: yes/no
```

## Troubleshoot common failures

The most likely failure is the model refusing to load, because of the 1-bit quantization risk described above. Whatever goes wrong, capture the exact error text and your LM Studio version, since those two facts usually decide whether the problem is the app or the file.

| Symptom | Likely cause | What to try |
| --- | --- | --- |
| Model fails to load | The bundled llama.cpp engine lacks the 1-bit support that [PrismML's fork](https://github.com/PrismML-Eng/llama.cpp) has. | Check the engine version in the LM Studio release notes, then test the same file in the fork directly. Capture the engine version and the exact error text. |
| Model not found in search | The GGUF repo is not indexed, or it was renamed. | Download it from the [model card](https://huggingface.co/prism-ml/Bonsai-8B-gguf) in a browser and import it manually. Note the search term you used and the filename. |
| Offline run fails | The app is calling out to the network, or the model was not fully cached. | Re-test with the model fully downloaded before you disconnect. Note whether reconnecting fixes it. |
| Throughput far below llama.cpp | GPU offload is disabled, or the engine defaults differ. | Check LM Studio's GPU offload setting and compare against a llama.cpp run with `-ngl 99` on the same device. Attach your settings export and both benchmark rows. |

## Next steps

- [Record what you measured in a device report](/docs/benchmarks/device-report-schema)
- [Read the LM Studio ecosystem entry](/docs/ecosystem/lm-studio)
- [Compare with the llama.cpp recipe](/docs/build-and-run/bonsai-llamacpp)

See something wrong? [Fix it](/docs/contribute/contributor-guide).
