---
title: Claim Source Matrix
status: published
audience: Docs librarian
owner: Source reviewer
source_tier: primary_links
benchmark_status: source_only
last_reviewed: 2026-07-07
---

The claim source matrix is the list of facts we publish about PrismML models, each traced to a named source with a verification status. Before you quote a number or a claim about PrismML anywhere on this site, look it up here to see whether it has a verified source. {% .lead %}

Here is how a row works. The claim "the 1-bit Bonsai 8B GGUF file is 1.16 GB" links to the official Hugging Face file listing, where a reviewer read the listed size of the file on 2026-07-06. Early discovery notes said about 1.15 GB, and the listing shows 1.16 GB, so 1.16 GB is the figure to use in prose. That is the whole method. A claim gets a source, a reviewer reads the source, and the row records what the source actually says.

Each row carries one of these statuses:

- **verified.** An official source states the fact directly and a reviewer confirmed it on the source, or we have run and benchmark evidence.
- **partial.** A source exists, but it does not cover the full claim, so quote it with the caveat in the notes.
- **source-linked.** A durable source exists, but a reviewer still needs the exact quote or version.
- **discovery.** The signal comes only from social posts or search, so do not treat it as fact.
- **quarantined.** Do not publish this as fact.

We checked every row against its source on 2026-07-06. No benchmark has been run locally, so speed, memory, and energy numbers stay out of this table until we have logs.

## Look up a claim

| Claim | Status | Source | What the source shows |
| --- | --- | --- | --- |
| The Bonsai 8B GGUF release is licensed Apache 2.0. | verified | [Hugging Face model card](https://huggingface.co/prism-ml/Bonsai-8B-gguf) | The license field on the card states apache-2.0, and the repo carries a 10.2 kB LICENSE file. |
| The 1-bit Bonsai 8B GGUF file is 1.16 GB. | verified | [Hugging Face file listing](https://huggingface.co/prism-ml/Bonsai-8B-gguf/tree/main) | The listing shows Bonsai-8B-Q1_0.gguf at 1.16 GB. Use 1.16 GB in prose, not the 1.15 GB from early notes. |
| Bonsai Image 4B is released in 1-bit and ternary variants under Apache 2.0. | verified | [PrismML release post](https://prismml.com/news/bonsai-image-4b) | The post names both variants and states the Apache 2.0 license for the release. |
| Ternary Bonsai Image 4B is a 1.21 GB model. | partial | [PrismML release post](https://prismml.com/news/bonsai-image-4b) | The post confirms 1.21 GB, but that figure covers the diffusion transformer only. The full deployment payload on Apple Silicon is 3.88 GB. Always state which size you mean. |
| 1-bit Bonsai Image 4B is a 0.93 GB model. | partial | [PrismML release post](https://prismml.com/news/bonsai-image-4b) | The post confirms 0.93 GB for the diffusion transformer only. The full deployment payload on Apple Silicon is 3.42 GB. We have not yet confirmed the figure on a Hugging Face file listing. |
| Bonsai Studio is a PrismML iPhone app for on-device image generation. | verified | [PrismML home page](https://prismml.com/) | The home page links to the App Store listing for Bonsai Studio by PrismML (id 6767042620). The Bonsai Image 4B post calls it the iOS app for running Bonsai Image 4B on iPhone and says both variants run on-device on iPhone 17 Pro Max. |
| PrismML launched the world's first 1-bit AI model. | quarantined | [PrismML press page](https://prismml.com/news/prismml-launches-worlds-first-1-bit-ai-model) | The headline says world's first, but the body narrows it to the "world's first commercially viable 1-bit large language models". This is a vendor marketing claim. Quote it with attribution and the qualifier, and do not publish it as an independent fact. |
| A 1-bit MLX build of Bonsai 8B exists. | verified | [Hugging Face model card](https://huggingface.co/prism-ml/Bonsai-8B-mlx-1bit) | The repo exists under Apache 2.0 in 1-bit g128 MLX format at 1.28 GB, based on Qwen3-8B. The throughput numbers on the card are vendor claims, and we have not run them locally. |

## Claims you cannot quote yet

Two claim areas have no row, so do not publish them as fact:

- Memory reduction, speedup, and energy claims. The home page numbers (14x smaller, 8x faster, 5x more energy efficient) are vendor marketing until someone runs a local benchmark and files the logs.
- Device support beyond iPhone. Each device needs its own row that separates official support from a demo someone got working once.

## Turn a social signal into a claim

A post on X can point you at something real, e.g., a local demo, WebGPU interest, or edge deployment discussion. It is never a source on its own. When you find a claim on X, look for the official source first, add a row here with what that source says, and only then quote the claim in public prose. If no official source exists, the row stays at discovery status. The X findings that started this table came through that path, and the ones with official sources are now rows above. The raw findings live in the [X discovery notes](/docs/sources/x-discovery-notes).

## Check a row before you add or quote it

Ask these questions:

- Does the row name the exact model, file, runtime, device, and date?
- Is the source official or reproducible?
- Is the claim scoped to a specific benchmark phase rather than a generic speed statement?
- If the claim came from a social post, is that post treated as a pointer and not as the source?
- Does the public page that quotes the claim match the row's status?

## Next steps

- Read the [source policy](/docs/sources/source-policy) for the rules behind these statuses.
- See where raw signals come from in the [X discovery notes](/docs/sources/x-discovery-notes).
- Ready to add a row? Start with the [contributor guide](/docs/contribute/contributor-guide).
