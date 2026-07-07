---
title: Wiki Evaluation Rubric
status: published
audience: Wiki reviewer
owner: Docs librarian
source_tier: internal_canonical
benchmark_status: not_applicable
last_reviewed: 2026-07-07
---

The evaluation rubric is the scoring standard that decides whether a page in this wiki is ready to publish. Use it to score a submitted page, check the hard gates, and assign one review outcome. {% .lead %}

## Score the six dimensions

Score each dimension from 0 to 3. The maximum total is 18, and a publishable page normally scores at least 15 with no hard gate failures. For example, a page that names its reader, prerequisites, and desired outcome scores 3 on stated audience. If the same page lists commands the author never ran without saying so, it scores 1 on runnable paths and also fails a hard gate.

| Dimension | 0 | 1 | 2 | 3 |
| --- | --- | --- | --- | --- |
| Stated audience | No reader or job named | Generic audience only | Reader and use case named | Reader, prerequisites, desired outcome, and non-goals are clear |
| Canonical source hygiene | Unsourced or social-only claims | Some sources, weak provenance | Primary sources used for major claims | Claim, source, date, and status are traceable, and X is discovery only |
| Runnable paths | No run path or verification state | High-level instructions only | Commands or workflow included, with gaps marked | Minimal path, expected result, environment, and failure notes are reproducible |
| Visual comprehension | No map or table where needed | Visual exists but does not clarify | Table or diagram clarifies the layer or flow | Visual makes the system easier to review and labels its assumptions |
| Contribution usefulness | No next action | Vague "contribute" language | Specific tasks or gaps listed | Issue-ready work with output, owner type, acceptance test, or template fields |
| Benchmark and eval clarity | Quality claims are untested | Metrics named without protocol | Benchmark status and metrics are explicit | Task, dataset or prompt set, device and runtime, quality, latency, memory, energy, and regression checks are clear |

### Read the total as a band

| Total | Band | Action |
| --- | --- | --- |
| 16 to 18 | Canonical | Publish or promote as a reference page. |
| 13 to 15 | Useful draft | Publish only if hard gates pass and TODOs are explicit. |
| 9 to 12 | Contributor note | Keep in the backlog or draft area. |
| 0 to 8 | Not ready | Rework around sources, audience, and verification. |

## Check the hard gates first

A hard gate is a rule that fails the page no matter how high it scores. Check the gates before you score, because scoring a page that fails a gate wastes your time and risks publishing unverified public claims. Fail the page until fixed if any item is true:

1. A product, benchmark, compression, licensing, device, or performance claim lacks a primary source and is not marked unverified.
2. X posts, search snippets, or third-party enthusiasm are treated as canonical evidence.
3. A recipe implies it was run but lacks device, runtime, version, or output details.
4. Benchmark language mixes marketing claims with measured results.
5. Open questions are presented as facts.
6. Unapproved or rumored claims, such as unreleased product names, appear in public-facing copy.

{% callout title="Gates before scores" type="warning" %}
If any gate fails, assign the quarantine label or return the page to the author without scoring it.
{% /callout %}

## Work through the review checklist

Score the dimensions in this order.

**Audience and scope.** The first section says who the page is for and what task it helps with, such as learn, install, compare, benchmark, verify, or contribute.

**Sources.** Every important claim has a source URL, a date, and a verification status. Official docs, repos, model cards, papers, and company posts count more than social posts. Social links stay as discovery context and are paired with durable official sources. Source gaps are listed separately from confirmed facts.

**Runnable or inspectable path.** Commands, setup steps, model and runtime versions, hardware assumptions, and expected output are present when the page has a run path. If the author did not run the path, the page says so plainly, e.g., "These commands come from the upstream docs; we have not yet run them on hardware", and explains what evidence is missing. See [the Bonsai llama.cpp recipe](/docs/build-and-run/bonsai-llamacpp) for a page that does this well.

**Visual and structural clarity.** Tables summarize ecosystem entries, runtime compatibility, or device results. Diagrams explain the supply chain flow or system boundaries. Each visual should remove ambiguity, not decorate the page.

**Contribution value.** The page gives the reader a concrete next step. A new contributor can submit a source update, recipe, benchmark run, or correction without asking where to start.

**Benchmark and eval.** Benchmark status is one of `not_run`, `partial`, `reproducible`, or `published`. `not_run` means no one has run the benchmark yet. Metrics match the deployment target, e.g., latency and memory for an on-device page. Evaluation claims name the task, prompt set or dataset, runtime, hardware, model variant, quantization, date, and regression expectation.

## Rate sources by tier

When you audit the source hygiene dimension, place each source in a tier. A lower tier number means stronger evidence.

| Tier | Use | Examples |
| --- | --- | --- |
| Tier 0: Canonical primary | Strong basis for facts and claims | Official docs, repositories, model cards, papers, release posts |
| Tier 1: Primary-adjacent | Useful context. Verify exact claims elsewhere. | Maintainer talks, company blogs, official demos |
| Tier 2: Reproducible community evidence | Useful if the method and environment are visible | Independent benchmark logs, runnable notebooks, issue threads with maintainer confirmation |
| Tier 3: Discovery signal | Good lead, not canonical | X posts, newsletters, podcasts |
| Tier 4: Unsupported | Do not publish as fact | Search snippets, rumors, unattributed claims |

## Confirm the community value checks

Before you publish, confirm each statement is true:

1. A new contributor can identify the intended reader and a useful next action in under five minutes.
2. A maintainer can trace every important claim to a durable source.
3. A builder can run, reproduce, or knowingly skip the documented path.
4. A reviewer can tell what is measured, what is assumed, and what remains unverified.
5. The page improves the shared ecosystem map instead of duplicating generic ML background.
6. The page produces a durable artifact, such as a doc, a runnable recipe, a benchmark result, or a contribution template.

## Assign one outcome label

End every review with exactly one label.

| Label | Meaning |
| --- | --- |
| `canonical` | Passes the hard gates and scores 16 to 18. |
| `publish-with-todos` | Passes the hard gates, scores 13 to 15, and lists its remaining gaps. |
| `draft` | Useful but incomplete. Visible to contributors only, with gaps made explicit. |
| `quarantine` | Contains unverified public claims, source-risk issues, or misleading benchmark language. Fix before any further review. |

## Next steps

- Apply the tiers in detail with the [source policy](/docs/sources/source-policy).
- See how a scored review fits the full workflow in the [operating model](/docs/governance/operating-model).
- Submitting a page yourself? Start with the [contributor guide](/docs/contribute/contributor-guide).
