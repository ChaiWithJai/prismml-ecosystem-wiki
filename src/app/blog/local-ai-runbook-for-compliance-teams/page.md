---
title: "What belongs in a local-AI runbook for a compliance-bound team?"
description: "A runbook an end user can hand to auditors covers four things demos never do: rollback, model provenance, failure modes, and operational boundaries."
audience: inference-engineer
pillar: end-user-case-study
book: transcript-theme
chapter_ref: "Theme 3: How regulated end users evaluate local AI"
status: draft
last_reviewed: 2026-07-07
---

A runbook an end user can hand to auditors covers four things demos never do: rollback, which is how to return to the last known-good model, model provenance, which is what weights came from where and how you verified them, failure modes, which is what breaks and what users see, and operational boundaries, which is who can change what. It is the artifact that converts a pilot into a deployment. {% .lead %}

## Understand why the auditor wants a runbook and not a demo

A demo shows that the model works once, on one machine, with the person who built it sitting at the keyboard. An auditor asks a different question. They want evidence that the team can operate the model when that person is on vacation, and evidence that a bad change can be undone. The transcripts behind Theme 3 show the same pattern across regulated end users. The pilot gets approved on the demo, but the deployment gets approved on the runbook.

The four sections map to the four questions an auditor asks in order.

1. Rollback answers "what do you do when a change goes wrong?"
2. Provenance answers "how do you know you are running what you think you are running?"
3. Failure modes answer "what does a user see when the system breaks?"
4. Operational boundaries answer "who is allowed to touch this, and how would you know if someone else did?"

## Write the rollback section first

Rollback is the section auditors read first, because it is the one that limits damage. Write it as numbered steps that a teammate can execute without you. A rollback section for a llama.cpp deployment looks like this.

1. Model files live in `/srv/models/`. The file currently served is the one that `current.gguf` points to, and that pointer is a symlink.
2. The last known-good file is recorded in `/srv/models/KNOWN_GOOD`, which contains one filename and its SHA-256 hash.
3. To roll back, repoint the symlink to the known-good file and restart the server:

   ```bash
   ln -sfn /srv/models/bonsai-8b-q4_k_m-2026-05.gguf /srv/models/current.gguf
   systemctl restart llama-server
   ```

4. Verify the rollback by checking the hash of the served file against `KNOWN_GOOD` and by running the smoke prompt in `/srv/models/smoke.txt`.

The test for this section is blunt. A teammate should be able to execute it tonight without asking you anything. If a step says "ask Priya which file is safe", the section is not done.

## Record provenance so an auditor can verify it

Provenance is a record of what weights you run, where they came from, and how you checked them. For each model version, record four fields.

- The source, e.g., the [Bonsai 8B GGUF model card](https://huggingface.co/prism-ml/Bonsai-8B-gguf) and the exact file name and revision you downloaded.
- The SHA-256 hash you computed after download, next to the hash the publisher lists.
- The date you downloaded it and who did the download.
- The license, copied from the model card, not paraphrased.

Here is the worked arithmetic for the storage this policy costs you. A runbook that supports rollback needs at least three files on disk at once. Those are the current model, the last known-good model, and a candidate under test. An 8 billion parameter model at 4-bit quantization stores each weight in about half a byte, so the weights alone are 8 billion x 0.5 bytes = 4 GB. GGUF files at Q4_K_M keep some tensors at higher precision, so plan for roughly 5 GB per file. That is an estimate from the arithmetic, not a measured file size, so check the actual size on the model card. Three files at 5 GB is 15 GB, plus a few hundred MB for hashes, logs, and smoke-test outputs. Reserve 20 GB and the policy never forces you to delete the file you may need to roll back to.

{% callout type="warning" %}
Do not write "verified" in a provenance record unless the record shows the command and both hashes. The transcripts show auditors treating an unverifiable claim as worse than no claim, because it suggests the rest of the runbook is also aspirational.
{% /callout %}

## List failure modes and operational boundaries

The failure modes section is a table with three columns. The first column names what breaks, e.g., the model file is corrupt, the server runs out of memory, or the disk fills. The second column states what a user sees, e.g., an error page, a timeout, or a wrong answer with no error. The third column states the first response, which is usually the rollback procedure or a restart. The entries where the user sees a wrong answer with no error are the ones auditors care about most, so do not leave them out because they are uncomfortable.

The operational boundaries section names people and permissions. State who can replace the model file, who can change the server configuration, and who can read the logs. Then state how a change outside those boundaries would be detected, e.g., a nightly job hashes `current.gguf` and alerts if the hash does not match the provenance record. A boundary with no detection is a request, not a boundary.

## Try it

This takes about 25 minutes and runs on a laptop. No GPU is needed, because an 8B model at 4-bit quantization runs on CPU with about 6 GB of free RAM, just slowly.

1. Pick one local model you already run, even a laptop llama.cpp setup. If you have none, download one file from the [Bonsai 8B GGUF model card](https://huggingface.co/prism-ml/Bonsai-8B-gguf).
2. Create the skeleton:

   ```bash
   mkdir -p ~/runbook && cd ~/runbook
   printf "# Rollback\n\n# Provenance\n\n# Failure modes\n\n# Operational boundaries\n" > RUNBOOK.md
   ```

3. Fill in provenance completely. Compute the hash and record it next to the publisher's hash:

   ```bash
   shasum -a 256 ~/models/bonsai-8b-q4_k_m.gguf
   ```

4. Fill in rollback completely, with real paths and the exact restart command for your setup. Leave failure modes and boundaries as headings with one entry each.
5. Hand the rollback section to a teammate, or read it tomorrow yourself, and execute it without looking anything else up.

## Check yourself

- **Could a teammate execute your rollback section tonight without asking you anything?** Expected answer: yes, because every step has a real path and a real command. If any step needs knowledge that is only in your head, the section is not done.
- **How much disk should you reserve for an 8B model at Q4 with rollback support, and why?** Expected answer: about 20 GB, because you hold three files of roughly 5 GB each, which are current, known-good, and candidate, plus room for logs and hashes.
- **What makes a provenance record verifiable rather than aspirational?** Expected answer: it shows the command that was run and both hashes, yours and the publisher's, so an auditor can rerun the check.
- **Which failure mode entries do auditors weigh most?** Expected answer: the ones where the user sees a wrong answer with no error, because nothing alerts anyone.

## Next steps

- Work through the [on-prem checklist runbook](/docs/runbooks/on-prem-checklist) and merge its items into your skeleton.
- Read the [regulated deployment case study](/docs/case-studies/regulated-deployment) to see a runbook that passed an audit.
- To understand the evaluation sequence your runbook feeds into, read [what a hospital CTO asks before running a model on-prem](/blog/hospital-cto-on-prem-ai-questions).

When you can do this, you can author an auditor-ready runbook covering rollback, provenance, failure modes, and boundaries for a local deployment.
