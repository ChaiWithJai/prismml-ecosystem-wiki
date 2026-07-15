---
title: 'Ternary Bonsai 27B passed a structured tool call'
description: 'The exact local tool call check, what passed, and what still needs testing before an agent can take actions.'
audience: local-ai-builder
pillar: bonsai-27b
status: published
last_reviewed: 2026-07-15
---

Yes in our basic local check. Through LM Studio's OpenAI compatible endpoint, the model selected get_weather, supplied Lisbon as the city, and ended with the tool_calls finish reason. This proves the response shape worked for one call. It does not prove a long agent loop is reliable. {% .lead %}

## What passed

The request included one function with one required string field. The model returned a structured function name and valid JSON arguments instead of writing a fake call in plain text.

## What to test next

- Return tool output to the model and confirm it writes the final answer.
- Test several tools with similar names.
- Test missing arguments and tool errors.
- Measure success across many full loops, not one request.

## Questions people ask

### Does one passing call make it ready for an autonomous agent?

No. An agent also needs planning, error recovery, and stable behavior across many tool turns.

### Did the call use a cloud API?

No. The model ran locally. The test tool was a schema check and did not fetch live weather.

## Sources

- [PrismML Hermes integration guide](https://docs.prismml.com/integrations/hermes)
- [PrismML local server guide](https://docs.prismml.com/run/server)
- [Ternary Bonsai 27B MLX model card](https://huggingface.co/prism-ml/Ternary-Bonsai-27B-mlx-2bit)

## Related Bonsai 27B lessons

- [How to use Ternary Bonsai 27B with Hermes Agent](/blog/ternary-bonsai-27b-hermes-agent)
- [Ternary Bonsai 27B needs room for reasoning tokens](/blog/ternary-bonsai-27b-reasoning-token-budget)
- [Ternary Bonsai 27B limitations and verification checklist](/blog/ternary-bonsai-27b-limitations)

The benchmark numbers on this page describe one checkpoint, runtime, machine, and test shape. Reproduce the test on the hardware and workload you plan to use before making a product decision.
