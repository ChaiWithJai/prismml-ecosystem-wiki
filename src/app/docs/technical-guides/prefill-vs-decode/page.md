---
title: Prefill Versus Decode
status: published
audience: DevRel engineer
owner: Technical writer
source_tier: course_material
benchmark_status: not_run
last_reviewed: 2026-07-07
---

Prefill and decode are the two phases of running a language model. Prefill reads your whole prompt at once, and decode generates the answer one token at a time. On this page you learn why the two phases hit different hardware limits, and how to measure each one so your speed claims are precise. {% .lead %}

{% system-model highlight="prefill-decode" /%}

This guide pairs with Lab 04 of [Inference The Hard Way](/docs/learning-paths/inference-the-hard-way).

## Tell the two phases apart

When you send a prompt to a runtime like llama.cpp, the runtime first processes every prompt token in one batch. This is prefill. Because the work is batched, the chip's compute units are usually the limit, and the number you feel is time to first token.

{% concept-diagram name="prefill-decode" /%}

After prefill, the runtime generates the reply one token at a time. This is decode. For each new token, the runtime streams the model weights from memory again, so memory bandwidth is usually the limit, and the number you feel is the gap between tokens.

| Phase | What happens | Usual bottleneck | What to measure |
| --- | --- | --- | --- |
| Prefill | The runtime processes prompt tokens in parallel. | Compute, because work is batched across prompt tokens. | Prompt processing throughput and time to first token. |
| Decode | The runtime generates one token at a time. | Memory bandwidth, because weights are streamed repeatedly. | Generation throughput and the time between tokens. |

## Understand why compression helps decode more

During decode with a batch size of one, you can approximate the top speed of a generation step with:

```text
max tokens/sec ~= memory bandwidth / bytes per forward pass
```

If a model format moves fewer bytes per forward pass, decode can get much faster. Prefill may not improve by the same ratio, because prompt tokens already share weight reads across parallel work. So a claim like "compression made the model 3x faster" is incomplete until it says which phase it measured.

## Measure both phases

llama.cpp ships a benchmark tool that measures the two phases separately. Run it like this:

```bash
./build/bin/llama-bench -m <bonsai-8b.gguf> -p 512 -n 128
```

The `-p 512` flag measures prefill on a 512-token prompt, reported as `pp512` in tokens per second. The `-n 128` flag measures decode over 128 generated tokens, reported as `tg128`. Run the same command on a baseline model, e.g., an FP16 or Q4 build of the same weights, so you can compare like with like. This command comes from the upstream llama.cpp docs; we have not yet recorded a run on hardware.

## Write a precise speed claim

Never write "Bonsai is X times faster" without saying:

- Which phase, prefill or decode.
- Which model and baseline.
- Which runtime.
- Which device.
- Which benchmark command.
- Which date and commit or release.

A claim scoped this way holds up when someone else reruns it. A claim without this scope cannot be checked, so treat it as unverified.

## Next steps

- [Weights on disk](/docs/technical-guides/weights-on-disk) explains the model formats whose byte counts set the decode speed limit.
- [KV cache](/docs/technical-guides/kv-cache) covers the memory that grows during decode, if you have not read it yet.

See something wrong? [Fix it](/docs/contribute/contributor-guide).
