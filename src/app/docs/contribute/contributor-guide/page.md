---
title: Contributor Guide
status: source_checked
audience: External contributor
owner: DevRel maintainer
source_tier: internal_operating_model
benchmark_status: not_applicable
last_reviewed: 2026-07-06
---

A contribution to this wiki is a documented fact about small local models or the tools that run them, backed by a source a reviewer can check. This page gives you the checklist a reviewer will apply to your change, so you can pass review on the first attempt. {% .lead %}

You can contribute four kinds of work:

- an ecosystem entry, which describes one project such as a runtime or a training tool
- a runtime recipe, which shows how to run a model on a specific device
- a benchmark result, which records what you measured on that device
- a PrismML claim, which is one sourced fact about the PrismML model family

If you do not have a change in mind yet, pick a task from [the backlog](/docs/contribute/backlog) and come back here before you open a pull request.

## Meet the definition of done

A reviewer marks a page as done when all nine items are true:

1. It has an official URL, and a repository, model card, paper, or docs URL when one exists.
2. It is assigned to exactly one primary supply chain layer, which tells reviewers who owns it.
3. It lists secondary layers only when they help route work.
4. Every public claim has a source and a date checked.
5. Install or run status is marked as verified, partial, not verified, or not applicable.
6. Benchmark status is marked as not run, partial, reproducible, or published.
7. Open questions are listed separately from facts.
8. A page owner and a reviewer are named.
9. The next refresh date is listed.

{% callout type="warning" title="No primary source, no publication" %}
A reviewer rejects or quarantines any product claim that has no primary source. A quarantined claim is held out of public docs until someone finds a source for it. An X/Twitter link counts as discovery only. It can point us at a claim, but it cannot support one. A published claim needs an official doc, repo, paper, model card, company post, or benchmark artifact behind it.
{% /callout %}

## Submit an ecosystem entry

- [ ] Add the official URL.
- [ ] Add the repository, model card, paper, or docs URL when one exists.
- [ ] Pick one primary supply chain layer.
- [ ] Say what the project contributes in one or two sentences.
- [ ] Mark install or run status.
- [ ] Mark benchmark status.
- [ ] List open questions separately from facts.
- [ ] Name the owner.

## Submit a runtime recipe

- [ ] List the model file, runtime, device, operating system, and source URL.
- [ ] Include exact setup steps.
- [ ] Include one command or manual flow that a reviewer can repeat.
- [ ] Record latency, tokens per second, memory, file size, and offline behavior when available.
- [ ] Mark unsupported devices and untested paths.
- [ ] Include an acceptance test, e.g. "A reviewer can start a local OpenAI-compatible server and run one prompt."

If you have not personally run the recipe, say so in the recipe. The reviewer labels it not verified until someone records a run on hardware. See [Bonsai with llama.cpp](/docs/build-and-run/bonsai-llamacpp) for the reference shape, including the environment record block.

## Submit a benchmark result

- [ ] State the task, prompt set, model, runtime, quantization, device, and date.
- [ ] Record time to first token, tokens per second, memory, and power when available.
- [ ] Keep quality notes separate from speed and memory results.
- [ ] Link the benchmark script, schema, or manual protocol.
- [ ] Mark the result as partial unless another reviewer can repeat it.

## Submit a PrismML claim

Every public statement about PrismML lives as one row in the [claim/source matrix](/docs/prismml/claim-source-matrix). For example, the claim "Bonsai 8B ships under an Apache 2.0 license" would appear as a row that names the field checked (license), links the official model card, and records the date you checked it.

- [ ] Add the claim to the claim/source matrix before it appears in public docs.
- [ ] Link the official PrismML source or model card.
- [ ] Record the exact field checked, such as license, file size, supported runtime, or device support.
- [ ] Mark X/Twitter-only claims as discovery.
- [ ] Remove or quarantine the claim when no primary source exists.

Each row in the matrix carries one of five statuses. The [claim/source matrix](/docs/prismml/claim-source-matrix) is the source of truth for these definitions:

- verified. An official source states the fact directly and a reviewer confirmed it on the source, or we have run and benchmark evidence.
- partial. A source exists, but it does not cover the full claim, so quote it with the caveat in the notes.
- source-linked. A durable source exists, but a reviewer still needs the exact quote or version.
- discovery. The signal comes only from social posts or search, so do not treat it as fact.
- quarantined. Do not publish this as fact.

Only verified claims and partial claims with a clear scope appear in public docs.

## Pick a first task

Pick from [the backlog](/docs/contribute/backlog). Higher priority does not mean harder work, and the P0 items are often the fastest first contributions. Every backlog item ends in one of four outputs: a durable doc, a runnable recipe, a benchmark artifact, or a source update. If your idea does not map to one of those, refine it with a maintainer first.

## Know who reviews your work

Each contribution type has one reviewer role, and the table below shows what that reviewer checks. Full role definitions live in the [operating model](/docs/governance/operating-model).

| Your contribution | Reviewed by | What they check |
| --- | --- | --- |
| Ecosystem entry | Layer owner | Layer assignment, entry consistency, open gaps. |
| Runtime recipe | Runtime validator | Repeated setup, device notes, failed paths. |
| Benchmark result | Benchmark owner | Schema fit, recorded run details, repeatability. |
| PrismML claim | Docs librarian | Claim/source matrix row, source tier, date checked. |
| Any page before publication | Reviewer, then DevRel maintainer | Clarity, audience fit, source status, acceptance test; final publish and refresh date. |

One person can hold more than one role, but every published page needs a named page owner and a named reviewer.

{% callout type="note" title="Before publication" %}
Complete the definition of done and add the owner block, which names the page owner, the reviewer, the source owner, the primary layer, the last source check, the last runnable check, the next refresh date, and the current status. Maintainers triage new submissions weekly, so name your owner and reviewer when you submit rather than waiting for review to assign them.
{% /callout %}

## Next steps

- [Pick a task from the backlog](/docs/contribute/backlog)
- [Read the source policy](/docs/sources/source-policy) to see how we tier sources before you cite one.
- [Read the operating model](/docs/governance/operating-model) if you want to take on a reviewer role.
