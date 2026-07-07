---
title: "Should I run AI on-device or in the cloud? The eight-factor tradeoff"
description: "Local inference wins on latency, privacy, offline independence, and zero marginal cost. It loses on device capability, thermals, fragmentation, and battery."
audience: ml-product-team
pillar: end-user-case-study
book: inference-engineering
chapter_ref: "Ch. 3, sec. 3.5 Local Inference"
status: draft
last_reviewed: 2026-07-06
---

Local inference wins on four factors: latency, privacy, offline independence, and zero marginal cost. It loses on four others: device capability, thermal limits, hardware fragmentation, and battery drain. Those eight factors are a ready-made scorecard. Run a feature such as meeting transcription through all eight and one factor is usually decisive, which turns a philosophical debate into a checklist. {% .lead %}

## Start with the eight factors from the book

Philip Kiely's *Inference Engineering* (Ch. 3, sec. 3.5) defines local inference as "running AI model inference directly on the end user's device" instead of on a server. He then lists four advantages and four weaknesses, and together they cover almost every argument a product team will have about this decision.

The four advantages of running on the device are these.

- **Latency.** There is no network round trip, which saves tens or even hundreds of milliseconds per request.
- **Independence.** The feature keeps working with no internet connection, and server outages and traffic spikes cannot break it.
- **Privacy.** The user's data never leaves their device.
- **Cost.** Datacenter GPUs are expensive, and inference on the user's own hardware costs the developer nothing per request.

The four weaknesses are these.

- **Device capability.** Kiely notes that even a high-end desktop offers a fraction of the speed of a datacenter GPU, and phones struggle with models above one or two billion parameters.
- **Thermal limits.** A phone or laptop cools itself far worse than a datacenter rack, so sustained inference forces the device to slow down.
- **Fragmentation.** Your users run many combinations of chips, operating systems, and driver versions, and you must support all of them.
- **Battery.** Inference is a heavy workload and drains a phone or laptop battery quickly.

Most debates about on-device AI go in circles because each person argues from one factor. The fix is to stop debating and score all eight for the specific feature in front of you.

## Score a real feature: meeting transcription

Meeting transcription is a good test case because Kiely calls out transcription as one of the workloads that fits on a phone. Speech models are latency-sensitive, and some are small enough to run in real time on a modern device.

Say your product transcribes meetings for 1,000 business users, and each user records about 5 hours of meetings a month. Here is the scorecard.

| Factor | Local or cloud? | Why |
| --- | --- | --- |
| Latency | Local | Live captions need words on screen as they are spoken, and a network round trip adds delay to every chunk. |
| Independence | Local | Meetings happen on planes and in conference rooms with bad wifi. |
| Privacy | Local | Meeting audio contains salaries, legal issues, and unreleased plans. |
| Cost | Local | The arithmetic below shows the cloud bill grows with every user. |
| Device capability | Cloud | A large transcription model is more accurate, but small ones fit on phones. |
| Thermal limits | Cloud | A one hour meeting is sustained load, so the device heats up. |
| Fragmentation | Cloud | You must test across iOS, Android, and several chip generations. |
| Battery | Cloud | An hour of on-device transcription costs meaningful battery. |

Now the cost row in numbers. A cloud transcription API priced at 0.6 cents per audio minute, which is a typical published rate as of this writing, gives you this bill:

```
1,000 users x 5 hours x 60 minutes = 300,000 minutes per month
300,000 minutes x $0.006 = $1,800 per month, or $21,600 per year
```

The on-device version has zero marginal cost. And the capability weakness is mild here, because a small transcription model such as Whisper small has about 244 million parameters, which is well under the one to two billion parameter ceiling Kiely gives for phones.

## Circle the decisive factor

The scorecard reads 4 to 4, but the factors do not weigh the same. For meeting transcription, privacy is decisive. A business customer whose legal team forbids sending meeting audio to a third party will not buy the cloud version at any price or any latency. The other seven factors adjust how good each option is. Privacy decides whether one of the options is allowed to exist.

Here is the test that proves it. Imagine privacy off the table, because your customers have all approved cloud processing. Now the decision flips. The cloud version transcribes with a larger and more accurate model, drains no battery, heats no phones, and needs no per-device testing, and $1,800 a month is a small bill for 1,000 paying users. The decision flipped when one factor left, so that factor was driving it and the other seven were not.

{% callout type="note" %}
Kiely closes the section by saying the future is not local or cloud but both together. Small models and quick queries run on the device while heavy workloads stay in the cloud. A transcription feature can run a small model live on the device and send audio for a higher quality second pass only when the user opts in.
{% /callout %}

One more warning from the book. When you score device capability, score your median user's hardware, not yours. Kiely points out that an AI enthusiast has the latest phone, while a median user has an older device with weaker components. If your scorecard only works on this year's flagship phone, the local option loses the capability row for most of your users.

## Try it

This takes about 20 minutes.

1. Pick one AI feature in your product, or one you are planning.
2. Draw a table with the eight factors as rows: latency, independence, privacy, cost, device capability, thermal limits, fragmentation, and battery.
3. For each row, write "local" or "cloud" and one sentence of evidence. For the cost row, do the arithmetic the way the example above does, with your own user count and usage.
4. Circle the single factor that would decide the question on its own.
5. Run the removal test. Imagine the circled factor is gone and ask whether your decision flips. If it does not flip, you circled the wrong factor. Find the one that makes it flip.

If your feature involves speech, you can also measure the capability row directly instead of guessing. Install whisper.cpp and time a small model on the oldest laptop in your office:

```bash
git clone https://github.com/ggml-org/whisper.cpp
cd whisper.cpp && make
./models/download-ggml-model.sh small
./main -m models/ggml-small.bin -f samples/jfk.wav
```

If the transcription runs faster than the audio plays, the capability row supports local for that device.

## Check yourself

1. Your feature is a photo tagger for a consumer app, and you circled cost as decisive. Cloud tagging would cost you $50 a month. Did you circle the right factor? Expected answer: no. Removing a $50 bill does not flip any decision, so cost was not driving it. Rescore and find the factor that flips it.
2. A teammate says on-device always wins because it is free. Which rows answer them? Expected answer: device capability, thermal limits, fragmentation, and battery. Free per request is one row out of eight, and the four weakness rows are where free gets paid for.
3. Your scorecard came out 4 to 4. What does that tell you? Expected answer: nothing by itself. The count does not decide, the decisive factor does. Apply the removal test to each candidate until you find the one that flips the decision.

## Next steps

- Check whether your target machines can run a local model at all in [hardware requirements](/docs/getting-started/hardware-requirements).
- Set up local transcription with [whisper.cpp](/docs/ecosystem/whisper-cpp).
- If your decisive factor was device capability, read [how much VRAM do I need to run an LLM?](/blog/how-much-vram-to-run-an-llm) to size the model your hardware can hold.

When you can do this, you can apply the eight-factor scorecard to a real feature and identify the decisive constraint.
