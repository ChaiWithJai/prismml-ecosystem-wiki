---
title: "X Discovery Notes: PrismML Signal Queue"
status: not_verified
audience: Researcher
owner: Docs librarian
source_tier: discovery
benchmark_status: not_applicable
last_reviewed: 2026-07-06
---

An X post about PrismML is a lead, not a fact. This page is the queue of every PrismML claim we found on X, each paired with the official source that could confirm or kill it, and here you can pick up the next claim to verify or add a new one in the same shape. {% .lead %}

None of the claims below has been checked against an official source yet. Until someone verifies a claim on the [source policy](/docs/sources/source-policy) page, no other page on this wiki may repeat it as fact.

{% callout type="warning" title="Leads only" %}
The numbers on this page (1.21 GB, 0.93 GB, 1.15 GB, "4B", "8B", compression ratios, license terms) come from X posts. Do not cite any of them anywhere else until you have verified them against an official blog post, model card, or whitepaper.
{% /callout %}

## Verify a queued claim

Each row below records one X post, the claim we saw in it, and the official source that can settle it. To verify a claim, open the sources in its "How to verify" cell, compare them against the observed claim, and record the result on the [source policy](/docs/sources/source-policy) page. If the official source contradicts the post, mark the row here as "killed" with the contradicting URL and keep it as a record.

For example, the first row queues a license claim. To close it, you would open the Bonsai Image 4B announcement and the Hugging Face model cards, confirm whether Apache 2.0 covers both the 1-bit and ternary weights, and record what you found.

| X post | Claim as observed | How to verify |
| --- | --- | --- |
| [PrismML 2059339169806307422](https://x.com/PrismML/status/2059339169806307422) | 1-bit and ternary Bonsai Image 4B released under Apache 2.0, with blog, demo, model, and whitepaper links. | Check the license and release scope in the [Bonsai Image 4B announcement](https://prismml.com/news/bonsai-image-4b), the [demo repo](https://github.com/PrismML-Eng/Bonsai-image-demo), and the Hugging Face model cards. Confirm whether Apache 2.0 covers both weight variants or only one. |
| [PrismML 2059339168250253731](https://x.com/PrismML/status/2059339168250253731) | Bonsai Studio iPhone app runs Bonsai Image 4B with on-device generation. | Find the official App Store listing and device requirements before anyone writes a build-and-run recipe for it. |
| [PrismML 2059339166056632570](https://x.com/PrismML/status/2059339166056632570) | Compression framed as "retained usefulness," referencing composition, preference, aesthetics, and prompt-following quality. | Find a linked benchmark source for each quality claim. Without one, no wiki page may repeat the framing. |
| [PrismML 2059339163061940524](https://x.com/PrismML/status/2059339163061940524) | Ternary Bonsai Image 4B described as a 1.21 GB ternary-weight model with a large footprint reduction versus full precision. | Check the exact file size and compression ratio against the blog, whitepaper, and model card, and note which full-precision baseline the reduction is computed against. |
| [PrismML 2059339159899390326](https://x.com/PrismML/status/2059339159899390326) | 1-bit Bonsai Image 4B described as a 0.93 GB maximum-compression variant. | Check the exact size, supported runtimes, and license in the model cards. |
| Vinod Khosla statuses (IDs not captured) | Compression presented as a way to cut energy and cost and widen access. Includes a claimed 1-bit Bonsai 8B at 1.15 GB. | Re-run the [broad search](https://x.com/search?q=%28PrismML%20OR%20%22Bonsai%208B%22%20OR%20%22Bonsai%20Image%22%29%20%28vkhosla%20OR%20Vinod%20OR%20Khosla%20OR%20Ion%20OR%20Stoica%20OR%20inference%20OR%20edge%29&src=typed_query&f=live), record the exact status URLs, then check the 1.15 GB figure against the [Bonsai 8B GGUF model card](https://huggingface.co/prism-ml/Bonsai-8B-gguf). |

{% callout type="note" title="Incomplete row" %}
We recorded the theme of the Khosla posts but not their status IDs or the exact wording of the 1.15 GB claim. That row cannot be verified until someone archives the URLs, so it stays in the queue.
{% /callout %}

## Add a new discovery

We collected these signals on 2026-07-06 with a read-only browser pass on X. We made no likes, reposts, follows, bookmarks, replies, or posts. To add new discoveries, repeat that pass with the two saved searches and keep it read-only:

- [PrismML broad search](https://x.com/search?q=%28PrismML%20OR%20%22Bonsai%208B%22%20OR%20%22Bonsai%20Image%22%29%20%28vkhosla%20OR%20Vinod%20OR%20Khosla%20OR%20Ion%20OR%20Stoica%20OR%20inference%20OR%20edge%29&src=typed_query&f=live)
- [Official PrismML search](https://x.com/search?q=from%3APrismML%20%28Bonsai%20OR%20%221-bit%22%20OR%20ternary%20OR%20local%20OR%20inference%20OR%20edge%20OR%20WebGPU%29&src=typed_query&f=live)

Record each new signal as a table row with three things:

1. The exact X post URL, captured at discovery time.
2. The claim exactly as you observed it, without cleanup or interpretation.
3. The official source that can confirm or kill it.

When you later cite a verified claim on another page, cite the official source, never the X post. Never turn third-party enthusiasm, such as amplification, benchmark screenshots, or size comparisons, directly into a project claim.

## Read the third-party themes

Beyond the official PrismML posts, third-party posts fall into four themes. These themes tell you where community interest sits, and none of them is evidence for any claim.

- **Local image generation.** AlphaSignalAI and Rahul (`@codecroc`) amplified Bonsai Image 4B as local image generation on phones, browsers, and WebGPU.
- **Edge inference.** Third-party posts framed PrismML around edge computing and the difficulty of serving one request at a time efficiently.
- **Architecture efficiency.** A Jon Durbin thread asked what architecture maximizes both training and inference efficiency and pointed at MoE-style tradeoffs.
- **Cost and energy.** Khosla posts and PrismML launch materials present compression as a way to cut energy and cost and widen access.

## Next steps

- [Source policy](/docs/sources/source-policy). Read how a claim moves from a lead to a published fact, and record your verification results there.
- [Contributor guide](/docs/contribute/contributor-guide). Start here if this is your first contribution to the source pipeline.
