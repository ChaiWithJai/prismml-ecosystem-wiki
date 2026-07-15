---
title: 'How Ternary Bonsai 27B fits into ODS'
description: 'Assess the Osmantic Deployment System as a local AI stack for Ternary Bonsai 27B, including its GGUF and external MLX server paths.'
audience: local-ai-builder
pillar: bonsai-27b
status: published
last_reviewed: 2026-07-15
---

ODS is a tenable application stack for Ternary Bonsai 27B, but its normal macOS model path assumes a native llama-server and a GGUF model. The safest current integration is to keep the proven MLX server on the Mac and point ODS services at its OpenAI compatible endpoint. Direct GGUF use requires PrismML's llama.cpp fork until the ternary kernels land upstream. {% .lead %}

## What ODS adds

- Open WebUI, Hermes Agent, LiteLLM, search, workflows, and vector storage around one inference endpoint.
- A GGUF model catalog and native Metal llama-server path on Apple silicon.
- Cloud and external backend overlays that skip the managed local model download.

## The integration gap

ODS pins an ordinary llama.cpp runtime and its model library is GGUF oriented. PrismML's Ternary Bonsai 27B GGUF card currently instructs users to build PrismML-Eng/llama.cpp for the Q2_0 group-128 kernels, so adding only a model-library entry is not sufficient.

ODS already routes clients through LLM_API_URL and HERMES_LLM_BASE_URL. A small macOS adapter can point those services to http://host.docker.internal:8080/v1 while leaving the existing mlx_lm.server responsible for inference. This avoids maintaining a second ternary runtime fork inside ODS.

## Questions people ask

### Can I drop the Bonsai GGUF into ODS today?

Only if ODS uses a llama.cpp build with PrismML's group-128 ternary kernels. Its standard pinned runtime should not be assumed compatible.

### Does ODS need another copy of the MLX model?

No. An external endpoint integration can reuse the same running MLX server and model cache.

## Sources

- [Osmantic Deployment System repository](https://github.com/Osmantic/ODS)
- [PrismML local server guide](https://docs.prismml.com/run/server)
- [PrismML formats and runtime support](https://docs.prismml.com/download/formats)
- [PrismML Bonsai demo repository](https://github.com/PrismML-Eng/Bonsai-demo)

## Related Bonsai 27B lessons

- [How to serve Ternary Bonsai 27B through an OpenAI compatible API](/blog/ternary-bonsai-27b-openai-api)
- [How to use Ternary Bonsai 27B with Hermes Agent](/blog/ternary-bonsai-27b-hermes-agent)
- [How to add Ternary Bonsai 27B to LM Studio](/blog/ternary-bonsai-27b-lm-studio)

The benchmark numbers on this page describe one checkpoint, runtime, machine, and test shape. Reproduce the test on the hardware and workload you plan to use before making a product decision.
