---
title: "Should I use one omni-modal model or a pipeline of small specialists?"
description: "Small specialists often beat the same capability inside a VLM at a fraction of the size. The trade is that a pipeline buys accuracy and cost with orchestration."
audience: ml-product-team
pillar: end-user-case-study
book: inference-engineering
chapter_ref: "Ch. 6, sec. 6.1.2 (p. 159)"
status: draft
last_reviewed: 2026-07-07
---

Omni models are convenient, but small specialists often beat the same capability baked into a VLM at a fraction of the size. A dedicated OCR model that fits in a few hundred megabytes can outscore a 7B VLM on receipt extraction while using a tenth of the RAM. The trade is that each pipeline stage scales on its own, so you buy accuracy and cost with orchestration work. {% .lead %}

## Know what each path is

An omni-modal model is one model that accepts several kinds of input and produces several kinds of output. A vision language model, or VLM, is the common case for receipts. Kiely's Inference Engineering (sec. 6.1) explains that a VLM is two modules: a standard LLM plus a small vision encoder that turns raw images into image tokens. You send it a receipt photo and a prompt, and it writes the extracted fields as text.

A pipeline of specialists splits that job into stages. An OCR model reads the pixels and outputs plain text. Then a small text model, or even a parser, turns that text into structured fields. Kiely (sec. 6.1.2) notes that production VLM systems already look like this in practice, with individual preprocessors for extracting data from PDFs, reading text from images via OCR, and transcribing audio.

## Weigh accuracy against convenience

The book's verdict on omni models is measured. Their blend of modalities gives unique capabilities, but Kiely (sec. 6.1.2) states that "smaller specialized models are often faster and more accurate within specific domains". He gives text recognition as the example. Many VLMs have OCR ability trained into their image processing, but those abilities "lag behind dedicated optical character recognition (OCR) models" that are generally a fraction of the size (Inference Engineering, sec. 6.1.2).

Receipts are exactly that specific domain. The task is not open-ended visual reasoning. It is reading printed text and mapping it to a fixed schema. A specialist trained only on text recognition spends all of its capacity on that one skill, while a 7B VLM spends most of its capacity on general language and vision ability you do not use.

## Do the memory and token arithmetic

Here is one worked comparison. The parameter counts are exact arithmetic, and the runtime figures are estimates for planning, not benchmarks.

The VLM path. A 7B model in FP16 needs 7 billion parameters times 2 bytes, which is 14 GB of weights. A 4-bit quantized file needs about 7 times 0.5, which is roughly 3.5 GB, plus KV cache and runtime overhead. Kiely's rule of thumb (sec. 6.1) is that one high-resolution image adds about a thousand visual tokens to the input sequence. So each receipt costs a prefill of roughly 1,000 image tokens plus your prompt before the model writes a single output token.

The pipeline path. Tesseract, a widely used open OCR engine, installs in tens of megabytes and typically runs in well under 1 GB of RAM (estimate). Its output for a receipt is a few hundred characters of plain text. If you then hand that text to a small LLM such as [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf) to structure it, the LLM reads roughly 300 text tokens instead of 1,000 image tokens, and you only need the LLM stage at all when a parser cannot handle the format.

Note what the arithmetic implies for scale. Kiely (sec. 6.1.2) says each pipeline component must be individually optimized for speed and should scale independently to avoid bottlenecks. If OCR is fast and structuring is slow, you add replicas only to the structuring stage. With one omni model, you can only scale the whole thing. The [cost modeling guide](/docs/technical-guides/cost-modeling) shows how to price both shapes.

The pipeline's cost is orchestration. Two stages means two deployments, two sets of metrics, a queue between them, and two places where a bad input can fail. At low traffic, that overhead can cost more engineer time than the VLM's extra RAM costs in hardware. The bake-off below gives you the numbers to find your own crossover point.

## Try it

Run both paths on five receipt screenshots in about 25 minutes. No GPU is needed. On a laptop, the VLM will be slow, and that is part of the lesson.

First, collect five receipt screenshots as PNG files and write out the ground-truth text for the total line of each one by hand.

Time the specialist with Tesseract.

```bash
brew install tesseract
time tesseract receipt1.png out1
cat out1.txt
```

Time a local VLM with llama.cpp. This downloads a 7B vision model, which needs roughly 6 GB of memory for the 4-bit file plus the vision encoder.

```bash
brew install llama.cpp
time llama-mtmd-cli -hf ggml-org/Qwen2.5-VL-7B-Instruct-GGUF \
  --image receipt1.png -p "Transcribe every line of this receipt exactly."
```

Repeat both commands for all five receipts. Score each path with exact-match on the total line: the extracted text either matches your ground truth exactly or it does not. Record three numbers per path: exact matches out of five, median seconds per receipt from `time`, and peak memory from Activity Monitor while the command runs.

If Tesseract misreads a receipt, that is a finding too. Crumpled or photographed receipts favor stronger OCR models or the VLM, and clean digital screenshots favor the specialist. Where the specialist wins on accuracy and speed, the remaining question is whether your traffic justifies running two services, and the [inference stack overview](/docs/concepts/inference-stack) shows where each stage sits.

## Check yourself

1. Why does a dedicated OCR model often beat a VLM at reading receipts? Expected answer: Kiely (sec. 6.1.2) reports that VLM text recognition lags behind dedicated OCR models that are a fraction of the size, because the specialist spends all of its capacity on one domain.
2. Roughly how much memory do the 4-bit weights of a 7B model need, and how did you get the number? Expected answer: about 3.5 GB, from 7 billion parameters times half a byte, before KV cache and overhead.
3. Why does a receipt image cost more input tokens than the OCR text of the same receipt? Expected answer: one high-resolution image adds about a thousand visual tokens (sec. 6.1), while the OCR text of a receipt is a few hundred text tokens.
4. Your OCR stage runs at 20x the speed of your structuring stage. What does independent scaling let you do? Expected answer: add replicas only to the structuring stage, instead of scaling one omni model that bundles both jobs.

## Next steps

- [Cost modeling](/docs/technical-guides/cost-modeling) turns your bake-off numbers into a monthly cost for each architecture.
- [The inference stack](/docs/concepts/inference-stack) explains where OCR, VLM, and LLM stages sit in a serving system.
- [Why do images blow up my context window?](/blog/images-blow-up-context-window) goes deeper on the image token arithmetic used above.

When you can do this, you can run a specialist-versus-generalist bake-off and justify a pipeline architecture from measurements.
