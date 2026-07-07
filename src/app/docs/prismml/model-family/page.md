---
title: PrismML Model Family
status: published
audience: DevRel
owner: PrismML liaison
source_tier: primary_links
benchmark_status: source_only
last_reviewed: 2026-07-07
---

PrismML is a company that builds small compressed language and image models, released under the Bonsai name, that you can run on a laptop, a phone, or in a browser. {% .lead %}

On this page you can learn what each Bonsai family is, see the licenses and file sizes we have confirmed against official sources, and pick a model to run yourself.

## Understand PrismML's pitch

PrismML describes its work as "concentrating intelligence". The claim is that denser models need less memory and energy and are easier to deploy. Speed, memory reduction, and energy numbers on PrismML pages are vendor claims until we run our own benchmarks, so treat them as the vendor's statements, not confirmed results. The "world's first 1-bit AI model" line is a marketing claim. The body of the press page narrows it to "commercially viable" 1-bit models, so quote it with attribution only.

PrismML's work spans most of the supply chain. The company designs the compressed formats (1-bit and ternary weights in GGUF and MLX files, defined in [weights on disk](/docs/technical-guides/weights-on-disk)), maintains a llama.cpp fork with custom kernels that unpack the compressed weights during execution, and ships end products such as browser demos and the Bonsai Studio iPhone app.

## Pick a model family

PrismML ships three Bonsai families. For example, if you want a text model on a Mac, download the 1-bit Bonsai 8B GGUF file (1.16 GB) and run it with llama.cpp by following the [Bonsai on llama.cpp recipe](/docs/build-and-run/bonsai-llamacpp).

| Family | What it is | Official sources |
| --- | --- | --- |
| 1-bit Bonsai | Compressed text model family for local and edge inference. | PrismML site, Bonsai release pages, Hugging Face collection, Bonsai demo repo, PrismML llama.cpp fork. |
| Ternary Bonsai | Text model family that trades some compression for quality by using ternary weights. | PrismML release page and Hugging Face collection. |
| Bonsai Image 4B | Local image generation model for browser, GPU, and iOS demos. | PrismML release page, Hugging Face collection, Bonsai Image demo repo, Bonsai Studio app page. |

## Check the facts we verified

We confirmed these items against official PrismML sources. Full rows live in the [claim/source matrix](/docs/prismml/claim-source-matrix).

- The Bonsai 8B GGUF release is licensed Apache 2.0. The model card at https://huggingface.co/prism-ml/Bonsai-8B-gguf states apache-2.0 and the repo includes a LICENSE file.
- The 1-bit GGUF file Bonsai-8B-Q1_0.gguf is 1.16 GB in the Hugging Face file listing at https://huggingface.co/prism-ml/Bonsai-8B-gguf/tree/main.
- Bonsai Image 4B ships in 1-bit and ternary variants under Apache 2.0 per the release post at https://prismml.com/news/bonsai-image-4b.
- The release post lists 0.93 GB for the 1-bit variant and 1.21 GB for the ternary variant. Both figures cover the diffusion transformer only. The full deployment payload on Apple Silicon is 3.42 GB for 1-bit and 3.88 GB for ternary, so always state which size you mean.
- A 1-bit MLX build exists at https://huggingface.co/prism-ml/Bonsai-8B-mlx-1bit under Apache 2.0. The card lists a 1.28 GB model based on Qwen3-8B.
- Bonsai Studio is a PrismML iOS app for running Bonsai Image 4B on iPhone. The PrismML home page links to the App Store listing (Bonsai Studio by PrismML, id 6767042620).

We checked these facts on 2026-07-06.

{% callout type="note" %}
Some Bonsai product names circulate only in social media posts. We do not repeat a product name here until a primary source confirms it. When you cite a claim, keep PrismML's own statements separate from third-party interpretation.
{% /callout %}

## Next steps

- [Run Bonsai with llama.cpp](/docs/build-and-run/bonsai-llamacpp) to try the 1-bit text model on your own machine.
- [Run Bonsai with MLX](/docs/build-and-run/bonsai-mlx) if you prefer the Apple Silicon path.
- [Trace every claim in the claim/source matrix](/docs/prismml/claim-source-matrix) before you quote a PrismML number.

See something wrong? [Fix it](/docs/contribute/contributor-guide).
