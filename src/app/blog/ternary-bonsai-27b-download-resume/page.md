---
title: 'How to resume the Ternary Bonsai 27B download'
description: 'A practical way to recover an interrupted Hugging Face transfer without creating several 8.49 GB model copies.'
audience: local-ai-builder
pillar: bonsai-27b
status: published
last_reviewed: 2026-07-15
---

Keep one download owner, confirm which cache it uses, and resume into that same Hugging Face cache. Do not start downloads in several applications. The MLX weight file is 8,490,785,104 bytes, so duplicate partial files can consume many gigabytes without producing a runnable model. {% .lead %}

## Why the first transfer caused trouble

The model was being fetched inside a short task window. The transfer stopped before the weight file completed, while later attempts looked at different cache locations. The work appeared stalled even though partial data existed.

The fix was to use one Hugging Face cache as the source of record. LM Studio then indexed symlinks to that completed snapshot, so it did not download another copy.

## Recovery checklist

- Find the active cache and the incomplete file before starting another transfer.
- Confirm free disk space for the finished file and temporary data.
- Use one process to resume the download.
- Verify the final byte count and hash before benchmarking.

## Questions people ask

### Should you delete every incomplete file first?

No. A current partial file may be reusable. Delete only an orphan after you confirm no active process owns it.

### Can LM Studio reuse the Hugging Face copy?

Yes. On our Mac, a normal model directory with file symlinks let LM Studio index the existing snapshot.

## Sources

- [Ternary Bonsai 27B MLX model card](https://huggingface.co/prism-ml/Ternary-Bonsai-27B-mlx-2bit)
- [PrismML Bonsai 27B collection on Hugging Face](https://huggingface.co/collections/prism-ml/bonsai-27b)
- [LM Studio model import documentation](https://lmstudio.ai/docs/app/advanced/import-model)

## Related Bonsai 27B lessons

- [How to verify the exact Ternary Bonsai 27B model](/blog/ternary-bonsai-27b-model-provenance)
- [How to add Ternary Bonsai 27B to LM Studio](/blog/ternary-bonsai-27b-lm-studio)
- [How to run Ternary Bonsai 27B with MLX](/blog/run-ternary-bonsai-27b-mlx)

The benchmark numbers on this page describe one checkpoint, runtime, machine, and test shape. Reproduce the test on the hardware and workload you plan to use before making a product decision.
