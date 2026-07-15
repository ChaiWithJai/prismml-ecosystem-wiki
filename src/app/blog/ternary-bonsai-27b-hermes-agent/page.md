---
title: 'How to use Ternary Bonsai 27B with Hermes Agent'
description: 'Connect Nous Research Hermes Agent to a local Ternary Bonsai 27B OpenAI compatible server and validate tool use.'
audience: local-ai-builder
pillar: bonsai-27b
status: published
last_reviewed: 2026-07-15
---

PrismML documents Hermes Agent as a supported client for its OpenAI compatible server. Start Ternary Bonsai 27B locally, run Hermes's model setup, and choose the local endpoint. Validate a simple tool call before giving the agent a larger task. {% .lead %}

## Configure the connection

The exact port must match the server you started. The stock command shown on the model page uses MLX LM's default port, 8080.

```bash
hermes setup model

# Choose: Custom OpenAI-compatible endpoint
# Base URL: http://127.0.0.1:8080/v1
# API key: any non-empty string
# Model: use the ID returned by GET /v1/models
```

## Validate before real work

- Ask the model to call one harmless tool with one required argument.
- Check that the response contains a structured tool call rather than plain text that looks like one.
- Run a second test that returns tool output to the model.
- Record failures by prompt, runtime version, and model version.

## Questions people ask

### Does local mean Hermes cannot use web tools?

No. The model can run locally while Hermes calls tools that use the network. Local inference and tool network access are separate choices.

### Will every Hermes skill work with this model?

Do not assume it will. Skills that need long planning, strict schemas, or many tool turns should be tested against their own success criteria.

## Sources

- [PrismML Hermes integration guide](https://docs.prismml.com/integrations/hermes)
- [PrismML local server guide](https://docs.prismml.com/run/server)
- [PrismML Bonsai 27B documentation](https://docs.prismml.com/models/bonsai-27b)
- [Ternary Bonsai 27B MLX model card](https://huggingface.co/prism-ml/Ternary-Bonsai-27B-mlx-2bit)

## Related Bonsai 27B lessons

- [How to serve Ternary Bonsai 27B through an OpenAI compatible API](/blog/ternary-bonsai-27b-openai-api)
- [How Ternary Bonsai 27B fits into ODS](/blog/ternary-bonsai-27b-ods)
- [Ternary Bonsai 27B limitations and verification checklist](/blog/ternary-bonsai-27b-limitations)

The benchmark numbers on this page describe one checkpoint, runtime, machine, and test shape. Reproduce the test on the hardware and workload you plan to use before making a product decision.
