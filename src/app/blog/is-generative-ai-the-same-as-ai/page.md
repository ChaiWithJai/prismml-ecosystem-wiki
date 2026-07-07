---
title: "Is generative AI the same thing as AI?"
description: "No. GenAI is one of four groups of AI, alongside traditional AI, general intelligence, and superintelligence. Conflating them wastes money and erodes trust."
audience: ml-product-team
pillar: foundational-concept
book: building-ai-products
chapter_ref: "Nika, Ch. 1, 'The Stages of AI Evolution' and Figure 1-1"
status: published
last_reviewed: 2026-07-07
---

No. Generative AI is one of four groups of AI. Marily Nika's Building AI-Powered Products (Ch. 1, Figure 1-1) splits modern AI into traditional AI, generative AI, general intelligence, and superintelligence, and she calls the mixup of "AI" with GenAI a misconception she meets daily. The mixup has costs. Picking an LLM where a classifier suffices wastes latency and money, and users stop trusting marketing that implies general intelligence. {% .lead %}

## Learn the four groups

Nika writes that GenAI "is by no means a replacement for traditional AI" (Building AI-Powered Products, Ch. 1). Her Figure 1-1 draws the four groups as rings of widening scope.

- Traditional AI, 1950s to present. Systems built for one specific task, using rules or pattern recognition. Examples in the chapter include face recognition in photo apps, speech-to-text in voice assistants, language translation, and pattern recognition over large datasets.
- Generative AI, late 2010s to present. Systems that create content such as text, images, video, or music from a prompt. Examples in the chapter include chat models, DALL-E, and procedurally generated game worlds.
- Artificial general intelligence, which Nika dates as a question mark around the 2030s. A hypothetical system that could learn and apply knowledge across many domains the way a person can. It does not exist yet.
- Artificial superintelligence, which she dates as a question mark around the 2040s. A hypothetical system beyond human intelligence. It also does not exist.

Only the first two groups ship today. When someone says "we added AI" they are describing something in ring one or ring two, and the useful question is which one. The recommendation feed in a music app is traditional AI. The feature that writes a playlist description is generative AI. Same app, different rings, different engineering.

## Work the arithmetic on picking the wrong ring

Calling everything "AI" leads to a concrete engineering mistake. When GenAI is the only ring you can name, every problem looks like a prompt, so teams route traditional AI problems through an LLM. The compute arithmetic shows what that costs.

Take support ticket routing into six queues. This is single-task classification, a ring one problem.

- Option A is a logistic regression classifier on a 50,000 word vocabulary. Scoring one ticket takes about 50,000 multiply-add operations per class, so about 300,000 operations for six classes.
- Option B is an 8B parameter LLM such as [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf). A transformer does roughly 2 operations per parameter per token, so about 16 billion operations for each token it processes. A 300 token ticket costs 300 times that in prefill, about 4.8 trillion operations, before the first label token comes out.

Divide the two. 4.8 trillion over 300,000 is 16 million. The LLM spends about 16 million times the compute of the classifier on the same ticket, and this rough count ignores attention overhead, so the true ratio is higher. That compute gap is where the latency and the bill come from, and the LLM also adds a failure mode the classifier does not have, because it can answer with text that is not one of your six labels.

The LLM is still the right pick in some cases, e.g., when you have no labeled tickets yet and need working routing this week. That is a reasoned choice between rings. The category error is not knowing a choice existed. The [intelligence density](/docs/concepts/intelligence-density) page covers how to think about capability per unit of compute when you make this call.

{% callout type="note" %}
The estimate above is derived from parameter counts, not measured. Measured throughput depends on hardware, batch size, and quantization. The point survives any reasonable measurement, because seven orders of magnitude do not disappear into implementation details.
{% /callout %}

## Check the message against the ring

The same mixup damages trust when it runs through marketing instead of tooling. Nika's Figure 1-1 puts general intelligence in a ring that does not exist yet, with a question mark on the date. Copy that says an assistant "understands your business" or "thinks like your best analyst" describes ring three while the product sits in ring one or two. Users find the gap fast, e.g., the first time the assistant fails a task that any junior analyst would handle, and the copy has taught them to distrust every other claim you make.

The fix is to write copy that names what the system does in its actual ring. "Drafts a reply you review" is a ring two claim a ring two product can keep. This is the self check for your own project: the ring your product sits in matches what your copy implies, or you can name the gap out loud.

## Try it

This takes about 25 minutes. The optional command runs on a laptop CPU or Apple silicon, no GPU needed, with a several GB model download.

1. Take 10 minutes and list five AI features you used today, e.g., a spam filter, face unlock, a photo search, an autocomplete, a chat assistant.
2. Label each one traditional or generative, with one sentence of justification tied to the definition. Traditional means one specific task through rules or pattern recognition. Generative means it created content from a prompt.
3. Sketch the four rings on paper: traditional, generative, general intelligence, superintelligence. Place your current project on it, and write one sentence saying why it sits there.
4. Optional. Watch a ring two tool do a ring one job. Run an LLM as a ticket classifier:

   ```bash
   brew install llama.cpp
   llama-cli -hf prism-ml/Bonsai-8B-gguf \
     -p "Classify this ticket as billing, bug, or feature-request. Ticket: my invoice charged me twice this month. Label:" -n 4
   ```

   Time it. Then note that a keyword rule matching "invoice" or "charged" gives the same label in microseconds. The label is correct either way. The cost is not.

## Check yourself

- **A bank flags unusual card transactions. Which ring?** Expected answer: traditional AI. It is one specific task done with pattern recognition, and nothing is generated.
- **A coding assistant writes a unit test from a comment. Which ring?** Expected answer: generative AI. It creates content from a prompt, and it is still specialized, not general intelligence.
- **A teammate says "let's use AI to find duplicate records" and means an LLM. What do you ask?** Expected answer: whether this is a classification task with available labels, because if it is, a ring one model does it at a tiny fraction of the compute, and the LLM should be a reasoned choice, not a default.
- **Does your product's ring match your marketing copy?** Expected answer: yes, or you can name the exact claim that overshoots and which ring it borrows from.

## Next steps

- Read the [inference stack](/docs/concepts/inference-stack) page to see where each kind of model runs and what serving it costs.
- Read the [intelligence density](/docs/concepts/intelligence-density) page for how to compare capability per unit of compute across model choices.
- For the same tradeoff argued from the serving side, read [why model selection is the biggest inference optimization](/blog/model-selection-biggest-inference-optimization).

When you can do this, you can classify AI features into the four groups and catch category errors in tooling choices and in messaging.
