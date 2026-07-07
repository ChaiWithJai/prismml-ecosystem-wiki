---
title: Device Benchmark Schema And Task Suite
status: draft
audience: Benchmark contributor
owner: Benchmark owner
source_tier: internal_standard
benchmark_status: not_run
last_reviewed: 2026-07-06
---

A device report is a record of one benchmark run. It captures which model you ran, on which machine, with which runtime, and how fast it went, so that someone else can compare your numbers with theirs or repeat the run. On this page you can copy the report format, pick a standard task to measure, and learn how to mark what your row does and does not prove. {% .lead %}

## Record a run

Each report is one CSV row or one JSON object. Here is the CSV header to copy:

```csv
date,operator,device,os,ram_gb,vram_gb,runtime,runtime_commit,model,model_file,quantization,prompt_set,ttft_ms,prompt_tok_s,decode_tok_s,peak_mem_gb,power_w,power_method,repro_notes,caveats,benchmark_status
```

Here is the same report as JSON. This example shows the shape only. It is not a measured result, which is why the metric fields are null.

```json
{
  "date": "2026-07-06",
  "operator": "contributor-handle",
  "device": "MacBook Pro 14 M3 Pro",
  "os": "macOS 15.5",
  "ram_gb": 36,
  "vram_gb": null,
  "runtime": "llama.cpp",
  "runtime_commit": "<commit-hash>",
  "model": "Bonsai-8B",
  "model_file": "Bonsai-8B-Q1_0.gguf",
  "quantization": "Q1_0 GGUF",
  "prompt_set": "suite-v1/summarization",
  "ttft_ms": null,
  "prompt_tok_s": null,
  "decode_tok_s": null,
  "peak_mem_gb": null,
  "power_w": null,
  "power_method": "",
  "repro_notes": "llama-cli command, flags, model card URL, log path",
  "caveats": "example row only",
  "benchmark_status": "not_run"
}
```

If you want the step-by-step protocol for running a benchmark, see the [evaluation harness](/docs/benchmarks/evaluation-harness). This page is the reference for the data that run produces.

## Fill in each field

Every field is required unless the rule says otherwise. Field names are the CSV column names.

| Field | Type | Rule |
| --- | --- | --- |
| `date` | ISO 8601 date | Date of the run, not of submission. |
| `operator` | string | Your contributor handle. |
| `device` | string | Marketed name plus chip, e.g. "MacBook Pro 14 M3 Pro". |
| `os` | string | OS and version. |
| `ram_gb` | number | Total system RAM. |
| `vram_gb` | number or empty | Only when VRAM is separate from RAM. |
| `runtime` | string | Runtime name, e.g. llama.cpp, vLLM, SGLang, MLX. |
| `runtime_commit` | string | Commit hash or release tag. Without it no one can repeat your run. |
| `model` | string | Model name as it appears on the model card. |
| `model_file` | string | Exact filename, e.g. `Bonsai-8B-Q1_0.gguf`. |
| `quantization` | string | Quantization or format label from the model card. |
| `prompt_set` | string | Task suite ID from this page, e.g. `suite-v1/summarization`. |
| `ttft_ms` | number | Time to first token, in milliseconds. |
| `prompt_tok_s` | number | Prompt processing throughput. |
| `decode_tok_s` | number | Decode throughput. This is the headline "tok/s". |
| `peak_mem_gb` | number | Peak RAM or VRAM during the run. |
| `power_w` | number or empty | Optional. Leave blank unless you name a measurement method. |
| `power_method` | string or empty | Required whenever `power_w` is filled. |
| `repro_notes` | string | Command or manual flow, flags, model card URL, log location. |
| `caveats` | string | Thermal throttling, background load, first-run cache effects. |
| `benchmark_status` | enum | `not_run`, `partial`, `reproducible`, or `published`. See below. |

{% callout type="warning" title="Empty is honest" %}
Leave a metric blank rather than estimating it. A blank field only means the row is incomplete. An invented number makes the whole row untrustworthy.
{% /callout %}

