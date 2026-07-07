---
title: "Should I use a speech-to-speech model or an ASR-LLM-TTS pipeline?"
description: "Cascaded VAD-ASR-LLM-TTS pipelines beat end-to-end speech-to-speech models on capability and cost, but you must budget latency across four models, not one."
audience: ml-product-team
pillar: end-user-case-study
book: inference-engineering
chapter_ref: "Ch. 6, sec. 6.4.2 (pp. 168-169)"
status: draft
last_reviewed: 2026-07-07
---

Use the pipeline. A cascade of VAD, ASR, LLM, and TTS models currently beats end-to-end speech-to-speech models on both capability and cost. The price is that you must budget latency across four models, and each stage has its own metric, such as time to the first spoken word rather than TTFT. Voice agent architecture is a pipeline decision first and a model decision second. {% .lead %}

## Know what each architecture is

A cascaded voice agent is a pipeline of four models. A voice activity detection model, or VAD, is a small model that flags which spans of audio contain speech, and it decides when the user has stopped talking. An ASR model such as Whisper turns the audio into text. An LLM reads the text and writes a reply. A TTS model turns the reply into audio. Kiely's Inference Engineering (sec. 6.4.2) describes this as the way most voice systems listen, think, and respond today, often with extra pieces such as embedding models for context.

A speech-to-speech model collapses the middle of that pipeline into one model. Kiely (sec. 6.4.2) explains that models like OpenAI's gpt-realtime take a core LLM and add the ability to consume and produce audio directly. This works because ASR, LLM, and TTS models share very similar decoder architectures.

## Pick the pipeline until speech-to-speech catches up

Kiely's verdict at time of publication is direct. There are no commercially viable open speech-to-speech models, and the closed options are "significantly less capable and more expensive than cascading multi-model setups" (Inference Engineering, sec. 6.4.2). He adds that research in the area is active and the modality will need its own inference engineering soon, so revisit this choice, but do not build on it today.

The pipeline also gives you control that a single model cannot. You can swap the ASR model without touching the LLM, quantize the TTS model to FP8 while the ASR model stays in FP16 (sec. 6.4), and scale each stage on its own hardware. The cost is coordination. Four models means four latency budgets, four sets of metrics, and four places to look when the agent feels slow.

## Budget latency across four stages

A voice agent feels responsive when the reply starts quickly after the user stops talking. So the number to budget is the time from the end of the user's speech to the first audible word of the reply. Each stage has its own metric on the way there.

- The VAD stage costs the silence it must observe before it declares the turn over.
- The ASR stage is measured by round-trip time per chunk, and Kiely (sec. 6.3.1) gives 200 milliseconds as a target because that is the average human reaction time.
- The LLM stage is measured by TTFT, but TTFT alone is not enough. The TTS model needs a first phrase to speak, so the useful number is the time to the first complete sentence of text.
- The TTS stage is measured by time to first byte of audio, which Kiely (sec. 6.4) calls TTFB and treats as the TTS equivalent of TTFT. He reports that Orpheus TTS can reach 150 milliseconds on a single H100.

Here is one budget that sums under one second. The VAD and LLM numbers are estimates for planning, and the other two come from the book's targets on server GPUs.

- VAD end-of-turn detection, 100 ms (estimate).
- ASR on the final chunk, 200 ms (Kiely's live target, sec. 6.3.1).
- LLM time to the first sentence of text, 350 ms (estimate).
- TTS time to first byte of audio, 150 ms (Kiely's Orpheus figure, sec. 6.4).

The sum is 100 + 200 + 350 + 150 = 800 milliseconds, which leaves 200 milliseconds for the network and audio buffers inside a one second target. Note what the arithmetic implies. Even if the LLM were instant, the other three stages plus network still spend about 650 milliseconds, so tuning the LLM alone cannot make a slow agent fast.

One more number from the book keeps you from over-tuning the last stage. A TTS model only needs to generate about 80 to 100 tokens per second to keep up with real-time audio, and Kiely (sec. 6.4) notes that speed beyond that level does not help the listener. Extra TTS throughput should go to serving more concurrent streams, not to a lower number on a dashboard.

## Try it

Build the toy loop on a laptop in about 25 minutes and time each stage. No GPU is needed. Your laptop numbers will be far worse than the book's H100 numbers, and that is fine, because the goal is to find which stage takes the largest share of your budget, not to hit the budget.

Time the ASR stage with [whisper.cpp](/docs/ecosystem/whisper-cpp) on its bundled sample.

```bash
git clone https://github.com/ggml-org/whisper.cpp && cd whisper.cpp
cmake -B build && cmake --build build -j
./models/download-ggml-model.sh base.en
time ./build/bin/whisper-cli -m models/ggml-base.en.bin -f samples/jfk.wav
```

Time the LLM stage with llama.cpp and [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf). The 4-bit file needs about 6 GB of memory. The timing block at the end of the output reports prompt processing time, which is your TTFT, and tokens per second, from which you can compute the time to a first sentence of about 15 tokens.

```bash
brew install llama.cpp
llama-cli -hf prism-ml/Bonsai-8B-gguf -p "Answer in one short sentence. What time do you close tonight?" -n 32
```

Time the TTS stage with the system voice on a Mac. Writing to a file measures synthesis without playback.

```bash
time say -o reply.aiff "We close at nine tonight."
```

For the VAD stage, assign your estimate on paper, because the cost is mostly the silence threshold you configure rather than compute. Then fill in the four-line budget from the section above with your measured numbers and see which stage is over. On most laptops the LLM stage takes the largest share by far, and people who guessed ASR are usually wrong.

## Check yourself

1. Why does Kiely recommend the cascade over speech-to-speech today? Expected answer: there are no commercially viable open speech-to-speech models, and the closed ones are less capable and more expensive than cascaded setups (sec. 6.4.2).
2. Why is TTFT alone the wrong metric for the LLM stage of a voice agent? Expected answer: the TTS model cannot start until it has a speakable phrase, so the number that gates the reply is the time to the first complete sentence of text, not the first token.
3. Your TTS model generates 300 tokens per second. How much does raising that to 400 help one listener? Expected answer: not at all, because real-time audio only needs about 80 to 100 tokens per second (sec. 6.4), so the extra speed should serve more concurrent streams instead.
4. Which stage blew the budget in your toy loop, and how do you know? Expected answer: your own measured stage, named from the timing output rather than from a guess.

## Next steps

- [whisper.cpp](/docs/ecosystem/whisper-cpp) covers installing and configuring the ASR stage used above.
- [Observability](/docs/technical-guides/observability) shows how to record per-stage latency in production instead of with `time`.
- [What do TTFT and TPS measure?](/blog/what-do-ttft-and-tps-measure) explains the LLM metrics that the voice metrics in this post are built on.

When you can do this, you can allocate and validate a four-stage voice latency budget against a target under one second.
