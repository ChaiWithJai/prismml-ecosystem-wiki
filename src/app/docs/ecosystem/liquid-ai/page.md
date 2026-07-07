---
title: Liquid AI (LFMs)
status: published
audience: DevRel engineer
owner: Docs librarian
source_tier: primary_links
benchmark_status: not_run
last_reviewed: 2026-07-07
---

Liquid Foundation Models (LFMs) are a family of small language models from Liquid AI that do not use the standard transformer design, and Liquid builds them to run on small devices such as laptops and phones. On this page you can find the official LFM docs and see how LFMs compare with PrismML Bonsai. {% .lead %}

## Find the official material

Liquid AI documents the LFM family in its [getting started docs](https://docs.liquid.ai/lfm/getting-started/welcome). The [complete model library](https://docs.liquid.ai/lfm/models/complete-library) lists every model, and the LFM2 generation has a public [technical report on arXiv](https://arxiv.org/html/2511.23404v1).

We have not yet pulled parameter counts, context lengths, licenses, or file formats out of those pages, so this entry does not state any. When you need one of those numbers, quote it from the model library or the LFM2 report and keep the URL.

{% callout type="note" title="Before you run an LFM locally" %}
Check the [model library](https://docs.liquid.ai/lfm/models/complete-library) for three things per model: whether the weights are open and under what license, which file formats it ships in (e.g., GGUF or MLX), and which local runtimes such as llama.cpp, Ollama, or LM Studio can load it. We have not run any LFM on hardware yet, so this page has no benchmark numbers.
{% /callout %}

## Understand where LFMs fit

Transformers are still the default design for language models. State space and hybrid models such as Mamba and the LFMs are attempts to do better on long context, memory use, and device performance. For example, an LFM aims to answer a long prompt on a laptop without filling its memory, where a transformer of the same size might struggle.

LFMs sit at the model architecture layer of the supply chain. Once you know which formats a given LFM ships in, the next questions move down the chain: which runtimes load it, and how it behaves on a device.

## Compare LFMs with Bonsai

LFMs and PrismML Bonsai chase the same goal from different directions. Both want useful output per GB of memory, per watt, and per dollar on small devices.

- Bonsai keeps a known transformer architecture and pushes compression to 1-bit and ternary weights.
- LFMs change the architecture itself to cut compute and memory cost.

Because the two take different paths, a fair comparison must hold the runtime, the device, and the quantization constant. Comparing parameter counts alone tells you little.

Any published claim about LFM performance, such as long context or on device speed, should come from the [LFM2 report](https://arxiv.org/html/2511.23404v1) with a section reference. We have not run a head to head test between an LFM and Bonsai yet.

## Next steps

- Read [supply chain layers](/docs/ecosystem/supply-chain-layers) to see where model architecture sits among the other layers.
- Run [Bonsai with llama.cpp](/docs/build-and-run/bonsai-llamacpp) to get a working local baseline you could later compare an LFM against.

See something wrong? [Fix it](/docs/contribute/contributor-guide).
