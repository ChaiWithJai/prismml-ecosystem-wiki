---
title: "Why is Apple Silicon good for running LLMs locally?"
description: "Apple's unified memory gives the GPU up to 512 GB versus 32 GB on consumer NVIDIA cards, at lower bandwidth. Big models fit on a Mac but generate slowly."
audience: researcher
pillar: ecosystem-player
book: inference-engineering
chapter_ref: "Ch. 3, sec. 3.5.1 Desktop Inference"
status: published
last_reviewed: 2026-07-07
---

Apple's unified memory gives the GPU access to far more memory than consumer NVIDIA cards, up to 512 GB versus 32 GB at the high end, at lower bandwidth. That is a trade between capacity and speed. A huge quantized MoE model fits on a Mac but generates slowly, while an RTX card is fast on anything small enough to fit. {% .lead %}

## Compare the two memory designs

A gaming PC has two separate memory pools. The CPU has system RAM, and the GPU has its own memory on the card. The model weights must fit inside the GPU's own memory, which tops out at 32 GB on a consumer card like the RTX 5090.

Apple's M series chips use one shared pool instead. The CPU and GPU both read from the same unified memory, so the GPU can use almost all of the machine's RAM. Kiely's Inference Engineering (Ch. 3, sec. 3.5.1) describes this as Apple's chips "giving inference on GPUs access to far more memory, albeit at slower speeds."

The book compares the highest options on the market at the time of writing:

| Hardware | NVIDIA RTX 5090 | Apple M3 Ultra |
| --- | --- | --- |
| Memory | 32 GB | 512 GB |
| Bandwidth | 1,792 GB/s | 819 GB/s |
| Cost (full computer) | $5,000 | $10,000 |

The Mac holds 16 times more model, and the NVIDIA card reads memory a bit over twice as fast. Neither is better in general. Each wins for a different kind of model.

## Work the numbers on capacity

During decoding, the GPU must read every active weight once per generated token. So two numbers predict most of local LLM performance. Memory capacity decides which models fit at all, and memory bandwidth caps how many tokens per second you can get.

Start with capacity. A Q4 quantized model stores each weight in about half a byte, so a model needs roughly 0.5 GB per billion parameters, plus overhead for the KV cache and the runtime.

Take a large MoE model with 671 billion total parameters and about 37 billion active per token. At Q4 the weights alone are about 335 GB. That will never fit on a 32 GB card, but it fits in the 512 GB Mac with room left for KV cache.

Now bandwidth. Each token touches only the active experts, about 18.5 GB at Q4. Dividing 819 GB/s by 18.5 GB gives a ceiling of about 44 tokens per second on the M3 Ultra. These are theoretical ceilings from arithmetic, not benchmarks, and real systems land below them.

Run the same arithmetic on a small dense model. An 8 billion parameter model at Q4 is about 4 GB, so it fits on both machines. The ceiling is about 448 tokens per second on the RTX 5090 and about 205 on the Mac. When the model fits on the card, the card wins on speed.

Kiely notes that the rise of Mixture of Experts helps desktop inference, because a single request only touches a fraction of the total weights. That is exactly the shape unified memory rewards. MoE models have huge total weights, which need capacity, and small active weights, which keep the bandwidth cost per token low.

{% callout type="note" %}
macOS does not give the GPU all of the RAM by default. The default limit is roughly two thirds to three quarters of total memory, and you can raise it with the `iogpu.wired_limit_mb` sysctl.
{% /callout %}

## Try it

Find your machine's GPU accessible memory and compute the largest Q4 model it could hold. This takes under ten minutes.

On a Mac, get total memory in GB:

```bash
sysctl -n hw.memsize | awk '{print $1/1073741824 " GB"}'
```

Multiply by 0.75 as an estimate of the default GPU limit. On a machine with an NVIDIA card, read the card's memory directly:

```bash
nvidia-smi --query-gpu=memory.total --format=csv
```

Then compute the largest model. Reserve about 20 percent of the usable memory for KV cache and runtime overhead, and divide the rest by 0.5 GB per billion parameters:

```text
max_params_B = (usable_GB * 0.8) / 0.5
```

For a 64 GB Mac, that is 48 GB usable, 38.4 GB for weights, so about a 76 billion parameter model at Q4. Check your answer by finding a Q4 model file of that size on Hugging Face and comparing its download size to your budget.

## Check yourself

Answer these without looking back.

1. A 400 billion parameter MoE model with 20 billion active parameters, quantized to Q4. Which machine runs it, and roughly how fast? Expected answer: only the 512 GB Mac fits the roughly 200 GB of weights, and the ceiling is about 819 divided by 10, so about 80 tokens per second.
2. A 7 billion parameter dense model serving many parallel requests. Which machine? Expected answer: the RTX card. The model fits in 32 GB, and the higher bandwidth gives more tokens per second.
3. Why does an MoE model suit unified memory better than a dense model of the same total size? Expected answer: both need the same capacity, but the MoE model reads only its active experts per token, so the lower bandwidth costs less speed.

## Next steps

- Read the [hardware requirements guide](/docs/getting-started/hardware-requirements) to size a machine for a specific model.
- See the [MLX ecosystem page](/docs/ecosystem/mlx) for running models on Apple Silicon with Apple's array framework.

When you can do this, you can match a model architecture to unified memory or a discrete GPU using capacity and bandwidth reasoning.
