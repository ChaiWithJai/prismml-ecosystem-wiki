---
title: "Do I need an LLM for ticket routing, or is a classifier enough?"
description: "For a bounded label set, a fine-tuned 100 MB classifier usually beats a prompted LLM on accuracy, cost, and latency. Run the bake-off before defaulting to an LLM."
audience: ml-product-team
pillar: end-user-case-study
book: building-ai-products
chapter_ref: "Nika, Ch. 1, 'The Stages of AI Evolution'; 'Traditional AI' subsection"
status: published
last_reviewed: 2026-07-07
---

Usually a classifier is enough. For a bounded label set, a fine-tuned 100 MB classifier tends to beat a prompted LLM on the three axes that decide production fitness: accuracy on your labels, cost per request, and P95 latency. The LLM wins when labels shift weekly or when inputs need reasoning. Run the comparison before defaulting to generation, because it is an afternoon of work. {% .lead %}

## Name the task before you pick the tool

Ticket routing is a fixed decision. A ticket comes in, and the system must assign it one label from a list you wrote down, e.g., billing, bug, or feature request. Marily Nika's Building AI-Powered Products (Ch. 1, the "Traditional AI" subsection) describes traditional AI systems as "designed to perform specific tasks through rule-based or pattern recognition systems". Routing fits that description exactly. It is one specific task, and a model learns the pattern from labeled examples.

Nika also writes that GenAI "does not replace the tasks handled by traditional AI" (Ch. 1). This is the point teams skip. An LLM can do routing, because you can put the labels in a prompt and ask for one back. The question is not whether it can. The question is what you pay for the flexibility you are not using. A prompted LLM is a general tool doing a bounded job, and you pay general-tool prices for it on every request.

P95 latency means the time under which 95 percent of requests finish. It is the number to watch here, because routing sits inline in the support flow and a slow tail shows up as tickets that stall.

## Work the arithmetic on the compute gap

Here is a derived comparison for one 300 token ticket. These numbers come from parameter counts, not from measurement, so treat them as estimates of scale rather than benchmarks.

- Option A is a fine-tuned encoder classifier with about 66 million parameters, which is about 130 MB at 16 bit weights. A forward pass costs roughly 2 operations per parameter per token. For 300 tokens that is 66 million times 2 times 300, which is about 40 billion operations.
- Option B is a prompted 8B model such as [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf). The prompt holds instructions, the label list, and the ticket, so call it 500 tokens. Prefill costs 8 billion times 2 times 500, which is about 8 trillion operations, plus about 16 billion more for each label token it writes.

Divide the two. 8 trillion over 40 billion is 200. The prompted LLM spends about 200 times the compute of the classifier on the same ticket, and this count ignores attention overhead, so the measured gap can be larger. On fixed hardware, compute per request is what you pay in latency and in money, so the 200 times shows up on both of those axes. The [cost modeling guide](/docs/technical-guides/cost-modeling) walks through turning an operation count into a dollar figure for your own hardware.

Accuracy is the axis people expect the LLM to win, and on a bounded label set it often does not. The classifier trained on your tickets has seen your label boundaries, e.g., where your team draws the line between a bug and a feature request. The prompted LLM has seen the label names and one sentence of instructions. It also has a failure mode the classifier cannot have, because it can output text that is not one of your labels, and you have to write parsing code for that case.

## Know when the LLM wins

The classifier is not always the answer, and the cases where it loses are specific.

- Your labels change weekly. Retraining a classifier on every label change costs more engineering time than editing a prompt. The LLM absorbs a new label list in one deploy.
- You have no labeled tickets yet. A classifier needs training data. A prompted LLM routes on day one, and it can label the backlog that trains its own replacement.
- The routing rule needs reasoning over the ticket, e.g., "route to legal if the customer implies a regulator is involved", where the signal is an implication rather than a phrase the classifier can learn from a few hundred examples.

If none of these describe your task, the [intelligence density](/docs/concepts/intelligence-density) page gives the general form of this argument, which is capability per unit of compute. For routing, the small model has the capability you need at a small fraction of the compute.

## Try it

This takes about 30 minutes on a laptop CPU or Apple silicon. No GPU is needed. The LLM step downloads a model file of a few GB.

1. Pull 100 tickets with known correct queues from your help desk export into a CSV with two columns, text and label.
2. Build the classifier side with embeddings and nearest centroid, which needs no training run:

   ```bash
   pip install sentence-transformers numpy
   ```

   Embed every ticket, average the embeddings per label to get one centroid per queue, and assign each ticket to its nearest centroid. Hold each ticket out of its own centroid, or split 80 to 20, so the accuracy number is honest. Wrap the loop in timing calls and record the median and P95 per ticket.
3. Build the LLM side with a local runner:

   ```bash
   brew install llama.cpp
   llama-cli -hf prism-ml/Bonsai-8B-gguf \
     -p "Classify this ticket as billing, bug, or feature-request. Ticket: <ticket text> Label:" -n 4
   ```

   Loop it over the same 100 tickets, parse the output back to a label, and count any unparseable output as wrong. Record the same timing numbers.
4. Fill the table. Six cells, all from measurement:

   | | Accuracy | Median latency | Est. cost per 1,000 tickets |
   |---|---|---|---|
   | Classifier | | | |
   | Prompted LLM | | | |

   For cost, use the [cost modeling guide](/docs/technical-guides/cost-modeling) to convert your measured seconds of compute into a dollar estimate, and label it as an estimate.
5. Write one sentence recommending an architecture, and name the column that decided it.

## Check yourself

- **Your comparison table has six cells. Where did each number come from?** Expected answer: from running both systems on the same 100 tickets, not from a vendor page or from intuition. The cost cells are derived from measured time and are labeled as estimates.
- **The LLM scored 3 points higher on accuracy. Do you pick it?** Expected answer: not from that number alone. Check the latency and cost columns, check whether 100 tickets can resolve a 3 point gap, and check whether the LLM's unparseable outputs were counted as errors.
- **A teammate says the classifier will not keep up when the team adds queues. What do you ask?** Expected answer: how often queues actually change. If it is quarterly, a retrain per quarter is cheap. If it is weekly, that is one of the named cases where the LLM wins.
- **Which subsection of Nika's Chapter 1 covers the model family that routing belongs to?** Expected answer: the "Traditional AI" subsection, because routing is one specific task learned through pattern recognition.

## Next steps

- Read the [cost modeling guide](/docs/technical-guides/cost-modeling) to turn your measured latencies into cost per ticket.
- Read the [intelligence density](/docs/concepts/intelligence-density) page for the general rule behind this comparison.
- For the four groups of AI that frame this choice, read [is generative AI the same thing as AI](/blog/is-generative-ai-the-same-as-ai).

When you can do this, you can run a classifier versus LLM bake-off on a routing task and select the architecture from evidence.
