---
title: DevRel Operating Model
status: published
audience: DevRel
owner: DevRel maintainer
source_tier: internal_canonical
benchmark_status: not_applicable
last_reviewed: 2026-07-07
---

The operating model is the set of roles, steps, and schedules that keep this wiki accurate. Use this page when you need to decide who owns a piece of incoming work, how to check it, and when it is ready to publish. {% .lead %}

Incoming work is a page, a recipe, a benchmark, a source update, or an ecosystem entry. Every kind of work follows the same path here: it gets an owner, a reviewer, a source check, and an acceptance test before it goes live.

## Know the roles

Each role below owns one kind of decision. One person can hold more than one role, but every published page needs a named page owner and a named reviewer. For example, a new llama.cpp recipe has a recipe author who writes it, a runtime validator who repeats the setup, and a reviewer who signs off before the maintainer publishes it.

| Role | Owns | Main outputs |
| --- | --- | --- |
| DevRel maintainer | Wiki roadmap, page set, publication decisions | Accepted backlog, published pages, contributor guide |
| Docs librarian | Source quality, claim tracking, link hygiene | Claim/source matrix, source status, quarantined claims list |
| Researcher | Discovery work and source collection | Research notes, official source fallbacks, open questions |
| Recipe author | Local runtime and integration guides | Runnable recipes with acceptance tests |
| Benchmark owner | Test schema, task suite, result quality | Benchmark template, recorded runs, regression notes |
| Page owner | One page or one ecosystem entry | Drafts, refresh dates, issue triage for that page |
| Layer owner | One supply chain layer | Routing decisions, entry consistency, open gaps |
| Runtime validator | Runtime checks for local recipes | Repeated setup results, device notes, failed paths |
| Reviewer | Practical check before publication | Source review, runnable check, clarity review |
| Ecosystem liaison | Upstream wording and validation | PrismML or project confirmations, roadmap links, approved wording |

A claim is quarantined when we remove it from reader pages because it has no primary source. It stays on the quarantined list until someone finds an official source for it or retires it.

## Take in new work

Every new piece of work goes through the same eight steps before anyone starts writing:

1. Capture the request in the backlog or issue tracker.
2. Assign the work to one supply chain layer from the [ecosystem map](/docs/ecosystem/supply-chain-layers).
3. Assign the work to one public wiki page.
4. Classify the source state as primary, discovery only, mixed, or unsourced.
5. Name the page owner, reviewer, and source owner.
6. Define the output as a doc, recipe, benchmark artifact, or source update.
7. Define the acceptance test before work starts.
8. Reject or quarantine any product claim that has no primary source.

Record the answers on an intake card. A filled card for a recipe request looks like "Title: Bonsai with Ollama. Work type: recipe. Acceptance test: a reviewer can pull the model and get one completion." Copy this template:

```markdown
### Intake card

- Title:
- Work type: page | recipe | benchmark | source update | ecosystem entry
- Target page:
- Supply chain layer:
- Contributor:
- Page owner:
- Reviewer:
- Source owner:
- Source state: primary | discovery only | mixed | unsourced
- Expected output:
- Acceptance test:
- Open questions:
- Publish blocker:
```

## Route requests to the right place

Match the request to its topic and send it to the page that owns that topic. Each route also names the proof the work needs before it can publish.

| If the request is about | Route it to | Required proof |
| --- | --- | --- |
| PrismML model claims, file size, license, device support, or quality | The [PrismML claim/source matrix](/docs/prismml/claim-source-matrix) | Official PrismML post, repo, model card, paper, or app page |
| llama.cpp, MLX, Ollama, LM Studio, WebGPU, or iPhone paths | Runtime recipe backlog, e.g. [Bonsai with llama.cpp](/docs/build-and-run/bonsai-llamacpp) | A command or documented manual path that a reviewer can repeat |
| Quality, latency, memory, energy, or offline behavior | Benchmark harness pages | Benchmark schema and recorded run details |
| Architecture, KV cache, kernels, or training methods | Explainers under [Technical Guides](/docs/technical-guides/kv-cache) | Primary docs, papers, or official project docs |
| X/Twitter signal or third-party amplification | Research notes first | Durable official source before publication. Claims from X stay labeled "discovery, needs primary source" |

