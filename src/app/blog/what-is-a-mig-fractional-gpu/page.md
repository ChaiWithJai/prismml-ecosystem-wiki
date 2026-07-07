---
title: "What is a MIG (multi-instance GPU) and when should I use one?"
description: "Big GPUs like the H100 can split into up to seven fractional instances, and serving a 1 to 3B model on a whole H100 wastes money."
audience: ml-product-team
pillar: ecosystem-player
book: inference-engineering
chapter_ref: "Ch. 3, sec. 3.3.2 Multi-Instance GPUs"
status: draft
last_reviewed: 2026-07-07
---

Big GPUs like the H100 can split into up to seven fractional instances, and serving a 1 to 3B model on a whole H100 wastes money. Fractional GPUs change small model unit economics entirely. The quirk to know is that the layout is seven compute slices against eight memory slices, so a plan must respect both budgets. {% .lead %}

## Understand the problem MIG solves

Most GPU sizing questions are about a model that is too big for the hardware. Philip Kiely's *Inference Engineering* (Ch. 3, sec. 3.3.2) opens this section with the opposite case, where "the GPU is too big for the model." The newest GPU architectures only come in large cards. If you want Hopper or Blackwell performance, you buy an H100 or a B200, and each one has far more compute and memory than a 1 to 3B parameter model can use. Even with large batch sizes, most of the card sits idle while you pay for all of it.

Multi-instance GPU, or MIG, is a feature built into larger NVIDIA GPUs, including the A100, H100, H200, and B200. It splits one physical GPU into as many as seven separate instances. Each instance also gets a share of the CPU cores, RAM, storage, and network bandwidth of the host, so it behaves like a smaller standalone machine. Each model gets its own instance, and because the split happens in hardware, a spike in traffic on one instance cannot slow down the others.

## Respect both slice budgets

This is the part that trips people up. An H100 does not split into seven equal pieces of everything. It has seven compute slices and eight memory slices, and the two budgets are separate.

The compute count comes from the chip layout. Compute slices are groups of Streaming Multiprocessors, which are the units inside the GPU that run the math. An SXM H100 has 132 of them, which does not divide evenly by a power of two, so NVIDIA carves out seven equal compute slices and leaves the remainder idle. Memory splits into eight slices of 10 GB each on the 80 GB card.

Because the budgets differ, an instance can hold a bigger share of memory than of compute. Kiely's example is an H100 MIG instance with three compute slices. It has about 3/7 of the compute but can attach up to half of the VRAM, which is 40 GB. When you plan a shared card, you have to add up both columns and stay within seven compute slices and eight memory slices at the same time.

## Work one allocation end to end

Here is a plan for three small models sharing one 80 GB H100, using the standard instance shapes. The shape names encode both budgets, e.g., 3g.40gb means three compute slices and 40 GB of memory.

| Model | Weights at FP16 | Need with 1.8x KV headroom | Instance | Compute | Memory |
|---|---|---|---|---|---|
| 8B chat model | 16 GB | 28.8 GB | 3g.40gb | 3 slices | 4 slices |
| 3B speech model | 6 GB | 10.8 GB | 2g.20gb | 2 slices | 2 slices |
| 1.5B transcription model | 3 GB | 5.4 GB | 2g.20gb | 2 slices | 2 slices |

The memory need per model comes from the sizing formula covered in [How much VRAM do I need to run an LLM?](/blog/how-much-vram-to-run-an-llm), which is bytes per parameter times parameter count times 1.8 for KV cache headroom. The totals here are 3 + 2 + 2 = 7 compute slices and 4 + 2 + 2 = 8 memory slices. Both budgets are exactly full, so the plan is valid.

