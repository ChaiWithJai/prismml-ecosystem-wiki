---
title: LM Studio
status: source_checked
audience: DevRel engineer
owner: Runtime validator
source_tier: primary_links
benchmark_status: not_run
last_reviewed: 2026-07-06
---

LM Studio is a desktop app that downloads and runs language models on your own machine through a graphical interface, with no command line. On this page you can learn where LM Studio fits among the local runtimes, walk through a run of PrismML Bonsai in it, and see which facts are still unconfirmed. {% .lead %}

## Know where it fits

LM Studio runs packaged model files such as [Bonsai 8B GGUF](https://huggingface.co/prism-ml/Bonsai-8B-gguf). It sits in the same layer as llama.cpp, MLX, and Ollama, and the difference is the interface. With [llama.cpp](/docs/build-and-run/bonsai-llamacpp) you build the runtime yourself and work in a terminal. With LM Studio you install an app, pick a model, and chat with it. That makes it the easiest way to check that a model runs on a device offline, and the best demo tool for an audience that will not compile anything.

A working LM Studio setup is also the base for offline demos and privacy checklists, and any run you record with it can feed the device benchmark data (device, runtime, model, quantization, tokens per second, time to first token, memory).

{% callout type="note" title="What we have verified" %}
The URLs on this page come from the official LM Studio site and are the only claims we treat as confirmed. We have not yet checked feature details such as supported formats, server modes, OS requirements, or license terms against [the app docs](https://lmstudio.ai/docs/app), and we have not yet run Bonsai in LM Studio on a recorded device.
{% /callout %}

## Run Bonsai in LM Studio

Here is the run we want you to be able to reproduce. We have not yet completed it on a recorded device, so treat it as a checklist rather than a verified recipe.

1. Install LM Studio from [lmstudio.ai](https://lmstudio.ai/) and note the app version.
2. Download the [Bonsai 8B GGUF](https://huggingface.co/prism-ml/Bonsai-8B-gguf) file from the official model card.
3. Load the model, disconnect the network, and run one prompt.
4. Record your device, OS, app version, model file, quantization, output, time to first token, tokens per second, and peak memory. The [llama.cpp recipe](/docs/build-and-run/bonsai-llamacpp) shows the environment record format.
5. Export or screenshot the model and load settings so someone else can reproduce your run.

If you use the same model file as the llama.cpp path, your numbers show the overhead of the app itself.

For a live talk, a flow that works is: install the app, load Bonsai 8B GGUF, disconnect the network, run one prompt, and show the memory footprint.

## Check what is still unconfirmed

Before you rely on LM Studio for a workshop or a commercial demo, confirm these points against [the app docs](https://lmstudio.ai/docs/app), because we have not:

- whether it loads PrismML 1-bit and ternary GGUF files, not just standard quantizations
- whether it exposes a local OpenAI-compatible server, which you would need to mirror the llama.cpp server setup
- the supported operating systems and minimum hardware
- the license terms for workshop and commercial use
- what the app sends over the network after the model download, which decides what "offline" means

One more caution. Our research pass on X (2026-07-06) mentioned LM Studio only as part of a general trend toward better local tooling, not in any PrismML post. So do not claim that PrismML models run in LM Studio today until you have loaded one yourself.

## Official sources

- [lmstudio.ai](https://lmstudio.ai/) is the product home.
- [lmstudio.ai/docs/app](https://lmstudio.ai/docs/app) is the app documentation and the source to quote for any feature, format, or OS claim.
- [Bonsai 8B GGUF on Hugging Face](https://huggingface.co/prism-ml/Bonsai-8B-gguf) is the model card for the file to load.
- [llama.cpp on GitHub](https://github.com/ggml-org/llama.cpp) is the home of the GGUF format that LM Studio consumes.

## Next steps

- [Run Bonsai 8B in LM Studio](/docs/build-and-run/bonsai-lmstudio) walks through the run step by step.
- [Supply chain layers](/docs/ecosystem/supply-chain-layers) shows where runtimes sit in the wider toolchain.

See something wrong? [Fix it](/docs/contribute/contributor-guide).
