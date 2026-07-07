---
title: "What's the fastest way to run Whisper locally — streaming or batch?"
description: "Streaming whisper.cpp with small chunks minimizes latency to the first word. Batch runs over whole files maximize audio hours per GPU hour. Same weights."
audience: inference-engineer
pillar: ecosystem-player
book: inference-engineering
chapter_ref: "Ch. 6, secs. 6.3.1-6.3.2 (pp. 163-165); Ch. 1, sec. 1.2.2"
status: published
last_reviewed: 2026-07-07
---

It depends on which speed you are buying. Streaming whisper.cpp with small chunks cut at pauses in speech gives the lowest latency to the first word, so it fits live dictation. Batch runs over whole files finish the most audio hours per hour of compute, so they fit backlogs. The weights are the same, and only the deployment changes. {% .lead %}

## Name the metric before you tune anything

"Fastest" hides two different numbers. For live use, the number is round-trip time from when you stop speaking to when the words appear. Kiely's Inference Engineering (sec. 6.3.1) suggests aiming for 200 milliseconds per chunk, because that is the average human reaction time. For a backlog of files, the number is how many hours of audio you transcribe per hour of wall clock. The book (sec. 6.3.2) measures this as the Real-Time Factor, or RTF. An RTF of 2X means you transcribe one hour of audio in 30 minutes, and Kiely reports that a deployment tuned for long files can reach an RTF of 1000X on server GPUs.

This is the online versus offline split from Chapter 1 (sec. 1.2.2) applied to speech. One configuration cannot win both numbers, so pick the metric first. Our post on [online versus offline inference](/blog/online-vs-offline-inference) covers the general version of this trade.

## Configure streaming when a person is waiting

Kiely (sec. 6.3.1) makes a point that surprises people. Streaming is not a feature of the model runtime. The runtime still transcribes fixed chunks of audio. Streaming is built one layer up, where a server holds a connection open, a voice activity detection model watches the incoming audio, and the server cuts a chunk whenever the speaker pauses. A voice activity detection model, or VAD, is a small model that flags which spans of audio contain speech. Each chunk goes to Whisper as a normal request and the text comes back over the connection.

Chunk size is the main lever. The model cannot transcribe a word before the audio for it exists, so latency to the first word is at least the chunk length plus the inference time on that chunk. A 2 second chunk can show words about 2 seconds after you start talking. A 10 second chunk cannot beat 10 seconds no matter how fast the GPU is.

Small chunks cost accuracy. Whisper reads audio in windows of up to 30 seconds, and a word cut in half at a chunk boundary is often transcribed wrong. Kiely notes that when chunks run in order on the same machine, you can pass the previous chunk's text in as a prefix for the next chunk, which restores some of the lost context.

## Configure batch when the files are already on disk

For a backlog, no one is watching a single request, so let every chunk wait its turn. Kiely (sec. 6.3.2) describes the pipeline for long files. A VAD model first removes silence and cuts the audio at pauses rather than at fixed intervals, because a fixed interval risks cutting words in half. The chunks then run in parallel, packed into large batches so the hardware stays busy, and the transcripts are stitched back together by timestamp.

Parallel chunks give up the previous-chunk prefix trick. The book's answer is to check each chunk's output for repeated words and abnormal words per minute, which are the usual signs of a hallucinated transcript, and to re-run only the suspect chunks. Kiely writes that in practice these checks "obviate the need for passing a previous sequence as a prefix" (Inference Engineering, sec. 6.3.2).

## Work the overhead arithmetic on one example

The times below are made up to show the arithmetic. Measure your own before deciding anything.

Suppose each chunk pays 0.3 seconds of fixed overhead for model startup, padding, and scheduling, on top of the transcription itself.

- With 2 second chunks, one hour of audio is 1,800 chunks, and the overhead alone is 1,800 x 0.3 = 540 seconds, which is 9 minutes per audio hour.
- With 10 second chunks, one hour of audio is 360 chunks, and the overhead is 360 x 0.3 = 108 seconds, which is under 2 minutes per audio hour.
- With 30 second chunks, the overhead is 120 x 0.3 = 36 seconds per audio hour.

The transcription work is the same in every row, so the small chunks pay 15 times the overhead of the large ones. That is the whole trade in one table. Small chunks buy latency to the first word and pay for it in throughput and accuracy. Large chunks buy throughput and pay for it in waiting. The [batching guide](/docs/technical-guides/batching) explains the same mechanism for text models.

## Try it

You can measure the trade yourself in about 25 minutes with [whisper.cpp](/docs/ecosystem/whisper-cpp) and a microphone. No GPU is needed. The base model runs at usable speed on a laptop CPU, and whisper.cpp uses the GPU on Apple silicon automatically.

Build with the microphone example enabled and fetch a model. The streaming tool needs the SDL2 library, e.g., `brew install sdl2` on a Mac.

```bash
git clone https://github.com/ggml-org/whisper.cpp && cd whisper.cpp
cmake -B build -DWHISPER_SDL2=ON && cmake --build build -j
./models/download-ggml-model.sh base.en
```

Read one fixed paragraph aloud three times, once per chunk size. The `--step` flag sets how many milliseconds of new audio each inference step consumes.

```bash
./build/bin/whisper-stream -m models/ggml-base.en.bin --step 2000 --length 6000
./build/bin/whisper-stream -m models/ggml-base.en.bin --step 5000 --length 10000
./build/bin/whisper-stream -m models/ggml-base.en.bin --step 10000 --length 10000
```

For each run, record two things. First, the round-trip latency, which you can time from the end of a sentence to the text appearing. Second, the word errors, which you count by comparing the output to your paragraph. Then try the VAD mode, which cuts at your pauses instead of at a fixed interval:

```bash
./build/bin/whisper-stream -m models/ggml-base.en.bin --step 0 --length 30000 -vth 0.6
```

Expect the 2 second runs to show text fastest and to garble more words, mostly at chunk boundaries. Expect the VAD run to fix many of those errors, because pauses are places where no word is being cut.

## Check yourself

1. What is the floor on latency to the first word for a 5 second chunk, even on infinitely fast hardware? Expected answer: 5 seconds plus the inference time, because the audio for a word has to exist before the model can transcribe it.
2. In your microphone test, at which chunk size did accuracy degrade, and what is the mechanism? Expected answer: your own smallest size, and the mechanism is that a chunk boundary cuts words in half and drops the surrounding context that Whisper would otherwise use.
3. Why does a batch pipeline cut chunks with a VAD model instead of every N seconds? Expected answer: per Kiely (sec. 6.3.2), fixed intervals risk cutting words in half, while cutting at silence keeps each word intact.
4. Parallel batch transcription cannot pass the previous chunk's text as a prefix. What replaces it? Expected answer: automatic checks on each chunk for repeated words and abnormal words per minute, then re-running the suspect chunks with a higher temperature or smaller chunks.

## Next steps

- [whisper.cpp](/docs/ecosystem/whisper-cpp) covers installing and configuring the tool used above.
- [Batching](/docs/technical-guides/batching) explains why large batches raise throughput and latency together.
- [What's the difference between online and offline inference?](/blog/online-vs-offline-inference) works the same trade with cost arithmetic for a transcription backlog.

When you can do this, you can configure whisper.cpp for a latency target or a throughput target and state the accuracy trade at each chunk size.