Now the cost. Suppose an H100 rents for about $2.50 per hour, which is an estimate you should replace with your provider's price. Serving these three models on dedicated H100s costs three cards, or about $7.50 per hour. The MIG plan serves all three on one card for about $2.50 per hour, which cuts the bill by two thirds. Per model, the 8B model carries 4/8 of the memory, so a fair internal charge is about $1.25 per hour instead of $2.50 for a whole card. The 8B model fits this plan well. The public [Bonsai 8B model card](https://huggingface.co/prism-ml/Bonsai-8B-gguf) describes a model in exactly this size class, and at FP16 it fits a 3g.40gb instance with about 11 GB of margin.

## Decide when MIG is the right call

Use MIG when the model is small and the traffic per model is modest. Kiely notes that for a 3B model like Orpheus TTS, two MIG instances sometimes use the hardware better than giving the model a whole GPU. He also points out that Whisper, whose largest version is 1.55B parameters, runs fast on H100 fractions, which makes MIG a good fit for transcription serving.

Skip MIG when one model needs the whole card. A 70B model does not fit in any slice, and a small model with heavy traffic may need full compute even though its weights are tiny. Also remember that instances do not share memory, so you cannot pool two idle slices into one bigger one at runtime. You have to tear down instances and repartition, which stops the workloads on that card.

## Try it

Sketch a MIG allocation plan for three small models sharing one H100. This takes under 30 minutes with a spec sheet and a calculator, and the planning part needs no GPU.

1. Pick three models between 1B and 8B parameters and compute each memory need with (bits / 8) x params in billions x 1.8.
2. Assign each model the smallest standard H100 shape that covers its need: 1g.10gb, 2g.20gb, 3g.40gb, or 4g.40gb.
3. Add up the compute slices and the memory slices separately. If compute exceeds 7 or memory exceeds 8, drop a model to a smaller shape or lower its precision, and recompute.
4. Write the per model hourly cost as (memory slices / 8) x your H100 hourly rate, and compare it to one whole card per model.

If you have root access to a machine with an H100 or A100, you can create the instances for real. This step does require one of those GPUs.

```bash
sudo nvidia-smi -i 0 -mig 1        # enable MIG mode on GPU 0
nvidia-smi mig -lgip               # list the instance profiles your card supports
sudo nvidia-smi mig -cgi 3g.40gb,2g.20gb,2g.20gb -C   # create the three instances
nvidia-smi -L                      # confirm the instances and note their UUIDs
```

Point each model server at one instance by setting `CUDA_VISIBLE_DEVICES` to that instance's UUID.

## Check yourself

1. Why does an H100 split into seven compute slices instead of eight? Expected answer: compute slices are groups of Streaming Multiprocessors, and the SXM H100 has 132 of them, which does not divide cleanly by eight. NVIDIA makes seven equal slices and leaves the remaining units idle.
2. A teammate proposes 4g.40gb plus 3g.40gb plus 1g.10gb on one H100. Is the plan valid? Expected answer: no. Compute is 4 + 3 + 1 = 8 slices against a budget of 7, and memory is 4 + 4 + 1 = 9 slices against a budget of 8. Both budgets are over.
3. Your 3B model at FP16 needs about 10.8 GB with KV headroom. What is the smallest shape, and what does it cost per hour at a $2.50 estimate for the whole card? Expected answer: 2g.20gb. Charged by memory share, that is 2/8 of the card, or about $0.63 per hour, versus $2.50 for a dedicated H100.
4. When is MIG the wrong choice even for a small model? Expected answer: when traffic is heavy enough that the model needs the full card's compute, or when you expect to resize allocations often, because repartitioning stops the workloads on that card.

## Next steps

- [Hardware requirements](/docs/getting-started/hardware-requirements) lists which GPUs support MIG and the instance shapes each one offers.
- [Cost modeling](/docs/technical-guides/cost-modeling) shows how to turn slice shares into a per model cost your finance team can check.
- [At what token volume does owning a GPU beat an API?](/blog/token-volume-where-own-gpu-beats-api) covers the buy versus rent question that comes right after this one.

When you can do this, you can design a valid MIG allocation for multiple small models and quantify the savings versus whole GPU serving.
