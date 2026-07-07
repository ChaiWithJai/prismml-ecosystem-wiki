---
title: Inference The Hard Way
status: migrated
audience: DevRel
owner: Developer advocate
source_tier: primary_course
benchmark_status: partial
last_reviewed: 2026-07-06
---

Inference The Hard Way is a lab course that shows how a language model goes from bytes on disk to tokens on screen. Work through it here to learn where inference spends its time and memory, and to check each claim yourself with bytes on disk, kernel code, cache growth, and benchmark numbers instead of marketing language. {% .lead %}

By the end of the course you can explain how a compressed model runs, and you can back the explanation with measurements from your own machine.

[Start the course](https://chaiwithjai.github.io/inference-the-hard-way). This page tells you which order to take the labs in and which guide on this site pairs with each lab.

## Follow the labs in this order

1. Run Lab 00 and note your device details, e.g., chip, memory, and OS. You will want them later when you compare benchmark numbers.
2. Do the KV cache, prefill vs decode, and bandwidth ledger labs first, because they explain where the speed and memory costs come from.
3. Do the weights on disk and kernel reading labs next to see why "1-bit" is a storage format and an execution path, not only a smaller download.
4. Finish with the reproduction and capstone labs, which have you reproduce a whitepaper result and explain it to someone else.

## Pair each lab with its guide

Most labs have a short guide on this site that covers the same concept. Read the guide before or after the lab, whichever helps you more. For example, Lab 03 has you measure how the KV cache grows with context length, and the [KV cache](/docs/technical-guides/kv-cache) guide explains why that growth happens.

| Course module | Guide on this site |
| --- | --- |
| Lab 03 KV cache | [KV cache](/docs/technical-guides/kv-cache) |
| Lab 04 prefill vs decode | [Prefill vs decode](/docs/technical-guides/prefill-vs-decode) |
| Lab 05 weights on disk | [Weights on disk](/docs/technical-guides/weights-on-disk) |
| Lab 06 reading the kernel | [Kernel reading](/docs/technical-guides/kernel-reading) |
| Lab 07 bandwidth ledger | [Bandwidth ledger](/docs/technical-guides/bandwidth-ledger) |

Labs 01 and 02, the tokenizer and the forward pass, do not have guides yet.

## Check your understanding

Before you move on, you should be able to say this without notes:

```text
Prefill and decode are different physical regimes. Prefill batches prompt
tokens and is more compute-bound. Decode generates one token at a time and
streams weights through memory, so compressed weights mostly help decode.
The KV cache avoids recomputing past keys and values, but it becomes the next
memory wall as context grows.
```

If any sentence in that summary feels shaky, redo the lab that covers it.

## Next steps

- [Start the course](https://chaiwithjai.github.io/inference-the-hard-way) at Lab 00.
- Read the [KV cache](/docs/technical-guides/kv-cache) guide, the first technical guide on this track.
- After the bandwidth ledger lab, check your predicted decode ceiling against the [Bandwidth ledger](/docs/technical-guides/bandwidth-ledger) guide.

See something wrong? [Fix it](/docs/contribute/contributor-guide).
