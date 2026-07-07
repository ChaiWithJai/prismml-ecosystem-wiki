---
title: Training, Fine-Tuning, And Preference Alignment
status: source_checked
audience: DevRel engineer
owner: Recipe author
source_tier: primary_links
benchmark_status: not_run
last_reviewed: 2026-07-06
---

Fine-tuning updates a pretrained model on your own data, and preference alignment then steers the model toward outputs people prefer. On this page you pick the right tool for an adaptation job, choose between LoRA and QLoRA, choose between DPO, PPO, and GRPO, format your data correctly, and check the tuned model for regressions before you ship it. {% .lead %}

{% system-model highlight="training" /%}

## Pick a training tool

Five tools cover almost every adaptation job, and the choice comes down to your hardware and your method. For example, if you have one consumer GPU and want to fine-tune a small model with LoRA, start with [Unsloth](https://unsloth.ai/docs). If you instead need full RLHF across many machines, you need [OpenRLHF](https://github.com/OpenRLHF/OpenRLHF) on a [Ray](https://docs.ray.io/) cluster.

{% concept-diagram name="training-alignment" /%}

| Situation | Use | Why |
| --- | --- | --- |
| Single GPU, small model, fast SFT or LoRA iteration | [Unsloth](https://unsloth.ai/docs) | Memory-efficient kernels tuned for single-device fine-tuning. |
| Many methods (SFT, DPO, PPO, reward modeling) behind one config and CLI | [LLaMA-Factory](https://llamafactory.readthedocs.io/en/latest/) | You configure training in one YAML file across model families, without custom trainer code. |
| Preference alignment inside the Hugging Face ecosystem | [TRL](https://huggingface.co/docs/trl/en/index) | Maintained trainers (SFTTrainer, DPOTrainer, PPOTrainer, GRPOTrainer) on top of Transformers. |
| Full RLHF at multi-node scale with separate actor, critic, and reward roles | [OpenRLHF](https://github.com/OpenRLHF/OpenRLHF) | An RLHF framework scheduled on Ray and designed to distribute the four RLHF model roles. |
| Multi-node orchestration, fault tolerance, or a cluster shared with data and serving workloads | [Ray Train](https://docs.ray.io/) | It uses the same Ray primitives as Ray Data and Ray Serve. |

Do not introduce Ray Train for a job that fits on one machine. Ray Train helps when you need multi-node scaling, checkpoint and restore across worker failures, or a shared cluster with the data and serving layers. That is also why OpenRLHF builds on Ray ([OpenRLHF paper](https://arxiv.org/html/2405.11143v4)).

## Choose LoRA or QLoRA

LoRA freezes the base model and trains small low-rank adapter matrices on top of it, so you update a tiny fraction of the parameters. QLoRA does the same but first quantizes the frozen base weights to 4-bit, which cuts VRAM further at a small quality cost. Per the [Unsloth fine-tuning guide](https://unsloth.ai/docs/get-started/fine-tuning-llms-guide), the practical decision is the precision of the frozen base weights versus your VRAM budget. For example, on a 24 GB consumer GPU you would pick QLoRA to fit the largest base model you can.

| Method | Base weights | Trainable parameters | When |
| --- | --- | --- | --- |
| Full fine-tune | Updated, full precision | All | Rarely needed for small-model adaptation. Highest VRAM. |
| LoRA | Frozen, 16-bit | Low-rank adapters only | Default for task adaptation. Adapters are easy to swap and ship. |
| QLoRA | Frozen, quantized to 4-bit | Low-rank adapters only | Consumer GPUs, largest base that fits. Small quality tradeoff versus LoRA. |

{% callout type="note" title="Exact VRAM numbers" %}
Per-model VRAM tables and supported model lists change often. Check the live matrix in the [Unsloth docs](https://unsloth.ai/docs) rather than trusting numbers copied into this page.
{% /callout %}

## Run a first fine-tune

The shortest path to a working LoRA or QLoRA run is Unsloth plus TRL. These steps come from the [Unsloth fine-tuning guide](https://unsloth.ai/docs/get-started/fine-tuning-llms-guide). We have checked them against the upstream docs but have not yet run them on hardware, so treat them as a starting point rather than a proven recipe.

```bash
pip install unsloth
```

```python
from unsloth import FastLanguageModel

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="<base-model-id>",
    max_seq_length=2048,
    load_in_4bit=True,          # QLoRA path
)
model = FastLanguageModel.get_peft_model(model, r=16, lora_alpha=16)
# Then train with TRL's SFTTrainer on a chat-formatted dataset.
```

The equivalent LLaMA-Factory path is a YAML config plus `llamafactory-cli train <config>.yaml`. See the [LLaMA-Factory docs](https://llamafactory.readthedocs.io/en/latest/) for the current config schema.

We do not yet know the best-supported fine-tuning path for PrismML Bonsai models in Unsloth, and we found no primary source on whether 1-bit or ternary Bonsai checkpoints can be LoRA-tuned directly or must be adapted on a higher-precision parent first. Until a source or a recorded run settles those questions, fine-tune a standard 16-bit base model.

## Choose an alignment method

DPO, PPO, and GRPO all steer a model toward preferred outputs, but they need different data and different amounts of hardware. Start with DPO when you have static preference pairs and want the simplest pipeline. Use GRPO when a program can score outputs, e.g., a math checker or a format validator. Use PPO, via [TRL](https://huggingface.co/docs/trl/en/index) or OpenRLHF at scale, only when you need an online loop with a learned reward model.

| Method | Models in memory | Data required | Character |
| --- | --- | --- | --- |
| PPO | Policy, reference, reward, value/critic | Preference pairs to train the reward model, then prompts | Classic RLHF, with the most components and an online generation loop. |
| DPO | Policy, reference | Preference pairs (chosen and rejected) | Turns RLHF into a single classification-style loss on preference data, with no RL loop ([DPO paper](https://arxiv.org/abs/2305.18290)). |
| GRPO | Policy, reference (no value model) | Prompts plus a scoring function, sampled in groups of completions | Replaces the critic with group-relative baselines, and works well with verifiable rewards such as math and code checks. |

We do not yet have an experiment log showing which GRPO reward functions work best for small local models, so the format-check versus task-grader choice is still open.

## Format your data

Two formats recur across TRL, LLaMA-Factory, and Unsloth. SFT uses a conversational format, and DPO uses a preference format.

```json
// SFT: conversational format
{"messages": [
  {"role": "system", "content": "..."},
  {"role": "user", "content": "..."},
  {"role": "assistant", "content": "..."}
]}
```

```json
// DPO: preference format
{"prompt": "...", "chosen": "...", "rejected": "..."}
```

Follow these rules when you build a dataset:

- Apply the model's own chat template before tokenizing.
- Keep `chosen` and `rejected` as completions to the same `prompt`.
- Never mix templated and raw-text rows in one dataset.

The [TRL docs](https://huggingface.co/docs/trl/en/index) and the [LLaMA-Factory docs](https://llamafactory.readthedocs.io/en/latest/) data pages list the exact accepted schemas per trainer.

## Check for regressions before you ship

Preference tuning optimizes for the preference signal, and it can weaken capabilities that were not in the preference set without an obvious sign. Before you promote a tuned model, do the following:

1. Freeze a regression prompt set before tuning, covering task prompts, formatting and instruction-following probes, refusal probes, and a few long-context items.
2. Run the base and tuned checkpoints on the identical set with identical sampling parameters, and diff the outputs side by side.
3. Track response length drift. Tuned models often win preferences by getting longer, not better.
4. Log KL divergence from the reference model where the trainer exposes it. TRL trainers do.
5. Record everything in the [device report schema](/docs/benchmarks/device-report-schema) so someone else can reproduce the run.

{% callout type="warning" title="No published baseline yet" %}
We have not yet published a reproducible alignment benchmark run, so do not cite quality deltas from this page. Cite a recorded run once one exists.
{% /callout %}

## Next steps

- [Feature stores](/docs/technical-guides/feature-stores) covers the data layer that feeds training jobs like these.
- [Evaluation concepts](/docs/technical-guides/evaluation-concepts) goes deeper on how to judge a tuned model.

See something wrong? [Fix it](/docs/contribute/contributor-guide).
