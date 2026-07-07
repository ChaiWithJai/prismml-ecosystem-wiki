---
title: "What is speech recognition vs. text-to-speech, in plain terms?"
description: "Speech recognition turns speech into text and TTS is the inverse. Both run in 1 to 2 GB locally, so a full offline voice assistant fits on a laptop."
audience: inference-engineer
pillar: end-user-case-study
book: both
chapter_ref: "Nika, Ch. 1, 'Speech' subsection; Kiely, Ch. 6, sec. 6.4"
status: draft
last_reviewed: 2026-07-07
---

Speech recognition turns human speech into text. Text-to-speech, or TTS, is the inverse and gives the computer a voice. Both are decades old and both now run in about 1 to 2 GB of memory on a laptop. Modern TTS is literally an LLM with audio tokens added to its vocabulary, so a whole offline voice assistant fits on your machine. {% .lead %}

## Separate the two directions of the same loop

Speech recognition, also called ASR for automatic speech recognition, takes audio in and produces text out. Nika's Building AI-Powered Products (Ch. 1) introduces it in the Traditional AI section, because voice assistants like Siri and Alexa have used it for years and the research goes back decades. Her definition of the inverse is just as short. TTS systems "give computers the ability to speak in a humanlike manner" (Nika, Ch. 1). Nika opened her career on a speech team, and her point is that the hard part was never the definition. The hard part was accents, speaker identity, and fitting the technology into a product people would use.

Neither direction needs a giant model. Whisper is the standard open ASR model, and Kiely's Inference Engineering (sec. 6.3) notes that the largest Whisper is 1.55B parameters, which is small next to any chat LLM. TTS models are small too. Kiely (sec. 6.4) gives Orpheus TTS at three billion parameters and calls that the larger end for the category.

## See why modern TTS is an LLM

Kiely (sec. 6.4) explains what changed in TTS. Modern open TTS models are fine-tuned LLMs. Orpheus TTS is derived from Llama 3.2 3B. The recipe is to expand the LLM's vocabulary with tens of thousands of encoded audio tokens, then train the model "on pairs of text inputs with tokenized audio outputs" (Kiely, sec. 6.4). The model then generates audio tokens the same way a chat model generates words, and a separate small audio decoder converts those tokens into a waveform you can play.

This is why the whole field converged. ASR, the LLM, and TTS now share most of their architecture on the decoder side, so the same runtimes and the same optimizations serve all three. It also changes the metrics. Kiely measures TTS with time to first byte, time to first sentence, and tokens per second, and he notes that a TTS model only needs on the order of 80 to 100 tokens per second to produce audio in real time. Faster decoding than that does not make the voice better. It only lets one GPU serve more people at once.

## Chain the three stages into an assistant

Kiely (sec. 6.4.2) describes how most voice products work today. They cascade three models. ASR listens and produces text, an LLM reads the text and writes an answer, and TTS speaks the answer. A small voice activity detection model usually sits in front to notice when you start and stop talking. Single models that go speech to speech exist, but Kiely writes that at publication the open ones were not commercially viable, so the cascade is still the practical design.

The cascade fits in surprisingly little memory. The file sizes below are approximate, and you should check the actual downloads. The whisper.cpp base English model is about 150 MB. A 1B parameter LLM at 4-bit quantization is about 0.8 GB. A medium Piper TTS voice is about 60 MB. That sums to about 1 GB of model weights for the whole loop, which is the basis for the 1 to 2 GB claim in the lead.

## Work the latency arithmetic for one turn

The numbers below are made up to show the arithmetic. Measure your own in the exercise.

Suppose ASR takes 1.0 second to transcribe your question, the LLM takes 0.3 seconds to read the prompt and then writes 20 tokens per second, the full answer is 60 tokens, and TTS needs 0.4 seconds to produce its first audio.

- If you wait for the full answer before speaking, the decode takes 60 / 20 = 3.0 seconds, and the turn takes 1.0 + 0.3 + 3.0 + 0.4 = 4.7 seconds.
- If TTS starts as soon as the first sentence exists, and that sentence is 15 tokens, the wait for text is 15 / 20 = 0.75 seconds, and the turn takes 1.0 + 0.3 + 0.75 + 0.4 = 2.45 seconds.

Streaming the answer into TTS sentence by sentence cut the perceived latency almost in half, and no stage got faster. This is why Kiely prefers time to first sentence over time to first byte as the user-facing TTS metric. The user hears the first sentence while the LLM is still writing the rest.

## Try it

You can build the loop in about 30 minutes with [whisper.cpp](/docs/ecosystem/whisper-cpp), [llama.cpp](/docs/ecosystem/llama-cpp), and Piper. No GPU is needed. All three run on a laptop CPU, and whisper.cpp and llama.cpp use the GPU on Apple silicon automatically.

Install the pieces and fetch the models. The exact model files are listed on each project's page.

```bash
git clone https://github.com/ggml-org/whisper.cpp && cd whisper.cpp
cmake -B build && cmake --build build -j
./models/download-ggml-model.sh base.en
brew install llama.cpp ffmpeg
pip install piper-tts
```

Record a five second question, then run the three stages and time each one. On a Mac, `-f avfoundation -i ":0"` records from the default microphone.

```bash
ffmpeg -f avfoundation -i ":0" -t 5 -ar 16000 question.wav
time ./build/bin/whisper-cli -m models/ggml-base.en.bin -f question.wav -otxt -of question
time llama-cli -hf ggml-org/Llama-3.2-1B-Instruct-GGUF -f question.txt -n 128 > answer.txt
time (cat answer.txt | piper --model en_US-lessac-medium --output_file answer.wav)
afplay answer.wav
```

Add the three times together for your end-to-end latency per turn, and note which stage took the longest. On most laptops it is the LLM decode. If you have a few more GB of memory free, swap the 1B model for [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf) and measure how the answer quality and the decode time both change.

## Check yourself

1. In one sentence each, what do ASR and TTS do? Expected answer: ASR converts spoken audio into text, and TTS converts text into spoken audio, so they are the same loop run in opposite directions.
2. What makes a modern TTS model an LLM rather than a separate kind of model? Expected answer: per Kiely (sec. 6.4), it is a fine-tuned LLM whose vocabulary was expanded with encoded audio tokens, plus a small audio decoder that turns the generated tokens into a waveform.
3. In the worked example, why did streaming the first sentence into TTS nearly halve the turn latency? Expected answer: the user starts hearing audio after 15 tokens of decode instead of 60, so the wait drops from 4.7 to 2.45 seconds even though every stage runs at the same speed.
4. Why is there no benefit to a TTS model decoding at 500 tokens per second for a single listener? Expected answer: per Kiely (sec. 6.4), 80 to 100 tokens per second already produces audio in real time, so extra speed only helps serve more concurrent streams.

## Next steps

- [whisper.cpp](/docs/ecosystem/whisper-cpp) covers the ASR stage in more depth.
- [llama.cpp](/docs/ecosystem/llama-cpp) covers running the LLM stage locally.
- [Is speech-to-speech one model or a pipeline?](/blog/speech-to-speech-vs-asr-llm-tts-pipeline) compares this cascade against single-model voice systems.

When you can do this, you can assemble a fully local three-stage voice loop and profile its per-stage latency.
