---
title: Evaluation Harness
status: draft
audience: Benchmark contributor
owner: Benchmark owner
source_tier: internal_standard
benchmark_status: not_run
last_reviewed: 2026-07-06
---

The evaluation harness is a fixed protocol for measuring how a model actually behaves on a real device. It covers answer quality, speed, memory use, and energy use when you can measure it. On this page you can pick the prompts to run, record your results in a standard report, and check that your report is complete enough for someone else to repeat. {% .lead %}

No one has run this protocol on hardware yet. Your run can be the first published report.

## Run the first task suite

Run these prompts against your model and keep the raw output. The suite is small on purpose, so one session on one device is enough.

- One simple explanation prompt.
- One code or reasoning prompt.
- One question-answering prompt over a local document.
- One summarization prompt.
- One long-context prompt, which puts pressure on the KV cache.
- One image-generation prompt if you are testing a Bonsai Image path. This one is optional.

If you have not set up a runtime yet, start with the [Bonsai on llama.cpp recipe](/docs/build-and-run/bonsai-llamacpp) and come back here with a working model.

## Record your run

Write down your results in a device report while the run is still on screen. The report is a plain list of fields. For example, under "Decode tok/s" you would write the tokens per second your runtime printed during generation, and under "Command" you would paste the exact command you ran, flags included.

Copy this template and fill in every field you can:

```markdown
- Date:
- Operator:
- Device:
- OS:
- CPU:
- GPU:
- RAM / VRAM:
- Runtime:
- Runtime commit:
- Model:
- Model file:
- Quantization / format:
- Command:
- Prompt set:
- Output sample:
- TTFT:
- Prompt processing tok/s:
- Decode tok/s:
- Peak memory:
- Power / energy method:
- Offline mode verified:
- Failure notes:
```

Leave a field blank rather than guess. A blank field is honest and a guessed number is not.

## Know what each dimension needs

Each measurement is only useful if you record enough context to repeat it. For example, a decode speed of 14 tokens per second means nothing without the model file, the quantization, and the device it ran on.

| Dimension | What to record |
| --- | --- |
| Quality | The task, the prompt set or dataset, and how you scored the output. |
| Latency | Time to first token, prompt processing speed, and decode speed. |
| Memory | Peak RAM or VRAM, the model file, and the context length. |
| Energy | The device, how you measured power, and the token rate at that power. |
| Runtime | The runtime, its commit, the flags, and the backend path. |
| Device fit | Whether it works offline, how hard install was, and any thermal notes. |

## Check that your report is complete

A report is complete when someone else can repeat your run from the page alone. That means it names the model, the runtime, the device, the exact command, and the date, and it points to the raw output or a log. Do not cite a benchmark number anywhere on this site until its report meets that bar.

## Next steps

- [Run Bonsai on llama.cpp](/docs/build-and-run/bonsai-llamacpp) to produce your first numbers to report.
- Submit your report row via the [contributor guide](/docs/contribute/contributor-guide).

See something wrong? [Fix it](/docs/contribute/contributor-guide).
