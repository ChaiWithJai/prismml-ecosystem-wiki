---
title: Source Policy
status: published
audience: Docs librarian
owner: Source reviewer
source_tier: internal_standard
benchmark_status: not_applicable
last_reviewed: 2026-07-07
---

A source is any document, repository, post, or recording that a fact on this wiki comes from, and not every source is strong enough to support a published fact. On this page you can sort a source into one of five tiers and decide whether a claim from it is ready for a public page. {% .lead %}

## Sort a source into a tier

The tier tells you how much a source can support on its own. A runtime's official README is Tier 0, so you can cite it directly for a build command. An X post that claims a token rate on a phone is Tier 3, so you can use it as a lead but not as a published fact until you find or produce stronger evidence.

| Tier | What you can do with it | Examples |
| --- | --- | --- |
| Tier 0, canonical primary | Cite it directly for facts and claims. | Official docs, repositories, model cards, papers, release posts, benchmark repos. |
| Tier 1, primary adjacent | Use it for context. Verify exact claims elsewhere. | Maintainer talks, company blogs, official demos, standards docs. |
| Tier 2, reproducible community evidence | Cite it when the method and environment are visible. | Independent benchmark logs, notebooks, issue threads with maintainer confirmation. |
| Tier 3, discovery signal | Treat it as a lead. Do not publish it as fact. | X and Twitter posts, newsletters, podcasts, third party amplification. |
| Tier 4, unsupported | Do not publish it as fact at all. | Search snippets, rumors, unattributed claims, private notes without approval. |

## Handle X and Twitter posts

An X post can point you to a demo, a contributor question, or interest in the ecosystem. A post cannot carry a performance, license, device, or quality claim by itself. Trace the post back to a durable source before you publish anything from it.

```text
X post -> source task -> durable source -> claim/source row -> public page
```

## Promote a claim

Before you move a claim onto a public page, answer these questions:

- Does the claim have an official or reproducible source?
- Is the source dated?
- Does the claim name the model, runtime, device, and benchmark scope where relevant?
- Does the public page preserve uncertainty, e.g., "we have not yet run this on hardware"?
- Is the claim free of unapproved roadmap or product language?

If the answer to any question is no, hold the claim back.

## Quarantine a claim

Hold a claim out of public pages if any of these is true:

- It comes only from social media.
- It names performance without a benchmark setup.
- It names a license without model card or repository license evidence.
- It mentions a product roadmap or private notes.
- It turns an open question into a fact.

## Next steps

- Trace where published claims stand today in the [claim and source matrix](/docs/prismml/claim-source-matrix).
- Review incoming leads in the [X discovery notes](/docs/sources/x-discovery-notes).
- Learn how to submit a source in the [contributor guide](/docs/contribute/contributor-guide).
