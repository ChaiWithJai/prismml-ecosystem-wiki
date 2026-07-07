---
title: "What is GGUF block quantization and how do Q4_K models actually work?"
description: "Scale factors can apply per tensor, per channel, or per block. Q4_K stores a scale for every 32 values, and that granularity makes 4-bit inference usable."
audience: researcher
pillar: ecosystem-player
book: inference-engineering
chapter_ref: "Ch. 5, sec. 5.1.1 (pp. 123-124)"
status: draft
last_reviewed: 2026-07-07
---

A scale factor can apply to a whole tensor, to one channel, or to a small block of values. Finer granularity preserves outliers better, at the cost of storing and applying more scales. GGUF quantizes at the block level. In Q4_K, every block of 32 values carries its own scale, and that is what makes 4-bit inference usable on consumer hardware. {% .lead %}

## Climb the granularity ladder

A quantized format stores low-precision values plus a scale factor, which is the multiplier that maps those values back toward the original precision. Kiely's Inference Engineering (Ch. 5, sec. 5.1.1) lists three levels at which the scale can apply:

1. **Tensor level.** One scale for the entire tensor. This is the cheapest option, but one outlier value forces a large scale on millions of values, so the small values lose resolution.
2. **Channel level.** One scale per feature vector within the tensor. An outlier now only distorts its own channel.
3. **Block level.** Each feature vector is split into blocks of N values, and each block gets its own scale. An outlier now only distorts the 16 or 32 values that share its block.

Kiely states the tradeoff directly. Finer granularity has a lower chance of smoothing over outliers, so quality holds up, but the extra scales take memory to store and compute to apply. Blackwell GPUs apply block scale factors inside the Tensor Cores to hide that compute cost, and the same tradeoff shows up in file formats.

## Read the Q4_K layout

GGUF is the binary file format used by llama.cpp, and Kiely notes it "is the most popular choice for distributing highly quantized models on Hugging Face". Its quantization types are block formats. Q4_K, the most common 4-bit type, uses two levels of scale:

- Weights are grouped into super blocks of 256 values.
- Each super block is split into 8 sub blocks of 32 values.
- Each sub block stores a 6-bit scale and a 6-bit minimum, so every 32 values get their own mapping.
- Each super block stores one FP16 scale and one FP16 minimum that the 6-bit values multiply against.

So a 4-bit weight in Q4_K is decoded through two scales, a coarse FP16 one shared by 256 values and a fine 6-bit one shared by 32 values. This is the same idea as the microscaling formats the book describes for datacenter GPUs. MXFP4 computes a scale on every 32 parameters, and NVFP4 uses blocks of 16 plus a global scale. GGUF applies the idea in software so it runs on CPUs and Apple silicon, with no Blackwell hardware required.

## Work through the true bits per weight

The scales are not free, and you can compute their exact cost. One Q4_K super block covers 256 weights and stores:

```text
4-bit quants:    256 x 4 bits            = 1,024 bits = 128 bytes
sub block scales: 8 x (6 + 6) bits       =    96 bits =  12 bytes
super block scale: FP16 scale + FP16 min =    32 bits =   4 bytes

total: 144 bytes per 256 weights
bits per weight: (144 x 8) / 256 = 4.5
```

So Q4_K costs 4.5 bits per weight, not 4.0. The 0.5-bit overhead is the price of a scale and a minimum for every 32 values. These numbers come from the format definition in llama.cpp, not from a benchmark.

A file named Q4_K_M is a mix, because llama.cpp keeps sensitive tensors like some attention and output projections at Q6_K, which costs 6.5625 bits per weight by the same kind of arithmetic. The file average lands around 4.8 bits per weight, and that figure is an estimate that varies by architecture. The exercise below shows you how to read the exact mix from a file.

## Try it

This takes about 20 minutes, and most of it is download time. No GPU is needed, because you only inspect the file. You need Python and one GGUF file, e.g., the Q4_K_M file from [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf), which is roughly 5 GB.

```bash
pip install gguf huggingface_hub
huggingface-cli download prism-ml/Bonsai-8B-gguf \
  Bonsai-8B-Q4_K_M.gguf --local-dir .

gguf-dump Bonsai-8B-Q4_K_M.gguf | less
```

Read the output in two passes:

1. In the metadata section, find `general.file_type`. It names the overall quantization scheme of the file.
2. In the tensor list, each row shows a tensor name, its shape, its element count, and its type, e.g., `Q4_K` or `Q6_K`. Pick one `Q4_K` tensor and check its byte size against its element count. The ratio times 8 should come out to 4.5 bits per element, which confirms the super block arithmetic above.

Also note which tensors are not Q4_K. You will usually find the token embedding and some projections at Q6_K, and small tensors like layer norms at F32, because they are tiny and sensitive.

## Check yourself

1. Name the three levels at which a scale factor can apply, and state what finer granularity buys you and what it costs. Expected: tensor level, channel level, and block level. Finer granularity keeps outliers from distorting values outside their own block, and it costs extra memory and compute for the added scales.
2. Compute the true bits per weight of Q4_K from its layout. Expected: 128 bytes of quants plus 12 bytes of sub block scales plus 4 bytes of super block scales is 144 bytes per 256 weights, which is 4.5 bits per weight.
3. Why does a Q4_K_M file average more than 4.5 bits per weight? Expected: it is a mixed file. Sensitive tensors are kept at Q6_K or F32, so the average across the whole file is higher than the Q4_K rate.
4. Your colleague proposes one FP16 scale per tensor to save the scale overhead. What happens to quality at 4 bits? Expected: one outlier sets the scale for the whole tensor, so the many small values round to a few coarse steps and quality drops. The 0.5-bit block overhead is what prevents this.

## Next steps

- [Quantization guide](/docs/technical-guides/quantization) for number formats, dynamic range, and how granularity interacts with both.
- [llama.cpp ecosystem guide](/docs/ecosystem/llama-cpp) for where GGUF fits in the toolchain and which quantization types it supports.
- [Which parts of an LLM are safest to quantize?](/blog/safest-parts-of-llm-to-quantize) for choosing what to quantize once you understand how the format stores it.

When you can do this, you can explain the granularity ladder of scale factors and read a GGUF quant scheme's real storage cost from its metadata.
