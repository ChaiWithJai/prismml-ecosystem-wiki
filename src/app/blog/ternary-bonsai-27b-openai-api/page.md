---
title: 'How to serve Ternary Bonsai 27B through an OpenAI compatible API'
description: 'Start the Ternary Bonsai 27B MLX server and connect local tools through an OpenAI compatible endpoint.'
audience: local-ai-builder
pillar: bonsai-27b
status: published
last_reviewed: 2026-07-15
---

Start `mlx_lm.server` with the PrismML model ID, bind it to localhost, and point your client at `http://127.0.0.1:8080/v1`. The endpoint supports the common chat completions shape used by local agents and application libraries. {% .lead %}

## Start the server

```bash
mlx_lm.server \
  --model prism-ml/Ternary-Bonsai-27B-mlx-2bit \
  --host 127.0.0.1 \
  --port 8080
```

## Check the model endpoint

A successful response should list `prism-ml/Ternary-Bonsai-27B-mlx-2bit`. Send a short chat completion only after the model download and load have finished.

Keep the server on `127.0.0.1` unless another device must connect. A server bound to every network interface needs access controls and firewall rules.

```bash
curl http://127.0.0.1:8080/v1/models
```

## Questions people ask

### Do I need an API key for a local MLX server?

A local server usually does not verify an API key. Some client libraries still require a nonempty placeholder value.

### Can I use the same endpoint with an agent?

Yes, if the agent accepts a custom OpenAI compatible base URL and supports the model's response format.

## Sources

- [PrismML local server guide](https://docs.prismml.com/run/server)
- [PrismML MLX guide](https://docs.prismml.com/run/mlx)
- [PrismML Bonsai 27B documentation](https://docs.prismml.com/models/bonsai-27b)

## Related Bonsai 27B lessons

- [How to run Ternary Bonsai 27B with MLX](/blog/run-ternary-bonsai-27b-mlx)
- [How to use Ternary Bonsai 27B with Hermes Agent](/blog/ternary-bonsai-27b-hermes-agent)
- [Ternary Bonsai 27B limitations and verification checklist](/blog/ternary-bonsai-27b-limitations)

The benchmark numbers on this page describe one checkpoint, runtime, machine, and test shape. Reproduce the test on the hardware and workload you plan to use before making a product decision.
