---
title: 'Ternary Bonsai 27B needs room for reasoning tokens'
description: 'Why a short output limit can return reasoning without a final answer, with a traced 16 token and 256 token comparison.'
audience: local-ai-builder
pillar: bonsai-27b
status: published
last_reviewed: 2026-07-15
---

The model can use the whole output budget for reasoning before it writes a final answer. In our July 15 trace, a 16 token limit produced 15 reasoning tokens and no final content. A 256 token limit used 191 reasoning tokens and then returned the correct answer, 42. {% .lead %}

## The traced check

We asked the same simple addition question twice through LM Studio's OpenAI compatible API. Temperature was zero. Only the output token limit changed.

The small limit ended inside the reasoning field. The larger limit completed the reasoning and wrote the requested number in the content field.

## What applications should do

- Budget reasoning tokens separately from the visible answer when the runtime reports them.
- Treat an empty content field as an incomplete response, even when token usage is nonzero.
- Test the shortest output limit that works for each task type.
- Check whether the selected runtime offers a tested thinking control before relying on it.

## Questions people ask

### Did the model fail the math question?

No. It reached the correct answer when the output budget was large enough.

### Is 256 tokens always enough?

No. Harder tasks may need more reasoning. Measure the tasks your application sends.

## Sources

- [Ternary Bonsai 27B MLX model card](https://huggingface.co/prism-ml/Ternary-Bonsai-27B-mlx-2bit)
- [LM Studio model support documentation](https://lmstudio.ai/docs/app)
- [PrismML Bonsai 27B documentation](https://docs.prismml.com/models/bonsai-27b)

## Related Bonsai 27B lessons

- [Ternary Bonsai 27B passed a structured tool call](/blog/ternary-bonsai-27b-tool-calling-test)
- [How we benchmarked Ternary Bonsai 27B](/blog/ternary-bonsai-27b-benchmark-method)
- [Ternary Bonsai 27B limitations and verification checklist](/blog/ternary-bonsai-27b-limitations)

The benchmark numbers on this page describe one checkpoint, runtime, machine, and test shape. Reproduce the test on the hardware and workload you plan to use before making a product decision.
