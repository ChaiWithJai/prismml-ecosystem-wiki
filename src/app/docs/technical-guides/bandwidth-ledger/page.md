---
title: Bandwidth Ledger
status: migrated
audience: Benchmark contributor
owner: Benchmark owner
source_tier: course_material
benchmark_status: not_run
last_reviewed: 2026-07-06
---

A bandwidth ledger is a record that puts a predicted decode speed next to a measured one, so you can see how close a device gets to its physical limit. {% .lead %}

{% system-model highlight="bandwidth" /%}

On this page you predict the decode speed of a model on your device from two numbers, run a benchmark, and write both results down side by side.

## Predict the decode ceiling

When a model generates one token at a time, the main cost is moving the model's bytes from memory to the compute units. That gives a simple ceiling on decode speed:

{% concept-diagram name="bandwidth-ledger" /%}

```text
max tok/s ~= memory_bandwidth / bytes_per_forward_pass
```

For example, if your device can move 100 GB per second and the model file is 5 GB, the ceiling is about 20 tokens per second. A measured rate above that number means you measured wrong. A measured rate far below it means the runtime is leaving speed on the table.

Make the prediction twice, once for the full-precision model and once for the compressed one:

```text
FP16 bytes/pass:   record exact model size
Q1_0 bytes/pass:   record exact model size
device bandwidth:  record source and method
```

Write down where the bandwidth number came from, e.g., the vendor spec sheet or a memory benchmark you ran. The two sources can differ a lot.

## Fill your ledger row

After the benchmark run, write one row per model with these values:

- Bytes per forward pass, which is the exact model file size for batch-1 decode.
- Predicted tokens per second from the formula above.
- Measured tokens per second from your benchmark run.
- Utilization, which is measured divided by predicted.

This formula and template come from the Inference The Hard Way course. We have not yet recorded a measured run on hardware, so there is no filled example row to compare against yet.

## Compute energy per token

To compute energy per token, you need both power and token rate:

```text
energy per token = power / (3.6 x tokens_per_second)
```

If power rises but tokens finish much faster, energy per token can still fall. Do not publish an energy claim without the device, the measurement method, the token rate, and the formula.

## Report what you measured

A report that someone else can check includes:

- Device model and the source of its memory bandwidth number.
- Runtime name and commit.
- Model file and format.
- The benchmark command you ran.
- Prompt processing throughput.
- Decode throughput.
- Peak memory.
- Power or energy measurement, if you have one.
- An interpretation that is scoped to the phase and hardware you measured.

## Next steps

- Read [Architectures](/docs/technical-guides/architectures) to see how model design changes the bytes you just counted.
- Take the [Inference The Hard Way](https://chaiwithjai.github.io/inference-the-hard-way) course to measure each of these numbers yourself, lab by lab.

See something wrong? [Fix it](/docs/contribute/contributor-guide).
