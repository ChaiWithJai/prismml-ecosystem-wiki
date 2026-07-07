---
title: Audience And Standards
status: draft
audience: DevRel
owner: Docs librarian
source_tier: internal_standard
benchmark_status: not_applicable
last_reviewed: 2026-07-06
---

This wiki explains the tools that take a small open-weight language model from downloaded weights to a running product, and it is written for people who build and explain AI products. {% .lead %}

Read this page to see whether the wiki fits your work and what you can trust when you read it.

## Find your starting point

You will get the most from these docs if one of these describes you.

- **You explain AI products.** You can talk about models with customers, but you may not know inference internals. The technical guides teach you how a model actually runs so your claims stay accurate.
- **You build demos and sample apps.** The build-and-run recipes give you commands to run a model on your own machine and a way to record what you measured.
- **You maintain documentation or benchmarks.** The device report schema and the sources pages show how we record evidence so someone else can reproduce it.
- **You run an ecosystem project.** The ecosystem entries show where runtimes and tools fit in the chain from weights to product, so you can see where yours fits too.

If none of these fit, start with the supply-chain layers page. It defines the whole chain in one place.

## Trust what you read

Every page here follows the same rules, so you can rely on the same things everywhere.

- Every command comes from an upstream source we link to. When we have not yet run a command on hardware, the page says so in plain words.
- Every benchmark number states the task, model, runtime, device, and date. A number without that scope does not appear.
- Social media posts are never treated as evidence. When a claim comes from an unconfirmed post, the page labels it as unconfirmed.
- Open questions are stated as open questions, never as facts.
- Product names and roadmap claims appear only when the vendor has published them.

For example, the Bonsai recipe lists build commands that come from the upstream llama.cpp fork, and it says plainly that no one has yet recorded a run on hardware.

## See the standard we follow

We model the structure of these docs on four documentation sets: the JobsByCulture DevRel career guide, I'd Rather Be Writing, MDN, and Rails Guides. From them we borrow the habits that help a reader most.

- Start from the reader's work context and make the practical output explicit.
- Move from concept, to workflow, to measurement, to maintenance.
- Keep page types separate, e.g., an overview page does not double as a reference page.
- Get you productive quickly, then offer deeper paths.

## Next steps

- [Run Bonsai on your machine](/docs/build-and-run/bonsai-llamacpp)
- [Supply-chain layers](/docs/ecosystem/supply-chain-layers)

See something wrong? [Fix it](/docs/contribute/contributor-guide).
