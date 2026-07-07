---
title: "Why are floating-point formats better than integers for LLM quantization?"
description: "Exponent bits give floating-point formats the dynamic range to keep outlier values that integer formats crush, and scale-factor granularity is the other half."
audience: researcher
pillar: foundational-concept
book: inference-engineering
chapter_ref: "Ch. 5, sec. 5.1.1 (pp. 122-124)"
status: draft
last_reviewed: 2026-07-07
---

Exponent bits give floating-point formats the dynamic range to keep both tiny values and large outliers in the same tensor. Integer formats spread their codes evenly, so one large outlier forces a coarse scale that crushes everything else. Outlier handling, not average-case precision, is the quality frontier in low-bit inference, and scale-factor granularity is the other half of the same story. {% .lead %}

## Understand what exponent bits buy

An 8-bit value can encode 256 distinct codes whether it is an integer or a float. What differs is where those codes sit on the number line. INT8 places them at equal spacing, so a single scale factor maps the whole tensor onto 256 evenly spaced points. FP8 in the E4M3 layout spends 1 bit on sign, 4 bits on an exponent, and 3 bits on a mantissa, so its codes are dense near zero and spread out far from zero. The spacing between neighboring codes grows with the magnitude of the value.

Kiely's Inference Engineering (Ch. 5, sec. 5.1.1) defines dynamic range as the difference between the smallest and largest value a format can represent, and argues this is the property that decides quality in low-precision inference. The exponent gives floating-point formats a much wider dynamic range, "meaning it can better express very large and very small numbers," as Kiely puts it.

This is the property LLM weights need. Most weights in a linear layer sit in a narrow band near zero, but a small fraction are far larger, and those outliers have an outsized effect on the output. A format that represents the outliers badly loses quality even when it represents the bulk well.

## Work through one tensor by hand

Take a weight tensor where the bulk sits around 0.03 in magnitude and one weight is 6.0. All numbers below are derived from the format definitions, not benchmarks.

INT8 with a symmetric per-tensor scale has two options, and both lose.

- Keep the outlier. The scale is 6.0 / 127, which is about 0.0472. A bulk weight of 0.03 rounds to code 1 and dequantizes to 0.0472. The error is 0.0172, which is 57 percent of the value. The outlier is fine, and the bulk is ruined.
- Clip the outlier. Calibrate the scale to the bulk instead, e.g., scale to a 99th percentile near 0.05. Now the bulk is accurate to within half a step, about 0.0002, but 6.0 clips to 0.05. The error on the outlier is 5.95.

FP8 E4M3 does not have to choose, because the exponent moves per value.

- The outlier 6.0 is 1.5 times 2 to the power 2, which E4M3 stores exactly.
- The bulk weight 0.03 is 1.92 times 2 to the power -6. The 3-bit mantissa stores steps of 1/8, so the nearest code is 1.875 times 2 to the power -6, which is 0.0293. The error is 0.0007, about 2.3 percent.

Note what FP8 does not win. On the narrow bulk alone, a well-calibrated INT8 scale gives a smaller step (0.0002 here) than FP8's roughly 3 percent relative rounding. Integer formats look comparable or better on the average case. They lose specifically on tensors that mix a narrow bulk with outliers, and LLM weight tensors are exactly that.

Kiely's practical conclusion for production systems is blunt. Integer formats "are not suitable for quality-sensitive workloads due to their lack of dynamic range" (Ch. 5, sec. 5.1.1), and 8-bit floating point is generally the sweet spot for performance without quality loss.

## Shrink the scale factor's territory

The scale factor is the other half of the story, because dynamic range problems are local. One outlier only poisons the values that share its scale factor. The book lists three levels of granularity:

- Tensor level, one scale factor for the whole tensor.
- Channel level, one scale factor per feature vector.
- Block level, one scale factor per block of N values inside a vector.

Smaller territory means an outlier in one block no longer forces a coarse scale on the rest of the tensor. This is how modern 4-bit formats stay usable despite having almost no dynamic range of their own. MXFP8 and MXFP4 compute a blockwise scale for every 32 parameters, and NVFP4 uses blocks of 16 plus a second global scale factor. The cost is overhead. Every scale factor takes memory and must be applied at compute time, which is part of why real quantization gains fall short of the theoretical 2x per precision step.

{% callout type="note" %}
GGUF files use the same idea for local inference, with block-level scales and some components left at higher precision. The quantized builds on the [Bonsai 8B model card](https://huggingface.co/prism-ml/Bonsai-8B-gguf) are an example you can download and inspect. See the [quantization guide](/docs/technical-guides/quantization) for format details.
{% /callout %}

## Try it

Reproduce the outlier effect in a notebook with numpy. No GPU is needed, and the run takes a few seconds.

```python
import numpy as np

rng = np.random.default_rng(0)
w = rng.normal(0, 0.02, size=1_000_000).astype(np.float32)
out = rng.choice(w.size, 10_000, replace=False)  # ~1 percent outliers
w[out] *= 100

def int8(x):
    scale = np.quantile(np.abs(x), 0.99) / 127  # calibrated to the bulk
    return np.clip(np.round(x / scale), -127, 127) * scale

def fp8_e4m3(x):
    m, e = np.frexp(x)                # x = m * 2**e
    y = np.ldexp(np.round(m * 16) / 16, e)  # 3-bit mantissa
    return np.clip(y, -448, 448)

top = np.abs(w) >= np.quantile(np.abs(w), 0.99)
for name, q in [("INT8", int8(w)), ("FP8", fp8_e4m3(w))]:
    err = np.abs(w - q)
    print(name, "bulk max err:", err[~top].max(), "top 1% max err:", err[top].max())
```

The toy FP8 skips subnormals, so it is slightly kinder to tiny values than real hardware, but the outlier comparison holds. Then swap the INT8 calibration from the 99th percentile to `np.abs(x).max()` and print the same two numbers again. You should see the failure move from the outliers to the bulk, which shows that no single integer scale serves both.

## Check yourself

1. Your INT8 error looks fine on the bulk but is huge on the top 1 percent of values. What happened? Expected: the scale was calibrated to the bulk, so values above the calibration point were clipped. The format has no exponent to reach them.
2. You recalibrate INT8 with the absolute max instead. Why does bulk error jump? Expected: the outlier sets the step size for the whole tensor, so the 256 evenly spaced codes become too coarse for the narrow bulk.
3. What do block-level scale factors change, and what do they cost? Expected: each scale factor covers a small block, so an outlier only coarsens its own block. The cost is extra memory for the scale factors and extra compute to apply them.
4. Why can INT8 beat FP8 on a tensor with no outliers? Expected: evenly spaced codes match a narrow distribution better than exponent-spaced codes, which spend range on magnitudes the tensor never uses.

## Next steps

- [Quantization guide](/docs/technical-guides/quantization) for formats, granularity, and quality checks.
- [Which parts of an LLM are safest to quantize?](/blog/safest-parts-of-llm-to-quantize) for where these formats get applied first.

When you can do this, you can demonstrate numerically why exponent bits preserve outliers and explain what block-level scale factors add.
