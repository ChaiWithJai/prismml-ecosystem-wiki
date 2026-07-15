---
title: 'How the KV cache affects Ternary Bonsai 27B memory'
description: 'Understand context memory, hybrid attention, FP16 and 4 bit KV cache sizes, and realistic long context limits for Bonsai 27B.'
audience: local-ai-builder
pillar: bonsai-27b
status: published
last_reviewed: 2026-07-15
---

Qwen3.6 27B uses hybrid attention, so only 16 of its 64 layers grow a normal full attention KV cache. PrismML reports about 64 KiB per token at FP16. That is about 1.1 GB at 16K tokens, 4.3 GB at 64K, and 17.2 GB at the full 262K context. {% .lead %}

## Why hybrid attention helps

Most blocks use linear attention with a fixed recurrent state. Only the 16 full attention blocks add keys and values for every token. This keeps cache growth to about one quarter of what an all full attention stack with the same dimensions would require.

## What 4 bit KV changes

PrismML reports about a fourfold reduction with its 4 bit cache. The stated cache sizes are 0.27 GB at 16K, 1.1 GB at 64K, 2.1 GB at 128K, and 4.3 GB at 262K.

A smaller cache does not remove the need to test answer quality. PrismML reports low output divergence for Bonsai in its tests, but a production application should evaluate its own long prompts and retrieval tasks.

## Questions people ask

### Does setting a 262K context allocate 17.2 GB immediately?

Allocation behavior depends on the runtime. The full FP16 cache would reach about that size when filled. Some runtimes reserve memory earlier and others grow it as tokens arrive.

### Does the 4 bit KV cache work in every runtime?

Do not assume it does. Check the exact MLX or llama.cpp build and verify the active cache format before quoting memory results.

## Sources

- [PrismML Bonsai 27B whitepaper](https://github.com/PrismML-Eng/Bonsai-demo/blob/main/bonsai-27b-whitepaper.pdf)
- [PrismML Bonsai 27B documentation](https://docs.prismml.com/models/bonsai-27b)
- [Qwen3.6 27B base model card](https://huggingface.co/Qwen/Qwen3.6-27B)

## Related Bonsai 27B lessons

- [How large is Ternary Bonsai 27B?](/blog/ternary-bonsai-27b-model-size)
- [What Mac do you need for Ternary Bonsai 27B?](/blog/ternary-bonsai-27b-mac-requirements)
- [Ternary Bonsai 27B performance on an M4 Pro Mac](/blog/ternary-bonsai-27b-performance-m4-pro)

The benchmark numbers on this page describe one checkpoint, runtime, machine, and test shape. Reproduce the test on the hardware and workload you plan to use before making a product decision.
