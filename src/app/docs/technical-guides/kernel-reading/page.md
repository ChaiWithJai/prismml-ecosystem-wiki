---
title: Kernel Reading
status: published
audience: DevRel engineer
owner: Runtime educator
source_tier: course_material
benchmark_status: inspectable
last_reviewed: 2026-07-07
---

Kernel reading means opening the runtime source code and tracing what a compute kernel actually does with a model's weights. {% .lead %}

{% system-model highlight="kernels" /%}

On this page you will learn how to read a quantized matmul kernel and use what you find to confirm or reject a claim about a compressed model format.

This guide pairs with Lab 06 of [Inference The Hard Way](/docs/learning-paths/inference-the-hard-way).

## Know why the file size is not enough

For a compressed format, file size alone does not settle a claim. A runtime could store small weights on disk and still expand them into full FP16 tensors in memory before it multiplies. The question that settles the claim is whether the runtime unpacks compressed weights inside the matmul path without expanding the full tensor in memory. The only place that answer lives is the kernel code, so you read the kernel.

{% concept-diagram name="kernel-reading" /%}

## Answer five questions about the kernel

Work through the kernel source and answer these five questions. Together they trace a weight from its packed form on disk to the multiply that uses it.

1. Which rows, columns, or groups does one thread own?
2. Where is the group scale loaded?
3. Where are packed sign bits loaded?
4. Which shifts, masks, or vector operations unpack the bits?
5. Where does multiply-accumulate happen, and in what precision?

For example, in a llama.cpp quantized matmul kernel you would expect to find a loop where each thread loads a group scale, loads a block of packed bits, unpacks them with shift and mask operations, and accumulates the products into a float. If instead you find a step that writes a full FP16 copy of the tensor before the multiply, the format's memory claim does not hold in that backend.

Once you can answer the five questions for one kernel, compare it against its neighbors. Each family below gives you a different reference point.

| Kernel family | What to compare |
| --- | --- |
| Q1_0_g128 | Scale plus sign-bit unpack path. |
| Q4_0 or Q8_0 | More conventional quantized unpack path. |
| FP16 baseline | No compressed unpack path, and a different bandwidth profile. |
| MLX or Metal | Backend-specific shader or array operation model. |
| CUDA | Backend-specific thread/block strategy. |

## Write up what you found

Record your reading as an annotated walkthrough that another engineer can review in five minutes. You do not need to write a new kernel. Fill in this template with line references from the source:

```text
file:
commit:
backend:
operation:
compressed format:
where scale loads:
where bits load:
where unpack happens:
where accumulation happens:
does it materialize FP16 weights in memory:
open questions:
```

A finished walkthrough names the file, commit, and backend, answers the five questions with line references, and gives a clear yes or no on whether the kernel materializes FP16 weights in memory.

{% callout type="warning" %}
Do not claim an implementation property from the whitepaper alone when the code is available. Read the runtime source, or label the claim as coming from the paper only.
{% /callout %}

## Next steps

- [Build a bandwidth ledger](/docs/technical-guides/bandwidth-ledger) to turn what the kernel loads into a bytes-per-token estimate.
- [Review weights on disk](/docs/technical-guides/weights-on-disk) if you need a refresher on how the packed formats are laid out before the kernel reads them.

See something wrong? [Fix it](/docs/contribute/contributor-guide).