## Move pages through the lifecycle

A page moves through nine states from proposal to publication. Each state has one exit rule, and the person named in the rule decides when the page moves forward. For example, a draft recipe cannot reach Runnable checked until someone repeats its setup on a real machine.

| State | Exit rule |
| --- | --- |
| Proposed | Intake card has owner, reviewer, source state, output, and acceptance test |
| Accepted | Maintainer confirms the page belongs in the wiki architecture |
| Draft | Page owner writes the first version and links all sources |
| Source checked | Docs librarian verifies claims and marks gaps |
| Runnable checked | Recipe author or reviewer repeats the setup, prompt, benchmark, or manual flow |
| Reviewed | Reviewer checks clarity, audience fit, source status, and acceptance test |
| Published | DevRel maintainer approves and assigns refresh date |
| Refresh due | Page owner checks links, source status, and current runtime behavior |
| Retired or quarantined | Maintainer removes stale or unsupported public claims |

{% callout type="warning" title="Recipes and the Runnable checked gate" %}
A recipe that no one has run stays labeled "not verified" and must ship with an acceptance test a reviewer can repeat, e.g. "A reviewer can start a local OpenAI-compatible server and run one prompt." It cannot pass Runnable checked on the author's word.
{% /callout %}

## Assign owners to pages

Every page area has a default owner, a required reviewer, and an event that triggers a refresh. When you take on a page, check this table to see who reviews your work and what event means the page needs another look.

| Page | Primary owner | Required reviewer | Refresh trigger |
| --- | --- | --- | --- |
| Orientation | DevRel maintainer | Docs librarian | Thesis or map changes |
| Small-model state of the art | Researcher | Docs librarian | New model family, benchmark, or architecture source |
| Runtime and KV cache | Runtime page owner | Recipe author or benchmark owner | Runtime release or recipe change |
| Training and alignment | Training page owner | Benchmark owner | New fine-tuning or alignment path |
| PrismML integration guide | PrismML liaison | Docs librarian | PrismML release, model card change, or app update |
| Benchmark harness | Benchmark owner | DevRel maintainer | New metric, task suite, or published result |
| Contribution guide | DevRel maintainer | External contributor reviewer | Contributor friction or workflow change |
| Runtime recipes | Recipe author | Runtime validator | Runtime, model file, device, or command change |
| Ecosystem entries | Page owner | Layer owner | Source change or owner change |

Every maintained page records its ownership in the page frontmatter or the issue tracker. Record the page owner, reviewer, source owner, supply chain layer, last source check, last runnable check, next refresh date, and current status. Readers never see this record, so keep it out of the page body.

## Keep pages current

Run these checks on a schedule so pages do not go stale between releases.

| Cadence | Task |
| --- | --- |
| Weekly | Triage new intake cards and assign owners |
| Weekly | Review source hygiene blockers and quarantined claims |
| Every release or model update | Refresh PrismML pages and runtime recipes |
| Monthly | Check priority backlog items and retire stale work |
| Before publication | Complete the acceptance test and ownership record |

## Write and review to the standard

Apply these rules before writing or reviewing any page:

1. Name the reader by role, not by vague interest.
2. State the reader's task, e.g. run, compare, or verify.
3. Classify the topic under exactly one supply chain layer in the frontmatter, and keep that classification out of the reader prose.
4. Convert social or search discoveries into source tasks before publishing claims.
5. Prefer runnable proof and benchmark logs over broad assertions.
6. State uncertainty in plain reader language, e.g. "These commands come from the upstream docs; we have not yet run them on hardware."
7. End every page with a next step the reader can click.

## Next steps

- Check the sourcing rules your work must meet in the [source policy](/docs/sources/source-policy).
- Trace how product claims get verified in the [PrismML claim/source matrix](/docs/prismml/claim-source-matrix).
- Send new contributors to the [contributor guide](/docs/contribute/contributor-guide).
