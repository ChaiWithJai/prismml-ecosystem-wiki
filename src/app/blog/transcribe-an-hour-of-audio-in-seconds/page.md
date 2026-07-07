---
title: "How can I transcribe an hour of audio in seconds?"
description: "Not with a faster model. VAD chunking on CPU splits the file at silences, chunks fan out to parallel GPU workers, and quality checks catch hallucinations."
audience: inference-engineer
pillar: end-user-case-study
book: inference-engineering
chapter_ref: "Ch. 6, sec. 6.3.2 (pp. 164-165)"
status: published
last_reviewed: 2026-07-07
---

With a two-stage pipeline, not a faster model. A voice activity detection stage on CPU splits the file at silences, then the chunks fan out to parallel GPU workers, and speed improves roughly linearly up to about 1000x real time. Hallucinations from lost cross-chunk context are caught by compression-ratio and words-per-minute checks, and you fix them by re-running the odd chunks. {% .lead %}

## Measure speed as a real-time factor

Long-file transcription is measured with the Real-Time Factor, or RTF. The RTF is the length of the audio divided by the wall time it took to transcribe. Kiely's Inference Engineering (sec. 6.3.2) gives the anchor points. A person who transcribed an hour of audio in 30 minutes would have an RTF of 2X, and a Whisper deployment tuned for long files can transcribe an hour in under four seconds, which is an RTF above 900X, or roughly 1000X.

No single model runs 1000 times faster than real time on one request. Whisper reads audio in windows of up to 30 seconds, so an hour-long file is not one request in the first place. The speed comes from turning the file into hundreds of independent requests and running them at the same time.

## Split the file at silences, not at fixed intervals

The first stage is a voice activity detection model, or VAD. A VAD is a small model that flags which spans of audio contain speech. Kiely (sec. 6.3.2) has it run on its own dedicated hardware, and a CPU is enough because the model is tiny. The VAD removes silence and cuts the file into chunks at the pauses between words.

The cut points are the reason to use a VAD instead of slicing every 30 seconds. A fixed interval lands wherever it lands, and when it lands in the middle of a word, Whisper transcribes that word wrong on both sides of the cut. A pause is a place where no word exists to cut. As a bonus, the silence itself never reaches the GPU, so you do not pay inference time for dead air.

## Fan the chunks out to parallel workers

The second stage is a pool of GPU workers running Whisper. Each chunk is an independent request, so the chunks from one file can spread across every worker at once. Kiely (sec. 6.3.2) writes that RTF improves roughly linearly with the number of GPUs, and that each GPU also processes several chunks at once with in-flight batching. The workers do not need to be full GPUs. The book uses fractions of an H100 through Multi-Instance GPU, because the largest Whisper model is only 1.55B parameters. When every chunk is done, you stitch the transcripts back together by timestamp.

Here is the arithmetic on a made-up example, marked as such. Suppose one worker transcribes a 30 second chunk in 1.5 seconds, which is an RTF of 20X per worker. An hour of speech is about 120 such chunks after the silence is removed.

- Sequential, one worker: 120 x 1.5 = 180 seconds of wall time, so RTF is 3600 / 180 = 20X.
- 8 workers: about 15 chunks each, 15 x 1.5 = 22.5 seconds, so RTF is 3600 / 22.5 = 160X.
- 48 workers: 2 to 3 chunks each, about 4 seconds, so RTF is around 900X.

The per-chunk time never changed. Only the fan-out did. That is why buying a faster model is the wrong first move for long files.

## Catch the hallucinations that parallelism causes

Parallel chunks give up one quality trick. When chunks run in order on one machine, the previous chunk's text can be passed in as a prefix for the next chunk, and that context improves the transcription. Parallel workers cannot do this, because chunk 40 may finish before chunk 39 starts.

The lost context shows up as hallucinations, and the common form is a word or phrase repeated in a loop. Kiely (sec. 6.3.2) points out that these are cheap to detect automatically. A looping transcript compresses far better than normal text, so its compression ratio is abnormal, and its words per minute drift far from normal speech. When a chunk fails either check, the book gives two fixes:

