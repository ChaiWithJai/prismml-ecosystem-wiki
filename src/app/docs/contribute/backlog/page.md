---
title: Contribution Backlog
status: published
audience: Community maintainer
owner: DevRel maintainer
source_tier: internal_standard
benchmark_status: not_applicable
last_reviewed: 2026-07-07
---

The contribution backlog is the ordered list of work this wiki needs next, from hardware verification to new runtime recipes. Pick a task below, file it as an issue with the template on this page, and you have a scoped piece of work you can finish on your own. {% .lead %}

## Pick a task

Each task names what you produce and how we accept it. The acceptance test is the check a reviewer runs before the work merges, so read it before you start. For example, the first P0 task asks you to run llama.cpp on an Apple Silicon machine, record a device report, and update the recipe. It is accepted when another reviewer can reproduce one prompt from your notes.

P0 tasks block other work, so take one of those first if you can.

| Priority | Task | You produce | Accepted when |
| --- | --- | --- | --- |
| P0 | Verify llama.cpp on Apple Silicon. | Device report and recipe update. | Another reviewer can reproduce one prompt. |
| P0 | Complete the PrismML claim/source matrix. | Dated source rows. | Every numeric claim has a durable source or is marked unverified. |
| P1 | Add an MLX Bonsai recipe. | New recipe page. | Install, model, prompt, output, and failure notes are recorded. |
| P1 | Add a runtime compatibility matrix. | Table covering llama.cpp, MLX, Ollama, LM Studio, WebGPU, and iOS. | Each row has a status and an evidence requirement. |
| P1 | Add a KV cache visual. | Diagram or table showing cache growth. | A reader can calculate cache memory from architecture fields. |
| P2 | Build the Inference Inspector spec. | Capstone spec page. | Phase bar, KV gauge, bandwidth ledger, and token stream are defined. |
| P2 | Add a source queue workflow. | Intake template. | A contributor can submit a source task without a maintainer meeting. |

Pick the task that matches your skills. The P0 verification task needs the hardware and a terminal. The claim/source matrix needs someone comfortable tracing citations. The recipe and compatibility tasks need a contributor who runs models locally, and the visual and spec tasks fit writers and demo builders.

## File the issue

Copy this template into a new issue and fill in every heading. A blank heading usually means the task is not scoped yet, so ask in the issue rather than guessing.

```markdown
## Task

## Page route

## Audience job

## Source inputs

## Output artifact

## Acceptance test

## Reviewer

## Known gaps
```

## Check your work before you ask for review

Your task is done when all of these are true:

- The page route exists.
- The page frontmatter is updated.
- Every claim on the page names its source, or says plainly that it is unverified.
- The page says honestly whether anyone has run its commands on hardware.
- Anything you could not resolve is written on the page, not left out.

## Next steps

- Read the [contributor guide](/docs/contribute/contributor-guide) for how review works end to end.
- Check the [source policy](/docs/sources/source-policy) before you add or cite a source.
- See the [claim/source matrix](/docs/prismml/claim-source-matrix) if you take the P0 sourcing task.
