---
title: "Why is image generation compute-bound when the models are small?"
description: "Image models carry about 10x fewer parameters than frontier LLMs, but denoising attends over the whole latent every step. 50 steps is about 100 forward passes."
audience: ml-product-team
pillar: foundational-concept
book: inference-engineering
chapter_ref: "Ch. 2, secs. 2.3, 2.4.3 (pp. 55-56, 67)"
status: draft
last_reviewed: 2026-07-07
---

Image and video models carry roughly 10x fewer parameters than frontier LLMs, but iterative denoising attends over the entire latent object every step, and 50 steps is about 100 forward passes. Like LLM prefill, that is compute-bound work, so GPU sizing for a media feature follows different math than a chat feature of "similar model size". {% .lead %}

## Understand what a denoising step actually does

Kiely's Inference Engineering (Ch. 2, sec. 2.3, pp. 55-56) describes an image generation model as a pipeline of three parts. A text encoder turns the prompt into instructions the model can use. A denoising model starts from random noise and refines it into an image over a series of steps. A variational autoencoder then converts the result from latent space into pixels.

The denoising model does not work on pixels. A 1024 by 1024 image has over a million pixels, and the book notes that attention over the whole image at that size would be infeasible. So the model works in latent space, a smaller representation of the image. The book gives 128 by 128 as a typical latent size, which is about one percent of the values in the pixel version.

The part that changes the cost math is what happens per step. Each denoising step updates the entire latent at once. This is different from an LLM in decode, which produces one token at a time. And each step is not one forward pass. The book explains that each step runs two passes, one conditioned on the prompt and one without it, and the model combines the two using the guidance scale. So a 50 step generation runs about 100 forward passes, and most models use 30 to 50 steps for a high quality image.

## See why every pass looks like prefill, not decode

An LLM has two phases with opposite bottlenecks. Prefill processes the whole input prompt in one pass, so each weight the GPU loads feeds many operations, and the phase is compute bound. Decode produces one token per pass, so each weight loaded feeds few operations, and the phase is memory bound. The [prefill and decode concept page](/docs/concepts/prefill-decode) covers this split in detail.

Kiely makes the connection for media models directly in sec. 2.4.3 (p. 67). Image and video models are small, with about a tenth the parameters of frontier language models, "but their attention mechanism is just as computationally demanding" (Inference Engineering, p. 67). Attention for generating an image must consider the entire latent object, the same way LLM prefill processes the entire input sequence at once. The book's conclusion is that image and video inference is bottlenecked on compute.

A diffusion model never gets a cheap phase. An LLM pays the compute-bound price once, during prefill, and then spends the rest of the request in memory-bound decode. A diffusion model pays the compute-bound price on every one of its roughly 100 passes.

## Work through the cost of one generation

Here is the arithmetic for one image, derived from the numbers in secs. 2.3 and 2.4.3. Treat it as a way to compare shapes of work, not as a benchmark.

- The latent is 128 by 128, which is 16,384 positions. Attention in each forward pass covers all of them.
- The generation uses 50 steps, and each step runs 2 forward passes, so the model runs 100 forward passes.
- Each pass reads the full model weights and does dense attention plus the other layers over all 16,384 positions.

Compare that with a chat request to a dense LLM of similar size, e.g., an 8B model like [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf). The chat request does one prefill pass over the prompt, and then each output token is one small vector times matrix pass. The image request does 100 passes, and every pass has the shape of prefill. There is also no KV cache to reuse between steps the way decode reuses prefill's cache, because each step recomputes attention over the freshly updated latent.

This is why "the model is small, so it should be cheap to serve" fails for media. Parameter count tells you how much memory the weights need. It does not tell you how many compute-heavy passes each request triggers. A chat feature and an image feature with similar weight sizes can need different GPUs, because the chat feature is mostly limited by memory bandwidth and the image feature is limited by raw compute. The [hardware requirements guide](/docs/getting-started/hardware-requirements) covers how to size for each case.

## Try it

Confirm the compute-bound signature yourself in under 30 minutes. The plan is to generate the same image at 10, 30, and 50 steps, time each run, and watch memory. You need a machine that can run a small diffusion model, e.g., a GPU with 8 GB or more of VRAM or an Apple Silicon Mac. On CPU only, the runs finish but each one takes several minutes.

```bash
pip install diffusers torch transformers accelerate
```

```python
import time, torch
from diffusers import StableDiffusionPipeline

device = "cuda" if torch.cuda.is_available() else "mps"
pipe = StableDiffusionPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5", torch_dtype=torch.float16
).to(device)

for steps in (10, 30, 50):
    start = time.time()
    pipe("a desk lamp on a wooden table", num_inference_steps=steps)
    elapsed = time.time() - start
    mem = torch.cuda.max_memory_allocated() / 1e9 if device == "cuda" else None
    print(steps, "steps:", round(elapsed, 1), "s, peak GPU GB:", mem)
```

Run it once first to warm up, then record the three timings. Plot steps against seconds, or just eyeball the three numbers. Time should grow close to linearly with step count, e.g., the 50 step run should take about five times the 10 step run, while peak memory stays flat across all three. Flat memory with linear time is the signature of a compute-bound workload. Each step adds the same amount of compute, and no growing structure like a KV cache accumulates in memory. On Apple Silicon, `torch.cuda.max_memory_allocated` is unavailable, so watch memory in Activity Monitor instead.

## Check yourself

1. A diffusion model has 3B parameters and your chat model has 8B. A teammate says the image feature must be the cheaper one to serve. What is wrong with that reasoning? Expected answer: parameter count sets memory needs, not compute needs. The diffusion model runs about 100 compute-bound passes per image, while the chat model runs one prefill pass and then cheap memory-bound decode passes, so the image request can demand more compute per request.
2. Why does a 50 step generation run about 100 forward passes instead of 50? Expected answer: each step runs two passes, one with the prompt as conditioning and one without, and the model combines them using the guidance scale.
3. In the timing exercise, why does flat memory across 10, 30, and 50 steps rule out a memory bottleneck? Expected answer: nothing accumulates in memory as steps increase, so extra steps only add compute. If memory were the limit, you would expect memory use or memory traffic per unit of work to grow with the workload, and here the workload grows while memory stays constant.
4. Which LLM phase does a denoising pass resemble, and why? Expected answer: prefill, because both process the entire object at once, the whole prompt for prefill and the whole latent for a denoising pass, so each weight loaded feeds many operations.

## Next steps

- Read the [hardware requirements guide](/docs/getting-started/hardware-requirements) to turn this into a GPU sizing decision.
- Read the [prefill and decode concept page](/docs/concepts/prefill-decode) for the compute-bound versus memory-bound split this post builds on.
- Read [why is LLM prefill compute-bound but decode memory-bound](/blog/prefill-compute-bound-decode-memory-bound) for the arithmetic intensity math behind the labels.

When you can do this, you can identify a compute-bound workload from its step-scaling signature and adjust GPU sizing assumptions accordingly.
