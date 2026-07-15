---
title: PrismML Developer
---

PrismML is a family of small open-weight language models, led by Ternary Bonsai 27B. Work through these docs and you will be able to run the 27B checkpoint on hardware you already own, inspect measured local traces, and explain where its compressed weights help without overclaiming. {% .lead %}

{% quick-links %}

{% quick-link title="Start with Bonsai 27B" icon="installation" href="/docs/prismml/bonsai-27b" description="Run the public ternary checkpoint, read the local M4 Pro traces, and choose an MLX workflow." /%}

{% quick-link title="Read what people are saying" icon="presets" href="/blog/bonsai-27b-ecosystem-reactions" description="The Information, PrismML, Khosla team amplification, launch posts, and the claims that still need testing." /%}

{% quick-link title="Understand the ecosystem" icon="plugins" href="/docs/start-here/orientation" description="See how data, models, compression, runtimes, and devices fit together, and where PrismML sits." /%}

{% quick-link title="Contribute your first page" icon="theming" href="/docs/contribute/contributor-guide" description="Found a gap or an error? Here is how to fix it." /%}

{% /quick-links %}

## Ask instead of searching

The fastest way through these docs is to ask them. [Ask the docs](/chat) runs 1-bit Bonsai 1.7B in your own browser over WebGPU: type a question, watch the inference trace show how the answer was made, and follow the source links it cites into the site. Nothing you type leaves your device. It is also the search bar: press the search box anywhere and hand your query to Bonsai from there.

## The main story: Ternary Bonsai 27B

The public MLX checkpoint puts a 27B parameter model in an 8.49 GB package. In our controlled LM Studio runs on a 24 GB M4 Pro Mac, it decoded at 21.55 and 22.67 tokens per second at a 4,096 token context. It also returned a valid structured tool call. A reasoning check showed the important limit: a 16 token budget produced reasoning but no answer, while a 256 token budget returned `42` after 191 reasoning tokens.

Start with the [Bonsai 27B field guide](/docs/prismml/bonsai-27b), then read the [26 focused lessons](/blog) and the [link-first ecosystem roundup](/blog/bonsai-27b-ecosystem-reactions). The roundup centers [The Information's report](https://www.theinformation.com/articles/khosla-backed-startup-claims-breakthrough-largest-ever-ai-model-iphone), then separates PrismML's claims, investor amplification, platform reactions, and our local evidence.

## Choose how you connect

- **With a coding agent.** Point Claude Code, Cursor, or any agent at [/llms.txt](https://yourwildcard.ai/llms.txt); every page is raw Markdown if you append `.md` to its URL. [Use these docs with AI](/docs/start-here/use-with-ai) has a paste-ready starting prompt.
- **By hand.** Start with the [llama.cpp recipe](/docs/build-and-run/bonsai-llamacpp) and you will have a local model answering prompts in minutes.

## What you will be able to do

- **Run** Ternary Bonsai 27B locally with MLX or LM Studio and serve it as an OpenAI-compatible API.
- **Measure** tokens per second, time to first token, memory, and energy on your own device, in a format others can compare against.
- **Verify** the whitepaper's claims, from the 1.15 GB file size to the benchmark scores, against official sources and your own runs.
- **Explain** the results to your community with the baselines and caveats stated, using the same numbers the paper reports.

## Check what you need

Pick the environment that matches how deep you want to go. Every path helps benchmark Bonsai.

| Environment                 | Good for                                                      | Prerequisites                                                                             |
| --------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Local machine               | Running Bonsai 27B, measuring speed and memory, offline demos | Apple silicon Mac with 24 GB unified memory recommended, plus at least 12 GB of free disk |
| Notebook (Colab or Jupyter) | Re-running single benchmarks such as GSM8K                    | A GPU runtime and [EvalScope](https://github.com/modelscope/evalscope)                    |
| Cloud GPUs                  | Reproducing the paper's full evaluation matrix                | The paper's setup: EvalScope v1.4.2, vLLM 0.15.1, H100-class GPUs                         |

The [whitepaper benchmarks page](/docs/prismml/whitepaper-benchmarks) explains what to run in each environment and what the paper's numbers should look like when you get there.

## Understand the whitepaper benchmarks

The goal of these docs is an ecosystem that understands the paper's results, not just repeats its headlines. The [1-bit Bonsai 8B whitepaper](/whitepaper/1-bit-bonsai-8b-whitepaper.pdf) reports a 1.15 GB model scoring 70.5 across six benchmarks, generating up to 8.4x faster than FP16, and using 4x to 6x less energy per token. The [benchmarks guide](/docs/prismml/whitepaper-benchmarks) walks through what each of the six tests measures, where Bonsai wins, where it gives up points, and how to check the numbers yourself. You can trace any claim to its source in the [claim and source matrix](/docs/prismml/claim-source-matrix).

## Learn how it works underneath

Two deployed courses go deeper than the guides on this site. Take them in either order.

- [Inference The Hard Way](https://chaiwithjai.github.io/inference-the-hard-way/) teaches how Bonsai inference works, from the tokenizer and KV cache through kernels, bandwidth, and energy.
- [Kubernetes The Hard Way](https://bootstrap-your-own-k8s.netlify.app) teaches the infrastructure under production serving: machines, certificates, etcd, the control plane, workers, and networking.

The [technical guides](/docs/technical-guides/kv-cache) cover the same concepts in shorter form, starting with the KV cache.

## Next steps

- [Run and measure Ternary Bonsai 27B](/docs/prismml/bonsai-27b)
- [Read the Bonsai 27B ecosystem roundup](/blog/bonsai-27b-ecosystem-reactions)

See something wrong? [Fix it](/docs/contribute/contributor-guide).
