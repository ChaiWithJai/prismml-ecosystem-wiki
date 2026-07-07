---
title: PrismML Developer
---

PrismML is a family of small open-weight language models, and Bonsai is its 8B flagship. Work through these docs and you will be able to run Bonsai on hardware you already own, benchmark it with the same tests the whitepaper uses, and explain the results to other developers without overclaiming. {% .lead %}

{% quick-links %}

{% quick-link title="Run a model in minutes" icon="installation" href="/docs/build-and-run/bonsai-llamacpp" description="Start a local Bonsai 8B server with llama.cpp and send it your first prompt." /%}

{% quick-link title="Read the whitepaper benchmarks" icon="presets" href="/docs/prismml/whitepaper-benchmarks" description="What the six benchmarks measure, what Bonsai scored, and how to reproduce the numbers." /%}

{% quick-link title="Understand the ecosystem" icon="plugins" href="/docs/start-here/orientation" description="See how data, models, compression, runtimes, and devices fit together, and where PrismML sits." /%}

{% quick-link title="Contribute your first page" icon="theming" href="/docs/contribute/contributor-guide" description="Found a gap or an error? Here is how to fix it." /%}

{% /quick-links %}

## Ask instead of searching

The fastest way through these docs is to ask them. [Ask the docs](/chat) runs 1-bit Bonsai 1.7B in your own browser over WebGPU: type a question, watch the inference trace show how the answer was made, and follow the source links it cites into the site. Nothing you type leaves your device. It is also the search bar: press the search box anywhere and hand your query to Bonsai from there.

## Choose how you connect

- **With a coding agent.** Point Claude Code, Cursor, or any agent at [/llms.txt](https://yourwildcard.ai/llms.txt); every page is raw Markdown if you append `.md` to its URL. [Use these docs with AI](/docs/start-here/use-with-ai) has a paste-ready starting prompt.
- **By hand.** Start with the [llama.cpp recipe](/docs/build-and-run/bonsai-llamacpp) and you will have a local model answering prompts in minutes.

## What you will be able to do

- **Run** Bonsai 8B locally with llama.cpp, MLX, Ollama, or LM Studio, and serve it as an OpenAI-compatible API.
- **Measure** tokens per second, time to first token, memory, and energy on your own device, in a format others can compare against.
- **Verify** the whitepaper's claims, from the 1.15 GB file size to the benchmark scores, against official sources and your own runs.
- **Explain** the results to your community with the baselines and caveats stated, using the same numbers the paper reports.

## Check what you need

Pick the environment that matches how deep you want to go. Every path helps benchmark Bonsai.

| Environment | Good for | Prerequisites |
| --- | --- | --- |
| Local machine | Running Bonsai, measuring speed and memory, offline demos | Apple Silicon Mac (16 GB RAM comfortable) or an NVIDIA GPU, plus about 2 GB of disk for the model file |
| Notebook (Colab or Jupyter) | Re-running single benchmarks such as GSM8K | A GPU runtime and [EvalScope](https://github.com/modelscope/evalscope) |
| Cloud GPUs | Reproducing the paper's full evaluation matrix | The paper's setup: EvalScope v1.4.2, vLLM 0.15.1, H100-class GPUs |

The [whitepaper benchmarks page](/docs/prismml/whitepaper-benchmarks) explains what to run in each environment and what the paper's numbers should look like when you get there.

## Understand the whitepaper benchmarks

The goal of these docs is an ecosystem that understands the paper's results, not just repeats its headlines. The [1-bit Bonsai 8B whitepaper](/whitepaper/1-bit-bonsai-8b-whitepaper.pdf) reports a 1.15 GB model scoring 70.5 across six benchmarks, generating up to 8.4x faster than FP16, and using 4x to 6x less energy per token. The [benchmarks guide](/docs/prismml/whitepaper-benchmarks) walks through what each of the six tests measures, where Bonsai wins, where it gives up points, and how to check the numbers yourself. You can trace any claim to its source in the [claim and source matrix](/docs/prismml/claim-source-matrix).

## Learn how it works underneath

Two deployed courses go deeper than the guides on this site. Take them in either order.

- [Inference The Hard Way](https://chaiwithjai.github.io/inference-the-hard-way/) teaches how Bonsai inference works, from the tokenizer and KV cache through kernels, bandwidth, and energy.
- [Kubernetes The Hard Way](https://bootstrap-your-own-k8s.netlify.app) teaches the infrastructure under production serving: machines, certificates, etcd, the control plane, workers, and networking.

The [technical guides](/docs/technical-guides/kv-cache) cover the same concepts in shorter form, starting with the KV cache.

## Next steps

- [Run Bonsai locally with llama.cpp](/docs/build-and-run/bonsai-llamacpp)
- [Read the whitepaper benchmarks](/docs/prismml/whitepaper-benchmarks)

See something wrong? [Fix it](/docs/contribute/contributor-guide).
