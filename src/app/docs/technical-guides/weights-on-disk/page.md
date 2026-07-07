---
title: Weights On Disk
status: migrated
audience: DevRel engineer
owner: Technical writer
source_tier: course_material
benchmark_status: inspectable
last_reviewed: 2026-07-06
---

Quantization means storing a model's weights with fewer bits per weight than the precision they were trained in, so the file on disk gets smaller. A "1-bit model" takes this to the extreme and stores each weight as a single sign bit plus a shared scale for its group, so a weight that would take 16 bits in FP16 takes about 1.125 bits on disk. On this page you learn how those bits are laid out in a block and how to decode one block back into weights with a few lines of Python. {% .lead %}

{% system-model highlight="weights" /%}

GGUF is the file format that llama.cpp and related runtimes use to store a model as one file, holding the quantized weights plus the metadata a runtime needs to load them. The Bonsai files you download from Hugging Face, e.g., `Bonsai-8B-Q1_0.gguf`, are GGUF files.

A ternary model is a close relative of a 1-bit model. Each weight takes one of three values, -1, 0, or +1, times the group scale, instead of two. The extra zero value costs a little compression and buys back some quality.

This guide pairs with Lab 05 of [Inference The Hard Way](/docs/learning-paths/inference-the-hard-way), which has you parse one weight tensor by hand. Once you can do that, you can open a compressed model file and confirm byte by byte what it holds.

## Read the Q1 block layout

The course describes a group of 128 weights stored as one FP16 scale plus 128 packed sign bits. To reconstruct a weight, you take its sign bit b and compute scale times (2b - 1), which gives plus or minus the scale.

{% concept-diagram name="weights-on-disk" /%}

```text
group:
  scale: FP16
  bits: 128 sign bits

reconstruction:
  w = scale x (2b - 1)
```

The storage cost per weight follows from the block:

```text
(2 bytes x 8 bits/byte + 128 bits) / 128 weights = 1.125 bits/weight
```

So "1-bit" is honest about the sign bits but rounds away the scale. The scale costs 16 bits per 128 weights, which adds the extra 0.125 bits.

## Decode a block in Python

This sketch reads one block from an open file handle. It reads the 2-byte scale, unpacks the 16 bytes of sign bits, and reconstructs the 128 weights.

```python
import numpy as np

scale = np.frombuffer(f.read(2), dtype=np.float16)[0]
bits = np.unpackbits(np.frombuffer(f.read(16), dtype=np.uint8))
weights = scale * (2.0 * bits - 1.0)
```

This sketch comes from the course material, and we have not yet run it against a real model file. Before you trust it on a real GGUF file, check the scale order, the bit order, the tensor offset, and the block struct against the runtime implementation and the GGUF metadata.

## Know what the file format does not give you

A smaller file is not the whole story. The savings only help at inference time if the runtime keeps the weights packed during execution. The kernel must unpack the sign bits and multiply by the scale on the fly, without expanding the tensor back into a full FP16 copy in memory. If it expands the tensor first, you paid for compression on disk and got none of it at run time.

## Next steps

- [Read the kernel](/docs/technical-guides/kernel-reading) to see how the runtime unpacks these blocks during a matrix multiply.
- [Build the bandwidth ledger](/docs/technical-guides/bandwidth-ledger) to see why bits per weight sets the speed limit for decode.

See something wrong? [Fix it](/docs/contribute/contributor-guide).
