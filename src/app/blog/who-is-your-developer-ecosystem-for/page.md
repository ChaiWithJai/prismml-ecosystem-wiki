---
title: "Who is your developer ecosystem actually for? End users vs ecosystem members"
description: "CNCF-style segmentation splits an ecosystem into end users who adopt a project locally and ecosystem members who build on top. One project, two audiences."
audience: ml-product-team
pillar: ecosystem-player
book: transcript-theme
chapter_ref: "Theme 2: End users vs ecosystem members (CNCF-style segmentation)"
status: draft
last_reviewed: 2026-07-07
---

CNCF-style segmentation splits an ecosystem into two groups. End users, such as a hospital or a manufacturer, adopt the project for their own operations and never resell it. Ecosystem members, such as runtimes, managed service providers, and inference studios, build products on top of it. The end user needs a worked deployment example and runbooks, and the vendor needs the integration surface. One project, two audiences. {% .lead %}

## Split the audience the way the CNCF does

The Cloud Native Computing Foundation, or CNCF, is the body that hosts Kubernetes and many other open source infrastructure projects. Its membership model separates two kinds of participants, and the theme this post draws on applies the same split to AI projects.

- An end user runs the project inside their own organization to get their own work done. A hospital that runs a model on site for clinical note summarization is an end user. So is a manufacturer that runs defect detection on the factory floor. The end user does not sell the project to anyone.
- An ecosystem member builds a product or a service on top of the project and sells it to others. An inference runtime that adds support for your model format is an ecosystem member. So is a managed service provider that operates deployments for clients, and so is an inference studio that ships fine-tuned variants.

The split is about the direction of money and responsibility, not about company size. A consultancy of ten people that deploys your model for hospitals is an ecosystem member. A hospital network of fifty thousand people that deploys it for itself is an end user.

## Give each segment the content it actually reads

The two segments open your site with different questions, so the same page rarely serves both.

The end user asks whether the project will work in their environment and who will keep it working. The content that answers this is concrete and operational.

- A worked deployment example for an environment like theirs, e.g., the [regulated deployment case study](/docs/case-studies/regulated-deployment) for a hospital evaluating on-site inference.
- Runbooks that say what to do when the service degrades, how to upgrade, and how to roll back.
- Compliance notes that a security or legal reviewer can read without touching code.

The ecosystem member asks where the integration surface is and how stable it stays across releases. The content that answers this is about interfaces.

- The file formats, APIs, and extension points the project exposes, with versioning promises.
- A reference integration they can copy, e.g., how a runtime loads the model artifacts.

A public model card is one page that shows the split. The [Bonsai 8B model card](https://huggingface.co/prism-ml/Bonsai-8B-gguf) lists GGUF quantization files, which is integration surface for runtimes and tool builders. An end user landing on the same page needs something the card does not carry, which is a path like [running your first inference](/docs/getting-started/first-inference) and then a runbook for keeping it up.

## Work the audit for one project

Here is the arithmetic on a made-up but realistic audit. The counts below are inputs to the method, not measurements of any real project.

Suppose you list the last ten blog posts and docs pages a project shipped and label each one by the segment it serves.

- Seven items are for ecosystem members, e.g., a new plugin API, a runtime integration guide, and a post on the extension format.
- Three items are for end users, e.g., an install guide, a tutorial, and a hardware sizing note.

The ratio is seven to three, so 70 percent of recent content serves ecosystem members. Now compare that to the project's stated goal. If the roadmap says the growth target is hospital and manufacturing adoption, then the segment the project says it wants gets 30 percent of the content, and none of the three end user items is a runbook or a compliance note. The audit does not say the ratio must be 50 to 50. It says the ratio is a choice, and this project is making the choice by accident.

{% callout type="note" %}
Label each item by who can act on it, not by who might enjoy reading it. A deep dive on the model format is interesting to everyone, but only a tool builder can act on it, so it counts as ecosystem member content.
{% /callout %}

## Try it

Run the audit on one open source AI project you follow. Budget 30 minutes. No GPU is needed, because this exercise only reads web pages.

First, pick the project and collect its last ten blog posts or docs pages. Many projects publish an RSS or Atom feed, so you can pull the titles from the terminal.

```bash
# Pull recent post titles from the project's feed (adjust the URL)
curl -s https://example-project.org/blog/feed.xml | grep -o '<title>[^<]*' | sed 's/<title>//' | head -11
```

If there is no feed, open the blog index and the docs changelog in a browser and copy the ten most recent titles by hand.

Second, label each title "end user" or "ecosystem member" using the action test from the callout above. Write the labels next to the titles in a text file.

Third, compute the ratio. Count the labels, divide each count by ten, and write the two percentages at the top of the file. Then answer two questions in one sentence each. Which segment does the project say it wants, and which artifact is missing for the underserved segment, e.g., a runbook, an integration guide, or a compliance note.

## Check yourself

1. For your project, what was the ratio, and which segment came up short? Expected answer: a concrete split like seven to three, plus the underserved segment named. If you got a clean 50 to 50, check your labels against the action test, because mixed audiences usually hide inside pages labeled generously.
2. Name one item you labeled differently after applying the action test. Expected answer: something like "the format deep dive reads like general content, but only a tool builder can act on it, so it is ecosystem member content".
3. What is the one missing artifact you would ship first, and for whom? Expected answer: a specific artifact tied to a segment, e.g., "an upgrade runbook for end users, because the docs explain install but not what to do after an upgrade fails".

## Next steps

- [Regulated deployment case study](/docs/case-studies/regulated-deployment) is an example of end user content, written for the buyer who never resells.
- [Running your first inference](/docs/getting-started/first-inference) is the entry point an end user needs before any runbook applies.
- [What questions should a hospital CTO ask about on-prem AI?](/blog/hospital-cto-on-prem-ai-questions) shows what one end user segment asks before adopting.

When you can do this, you can segment an ecosystem's audience CNCF-style and audit its existing content against what both segments need.
