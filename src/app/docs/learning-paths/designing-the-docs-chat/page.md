---
title: Designing The Docs Chat
status: verified
audience: DevRel
owner: DevRel maintainer
source_tier: internal_canonical
benchmark_status: partial
last_reviewed: 2026-07-07
---

The docs chat agent is a worked example of the two Hard Way courses: Inference The Hard Way chose the model and the prompt shape, and Kubernetes The Hard Way ruled out every deployment except the browser. This page shows the arithmetic and the decisions so you can reuse them. {% .lead %}

## Let deployment constraints pick the architecture

This site deploys on Netlify as static files. That single fact eliminates most chat architectures, and [Kubernetes The Hard Way](https://bootstrap-your-own-k8s.netlify.app) is why we could see it quickly: after you have built a serving cluster by hand once, you know exactly what a server-side model needs and what it costs.

| Option | What it needs | Verdict |
| --- | --- | --- |
| Netlify static hosting | Nothing. Files only. | No compute at all, so no server-side model |
| Netlify Functions | CPU-only serverless, short timeouts, cold starts | An 8B model on a cold CPU function is seconds per token. Not viable |
| A GPU server we run | Everything the course teaches: machines, TLS, ingress, autoscaling, plus a GPU bill that scales with users | Viable but it turns a free community wiki into an ops project |
| WebGPU in the reader's browser | A 290 MB one-time download and a WebGPU browser | Zero infrastructure, zero marginal cost, private by construction |

The browser wins on every axis that matters for a community docs site: each new reader brings their own GPU, so the system scales by definition, and questions never leave the device.

## Let inference arithmetic pick the model

[Inference The Hard Way](https://chaiwithjai.github.io/inference-the-hard-way/) teaches you to budget a deployment in bytes before writing code. The budget for a browser is strict: the download, the memory, and the bandwidth all belong to someone else's laptop.

- **Download.** 1-bit Bonsai 8B is 1.16 GB; 1-bit Bonsai 1.7B is 290 MB in the [ONNX build](https://huggingface.co/onnx-community/Bonsai-1.7B-ONNX). A 290 MB one-time download is acceptable for a docs page; 1.16 GB is a hard sell.
- **KV cache.** Bonsai 1.7B has 28 layers, 8 KV heads, and head dimension 128, so the cache costs 2 x 28 x 8 x 128 x 2 bytes, about 112 KB per token. A 2,048-token conversation costs about 0.22 GB on top of the weights. The [KV cache guide](/docs/technical-guides/kv-cache) walks this formula.
- **Prefill.** Every question re-sends retrieved doc excerpts, and prompt processing is the price you pay before the first token appears. We cap excerpts near 2,400 characters per page, roughly 600 tokens, to keep time to first token tolerable on integrated GPUs. The [prefill vs decode guide](/docs/technical-guides/prefill-vs-decode) explains why this phase dominates.
- **Bandwidth.** Decode streams the weights once per token, so a 290 MB model on even a modest GPU has a comfortable ceiling. This is the [bandwidth ledger](/docs/technical-guides/bandwidth-ledger) argument working in our favor: 1-bit weights are what make browser inference reasonable at all.

## Let an eval pick the prompt

We wrote four gold questions with known answers in the docs, then ran the exact chat prompt through Bonsai 8B locally with llama.cpp before shipping anything. The eval caught two real bugs:

1. **Retrieval failure.** Raw keyword counting let the word "Bonsai" drag every question toward the same two pages, and two-letter terms like "KV" were being dropped. The fix is IDF weighting: rare words count more than common ones. After the fix, the KV cache question retrieved the KV cache guide.
2. **Ordering failure.** With excerpts before the question, the model missed a number that was verbatim in its context and wrongly abstained. Putting the question first fixed it. Small models read long contexts worse than short ones, so tell them what to look for before showing them where to look.

The behavior we kept is the one support bots are judged on: across every run, the model either answered from the excerpts or abstained. It never invented a number. The abstain-when-unsure failure mode costs a resolution; the invent-when-unsure failure mode costs your credibility.

## Reuse the pattern

The whole agent is three static files: the docs bundle ([/llms-full.txt](https://yourwildcard.ai/llms-full.txt)) that the site already generates for coding agents, a web worker that loads the ONNX model over WebGPU, and a page that does keyword retrieval in a few dozen lines of JavaScript. No framework, no vector database, no server. If your docs already ship an llms-full.txt, you are one worker file away from the same feature.

## Next steps

- [Use the chat agent](/chat) and watch the tokens per second it reports.
- [Take Inference The Hard Way](https://chaiwithjai.github.io/inference-the-hard-way/) to learn the budgeting used here, and [Kubernetes The Hard Way](https://bootstrap-your-own-k8s.netlify.app) to learn what the server-side option would have required.

See something wrong? [Fix it](/docs/contribute/contributor-guide).
