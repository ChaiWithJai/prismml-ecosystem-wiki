---
title: "Why do voice assistants struggle with accents, and whose job is it to fix?"
description: "Accent failures are dataset coverage failures that surface as product failures. Aggregate word error rate can look fine while hiding a large gap for accented speakers."
audience: researcher
pillar: end-user-case-study
book: building-ai-products
chapter_ref: "Nika, Ch. 1, opening narrative (speech team mission)"
status: published
last_reviewed: 2026-07-07
---

Accent failures are dataset coverage failures that surface as product failures, so fixing them is the PM's job and not only the researcher's. The measurement trap is averaging. An aggregate word error rate can look fine while it hides a 2 to 3x gap for accented speakers. You must slice the evaluation by demographic, or the failure stays invisible until users churn. {% .lead %}

## Trace the failure back to the dataset

Marily Nika opens Building AI-Powered Products with the first AI team she worked for. The team built smart home assistants, and its goal was devices that could "understand a wide variety of accents", as she puts it. She joined because she "knew many voice systems didn't really 'get' different ways of speaking". The team then spent months wrangling enormous datasets before the capability became a product.

The order of that story is the lesson. The accent problem was not a mystery about the model architecture. It was a known property of the training data, and the team treated dataset work as the main work. A speech model learns the sound patterns it was trained on. If a training set holds mostly one variety of English, the model transcribes that variety well and everything else worse. In Chapter 1 Nika writes that "Bias, noise, and irrelevance in your datasets can result in skewed or flawed AI outputs". An accent gap is one form of that skew.

So the failure has two owners. The researcher owns the technical fact that coverage in the training data sets the accuracy floor for each accent. The PM owns the product facts, meaning which users the product promises to serve, what data the team collects to cover them, and what number has to be true before launch. Nika places data sourcing and validation inside the PM's workflow, not outside it. A PM who treats accent accuracy as a research detail has handed a launch decision to whoever assembled the training set.

## Compute how averaging hides the gap

Word error rate, or WER, is the standard accuracy measure for speech recognition. It counts how many words the system gets wrong out of every 100 words spoken, so lower is better. The trap is that one WER number for a whole test set is a weighted average, and the weights come from who is in the test set.

Here is a worked example with constructed numbers, not measurements from any real system. Suppose your test set has 1,000 clips. 900 clips come from speakers whose accents the training data covers well, and the model scores 8% WER on them. 100 clips come from speakers with underrepresented accents, and the model scores 24% WER on them.

The aggregate is the clip-weighted average. That is (900 x 8 + 100 x 24) / 1,000, which is (7,200 + 2,400) / 1,000, or 9.6% WER.

Now suppose the launch bar is WER under 10%. The aggregate passes at 9.6%. The worst slice fails at 24%, which is 3 times the 8% the majority gets and 2.4 times the launch bar. Both numbers describe the same model on the same test set. The aggregate says ship. The slice says one accent group gets roughly one word in four wrong, which for a voice assistant means repeated commands, wrong actions, and a user who stops talking to the device.

The number that belongs in the launch review is the worst slice, reported next to the aggregate. An aggregate alone cannot fail a launch for a group that is 10% of the test set, because a small group gets a small weight in the average. And the test set usually mirrors the training set, so the group most likely to fail is also the group with the least weight in the average.

{% callout type="note" %}
A sliced evaluation only needs one design change. Attach a speaker group label to every test clip, then report WER per group and the gap between the best and worst group. The model, the metric, and the test harness all stay the same.
{% /callout %}

## Assign the fix to the right owner

The researcher's share of the fix is real. Someone has to measure per-group WER, find or collect accented speech data, and retrain or fine-tune. Open corpora such as Mozilla Common Voice exist partly because volunteers record accented speech for exactly this gap.

The PM's share decides whether any of that happens. The PM writes the launch criteria, so the PM decides whether "WER under 10% aggregate" or "WER under 10% on every named speaker group" is the bar. The PM approves the data collection plan, so the PM decides whether underrepresented accents get sampled on purpose or by accident. The PM also owns what the product does when recognition is weak. Nika's advice for probabilistic systems is to build the uncertainty into the interface, e.g., have the assistant confirm before acting on a low-confidence command instead of acting on a wrong guess.

That is why the answer to "whose job is it" is the PM's. The PM controls the two decisions that make the failure visible and funded, which are the evaluation design and the launch bar. A researcher can report a slice gap, but only the PM can make the gap block a launch.

## Try it

This takes about 25 minutes on a laptop CPU. No GPU is needed for a small Whisper model.

1. Build whisper.cpp and get a small English model:

   ```bash
   git clone https://github.com/ggml-org/whisper.cpp
   cd whisper.cpp
   sh ./models/download-ggml-model.sh base.en
   cmake -B build && cmake --build build -j
   ```

2. Get two recordings of the same sentence in two different accents. Record yourself and a friend saying the same two or three sentences, or download clips of the same prompt from Mozilla Common Voice, which labels clips by the speaker's reported accent. Convert each clip to 16 kHz WAV, which is the input whisper.cpp expects:

   ```bash
   ffmpeg -i accent_a.mp3 -ar 16000 -ac 1 accent_a.wav
   ffmpeg -i accent_b.mp3 -ar 16000 -ac 1 accent_b.wav
   ```

3. Transcribe both and save the outputs:

   ```bash
   ./build/bin/whisper-cli -m models/ggml-base.en.bin -f accent_a.wav > a.txt
   ./build/bin/whisper-cli -m models/ggml-base.en.bin -f accent_b.wav > b.txt
   diff a.txt b.txt
   ```

4. Count the errors by hand. Write down the sentence that was actually spoken, then count wrong, missing, and inserted words in each transcript. Divide by the total words spoken to get a rough per-clip WER for each accent.
5. Compute your own two numbers. First the average WER across both clips, then the WER of the worse clip. Write one sentence saying which number you would put in a launch review and why.

Two clips is a demonstration, not an evaluation. The point is that the sliced procedure is the same at 2 clips and at 10,000, and only the sliced version can show you the gap.

## Check yourself

- **Your aggregate WER is 9.6% and your launch bar is 10%. What do you still not know?** Expected answer: the per-group numbers. The aggregate is a weighted average, so a small group can sit far above 10% while the total passes.
- **In the worked example, why does the failing group barely move the aggregate?** Expected answer: the group is 100 of 1,000 clips, so its 24% WER contributes only 2.4 points to the average. The weighting hides it.
- **Which single change makes the gap visible without touching the model?** Expected answer: label each test clip with a speaker group and report WER per group next to the aggregate.
- **Whose sign-off should the sliced report block?** Expected answer: the PM's launch decision, because the PM sets the launch bar and can require the worst slice, not the aggregate, to clear it.

## Next steps

- Read the [whisper.cpp ecosystem page](/docs/ecosystem/whisper-cpp) for what the runtime does and how to run it well.
- Read the [benchmarking guide](/docs/technical-guides/benchmarking) to turn the hand-counted exercise into a repeatable evaluation.
- For the same averaging trap in latency numbers, read [why you should report p99 latency, not the average](/blog/why-report-p99-latency-not-average).

When you can do this, you can design a demographically sliced ASR evaluation and detect a slice gap that aggregate metrics hide.
