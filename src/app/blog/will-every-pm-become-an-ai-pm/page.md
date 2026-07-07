---
title: "Will every product manager become an AI product manager?"
description: "Nika's answer is yes. AI changes which problems are solvable and at what scale, so AI literacy becomes a baseline skill for every PM, not a specialist track."
audience: ml-product-team
pillar: end-user-case-study
book: building-ai-products
chapter_ref: "Nika, 'Closing Thoughts' (front matter)"
status: published
last_reviewed: 2026-07-07
---

Marily Nika's answer is yes. She closes the front matter of Building AI-Powered Products with the claim that "All product managers will be AI product managers in the future." AI changes which problems a team can solve and at what scale, so AI literacy becomes a baseline skill for the whole PM org rather than a specialist track. The practical response is a first AI feature playbook. Pick one workflow, prototype it with a local model in a week, and define the go or no-go eval before you start. {% .lead %}

## Read the claim as a forecast about your org chart

Nika states the claim in one paragraph in her "Closing Thoughts", before Chapter 1 even starts. Her reason is that AI and generative AI let teams "solve problems and scale solutions" that were out of reach a decade ago. Lenny Rachitsky repeats the claim in his endorsement of the book, so the claim is the book's thesis and not a throwaway line.

The claim is not that every PM will train models. It is that the set of solvable problems has changed, and a PM who cannot see the new set will scope features as if it were 2019. Nika writes in the preface that AI systems are probabilistic, depend on data quality, and need continuous evaluation. A PM who has never shipped against those three properties has no way to judge which AI pitches are real. That is what "AI literacy as table stakes" means in practice. It is judgment earned by shipping one small AI feature, not a certificate.

For your org this cuts one planning debate short. You do not need to decide whether to hire a separate AI PM track. You need every PM to run one first AI feature, because the literacy comes from the attempt.

## Run the first AI feature playbook

The playbook has three steps, and the order is the point.

1. Pick one workflow you already own. Not a new product. A step your users already do by hand, e.g., writing a summary of a long record.
2. Write the go or no-go eval before you touch a model. Decide what output counts as usable, how many test cases you will score, and what pass rate means go. Committing to the gate first stops you from lowering the bar after you see the demo.
3. Prototype with a local model in one week. A local open model on a laptop is enough to answer "is this workflow solvable", and it keeps your test data on your machine. Our [first inference guide](/docs/getting-started/first-inference) gets a model responding in minutes, and a small model with high [intelligence density](/docs/concepts/intelligence-density) is the right size for this test because you want the cheapest model that clears your gate, not the best model available.

## Work one example with the arithmetic

Here is the playbook applied to a support team. The workflow is drafting the first reply to an inbound ticket. Today an agent reads the ticket and writes the reply by hand.

The eval gate, written before the prototype starts, is this. Sample 50 past tickets that already have a human reply. The model drafts a reply for each. A support lead scores each draft as send-with-light-edits or rewrite-from-scratch. Go means at least 40 of 50 drafts, which is 80 percent, score send-with-light-edits, and zero drafts state a refund policy that does not exist. The second condition is there because a made-up policy is the AI failure mode that costs money.

Now the week, at 5 working days.

- Day 1. Set up the local model and confirm it responds. The [first inference guide](/docs/getting-started/first-inference) covers this.
- Days 2 and 3. Iterate on the prompt against 10 tickets held out from the 50. Do not touch the 50 scoring tickets yet, because tuning on your test set inflates the pass rate.
- Day 4. Run all 50 tickets and have the support lead score them. At about 3 minutes to read a ticket, a draft, and the original human reply, scoring takes 50 times 3, which is 150 minutes, or about 2.5 hours.
- Day 5. Count the scores and make the call. 40 or more usable drafts and zero invented policies is go. Anything less is no-go, and the writeup of why is still a useful output.

The total human scoring cost is one afternoon. That is the whole price of knowing whether this feature is real, and you paid it before anyone wrote production code.

{% callout type="note" %}
The 80 percent threshold in this example is a choice, not a benchmark. Set your own threshold from what your team will tolerate, then commit to it in writing before day 1. The number you pick is less important than picking it before you see any output.
{% /callout %}

## Try it

This takes about 30 minutes and needs a terminal. An 8B model quantized to GGUF runs on a recent laptop with 8 GB of free RAM. No GPU is required, though on CPU alone the model responds slower, at a few words per second.

1. Install llama.cpp and pull [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf), an open 8B model published on Hugging Face:

   ```bash
   brew install llama.cpp
   llama-cli -hf prism-ml/Bonsai-8B-gguf -p "Draft a polite reply to this support ticket: My export has been stuck at 90 percent for an hour."
   ```

2. Confirm you get a coherent draft. This is your local prototype stack working.
3. Pick one non-AI feature you own and write a five-line pitch for its AI version. The five lines are the workflow, the user, what the model does, one named risk, and the go or no-go criterion.
4. Check the risk line. It must name an AI failure mode, e.g., the model invents a policy, and not a generic project risk like "timeline slips".
5. Check the criterion line. It must be countable within a one-week prototype, e.g., "40 of 50 sampled drafts scored usable by the support lead".

## Check yourself

- **Is your go or no-go criterion measurable inside one week?** Expected answer: yes, because it names a sample size, a scorer, and a threshold, and the scoring time works out to hours, not weeks. If it needs a live A/B test or a quarter of usage data, it is a launch metric, not a prototype gate, so rewrite it.
- **Is your named risk specific to AI?** Expected answer: yes, it describes a wrong output the model can produce, e.g., a fabricated policy or a confident answer on missing data. "The project might be late" fails this check.
- **Why write the gate before the prototype?** Expected answer: because a working demo tempts you to lower the bar. The pre-committed gate is what separates an evaluation from a justification.

## Next steps

- Run your first local model with the [first inference guide](/docs/getting-started/first-inference) so day 1 of your prototype week is already done.
- Read [what intelligence density means](/docs/concepts/intelligence-density) to pick the smallest model that can clear your gate.
- For what the role looks like after your first feature ships, read [what an AI product manager does day to day](/blog/what-does-an-ai-product-manager-do).

When you can do this, you can scope a one-week local-model prototype with a pre-committed evaluation gate.
