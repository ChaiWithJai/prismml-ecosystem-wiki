---
title: "What legitimate uses do deepfakes have, and how should teams manage the risk?"
description: "Synthetic voice and face generation has legitimate uses and serious misuse potential, so consent, disclosure, and abuse review belong in the PRD."
audience: ml-product-team
pillar: end-user-case-study
book: building-ai-products
chapter_ref: "Nika, Ch. 1, 'Deepfakes' subsection"
status: published
last_reviewed: 2026-07-07
---

Legitimate uses of voice cloning include accessibility voices for people who lost speech, localization and dubbing, and consented brand voices. Synthetic voice and face generation has legitimate entertainment and simulation uses, and serious misuse potential, so consent, disclosure, and abuse review belong in the PRD, not bolted on after launch. For a voice-cloning feature that means three artifacts: what the user signs, what is embedded in the output audio, and what is logged. {% .lead %}

## Name the legitimate uses before you name the risks

Marily Nika's Building AI-Powered Products (Ch. 1) covers deepfakes as one of the generative AI capabilities a PM will be asked to ship. Her framing is useful because she treats the technology as neutral. The same voice model that can impersonate a person without permission can also dub a film into another language in the original actor's voice, give a synthetic voice back to a patient who lost theirs, or generate training scenarios for a call center simulator.

The list of legitimate uses is not decoration. It is what tells you who the intended user is, and the misuse review in the next section only works if you can say what normal use looks like. A dubbing studio enrolls a voice once, with a contract, and generates hours of audio in that one voice. A harasser enrolls many voices, fast, with no contract. The two patterns look different in the logs, but only if you decided to log them.

## Design the three artifacts in the PRD

Nika's point in Chapter 1 is that the PM owns the line between what the system does alone and what a person must review. For a voice-cloning feature, that line shows up as three concrete artifacts, and each one is a PRD section, not a legal afterthought.

- **The consent record.** The person whose voice is cloned signs something. The PRD says what they sign, whether the signature is tied to a verified identity, and whether consent covers one project or all future use. It also says how the person revokes consent and what happens to existing clones when they do.
- **The watermark.** Something is embedded in every output file that marks it as synthetic. The PRD says what is embedded, whether it is audible or inaudible, and who holds the tool that detects it. It also states the known limits, e.g., whether the mark is still detectable after the audio is compressed or re-recorded through a speaker.
- **The log.** Every enrollment and every generation is recorded. The PRD says which fields are kept, e.g., who enrolled which voice, when, and how many distinct voices one account has enrolled, and it says who reviews the log and how often.

If any of the three is missing, you find out during an abuse incident, which is the most expensive time to find out.

## Work the numbers on abuse

Here is a worked example with made-up but explicit numbers. Every figure below is an estimate you would replace with your own.

Suppose your feature reaches 10,000 voice enrollments per month. Estimate that 2 percent of enrollments are attempts to clone a voice without consent. That is 10,000 times 0.02, which is 200 bad attempts per month. Suppose your consent check, e.g., requiring the speaker to read a random challenge phrase live, catches 95 percent of those. That is 200 times 0.95, which is 190 caught, and 200 minus 190 leaves 10 unconsented clones reaching production audio each month.

Now the numbers force the product decision. Ten incidents per month is the residual you are accepting at launch. The kill criterion in your misuse review should be a threshold on that same measurable quantity, decided before launch, e.g., "more than 15 confirmed unconsented clones in any 30 day window shuts off enrollment until the check is redesigned." The threshold is written down first, so when the number crosses it, shutdown does not need a meeting.

{% callout type="note" %}
The arithmetic is simple on purpose. The value is not the numbers, which are estimates. The value is that each safeguard now has a quantity attached, so "is the consent check good enough" becomes a comparison against a threshold instead of a debate.
{% /callout %}

## Try it

This takes about 20 minutes and needs no GPU, because it is a writing exercise. If you want a concrete system to reason about, picture a voice-clone feature running fully on device with a local model, the same deployment shape as running [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf) locally, where no audio leaves the machine and the vendor cannot see the logs.

1. Open a blank file and give it this header:

   ```text
   Misuse review: local voice-clone feature
   Date, author, status: pre-launch
   ```

2. Write three abuse vectors, one line each. Name the attacker and the harm, e.g., "an ex-partner enrolls the victim's voice from old voicemails."
3. Write three mitigations, one line each, and tie each one to a vector. Say which of the three artifacts it lives in, the consent record, the watermark, or the log.
4. Write one kill criterion on the last line. It must contain a number, a time window, and an action, in one sentence.
5. Check the length. The whole review should be 10 lines. If it is longer, you are writing policy prose instead of a review.

The local deployment shape makes one vector harder and one mitigation weaker. Exfiltration by the vendor is off the table, but a central team cannot scan enrollments for abuse patterns because the logs stay on the device. Your review should say which side of that trade you are on.

## Check yourself

- **Does your kill criterion work without a meeting?** Expected answer: yes, because it names a measurable count, a window, and an automatic action. "We will evaluate significant abuse" fails this test. "More than 15 confirmed unconsented clones in 30 days disables enrollment" passes.
- **Can each mitigation point to the vector it blocks?** Expected answer: yes, one to one. A mitigation that blocks nothing specific is a compliance decoration.
- **Where does a revoked consent leave existing audio?** Expected answer: your consent record section says so explicitly, e.g., existing files keep their watermark and new generation stops. If you have no answer, the consent artifact is incomplete.

## Next steps

- Read the [regulated deployment case study](/docs/case-studies/regulated-deployment) for how a team wrote these artifacts into a real approval process.
- Use the [on-prem checklist](/docs/runbooks/on-prem-checklist) if your voice feature runs on customer hardware, where logging and revocation work differently.
- For the buyer's view of the same safeguards, read [the local AI runbook for compliance teams](/blog/local-ai-runbook-for-compliance-teams).

When you can do this, you can produce a consent, watermark, and logging design and a misuse review with a pre-committed kill criterion.
