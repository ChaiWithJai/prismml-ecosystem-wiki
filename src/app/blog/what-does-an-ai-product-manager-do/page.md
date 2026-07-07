---
title: "What does an AI product manager actually do day to day?"
description: "The AI PM turns model capability into a product users trust, and the hard part is rarely the model. It is one line item in the shipping plan."
audience: ml-product-team
pillar: end-user-case-study
book: building-ai-products
chapter_ref: "Nika, Ch. 1, 'The Role of AI Product Managers'"
status: published
last_reviewed: 2026-07-07
---

The AI product manager turns a model capability into a product users trust, and the hard part is rarely the model. Marily Nika opens Building AI-Powered Products with her first speech team, where the recognition already worked and the team still "spent months trying to figure out how to embed this technology into user-facing products". The model is one line item in the shipping plan. The rest of the plan is product work. {% .lead %}

## Learn what the role actually is

Nika's Building AI-Powered Products (Ch. 1) describes her first AI team, which built smart home assistants that had to understand many accents and recognize who was speaking. The speech recognition itself was a solved capability in the demo. The months of work went into wrangling datasets and embedding the capability into a product a person could use in a kitchen.

That gap between demo and product is the AI PM's job. Chapter 1 names the properties of AI that create the gap.

- AI is probabilistic. The model predicts, and some predictions are wrong. Nika's answer is to design the interface around uncertainty, e.g., show a confidence score or a warning when the system is not sure.
- AI depends on data. The PM plans how data is collected, cleaned, and kept private, because bad data produces bad outputs no matter how good the algorithm is.
- AI decides things on its own. The PM draws the line between decisions the system makes alone and decisions a person must review.

None of these are model training tasks. Each one is a decision about what the user sees and what happens when the system is wrong. That is why the AI PM role exists as a separate job.

## Count the work the demo hides

A demo proves the capability exists. A product proves the capability survives contact with a user who did not build it. The tasks between the two are countable, and counting them is the useful skill.

Here is the worked example. Take a local transcription demo built on whisper.cpp, which runs the Whisper speech model on your own machine. The demo takes an audio file and prints text. The product goal is a note-taking feature inside an app. Here are ten tasks between the two, each marked model work or product work.

1. Pick the model size that fits the user's hardware. Model work.
2. Set a latency budget, meaning the longest wait the user will accept before notes appear. Product work. Skip it and the user stares at a blank screen and quits.
3. Design what the user sees while transcription runs. Product work. Skip it and the user assumes the feature is broken.
4. Design what happens when transcription fails on noisy audio. Product work. Skip it and the user gets silent data loss.
5. Write the words that tell the user audio never leaves the device. Product work. Skip it and the user assumes the audio is uploaded and refuses to record anything private.
6. Decide whether the user can edit the transcript, and how edits are saved. Product work. Skip it and one wrong word makes the whole note untrustworthy.
7. Measure accuracy on the accents and audio your users actually have. Model work.
8. Handle the file formats and sample rates real recordings arrive in. Product work. Skip it and half of imported recordings fail.
9. Decide what happens to a recording that is two hours long. Product work. Skip it and the app appears to hang on the user's most valuable meeting.
10. Choose a fallback when the device is too slow for the chosen model, e.g., a smaller model with a quality warning. Product work. Skip it and older devices give a first impression of a frozen app.

The count is 2 model tasks and 8 product tasks, a ratio of 1 to 4. The ratio is the point. The demo made the 2 model tasks look like the whole job, and the 8 product tasks are invisible until you enumerate them.

The latency budget in task 2 has arithmetic behind it. As a rough estimate, a small Whisper model on a recent laptop transcribes at several times faster than real time, so a 30 minute recording takes a few minutes. A few minutes is fine for a meeting that just ended and useless for live notes. The same model capability supports one product promise and not the other, and only the PM's budget decision tells engineering which promise is being made.

{% callout type="note" %}
The task list is not padding around the model. Each product task names a user consequence if skipped, and any one of them can sink the feature while the model performs exactly as it did in the demo.
{% /callout %}

## Try it

This takes about 25 minutes and needs only a terminal.

1. Get a working transcription demo. Build whisper.cpp and run it on a sample file:

   ```bash
   git clone https://github.com/ggml-org/whisper.cpp
   cd whisper.cpp
   sh ./models/download-ggml-model.sh base.en
   cmake -B build && cmake --build build -j
   ./build/bin/whisper-cli -m models/ggml-base.en.bin -f samples/jfk.wav
   ```

2. Confirm the demo works. You should see a transcript of the sample audio. This is the point where a demo video would end.
3. Take 10 minutes and list ten tasks needed to ship this as a note-taking feature in an app you use. Do not copy the list above. Write your own for your app.
4. Mark each task M for model work or P for product work.
5. For every P task, write one sentence naming what the user loses if you skip it. If you cannot name a loss, the task is padding, so replace it.
6. Count the M and P labels and write the ratio down.

## Check yourself

- **What ratio did you get?** Expected answer: heavily product weighted, around 2 M to 8 P give or take a task. If you got mostly M tasks, you listed model improvements rather than shipping tasks, so redo the list starting from what the user sees.
- **Does every P task name a user consequence?** Expected answer: yes, and the consequence is specific, e.g., "the user loses the recording" rather than "worse experience".
- **Which single P task would you cut first, and what breaks?** Expected answer: you can name the task and the exact user harm, which shows the list is real and not padding.

## Next steps

- Read the [whisper.cpp ecosystem page](/docs/ecosystem/whisper-cpp) for what the runtime does and where it fits.
- Run your own model locally with the [first inference guide](/docs/getting-started/first-inference) so the demo side of the exercise is yours, not borrowed.
- For how a buyer weighs the product tasks you just listed, read [what a hospital CTO asks before running a model on-prem](/blog/hospital-cto-on-prem-ai-questions).

When you can do this, you can decompose a demo-to-product gap into enumerated tasks and quantify the model to product work ratio.
