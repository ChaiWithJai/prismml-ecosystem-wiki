---
title: Wiki Contract
status: published
audience: Maintainers
owner: Documentation PM
source_tier: internal_standard
benchmark_status: not_applicable
last_reviewed: 2026-07-07
---

The wiki contract is the checklist a maintainer uses to decide whether a page in this wiki is finished. Use it to accept or reject a delivered page based on evidence, because a site that builds and deploys is not the same as a site whose pages are correct. {% .lead %}

## Check a page against the contract

A page passes the contract when you can point to evidence for each check below. For example, the Bonsai llama.cpp recipe passes the claim check because every command in it links to the upstream llama.cpp documentation, and it passes the runtime check because a recorded run on an M4 Pro is attached to the page. Most other recipes still carry "not verified" until someone attaches theirs.

| Check | Evidence you need to see |
| --- | --- |
| Site structure | The page lives at a nested `/docs/...` route with sidebar navigation, search, a table of contents, callouts, and code fences. |
| Source coverage | Every major source is mapped to a route or explicitly excluded, per the matrix below. |
| Claim hygiene | Every PrismML claim appears in the dated [claim and source matrix](/docs/prismml/claim-source-matrix) before it appears in prose. |
| Runtime proof | A recipe either includes device and runtime logs from a run, or says plainly that no one has run its commands yet. |

A page must also do a job for a reader. Someone should be able to use it to explain a concept, run a recipe, verify a claim, or teach the material. If you cannot name the job, reject the page.

{% callout type="warning" title="Deployment is not completion" %}
Deployment only proves the site can be served. Accept the wiki only after each page passes this contract.
{% /callout %}

## Map sources to pages

Each source document must land on a public page or be excluded on purpose, so nothing disappears silently. Here is the current map.

| Source | Public page | State |
| --- | --- | --- |
| `README.md`, `wiki-index.md`, `wiki-information-architecture.md` | Home, Orientation, Supply-chain layers | Moved over in full. |
| `ecosystem-map/prismml.md` | PrismML model family, claim and source matrix | Partly moved. Some claims still need source review. |
| `build-and-run/prismml-bonsai-llamacpp.md` | Bonsai with llama.cpp | Moved over. The commands come from the upstream docs, and we have not yet run them on hardware. |
| `benchmarks/device-report-template.md` | Evaluation harness | Moved over in full. |
| `governance/source-policy.md` | Source policy | Moved over in full. |
| `contribution-backlog.md` | Contribution backlog | Moved over in full. |
| `x-comet-research-notes.md` | Claim and source matrix discovery queue | Partly moved. The X posts stay labeled as unconfirmed. |
| Inference The Hard Way labs 03 to 07 | KV cache, prefill and decode, weights, kernels, bandwidth | Moved over in full. |
| `in-house-ml.md` | None | Excluded until the source owner approves publication. |

## Fill in the page contract

When you add or review a page, fill in this template and keep it with the page's issue. It records who the page is for, where its facts come from, and how someone checks them.

```text
route:
audience job:
primary question:
source inputs:
required visual or table:
verification check:
known gaps:
owner:
review cadence:
```

## Next steps

- Read the [source policy](/docs/sources/source-policy) for the rules on which sources a claim may cite.
- Trace individual claims in the [claim and source matrix](/docs/prismml/claim-source-matrix).
- Follow the [contributor guide](/docs/contribute/contributor-guide) to submit or review a page.
