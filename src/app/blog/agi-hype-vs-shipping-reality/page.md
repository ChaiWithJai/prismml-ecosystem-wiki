---
title: "What's the difference between AGI hype and today's AI capabilities?"
description: "AGI is a frontier Nika dates to the 2030s with a question mark, not a shipped capability. Honest roadmaps separate what ships today from speculative ability."
audience: ml-product-team
pillar: end-user-case-study
book: building-ai-products
chapter_ref: "Nika, Ch. 1, 'Artificial General Intelligence (2030s?)'"
status: published
last_reviewed: 2026-07-07
---

The difference is shipped narrow capability against speculative general capability. Marily Nika's Building AI-Powered Products (Ch. 1) dates artificial general intelligence to the 2030s with a question mark, and she describes multidomain problem solving and faster R&D as its promise, not as anything a current product does. Copy that implies AGI sets expectations your product will visibly miss, and regulated buyers read overpromise as a risk signal. {% .lead %}

## Read the question mark in the chapter heading

Nika's section heading is "Artificial General Intelligence (2030s?)". The question mark is part of the claim. She calls AGI "the next frontier in AI research" and writes plainly that "we are not there yet" (Building AI-Powered Products, Ch. 1). Everything she lists under AGI is written in the future tense. AGI "will be able to tackle complex, multidomain problems", could speed up scientific discovery by generating hypotheses and running experiments, and could turn today's assistants into systems that manage large parts of daily life.

Read that list next to what any current product does. A current product does one job, or a small set of jobs, inside a domain someone chose and tested. That is true of a fraud model and it is true of an LLM assistant. The assistant covers more surface than the fraud model, but it is still a specific system with tested strengths and known failure modes, not a general one. The chapter's future tense is the honest tense for AGI, and copy in the present tense should describe only what shipped.

## Sort marketing claims into three tiers

A useful audit assigns every claim on a product page to one of three tiers.

- Traditional. The claim describes one specific task done with rules or learned patterns, e.g., "flags duplicate invoices" or "transcribes calls".
- GenAI. The claim describes content created from a prompt that a person then uses or reviews, e.g., "drafts a reply you approve".
- Implies AGI. The claim describes ability across open-ended domains with no stated limits, e.g., "understands your business", "thinks like your best analyst", or "handles anything your customers ask".

The first two tiers describe things a team can ship and demo today. The third tier borrows from Nika's 2030s section. The tell is a missing boundary. A shipped feature has a scope you can state, and copy in the third tier refuses to state one. The [intelligence density](/docs/concepts/intelligence-density) page makes the same point from the engineering side, because a model has a measurable amount of capability per unit of compute, and copy should not promise more than the model holds.

## Work the arithmetic on a broken promise

Overpromising is not only a tone problem. You can count what it costs. Take a support assistant trained on six intents, e.g., billing, refunds, and password resets. Suppose it handles 1,000 tickets a month. The landing page says it "handles anything your customers ask", which is a third tier claim, so users send it everything.

Assume 20 percent of tickets fall outside the six trained intents. That share is an estimate, not a measurement, and your own logs will give you the true number. The arithmetic that follows is derived from that assumption.

- Out-of-scope tickets per month: 1,000 times 0.20 is 200.
- Out-of-scope tickets per year: 200 times 12 is 2,400.

Each of those 2,400 tickets is a moment where the copy promised an answer and the product visibly failed to give one. Now rewrite the claim to match the product. "Resolves your six most common ticket types and hands the rest to your team" describes the same system. The 2,400 events still happen, but each one is now a handoff the copy predicted instead of a failure the copy denied. The product did not change. The promise did, and the promise is what the user grades.

Regulated buyers grade the promise hardest. A hospital or bank buyer reads a third tier claim as evidence that the vendor either does not know its system's limits or will not say them, and both readings kill the deal. The [regulated deployment case study](/docs/case-studies/regulated-deployment) shows the flip side, where a vendor won by stating scope and failure handling up front.

## Rewrite the claim without losing the sale

Honest copy still has to sell. The rewrite above works because it kept the strongest true fact, which is that the assistant resolves the most common tickets on its own. If your honest rewrite reads as boring, the problem is usually that you grounded the adjectives and kept a weak claim, instead of finding the strongest claim the product can keep. "Drafts a compliant denial letter in 40 seconds, and a reviewer signs every one" is a first or second tier claim, it names a boundary, and it is more persuasive than "understands insurance" because a buyer can test it.

## Try it

This takes about 25 minutes with a browser and a text editor. No GPU and no model download are needed.

1. Pick one product landing page, yours or a competitor's, and copy every capability claim into a list. Ten minutes.
2. Tag each claim traditional, GenAI, or implies AGI, using the definitions above. The test for the third tag is whether the claim states a boundary. Five minutes.
3. Take one claim tagged as implying AGI and rewrite it to describe the shipped capability, including what happens outside its scope. Five minutes.
4. Check the rewrite against the self test. It should still be compelling. If honesty made the sentence boring, you kept a weak claim and grounded its adjectives, so go find the strongest claim the product can keep and write that instead. Five minutes.

If you want a grounded claim to practice on, the [Bonsai 8B model card](https://huggingface.co/prism-ml/Bonsai-8B-gguf) is a public example of first and second tier writing, because it states what the model is and what hardware runs it rather than what it understands.

## Check yourself

- **A page says the assistant "learns your entire business in a day". Which tier?** Expected answer: it implies AGI. It claims open-ended ability across domains with no stated boundary, which Nika's chapter places in the 2030s with a question mark.
- **A page says the tool "drafts release notes from merged pull requests". Which tier?** Expected answer: GenAI. It creates content from defined inputs, and the scope is stated.
- **Why do regulated buyers punish claims that imply AGI harder than consumer buyers do?** Expected answer: because they must document system limits for their own regulators, so a vendor that overstates capability either does not know its limits or hides them, and both are disqualifying.
- **Your honest rewrite is dull. What went wrong?** Expected answer: you grounded a weak claim instead of replacing it. The fix is to find the strongest claim the product can keep, with its boundary stated, and lead with that.

## Next steps

- Read the [regulated deployment case study](/docs/case-studies/regulated-deployment) to see scoped claims winning a sale under heavy compliance review.
- Read the [intelligence density](/docs/concepts/intelligence-density) page for how to reason about how much capability a model of a given size can hold.
- For the four groups of AI that this three tier audit builds on, read [is generative AI the same thing as AI](/blog/is-generative-ai-the-same-as-ai).

When you can do this, you can classify marketing claims by capability tier and rewrite overreach without losing persuasive force.
