---
title: "Why should every demo be extendable, not just runnable?"
description: "A runnable demo proves the software works. An extendable demo proves the user can make it theirs, and that first change is the actual adoption event."
audience: ml-product-team
pillar: end-user-case-study
book: transcript-theme
chapter_ref: "Theme 4: Time-to-value as the docs metric"
status: draft
last_reviewed: 2026-07-07
---

A runnable demo proves your software works. An extendable demo proves the user can make it theirs, and that first change is the actual adoption event. The difference is structural. An extendable demo names its extension points, puts the first change in one obvious file, and gets the first modification done in minutes. End users ship internal tools by extending demos, and almost never by starting fresh. {% .lead %}

## Measure the demo by time to first modification

The transcript theme this post draws on argues that time to value is the metric that docs should be judged by. A demo is the most concentrated form of docs, so the same metric applies to it. The question is which value you time.

Most teams time the run. They measure how long it takes a new user to clone the repo, install the dependencies, and see output. That number is useful, but it stops one step short of adoption. A user who runs your demo has verified your claim. A user who changes your demo has started building their own tool on top of your project, and that is the moment they become an adopter.

The reason is how end users actually work. A developer at a hospital or a manufacturer rarely starts an internal tool from an empty file. They find the demo closest to their need, run it once to confirm it works, and then start editing it toward their own data and their own model. If the first edit takes an afternoon of reading source code, many of them stop there. So the number to measure is time to first modification, which is the minutes from a working run to a working modified run.

## Name the extension points

The gap between runnable and extendable is not more features. It is structure that tells the user where to edit. Three properties do most of the work.

- **Named extension points.** The README says, in plain words, which things the user is expected to swap, e.g., "to use a different model, change `MODEL_PATH` in `config.py`". A public model artifact makes this concrete. If your demo says it accepts any GGUF file, the [Bonsai 8B model card](https://huggingface.co/prism-ml/Bonsai-8B-gguf) lists real files a user can point it at.
- **One obvious file to edit.** The values a user is expected to change live in one config file, not spread across the scripts. A user who has to search three files for one setting concludes that the demo was not built to be changed.
- **A worked first modification.** The README walks through one small change end to end, e.g., swapping the bundled model, and states how long it should take. This tells the user the demo expects to be edited, and it gives them a template for their second change.

None of this requires the demo to be configurable for every case. It requires the demo to be honest about the two or three changes almost every adopter makes, which are usually the model and the data source.

## Work the numbers for one swap

Here is the arithmetic on a made-up but realistic timing. The minutes below are inputs to the method, not measurements of any real demo.

Suppose a user takes a transcription demo and swaps the bundled model for a different GGUF file. The whole task takes 28 minutes, split like this.

- 3 minutes to download the new model file.
- 4 minutes to make the actual edits, which turn out to be two lines.
- 21 minutes to read the source code and find which two lines to edit, because the model path is built from pieces in two different files.

The edit itself is 4 of the 28 minutes, so 24 minutes, which is 86 percent of the total, went to downloading and searching. The download is unavoidable. The searching is not. If the README had named the model path as an extension point and said which file it lives in, the search would take about 2 minutes instead of 21. The total would drop from 28 minutes to about 9 minutes, which is roughly a third of the original time. One sentence in the README buys back two thirds of the user's time, and that sentence is what this post means by an extension point.

{% callout type="note" %}
Log the search time separately from the edit time when you run this on a real demo. The search time is the part that structure can remove, so it is the number that tells you whether the demo is extendable.
{% /callout %}

## Try it

Take one demo you maintain or one you use, and make the smallest meaningful modification, e.g., swap the model or point it at a different data source. Budget 30 minutes. If the demo needs a GPU to run, you still need that GPU to verify the modified run, but the timing and the log work on any machine.

First, get to a clean working run, then start a timer and a log file.

```bash
date +%s > /tmp/mod-start.txt
touch /tmp/mod-log.txt
```

Second, make the modification. Every time you have to open a source file to figure out where or what to edit, add a line to the log before you continue.

```bash
echo "read serve.py to find where the model path is built" >> /tmp/mod-log.txt
```

Third, when the modified demo runs, stop the timer and compute the total.

```bash
echo $(( $(date +%s) - $(cat /tmp/mod-start.txt) )) seconds
```

Fourth, read the log and split the total into edit time and search time. Then write one sentence naming the single change to the demo that would have removed the most search time. That sentence is the missing extension point, and if you maintain the demo, it is your next README edit.

## Check yourself

1. What was your split between edit time and search time? Expected answer: concrete minutes, e.g., "4 minutes editing and 17 minutes searching". If your search time was near zero, the demo already names its extension points, so try a second, less common modification and see if that also holds.
2. Can you name the single change that would have halved your modification time? Expected answer: one specific fix, e.g., "put the model path in `config.py` and name it in the README". If you cannot name one, your log entries were too coarse, so rerun with a log line for every file you opened.
3. Why is time to first modification a better adoption signal than time to first run? Expected answer: running verifies the maintainer's claim, but modifying starts the user's own tool, and end users build internal tools by extending demos rather than starting fresh.

## Next steps

- [Running your first inference](/docs/getting-started/first-inference) is the working run you should start from before timing any modification.
- [How many clicks to first inference? The docs funnel](/blog/clicks-to-first-inference-docs-funnel) applies the same time-to-value metric to the docs path before the demo.

When you can do this, you can audit a demo for extendability and specify the extension points that turn people who run it into people who adopt it.
