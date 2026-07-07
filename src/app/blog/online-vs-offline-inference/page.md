---
title: "What's the difference between online and offline inference?"
description: "Online inference optimizes for latency because a user is waiting. Offline batch inference optimizes for throughput because fewer GPUs means cheaper."
audience: inference-engineer
pillar: foundational-concept
book: inference-engineering
chapter_ref: "Ch. 1, sec. 1.2.2 (pp. 29-30)"
status: published
last_reviewed: 2026-07-07
---

Online inference optimizes for latency because a user is waiting. Offline batch inference optimizes for throughput because fewer GPUs means cheaper. The trade is direct, so the same model often deserves two deployments. Real-time dictation and back-catalog transcription can share Whisper weights but nothing else about their configuration. {% .lead %}

## Separate online from offline before you configure anything

An online workload has a person waiting on the other end of the request. Chat, code completion, and voice agents are all online. If the response is slow, the person notices and the product feels bad. So an online deployment should be configured for low latency, e.g., small batches and a short queue.

An offline workload has no one waiting. The job runs over a fixed pile of inputs and the only person who cares about timing is whoever pays the GPU bill. Kiely's Inference Engineering (Ch. 1, sec. 1.2.2) lists examples like transcribing a back catalog of podcasts, embedding a document set on a schedule, and cleaning a corpus for training. For these jobs, each individual request can be slow. What you want is the highest number of requests finished per hour of GPU time, because that number sets the cost.

Kiely calls latency versus throughput one of the primary tradeoffs in the field. In his words, lower latency "makes your application faster, but higher throughput makes it cheaper at scale" (Inference Engineering, sec. 1.2.2). The mechanism is batching. A GPU finishes more total work per hour when it processes many requests together, but each request in a big batch waits on the others, so each one finishes later. You can read why in our [batching guide](/docs/technical-guides/batching).

## Run the same model twice when both workloads exist

The model is not the deployment. Kiely uses Whisper, a speech-to-text model, as the example. A dictation app needs words on screen while the speaker is still talking, so it feeds the model small audio chunks and accepts that the GPU sits partly idle between them. A back-catalog job has the whole archive on disk already, so it packs the GPU with as much audio as fits and lets every request wait its turn.

The book's advice is that when both use cases have enough volume, you should run two separate deployments of the same weights, one configured for latency and one for throughput. A single deployment has to pick one side of the trade. If it picks latency, the batch job burns GPU hours on idle capacity. If it picks throughput, the dictation user watches a spinner.

## Work the cost arithmetic on one example

The speeds below are made up to show the arithmetic. Measure your own before deciding anything.

Suppose you have 10,000 hours of archived audio to transcribe, a GPU costs $2 per hour to rent, and you measure these two speeds on your hardware:

- The latency-tuned deployment, with small chunks and a batch size near 1, transcribes 5 hours of audio per GPU-hour.
- The throughput-tuned deployment, with large batches, transcribes 40 hours of audio per GPU-hour.

The batch job costs are then:

- Latency-tuned config: 10,000 / 5 = 2,000 GPU-hours, which is $4,000.
- Throughput-tuned config: 10,000 / 40 = 250 GPU-hours, which is $500.

Running the archive through the online deployment overpays by 8 times, and the ratio holds at any GPU price because both numbers scale with it. The mistake in the other direction does not show up as money. It shows up as latency. A throughput-tuned deployment waits to fill a batch before it starts, so the dictation user waits seconds for the first word instead of a fraction of a second. One deployment cannot win both metrics, which is why the book recommends two.

## Try it

You can feel both modes in about 20 minutes with [whisper.cpp](/docs/ecosystem/whisper-cpp) and one podcast episode. No GPU is needed, because the base model runs at usable speed on a laptop CPU, and whisper.cpp uses the GPU on Apple silicon automatically.

Build whisper.cpp and fetch a model:

```bash
git clone https://github.com/ggml-org/whisper.cpp && cd whisper.cpp
cmake -B build && cmake --build build -j
./models/download-ggml-model.sh base.en
```

Convert your episode to the format whisper.cpp reads:

```bash
ffmpeg -i episode.mp3 -ar 16000 -ac 1 episode.wav
```

First, the online-style run. Split the audio into 10 second chunks to imitate audio arriving live, then time how long the first chunk takes. That time is your latency to the first words.

```bash
ffmpeg -i episode.wav -f segment -segment_time 10 -c copy chunk_%03d.wav
time ./build/bin/whisper-cli -m models/ggml-base.en.bin -f chunk_000.wav
for f in chunk_*.wav; do ./build/bin/whisper-cli -m models/ggml-base.en.bin -f "$f"; done
```

Time the whole loop too. Then the offline-style run, the entire file as one job:

```bash
time ./build/bin/whisper-cli -m models/ggml-base.en.bin -f episode.wav
```

Record three numbers: latency to first words from the first chunk, wall-clock per audio-hour for the chunked loop, and wall-clock per audio-hour for the single batch run. The chunked run gets you words within seconds of "audio arriving", and the single run finishes the whole episode in less total time, because each chunk pays model startup and padding overhead that the batch run pays once.

## Check yourself

1. Which configuration wins on latency to first word, and why? Expected answer: the chunked run, because it starts transcribing after 10 seconds of audio exist instead of waiting for the whole file.
2. Which configuration wins on wall-clock per audio-hour, and why? Expected answer: the single batch run, because the per-chunk overhead is paid once and the hardware stays busy.
3. Your company runs only the latency-tuned deployment and pushes the archive job through it. Using the worked example above, what does that cost? Expected answer: 8 times the GPU spend of a throughput-tuned deployment, and the multiple is whatever ratio your own two measured speeds give.
4. When does one deployment stop being enough? Expected answer: when both an online and an offline use case have enough volume, per Kiely (sec. 1.2.2), because one configuration must sacrifice either the user's latency or the batch job's cost.

## Next steps

- [whisper.cpp](/docs/ecosystem/whisper-cpp) covers the tool used in the exercise.
- [Batching](/docs/technical-guides/batching) explains the mechanism that trades latency for throughput.
- [Batch size and the latency-throughput tradeoff](/blog/batch-size-latency-throughput-tradeoff) works the same trade at the level of a single server's batch size.

When you can do this, you can configure the same model for latency and for throughput and quantify the cost of using the wrong mode.
