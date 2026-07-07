---
title: DevRel Playbooks
status: published
audience: DevRel
owner: DevRel maintainer
source_tier: mixed
benchmark_status: not_applicable
last_reviewed: 2026-07-07
---

A DevRel playbook is a short, repeatable procedure for a recurring community task, such as announcing a release or preparing a live demo. {% .lead %}

This page gives you four playbooks for PrismML work. You can write a launch brief, run office hours, check a demo before you give it, and route community feedback to the right owner.

{% callout type="note" title="These playbooks are untested" %}
Nobody has run these playbooks yet. The steps and success metrics below are our best proposal, not a record of what worked. If you run one, tell us what happened so we can correct it.
{% /callout %}

## Write a launch brief

When PrismML ships a new model, updates a model card, or changes a runtime fork, write a brief that the community team can publish within 48 hours. The brief answers launch-day questions with sourced facts only. Before you publish, check every claim against the [claim and source matrix](/docs/prismml/claim-source-matrix). The matrix is the table where we record each public claim about PrismML next to the official source that backs it. A claim with no matching official source stays out of the brief and goes through the [source policy](/docs/sources/source-policy) instead.

For example, if PrismML releases a new Bonsai build, your brief lists the release date, links the official repo and model card, describes what changed in one plain paragraph, and states which wiki pages and recipes the change touches. It also lists what we do not claim yet, so an advocate on stage knows where the line is.

Use this template:

```markdown
### Launch brief

- Release name and date:
- Official sources (repo / model card / company post URLs):
- What changed (one paragraph, no adjectives without sources):
- Claims added to matrix (link rows):
- Affected wiki pages and recipes:
- Runtime/device support changes (source URL per claim):
- Talking points a DA can say without overclaiming:
- Things we do NOT claim yet (open questions):
- Demo asset to use (see the demo checklist below):
- Owner / reviewer / publish date:
```

The PrismML liaison owns the brief and the docs librarian reviews it. During launch week, turn every question the brief cannot answer into a backlog card so the next brief can answer it. The brief succeeds when every published claim has a verified or partially verified matrix row.

## Run office hours

Hold a live session where contributors ask questions about recipes, benchmarks, and ecosystem entries. A Developer Advocate hosts, and the recipe author or benchmark owner joins when the agenda touches their work. We suggest a weekly session, plus an extra one after each launch brief, but the source docs do not fix a cadence, platform, or time zone yet.

Give every question one of three exits:

- Answer it with a link to a wiki page.
- Convert it into a backlog card with a named owner.
- Log it as an open question on the page it belongs to.

The session succeeds when every question has a recorded exit. If the same question comes back a second time, fix the page instead of repeating the answer.

Use these standing assets instead of improvising material:

- [Inference The Hard Way](https://chaiwithjai.github.io/inference-the-hard-way/) walks through tokenization, KV cache, decode, and bandwidth. Use it when you explain how PrismML Bonsai inference works. We confirmed the link works on 2026-07-06.
- [Kubernetes The Hard Way](https://bootstrap-your-own-k8s.netlify.app) covers serving and cluster questions. The source repo is [github.com/ChaiWithJai/kubernetes-the-hard-way](https://github.com/ChaiWithJai/kubernetes-the-hard-way).
- The [Bonsai llama.cpp recipe](/docs/build-and-run/bonsai-llamacpp) is the target for live runs and the device report walkthrough.

## Check a demo before you give it

Do not ship a demo that a reviewer could not reproduce from the wiki alone. Before any talk, office-hours session, or partner meeting that includes a live run, work through this checklist. The recipe author prepares the demo and the runtime validator signs off.

```markdown
### Demo readiness checklist

- [ ] Recipe page exists and its commands come from checked upstream sources
- [ ] Runtime built from a named commit or release
- [ ] Model file downloaded from an official model card URL
- [ ] Environment record filled (device, OS, RAM/VRAM, runtime commit)
- [ ] Dry run completed within 48h of the session; TTFT and tokens/sec noted
- [ ] Offline mode tested if the demo claims local/offline operation
- [ ] Fallback: recording or screenshots for the failure case
- [ ] Every number said aloud has a claim-matrix row or is labeled "my machine, one run"
```

The environment record block lives in the [Bonsai llama.cpp recipe](/docs/build-and-run/bonsai-llamacpp). If a checklist item fails, fix the recipe or add a troubleshooting entry before the next demo. The demo succeeds when it runs from documented commands at a named runtime commit, and when you have stated, not assumed, how it behaves offline.

{% callout type="warning" title="Numbers on stage" %}
A demo is a benchmark claim delivered out loud. Latency, tokens per second, and memory figures you say in a session follow the same source rules as published pages. Each figure needs a claim-matrix row, or you say plainly that it comes from a single run on your machine.
{% /callout %}

## Route community feedback

When a question, bug report, benchmark dispute, or social post comes in, send it to the owner who can act on it. The Community Manager routes each signal, and the weekly triage in the [operating model](/docs/governance/operating-model) reviews what was routed. A signal that sits unrouted for more than a week goes to the DevRel maintainer.

For example, if someone posts on X that Bonsai runs at 40 tokens per second on an iPhone, do not publish that number. Record it as a discovery note, then look for a run a reviewer can repeat. Nothing we publish rests only on an X or Twitter post.

Route each signal by what it is about:

| Signal is about | Route to | Required proof before publication |
| --- | --- | --- |
| PrismML model claims, file size, license, device support | PrismML pages and the claim/source matrix | Official PrismML post, repo, model card, paper, or app page |
| llama.cpp, MLX, Ollama, LM Studio, WebGPU, iPhone paths | Runtime recipe backlog | A command a reviewer can repeat |
| Quality, latency, memory, energy, offline behavior | Benchmark harness | Benchmark schema and recorded run details |
| Architecture, KV cache, kernels, training methods | Concept explainers | Primary docs or papers |
| X/Twitter signal or third-party amplification | Research notes first | A durable official source |

Routing succeeds when every signal lands with an owner within one weekly triage cycle, and when no published claim rests only on a social post.

## Run one first

If you want to put these playbooks to work, start with the demo checklist. Run it against the [Bonsai llama.cpp recipe](/docs/build-and-run/bonsai-llamacpp) on one device and attach the filled environment record and checklist to an issue titled "First demo-readiness run: Bonsai llama.cpp". That single run also produces the first device report the recipe needs.

## Next steps

- Read the [source policy](/docs/sources/source-policy) to see the rules every brief and demo figure must pass.
- Check the [claim and source matrix](/docs/prismml/claim-source-matrix) before you publish any claim.
- See the [contributor guide](/docs/contribute/contributor-guide) for how to file cards and log a playbook run.
