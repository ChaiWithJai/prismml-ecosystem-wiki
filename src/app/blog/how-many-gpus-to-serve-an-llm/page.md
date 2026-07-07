---
title: "How many GPUs do I need to serve a large LLM?"
description: "Minimum GPU count is arithmetic: precision bytes times parameters times a 1.8x KV cache multiplier, rounded up to the next instance size."
audience: ml-product-team
pillar: foundational-concept
book: inference-engineering
chapter_ref: "Ch. 5, sec. 5.4 (p. 142)"
status: published
last_reviewed: 2026-07-07
---

Minimum GPU count is arithmetic you can do before touching hardware. Multiply the bytes per parameter by the parameter count, then by a KV cache multiplier of roughly 1.8x on top of weights, and round up to the next instance size. Weights fitting is not enough. The KV headroom is the part everyone forgets. {% .lead %}

## Start from the formula in the book

Philip Kiely's *Inference Engineering* (Ch. 5, sec. 5.4) gives the estimate as one line of code. The VRAM required is the precision in bits divided by 8, times the parameter count in billions, times a KV cache allocation factor, and he uses 1.8 for that factor. The result is in gigabytes. You then round up to the next available instance size, because GPUs come in fixed configurations such as one, two, four, or eight cards per node.

The 1.8 multiplier is an estimate, not a law. It covers the KV cache, which is the memory the server keeps for every token in every active request, plus buffers. Long context or high batch sizes push the true need above 1.8, and short context pushes it below. It is the right starting number for a first sizing pass, and you refine it later with a load test.

Kiely also explains why you cannot skip the multiplier. He writes that "It's not enough to just barely squeeze the model weights into VRAM." His example is DeepSeek-V3.1, a 671 billion parameter model. At FP8 precision, the weights alone are about 671 GB. Four B200 GPUs give 720 GB, so the weights technically load. But the KV cache often takes 80 percent or more of the VRAM that remains after weights, and 49 GB of leftover room is not enough to serve any reasonable context length or batch size. The deployment that works is a full node of eight B200s.

## Work one example end to end

Here is the book's own case, with the arithmetic shown.

- Precision: FP8, so 8 bits / 8 = 1 byte per parameter.
- Parameters: 671 billion, so weights are about 671 GB.
- KV multiplier: 671 x 1.8 = about 1,208 GB required.
- Available instance sizes for the B200, which has 180 GB each: 180, 360, 720, or 1,440 GB.
- 1,208 GB does not fit in 720 GB, so round up to 1,440 GB. That is eight B200 GPUs.

Notice what the rounding step does. The formula said 1,208 GB, but you cannot buy 1,208 GB. You buy the next size up, and the extra 232 GB is not waste. It becomes room for more KV cache, which means more concurrent users or longer context per user. Kiely notes that even midsize models are often served above the minimum GPU count for exactly this reason. More cache room gives better latency per user.

One caution for the product plan. Once a model needs more than one GPU, the GPUs have to split the model between them and talk to each other on every step, which the book covers in the same section under model parallelism. The formula tells you the minimum count. It does not promise that four cards run four times faster than one.

## Try it

This exercise needs no GPU. It is a calculator and two spec sheets, and it takes under 30 minutes.

Compute VRAM for these three combinations with the formula (bits / 8) x params in billions x 1.8.

```text
1. Bonsai 8B at FP16:   (16/8) x 8   x 1.8 = 28.8 GB
2. A 70B model at FP8:  (8/8)  x 70  x 1.8 = 126 GB
3. DeepSeek-V3.1 at FP8: (8/8) x 671 x 1.8 = 1,207.8 GB
```

Now check each against a real spec sheet and pick an instance.

1. Look up the NVIDIA L40S (48 GB) and H100 (80 GB) spec pages, and the [Bonsai 8B model card](https://huggingface.co/prism-ml/Bonsai-8B-gguf). Does 28.8 GB fit on one L40S? Yes, with about 19 GB of margin.
2. Does 126 GB fit on one H100? No. Two H100s give 160 GB, so the answer is a two GPU instance with about 34 GB of margin.
3. Does 1,208 GB fit on four B200s at 720 GB? No. Round up to eight B200s at 1,440 GB.

For each one, write down the fit or no fit call and the margin in GB. You have done the exercise correctly when your margin includes the KV cache, not just the weights.

## Check yourself

1. A 32B model at FP16. What does the formula say, and does it fit on one 80 GB H100? Expected answer: 2 x 32 x 1.8 = 115.2 GB, so no. It needs two H100s (160 GB), which leaves about 45 GB of margin.
2. Your team quantizes that same 32B model to FP8. What changes? Expected answer: 1 x 32 x 1.8 = 57.6 GB, so it now fits on one H100 with about 22 GB of margin. Halving the precision halved the whole requirement, because the multiplier applies to weights.
3. A teammate says "the weights are 671 GB and four B200s have 720 GB, so we are covered." What is wrong? Expected answer: the 49 GB left over has to hold the KV cache for every active request, and that is not enough to serve real traffic. The formula with the 1.8 multiplier says 1,208 GB, which needs eight B200s.
4. Where does the 1.8 come from, and when is it wrong? Expected answer: it is Kiely's starting estimate for KV cache and buffers on top of weights. It is too low for very long context or heavy concurrency and too high for short prompts at batch size one, so you confirm it with a load test before you commit to hardware.

## Next steps

- [Hardware requirements](/docs/getting-started/hardware-requirements) maps common GPUs and instance sizes to the model sizes they can hold.
- [KV cache](/docs/technical-guides/kv-cache) explains what the 0.8x of headroom in the multiplier is actually storing.
- [How much VRAM do I need to run an LLM?](/blog/how-much-vram-to-run-an-llm) does the same budget at single GPU scale, with the per token cache math written out.

When you can do this, you can size a GPU deployment for a given model and precision using the capacity formula.
