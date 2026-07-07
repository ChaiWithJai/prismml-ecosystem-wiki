---
title: "How do you benchmark a local model when your budget is a power outlet, not a GPU cluster?"
description: "When watts and RAM are the hard constraints, fix the machine, fix a power or thermal ceiling, and compare models on capability delivered within that envelope."
audience: inference-engineer
pillar: end-user-case-study
book: transcript-theme
chapter_ref: "Theme 1: Intelligence density (capability per GB/watt/dollar)"
status: draft
last_reviewed: 2026-07-07
---

When watts and RAM are the hard constraints, benchmark inside the envelope. Fix the machine, fix a power or thermal ceiling, and compare models on the capability each one delivers within that envelope, not on what each could do with unlimited hardware. This framing routinely changes the model choice, because the leaderboard winner is often not the envelope winner. {% .lead %}

## Fix the envelope before you run anything

A benchmark on someone else's hardware answers someone else's question. If your deployment target is a mini PC in a clinic or a laptop on battery, the question is not "which model is most capable". The question is "which model delivers the most capability on this exact machine without tripping its limits". So the first step is to write the envelope down before you download a single model.

An envelope has three parts.

- The machine. One specific device with a known amount of RAM and a known chip. Every run in the benchmark happens on this device and no other.
- The ceiling. A limit you refuse to cross, e.g., the model plus its working memory must stay under 12 GB of RAM, or the package power must stay under 30 watts sustained. Pick the limit that reflects your deployment, not the one that is easy to measure.
- The workload. Your own eval prompts with a pass condition you decided in advance. The [benchmarking guide](/docs/technical-guides/benchmarking) covers how to build this set.

A model that produces better output but breaks the ceiling scores zero. That rule sounds harsh, but it matches reality. A model that swaps to disk or throttles the chip does not ship, so its offline quality is not available to your users.

## Compare models on density, not on absolute quality

The theme this post draws on defines [intelligence density](/docs/concepts/intelligence-density) as capability per GB, per watt, and per dollar. Inside a fixed envelope, density is the number that decides. The larger model almost always passes more evals in absolute terms. The envelope question is whether it passes enough more to justify what it takes from a machine that has little to give.

The comparison has two stages.

1. Eliminate. Any model that breaks the ceiling is out, no matter its score. If the 8B model needs 9 GB and your ceiling is 6 GB of free RAM, the 8B model is not a worse choice. It is not a choice.
2. Rank. Among the models that fit, divide the eval pass rate by the resource each one consumes, e.g., passes per GB of resident memory, or passes per watt of sustained draw. The highest ratio wins the slot, because the resource it leaves free goes to the rest of the application or to a longer battery life.

Note what this ordering does. It never asks where the models sit on a public leaderboard. A leaderboard compares models with the constraint removed, and your envelope is the constraint. The two rankings agree only by accident.

## Work one example with derived numbers

Here is the arithmetic for a made-up but realistic case. Every number is an assumed input so you can follow the division, not a measured benchmark result. Rerun the math with your own measurements.

The machine is a MacBook Air with 16 GB of RAM, and the ceiling is 8 GB free for the model. The workload is a 20-prompt extraction eval.

- Model A is a 4B model in 4-bit GGUF. Its file is about 2.5 GB. Suppose it passes 14 of 20 prompts, a pass rate of 0.70.
- Model B is an 8B model in 4-bit GGUF, e.g., [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf). Its file is about 5 GB. Suppose it passes 17 of 20, a pass rate of 0.85.

Both fit under the 8 GB ceiling, so neither is eliminated and the choice goes to the ranking stage. Passes per GB for Model A is 0.70 divided by 2.5, which is 0.28. For Model B it is 0.85 divided by 5, which is 0.17. Model B wins on absolute quality and Model A wins on density, and the envelope decides which fact governs. If the app needs the extra 5.5 GB for a document cache, Model A wins. If the machine has nothing else to hold and the workload punishes the 3 extra failures, Model B earns its footprint.

Now tighten the ceiling to 4 GB, e.g., the same app must run on the 8 GB machines in the fleet. Model B no longer fits, so the elimination stage removes it before quality is even discussed. The model choice changed and no model got better or worse. Only the envelope moved, and that is the point of writing it down first.

{% callout type="note" %}
Say which constraint eliminated a model, not just that it lost. "The 8B model broke the RAM ceiling" and "the 8B model fit but ranked lower per GB" lead to different decisions when the fleet gets new hardware next year.
{% /callout %}

## Try it

Benchmark two models of different sizes inside one envelope. Budget 30 minutes. No GPU is required, and any recent laptop with 16 GB of RAM works.

Write 10 prompts for one task into `prompts.txt`, one per line, and decide the pass condition before you run.

```bash
# Install llama.cpp (macOS)
brew install llama.cpp

# Run each model over the prompts while logging peak memory:
while IFS= read -r p; do
  /usr/bin/time -l llama-cli -m model-4b-q4_k_m.gguf \
    -p "$p" -n 256 --temp 0 -no-cnv 2>> mem-4b.log
done < prompts.txt

while IFS= read -r p; do
  /usr/bin/time -l llama-cli -m model-8b-q4_k_m.gguf \
    -p "$p" -n 256 --temp 0 -no-cnv 2>> mem-8b.log
done < prompts.txt

# Peak resident memory per run is the "maximum resident set size" line:
grep "maximum resident set size" mem-4b.log mem-8b.log

# If you can, log power draw in a second terminal during the runs (macOS):
sudo powermetrics --samplers cpu_power -i 1000 -n 30
```

On Linux, use `/usr/bin/time -v` for peak memory and check whether your machine exposes power through `powerstat` or a similar tool. If you cannot read power, RAM alone is enough for the exercise.

Score the passes for each model, divide each pass rate by its peak memory in GB, and rank the two models by that ratio. Then rerun the whole eval once and check that the ranking holds.

## Check yourself

1. Is your ranking stable across the re-run? If the order flipped, your prompts are too few or your pass condition is too vague, so tighten the condition before you trust either ranking.
2. Which constraint would eliminate the larger model on your target machine, RAM, thermals, or speed? You should be able to name one and point at the log line that shows it, e.g., the peak resident memory that crossed your ceiling.
3. Did the denser model and the higher-scoring model differ? If they did, say in one sentence which one ships and why the envelope makes that the right call.

## Next steps

- [Intelligence density](/docs/concepts/intelligence-density) defines capability per GB, per watt, and per dollar, which is the ratio this whole method ranks on.
- [Benchmarking](/docs/technical-guides/benchmarking) covers building the eval set and reporting the results so a second person can rerun them.
- [What does 'intelligence density' actually measure?](/blog/what-is-intelligence-density) works the same ratio for a model selection argument rather than a benchmark design.

When you can do this, you can run a benchmark inside a fixed hardware envelope and select a model on the capability it delivers within your budget.