- Re-run the chunk at a higher temperature. This sounds backwards because higher temperatures usually produce more hallucinations, but the goal is to break the repetition loop by forcing a different output.
- Re-chunk that segment into smaller pieces and transcribe them again.

Kiely writes that in practice these checks "obviate the need for passing a previous sequence as a prefix" (Inference Engineering, sec. 6.3.2). You only pay the re-run cost on the few chunks that fail, so the pipeline stays fast.

## Try it

You can build a small version of the pipeline in about 25 minutes with ffmpeg and [whisper.cpp](/docs/ecosystem/whisper-cpp). No GPU is needed. The base model runs at usable speed on a laptop CPU, and the point is the speedup ratio, not the absolute time.

Build whisper.cpp, fetch a model, and pick any 10 minute audio file, e.g., a podcast episode saved as `input.mp3`.

```bash
git clone https://github.com/ggml-org/whisper.cpp && cd whisper.cpp
cmake -B build && cmake --build build -j
./models/download-ggml-model.sh base.en
```

Split the file at silences with ffmpeg. The `silencedetect` filter prints where the pauses are, and a small amount of shell turns those timestamps into cut points. A simpler stand-in that is good enough for this exercise is segmenting near a target length at keyframes:

```bash
ffmpeg -i input.mp3 -f segment -segment_time 30 -c copy chunk_%03d.mp3
ffmpeg -i input.mp3 -af silencedetect=noise=-30dB:d=0.5 -f null - 2>&1 | grep silence_
```

Compare the printed silence timestamps with your chunk boundaries, and note which chunks got cut mid-word. Then run the sequential baseline and time it:

```bash
time (for f in chunk_*.mp3; do ./build/bin/whisper-cli -m models/ggml-base.en.bin -f "$f" -otxt; done)
```

Now run two workers in parallel. Each worker takes every other chunk:

```bash
time (ls chunk_*.mp3 | awk 'NR%2==1' | xargs -I{} ./build/bin/whisper-cli -m models/ggml-base.en.bin -f {} -otxt & \
      ls chunk_*.mp3 | awk 'NR%2==0' | xargs -I{} ./build/bin/whisper-cli -m models/ggml-base.en.bin -f {} -otxt & \
      wait)
```

Compute the RTF for both runs as 600 seconds of audio divided by the wall time. Then read the text across one chunk boundary and check for a dropped or duplicated word. That defect is the small-scale version of the cross-chunk context problem the quality checks exist for.

## Check yourself

1. Your parallel run took 210 seconds and your sequential run took 400 seconds on the 10 minute file. What are the two RTFs, and is the speedup near your worker count? Expected answer: 600 / 400 = 1.5X sequential and 600 / 210 = 2.9X parallel, and the speedup of 1.9 is close to the 2 workers you ran.
2. Why does the pipeline cut at silences instead of every 30 seconds? Expected answer: per Kiely (sec. 6.3.2), a fixed interval risks cutting words in half, and a pause is a safe cut point. Removing silence also skips inference on audio with no speech.
3. What two cheap signals flag a hallucinated chunk? Expected answer: an abnormal compression ratio, because repeated text compresses too well, and words per minute far from normal speech.
4. Why does re-running a bad chunk at a higher temperature help, when higher temperatures usually hallucinate more? Expected answer: the failure is a repetition loop, and the higher temperature forces a different output that breaks the loop.

## Next steps

- [whisper.cpp](/docs/ecosystem/whisper-cpp) covers installing and configuring the tool used above.
- [Batching](/docs/technical-guides/batching) explains the in-flight batching that keeps each GPU worker full.
- [What's the fastest way to run Whisper locally?](/blog/fastest-way-to-run-whisper-locally) works the latency side of the same pipeline for live audio.

When you can do this, you can build a chunk-and-fan-out transcription pipeline and compute its real-time factor at N workers.
