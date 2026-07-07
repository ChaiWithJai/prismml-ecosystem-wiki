---
title: Evaluation For The Deployment Target
status: published
audience: Benchmark contributor
owner: Recipe author
source_tier: primary_links
benchmark_status: not_run
last_reviewed: 2026-07-07
---

Evaluation is how you check that a model still does its job on the device where it will actually run, not just on a cloud leaderboard. On this page you can pick the right evaluation style for your model, write a task card with an acceptance test, and set up a regression set that survives model and runtime upgrades. {% .lead %}

{% system-model highlight="evaluation" /%}

A local model must be judged on local tasks. That means you track device-level latency, memory, energy, privacy, and offline behavior alongside output quality.

## Choose an evaluation mode

There are three common ways to evaluate a model, and each fits a different question. Arena-style evaluation asks real people which of two outputs they prefer. An automatic task suite scores the model against tasks you define, e.g., "summarize this document and pass an exact-match check". A regression set replays cases the model has passed before to catch anything a change broke.

{% concept-diagram name="evaluation-concepts" /%}

For example, if you quantize Bonsai 8B to a smaller file and want to know whether it is still usable, you would run your automatic task suite first because it is cheap, then check the regression set before you promote the new build.

| Mode | What it measures | When to use it | Cost |
| --- | --- | --- | --- |
| Arena-style human preference | Which output real people prefer in pairwise, anonymized battles. | Ranking general chat quality and catching problems no static benchmark covers. | High, because it needs sustained voter traffic or a paid rater pool. |
| Automatic task suite | Pass or fail on defined tasks with acceptance tests. | Domain-specific deployments and gating before you promote a model or quantization. | Low per run once the tasks are written. |
| Regression set | Whether a new model, runtime, or quantization breaks cases that passed before. | Every upgrade, including a new model version, a new quant format, and a new runtime commit. | Low, but it needs maintenance discipline (see below). |

## Learn from the Arena lineage

The human preference methods this ecosystem uses come from LMSYS and Berkeley.

1. **Chatbot Arena** ([launch blog](https://www.lmsys.org/blog/2023-05-03-arena/), [paper](https://arxiv.org/abs/2403.04132)) runs crowdsourced, pairwise, anonymized model battles scored with Elo-family rating systems. The paper details the Bradley-Terry model and the sampling method. The main finding is that live human preference on real prompts catches quality differences that static benchmarks miss.
2. **Arena-Hard-Auto** ([repo](https://github.com/lmarena/arena-hard-auto)) is an automatic pipeline that selects hard prompts from arena traffic and uses a language model as the judge for pairwise comparison. This removes human raters in exchange for repeatability and speed. Per the repo, it is designed to correlate with human arena rankings. Check the repo for the current correlation numbers before you cite them, because we have not verified them here.

Three lessons transfer to local evaluation:

- Pairwise scoring beats absolute scoring.
- The prompt distribution should come from real usage.
- An automated judge must be validated against human preference before you trust it for gating.

## Record more than quality

Cloud arenas rank quality only. For local deployment, quality is one of six dimensions you should record. When you compare two local combinations of model, runtime, and quantization, record all of these:

| Dimension | Metric | Why it gates deployment |
| --- | --- | --- |
| Quality | Pairwise win rate or task pass rate | The model must still do the job after compression. |
| Latency | Time to first token, tokens per second | Interactive local use is not workable when the first token takes more than a few seconds. |
| Memory | Peak RAM or VRAM, model file size | This determines which devices can run the model at all. |
| Energy | Power draw or battery impact, when you can measure it | Edge and phone deployments are limited by energy. |
| Privacy | What data leaves the device (it should be none) | Privacy is the main reason users choose local inference. |
| Offline | Works with the network disabled after the model download | This separates truly local paths from paths that still need the cloud. |

Record your hardware and software setup with the environment block from [the Bonsai llama.cpp recipe](/docs/build-and-run/bonsai-llamacpp), run the comparison with [the evaluation harness protocol](/docs/benchmarks/evaluation-harness), and report the results in [the device report format](/docs/benchmarks/device-report-schema).

## Write a task card

A task card describes one capability you plan to ship, e.g., local summarization on a phone, along with the bars it must clear. Write one task card per capability. Copy this template verbatim:

```markdown
# Task: <name>
- Layer: evaluation and alignment
- Deployment target: <device class, runtime, model + quantization>
- User story: As a <role>, I need <capability> so that <outcome>.
- Prompt set: <file or URL, with count and date collected>
- Scoring: <exact-match | rubric | pairwise judge | human rater>
- Judge: <human | model name + version, with validation evidence>
- Quality bar: <e.g. >= 85% pass rate on the prompt set>
- Latency bar: <e.g. TTFT < 2s, >= 10 tok/s on the target device>
- Memory bar: <e.g. peak RAM < 6 GB>
- Offline required: yes/no
- Owner: <role>
- Status: not_run | partial | reproducible | published
```

## Write an acceptance test

A task card is only useful when another person can run it and get a clear verdict. The acceptance test is the exact procedure they follow:

```markdown
# Acceptance test: <task name>
1. Environment: record the device report block (device, OS, runtime commit, model file, quantization).
2. Run: <exact command or harness invocation>.
3. Expected: <pass-rate threshold, expected output shape, latency/memory bars>.
4. Evidence: attach raw outputs, scores, TTFT, tok/s, peak memory.
5. Offline check: repeat one run with networking disabled; record result.
6. Verdict: pass/fail against every bar, not just quality.
```

{% callout type="note" %}
These templates come from the upstream methods above. We have not yet run a full cycle from task card to verdict on hardware, so treat them as a starting point rather than a proven protocol.
{% /callout %}

## Maintain a regression set

A regression set is the accumulated list of prompts and tasks a deployment must never fail again. Five rules keep it useful:

1. **Add on failure, not on success.** When a bug report or an arena loss gets fixed, add its prompt to the set.
2. **Pin everything.** Each entry records the model variant, quantization, runtime commit, device class, and the date it last passed. An entry without these pins is useless.
3. **Rerun on every supply-chain change.** A new model version, quant format, runtime commit, or kernel path can each change outputs without warning.
4. **Prune deliberately.** Retire an entry only with a written reason, e.g., the task is obsolete. Never retire one because it is inconvenient to keep passing.
5. **Separate quality regressions from performance regressions.** A model can keep its pass rate while its response time doubles. Both are failures against the deployment target.

## Next steps

- Run these ideas against real numbers with [the evaluation harness](/docs/benchmarks/evaluation-harness).
- Record what you measure in [the device report format](/docs/benchmarks/device-report-schema).

See something wrong? [Fix it](/docs/contribute/contributor-guide).