## Pick a task from the suite

The task suite gives every run the same prompts, so a `decode_tok_s` number from your laptop can be compared with one from someone else's desktop. The suite ID is `suite-v1`, and each task ships as one prompt set.

For example, `suite-v1/summarization` gives the model a fixed article and asks for a summary within a length bound. You record the speed numbers from that run, and you check that the summary kept the facts and stayed within the bound.

| Task ID | What it exercises | Pass signal |
| --- | --- | --- |
| `suite-v1/coding` | One code generation or code reasoning prompt. | Output compiles or a human confirms correct logic. |
| `suite-v1/summarization` | Fixed article to a summary within a length bound. | Facts are preserved and the length bound is respected. |
| `suite-v1/extraction` | Structured fields from messy text into JSON. | Output parses and fields match a key. |
| `suite-v1/tool-use` | Prompt requiring a correctly formed tool call. | Tool name and arguments are valid. |
| `suite-v1/doc-qa` | Question over a local document in context. | Answer grounded in the document, not prior knowledge. |
| `suite-v1/image-gen` | One image prompt, only for image-capable paths such as Bonsai Image. | Image renders. Size, steps, seed, and total latency are recorded. |

Image runs also record the prompt, image size, steps, seed, and total latency. These fields match the image table in the device report template.

## Measure KV cache reuse

The KV cache microbench measures how much faster a runtime answers when it can reuse work from an earlier prompt. Send N prompts that share one long fixed prefix and have short varying suffixes. Then compare time to first token between the first request, which is cold, and the later requests, which are warm.

This protocol comes from the runtimes' own docs. No one has run it on hardware yet, so treat the steps as a starting point rather than a proven recipe. Run it on each runtime that serves your model, where supported:

- [vLLM](https://github.com/vllm-project/vllm). Use the automatic prefix caching path.
- [SGLang](https://github.com/sgl-project/sglang). Use the RadixAttention prefix reuse path.
- [llama.cpp](https://github.com/ggml-org/llama.cpp). Use `llama-server` with prompt caching, as in the [Bonsai recipe](/docs/build-and-run/bonsai-llamacpp).

Record one report row per runtime. Set `prompt_set` to `kv-cache-v1` and put the warm and cold TTFT numbers in `repro_notes`.

## Check quality, not just speed

A speed number is misleading if the model got faster by getting worse, so every complete report pairs its metrics with two kinds of quality evidence.

1. **Human rubric.** Record the task, the expected behavior, the observed behavior, your rating, any failure modes, and a path to the output. This matches the "Quality Notes" block of the device report template and stays separate from the latency and memory numbers.
2. **Automated checks.** Run parse checks for `extraction` and `tool-use` (valid JSON, valid tool call), length bounds for `summarization`, and exact-match or containment checks for `doc-qa`.

A regression is any check that passed before and fails on a newer model file, quantization, or runtime commit with the same prompt set. When you find one, file it as its own row with `benchmark_status: partial` and name the failing check in `caveats`. Never overwrite the passing historical row.

## Mark what your row proves

The `benchmark_status` field says how far a row can be trusted. Set it honestly.

| Status | What it means |
| --- | --- |
| `not_run` | The protocol is written down and no one has run it. |
| `partial` | You measured something real, but the row is incomplete. Any measurement with the environment fields filled qualifies. |
| `reproducible` | Someone else can repeat your run from the row alone. That requires the command, runtime commit, model file, device, and log location, and a second person has repeated the run with results in an explained range. |
| `published` | A maintainer has reviewed the row as a reference report. |

## Next steps

- [Run Bonsai with llama.cpp](/docs/build-and-run/bonsai-llamacpp) to produce your first row of data.
- [Follow the evaluation harness](/docs/benchmarks/evaluation-harness) for the step-by-step benchmark protocol.
- Submit your report row via the [contributor guide](/docs/contribute/contributor-guide).

See something wrong? [Fix it](/docs/contribute/contributor-guide).
