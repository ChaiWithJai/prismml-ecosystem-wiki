---
title: "What does 'sparse FLOPS' mean on a GPU spec sheet, and should I trust it?"
description: "Sparse FLOPS assume 2:4 structured sparsity and run about double the dense figure. Default inference is dense, so compare GPUs on dense FLOPS at one precision."
audience: ml-product-team
pillar: ecosystem-player
book: inference-engineering
chapter_ref: "Ch. 3, sec. 3.1.1 Compute"
status: draft
last_reviewed: 2026-07-07
---

Vendors advertise sparse FLOPS measured with 2:4 structured sparsity, and those numbers run roughly double the dense figures. But default inference is dense, so the sparse number rarely applies to you. Compare GPUs on dense Tensor Core FLOPS at matching precision, or you are buying hardware on an inflated marketing metric. {% .lead %}

## Learn what the two numbers on the spec sheet mean

A GPU spec sheet lists two compute figures for its Tensor Cores at each precision. Kiely's Inference Engineering (Ch. 3, sec. 3.1.1) defines them plainly.

- Dense is the operations per second when every element of the tensor is used.
- Sparse is the rate when the tensor has 2:4 structured sparsity, which means that in every group of four values, two are zero. The Tensor Cores skip the multiplications by zero, so they finish the same matrix in about half the time.

The sparse figure is usually double the dense figure, though Kiely notes it is not always exactly double. The catch is that the sparse rate only applies when the model weights actually have that exact 2:4 zero pattern. A model only gets that pattern if someone pruned it into that shape on purpose and served it through a runtime that uses the sparse instructions. Almost no production LLM deployment does this. The book's guidance is direct: "By default, inference is dense, so ensure that you're looking at FLOPS without sparsity."

So the sparse number is not fake, but it is measured under a condition your deployment does not meet, so it does not predict your performance.

## Check the precision before you compare two GPUs

Sparsity is not the only way a spec sheet can mislead a comparison. FLOPS roughly double each time the number format halves in size, e.g., a GPU that does one petaFLOPS at 16 bits does about two petaFLOPS at 8 bits (Kiely, sec. 3.1.1). A comparison is only fair when both GPUs are quoted at the same precision and both figures are dense.

This gives you a two-step check for any GPU marketing page:

1. Is the figure dense or sparse? If the page does not say, look for an asterisk or a footnote. NVIDIA datasheets often print the sparse figure with a footnote that reads "with sparsity".
2. What precision is the figure at? FP8 numbers are about twice the FP16 numbers on the same chip, so comparing an FP8 figure against an FP16 figure is off by 2x before you start.

If a page fails either check, normalize the numbers yourself before you trust the comparison.

## Work one example with the H100

Here is the arithmetic for one GPU. The book's Hopper table (sec. 3.2.1) lists the H100 at 1,979 teraFLOPS of dense FP8 compute, with 80 GB of memory and 3.35 TB/s of bandwidth. NVIDIA's public H100 datasheet lists FP8 compute as 3,958 teraFLOPS, with a footnote that the figure is with sparsity.

The ratio is 3,958 divided by 1,979, which is exactly 2. Same chip, same precision, and the headline number is double the number your dense inference workload can reach. A vendor page that quotes 3,958 is not lying, but if you compare it against another GPU's dense figure you will overrate the H100 by 2x.

Here is what an honest two-GPU comparison looks like, using the dense FP8 figures from the book's tables. Prices are estimates, since cloud rates vary by provider and region.

| GPU | Dense FP8 | VRAM | Bandwidth | Price per hour |
| --- | --- | --- | --- | --- |
| H100 | 1,979 teraFLOPS | 80 GB | 3.35 TB/s | check your provider |
| H200 | 1,979 teraFLOPS | 141 GB | 4.8 TB/s | check your provider |

The excluded marketing number is the sparse figure for each chip. Note what the honest table shows. The H200 has no compute advantage at all. Its gains are memory size and bandwidth, which is exactly what helps LLM decode. If you mixed a sparse figure into this table, it would show a compute gap that does not exist.

## Know when the sparse number is legitimate

The sparse figure exists because pruning research produced models that can use it. Pruning is the process of setting some model weights to zero and removing their effect from the computation. Tools exist for this, e.g., Kiely's tooling chapter mentions that NVIDIA's ModelOpt library supports sparsity alongside quantization and distillation, and its outputs run on the common inference engines.

So a team could prune a model to the 2:4 pattern, verify that quality held up, and then honestly plan against the sparse FLOPS figure. If your vendor claims the sparse number applies to your deployment, ask two questions.

1. Which model in our stack was pruned to 2:4 structured sparsity?
2. Which serving path runs the sparse Tensor Core instructions?

If the answer to either question is vague, plan against the dense figure. The burden of proof sits with whoever quoted the bigger number.

## Try it

Time needed is about 20 minutes. No GPU is required, because this exercise only uses spec sheets and pricing pages.

1. Open the datasheet PDF for one GPU, e.g., search for "NVIDIA H100 datasheet" or "NVIDIA B200 datasheet".
2. Find the FP8 Tensor Core row. Write down the dense figure and the sparse figure. If only one number appears, read the footnotes to learn which one it is.
3. Divide sparse by dense. You will usually get 2, and the point of doing the division once is that you will recognize the doubled number on sight afterward.
4. Open one cloud GPU pricing page and find where it lists FLOPS for that GPU. Check the figure against your two numbers. Note whether the page quotes the dense figure, the sparse figure, or does not say.
5. Optional last step if you want to connect this to a real model: the dense figure is the one to use when you estimate serving cost for a public model such as [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf), because that model ships dense.

You pass if you can point at the pricing page and say which number it used.

## Check yourself

1. A vendor page says the H100 does 3,958 teraFLOPS of FP8. Your inference workload is a standard dense LLM. What throughput figure should you plan against? Expected answer: 1,979 teraFLOPS, the dense figure. The 3,958 figure assumes 2:4 structured sparsity, and a standard model does not have it.
2. GPU A is quoted at 2 petaFLOPS FP8 sparse. GPU B is quoted at 1.5 petaFLOPS FP8 dense. Which has more usable compute for dense inference? Expected answer: GPU B. GPU A's dense figure is about 1 petaFLOPS, since sparse is roughly double dense.
3. When would the sparse figure be the honest one to use? Expected answer: when the model was pruned to the 2:4 structured pattern and the serving stack runs the sparse Tensor Core path. That is rare in production LLM serving.
4. Why must the two GPUs in a comparison table be quoted at the same precision? Expected answer: FLOPS roughly double when precision halves, so an FP8 figure next to an FP16 figure inflates one chip by about 2x even when both are dense.

## Next steps

- Read the [hardware requirements guide](/docs/getting-started/hardware-requirements) to pick a GPU using dense FLOPS, VRAM, and bandwidth together.
- Read the [cost modeling guide](/docs/technical-guides/cost-modeling) to turn honest spec figures into a price per token.
- Read [what is an ops:byte ratio](/blog/what-is-ops-byte-ratio) to see why the dense FLOPS figure is the numerator in the ratio that predicts your bottleneck.

When you can do this, you can normalize GPU spec sheet comparisons to dense figures at the same precision and flag inflated claims.
