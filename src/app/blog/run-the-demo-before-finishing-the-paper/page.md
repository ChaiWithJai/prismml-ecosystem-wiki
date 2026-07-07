---
title: "Should you run the demo before you finish the paper?"
description: "For systems papers, yes. Run the demo first, then read the paper to debug your gaps. The claims land as answers to problems you just hit, not abstractions."
audience: researcher
pillar: end-user-case-study
book: transcript-theme
chapter_ref: "Theme 6: Demo-driven learning"
status: draft
last_reviewed: 2026-07-07
---

For a systems paper, yes. Get the demo or a small implementation running first, then read the paper to debug your gaps. Reading after you apply sticks because the paper's claims land as answers to problems you just hit, not as abstractions to memorize. The transcripts behind Theme 6 describe teams that work this way, and they report the paper reads differently, and faster, after the artifact runs. {% .lead %}

## Treat the paper as a debugger, not a textbook

A systems paper describes a running artifact. The authors built something, measured it, and then wrote the prose. When you read the prose first, you receive the claims in the reverse order from how they were produced, and you have no way to tell which sentences are load-bearing. Every claim looks equally plausible, so you file all of them at the same shallow depth and forget most of them within a week.

The transcripts behind Theme 6 show the same pattern across teams. An engineer reads a paper about an inference technique, nods along, and cannot answer a basic question about it a month later. The same engineer runs the technique on a local model for twenty minutes, gets a confusing number in the logs, goes back to the paper to explain the number, and can still explain the mechanism months later. The paper did not change. The question the engineer brought to it did.

This is why the order is run first, read second. Running the demo generates specific confusions, e.g., a metric in the output you cannot interpret. The paper then answers those confusions one by one, and each answer attaches to something you saw with your own eyes.

## Stop reading at the point of first confusion

The loop has a concrete shape.

1. Read only the abstract and skim the figures, no more than ten minutes. You want to know what the system claims, not how it works.
2. Get the smallest runnable version of the technique working. Prefer a demo you can run on a laptop over the authors' full setup.
3. Write down every output you cannot explain. These are your questions.
4. Now read the paper in full, hunting for the sentence that explains each question.

The failure mode this prevents is finishing the paper with zero questions. Zero questions does not mean full understanding. It usually means the reading produced no contact with the system at all, so nothing pushed back on your assumptions.

## Work through one misreading and its correction

Here is the kind of correction the loop produces, using speculative decoding as the technique. The [speculative decoding guide](/docs/technical-guides/speculative-decoding) covers the mechanism in full.

On a first pass through a speculation paper, many readers file the headline speedup as a fixed property of the method, e.g., "this technique makes decoding about 2 to 3 times faster." Then they run a demo and see the speedup swing with the prompt, and the paper suddenly reads differently. The speedup was never a constant. It is arithmetic over the acceptance rate, which the running system prints and the first reading skipped.

The arithmetic is short. Suppose the draft model proposes 4 tokens per step and the target model accepts each proposed token with probability 0.7. Treat 0.7 as an assumption for the example, not a measurement. The expected number of tokens produced per target model forward pass is

(1 - 0.7^5) / (1 - 0.7) = (1 - 0.168) / 0.3 = about 2.8 tokens.

Without speculation, one forward pass produces exactly 1 token. So 2.8 tokens per pass is an upper bound of about a 2.8x speedup, before you subtract the cost of running the draft model. Drop the acceptance rate to 0.4 and the same formula gives about 1.6 tokens per pass, and the draft cost can eat most of that. The claim you misread as a benchmark was a function, and the running demo is what forces you to see its input.

{% callout type="note" %}
Do not quote a speedup from your demo as if it generalizes. It is one measurement on your hardware, your prompt, and your model pair. Report it that way or not at all.
{% /callout %}

## Try it

This takes about 25 minutes of active work, plus a model download of a few gigabytes. No GPU is needed. The commands run on CPU and run faster on Apple Silicon or a CUDA GPU. The technique is prefix caching, because its smallest demo is two commands.

1. Skim the prefix caching section of a paper or guide you have only read, for ten minutes at most. Write one sentence stating what you think it claims.
2. Download a small open model, e.g., [Bonsai 8B in GGUF format](https://huggingface.co/prism-ml/Bonsai-8B-gguf):

   ```bash
   pip install -U "huggingface_hub[cli]"
   hf download prism-ml/Bonsai-8B-gguf --local-dir ./bonsai
   ```

3. Run the same long prompt twice with a prompt cache, following the setup in the [first inference guide](/docs/getting-started/first-inference):

   ```bash
   llama-cli -m ./bonsai/<model-file>.gguf \
     --prompt-cache cache.bin \
     -p "<paste three paragraphs of any document> Summarize the above." \
     -n 64 2>&1 | tee run-01.log

   llama-cli -m ./bonsai/<model-file>.gguf \
     --prompt-cache cache.bin \
     -p "<the same three paragraphs> List three facts from the above." \
     -n 64 2>&1 | tee run-02.log
   ```

4. Compare the prompt evaluation time printed in the two logs. Write down anything you cannot explain, e.g., why the second run only skips the tokens up to the first character that differs.
5. Reread the caching section with your questions in hand. Note what you now read differently, and compare your note against the sentence you wrote in step 1.

If you prefer speculation over caching, run the demo in the [speculative decoding guide](/docs/technical-guides/speculative-decoding) instead and watch the acceptance rate in the logs.

## Check yourself

- **Name one claim from the material you misread before the run, and what the running system corrected.** Expected answer: any concrete pair works, e.g., "I read the cache as saving the whole prompt, and the second run showed it only reuses the prefix up to the first differing token."
- **Why does reading the abstract before the run not spoil the loop?** Expected answer: the abstract tells you what the system claims, which you need to pick a demo. The mechanism, which is the part the run teaches, stays unread until you have questions.
- **You finished a paper and have no questions. What does that signal, and what do you do?** Expected answer: it signals the reading never made contact with the system. Go run the smallest demo and collect outputs you cannot explain, then read again.

## Next steps

- Work through the [first inference guide](/docs/getting-started/first-inference) once, so future demos start from a known-good local setup.
- Read the [speculative decoding guide](/docs/technical-guides/speculative-decoding) after running its demo, in that order, and note the difference.
- For the mechanism behind the acceptance rate arithmetic above, see [how speculative decoding works](/blog/how-speculative-decoding-works).

When you can do this, you can execute an apply-first study loop and state the comprehension delta it produced.
