---
title: "What does a hospital CTO actually ask before running a model on-prem?"
description: "Regulated buyers evaluate in order: risk first (data residency, audit trails, liability), feasibility second, features last. Lead with capability and demos stall."
audience: ml-product-team
pillar: end-user-case-study
book: transcript-theme
chapter_ref: "Theme 3: How regulated end users evaluate local AI"
status: published
last_reviewed: 2026-07-07
---

The order of evaluation is the surprise. A hospital CTO asks about risk first, e.g., where patient data lives and who is liable when the model fails. Feasibility comes second, meaning whether the model runs on hardware the hospital can own with the staff it already has. Features come last. A pitch that opens with capability answers the third question before the buyer has asked the first, and that is why demos alone stall. {% .lead %}

## Learn the order a regulated buyer uses

On-prem means the model runs on servers the hospital owns, inside its own network. The transcripts behind Theme 3 show the same pattern across regulated end users. The CTO works through three groups of questions in a fixed order, and does not move to the next group until the current one is settled.

**Risk questions come first.** These are the questions the CTO must answer to a board, a regulator, or a lawyer.

- Where does patient data live, and does any of it leave our network?
- Who can audit what the model saw and what it produced?
- If the model output harms a patient, who is liable, us or the vendor?
- What happens to our data if the vendor shuts down or is acquired?

**Feasibility questions come second.** These are the questions the CTO must answer to the operations team.

- Does the model run on hardware we can buy and rack ourselves?
- Can our current staff operate it, or does it need a hire we do not have budget for?
- What breaks when the model needs an update?

**Feature questions come last.** Only after the first two groups are settled does the CTO ask what the model can do, how accurate it is, and how fast it responds.

The order is not a preference. It reflects who can say no. A regulator or a lawyer can kill the project at the risk stage, and no feature can save it there. So the CTO spends attention in the order the vetoes arrive.

## Work through the arithmetic the CTO runs at the feasibility stage

The feasibility stage has real numbers in it, so here is a worked example. Suppose the proposal is a 70 billion parameter model quantized to 4 bits, which means each weight is stored in half a byte.

- Weight memory: 70 billion parameters x 0.5 bytes = 35 GB.
- Working memory for the cache and overhead: add roughly 20 percent, so plan for about 42 GB of GPU memory.
- That fits on one 48 GB card, or two 24 GB cards with the model split across them.

A single server with one 48 GB workstation card costs somewhere in the range of $15,000 to $30,000. That range is an estimate from public list prices in mid 2026, not a benchmark, so check current prices before you quote it. The CTO will also add a second server for failover and a fraction of an engineer to own updates and monitoring. If that fraction is a quarter of a $180,000 salary, the staffing line is $45,000 per year, which is larger than the hardware line. The staffing question is usually the one that decides feasibility, not the GPU.

If you want the deeper version of this sizing arithmetic, see [how much VRAM you need to run an LLM](/blog/how-much-vram-to-run-an-llm).

{% callout type="warning" %}
Do not quote accuracy or throughput numbers to a regulated buyer unless you can show how they were measured. The transcripts show CTOs treating an unsourced benchmark claim as a risk signal about the vendor, which moves the conversation backward to the risk stage.
{% /callout %}

## Reorder your pitch to match the buyer

Most technical pitches and READMEs are written in the reverse order. They open with features, mention deployment in the middle, and put security and compliance in an appendix. That structure forces the CTO to read to the end before the first question gets an answer.

To fix it, restructure the material so it answers the questions in the order the CTO asks them.

1. Open with the risk answers. State where data lives, what gets logged, and what the vendor is liable for. Link the audit documentation.
2. Follow with the feasibility answers. State the exact hardware requirement, the update process, and the skills needed to operate it.
3. Close with the features. By this point the reader has permission to care about them.

The demo still has a place. It belongs after the risk conversation, as evidence for the feature claims, not as the opening move.

## Try it

This takes about 25 minutes.

1. Take 10 minutes and write the first ten questions a hospital CTO would ask about your on-prem proposal. Write them as the CTO would say them, not as your documentation is organized.
2. Label each question R for risk, F for feasibility, or X for features. Count each label.
3. Now audit your own README or pitch deck. From the repo root, list the section headings in reading order:

   ```bash
   grep -n "^#" README.md
   ```

4. Label each heading R, F, or X the same way.
5. Compare the two orderings. Note the first R heading in your README and how many X headings appear before it.

## Check yourself

- **Which two sections of your README would you move to the top?** Expected answer: the two sections that carry your R labels, typically security or data handling and deployment requirements. If you cannot name two, your README does not answer the risk questions anywhere, which is a bigger finding.
- **In your ten CTO questions, how many were risk questions?** Expected answer: four or more. If you wrote mostly feature questions, rewrite the list from the point of view of someone who reports to a board.
- **Where does the demo belong in the restructured pitch?** Expected answer: after the risk answers, as evidence for the feature claims.

## Next steps

- Read the [regulated deployment case study](/docs/case-studies/regulated-deployment) for a full account of one buyer's evaluation.
- Work through the [on-prem checklist runbook](/docs/runbooks/on-prem-checklist) before your next proposal.
- If the feasibility numbers above were new to you, start with [how much VRAM you need to run an LLM](/blog/how-much-vram-to-run-an-llm).

When you can do this, you can reconstruct a regulated buyer's evaluation sequence and restructure a technical pitch to match it.
