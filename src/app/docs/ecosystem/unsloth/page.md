---
title: Unsloth
status: published
audience: DevRel engineer
owner: Recipe author
source_tier: primary_links
benchmark_status: not_run
last_reviewed: 2026-07-07
---

Unsloth is a toolkit for fine-tuning language models, which means training an existing model further on your own data so it behaves the way you want. On this page you can learn where Unsloth fits in the path from a small model's weights to a running local product, and find the official docs to start a fine-tuning run of your own. {% .lead %}

## What Unsloth does

Unsloth adapts a model you already have. You give it a base model and a dataset, and it runs supervised fine-tuning (SFT) or a lighter method such as LoRA or QLoRA, which train a small set of extra weights instead of the whole model. The official documentation lives at [unsloth.ai/docs](https://unsloth.ai/docs), and the [fine-tuning guide](https://unsloth.ai/docs/get-started/fine-tuning-llms-guide) walks through a full run.

Comparable tools include LLaMA-Factory, TRL, OpenRLHF, and Axolotl. TRL and OpenRLHF focus on preference alignment methods such as DPO and PPO, which you would run after or instead of an Unsloth SFT pass. We have not benchmarked these tools against each other, so we do not claim a winner.

Unsloth also lists a product called Unsloth Studio, described as a local app for working with models. We have only seen this name in our own ecosystem notes and have not confirmed it against an Unsloth product page, so treat it as unconfirmed.

{% callout type="warning" title="We have not run this yet" %}
The links on this page come from the official Unsloth docs, but we have not yet installed Unsloth or completed a fine-tuning run on our own hardware. Until we do, treat every step as upstream guidance rather than a tested recipe.
{% /callout %}

## See where fine-tuning fits

Fine-tuning sits between preparing data and shipping a model to a local runtime:

```text
data and features
  -> training and post-training   <- Unsloth lives here
  -> compression and formats      (GGUF/MLX export targets)
  -> runtime and serving          (llama.cpp, Ollama, LM Studio, MLX)
  -> evaluation and feedback      (regression evals after tuning)
```

In practice the flow looks like this. You format a dataset, fine-tune a small model with Unsloth, export the tuned weights to a local runtime format such as GGUF or MLX, run the model with a tool like llama.cpp, and then run evaluations to check that tuning did not hurt quality. The [Bonsai llama.cpp recipe](/docs/build-and-run/bonsai-llamacpp) shows the running step of that flow.

One open question for this ecosystem: PrismML Bonsai models use 1-bit and ternary weight formats, and we do not yet know which quantized bases Unsloth supports for training or whether its output feeds that compression path. We have asked the Unsloth team and have no answer yet.

## Plan a fine-tuning run

If you want to try Unsloth yourself, follow the [official fine-tuning guide](https://unsloth.ai/docs/get-started/fine-tuning-llms-guide). A run you could later share back here would:

1. Install Unsloth from a named release or commit, per the official docs.
2. Fine-tune one named small model on a documented dataset.
3. Record the device, VRAM use, wall-clock time, and final loss or eval score.
4. Export the tuned model to a local runtime format and complete one prompt, following the pattern in the [Bonsai llama.cpp recipe](/docs/build-and-run/bonsai-llamacpp).

After a verified run, before-and-after quality comparisons and device benchmark rows (tokens per second, time to first token, RAM and VRAM) become possible for the tuned model.

## Next steps

- Read [supply chain layers](/docs/ecosystem/supply-chain-layers) to see how the training layer connects to the rest of the ecosystem.
- Run the [Bonsai llama.cpp recipe](/docs/build-and-run/bonsai-llamacpp) to try the runtime step that a tuned model would flow into.

See something wrong? [Fix it](/docs/contribute/contributor-guide).
