---
title: "What content do runtimes, MSPs, and inference studios need that end users never read?"
description: "Ecosystem members read the integration surface: API guarantees, extension points, version matrices. End users read outcomes. Publish only one and gaps follow."
audience: ml-product-team
pillar: ecosystem-player
book: transcript-theme
chapter_ref: "Theme 2: End users vs ecosystem members (CNCF-style segmentation)"
status: draft
last_reviewed: 2026-07-07
---

Ecosystem members build on your project, so they read the integration surface, e.g., API stability guarantees, extension points, version support matrices, and packaging conventions. End users consume outcomes, e.g., worked deployment examples, runbooks, and compliance mappings. When you publish only one kind, you tell the other audience it is not welcome, and the gap shows up later as missing adoption or missing contributions. {% .lead %}

## Split your readers by what they do with your project

The transcripts behind Theme 2 use the segmentation the CNCF uses for its projects. The CNCF is the foundation that hosts Kubernetes, and it splits every project's audience into end users and ecosystem members. The split is not about job title. It is about what the reader does with your project.

- An end user runs your project to get a result for their own organization. A hospital team deploying a model on its own servers is an end user.
- An ecosystem member builds a product or a service on top of your project and sells the result to someone else. A runtime that adds your model format, an MSP that operates your stack for its clients, and an inference studio that tunes deployments for hire are all ecosystem members.

The two groups read different documents because they answer to different people. The end user answers for one deployment, so they want the shortest safe path to a working system. The ecosystem member answers for many customers at once, so they want to know what they can depend on across versions and what will break under them.

## Write the integration surface for ecosystem members

An ecosystem member never asks how to deploy your project once. They ask what they can promise their own customers. That means they read four kinds of content that an end user skips.

- **API stability guarantees.** State which interfaces are stable, which are experimental, and how much notice you give before a breaking change. An MSP writes contracts on top of these promises.
- **Version support matrix.** State which versions of your project work with which versions of the runtimes and formats around it. For example, a matrix entry might say which [vLLM](/docs/ecosystem/vllm) releases serve a given model format.
- **Extension points.** Document where a third party can plug in, e.g., a custom scheduler, a new quantization format, or a billing hook, and which of those points you promise not to move.
- **Packaging conventions.** State how artifacts are named, versioned, and checksummed. A public example is the [Bonsai 8B GGUF model card](https://huggingface.co/prism-ml/Bonsai-8B-gguf), which lists the exact files and quantization variants an integrator can pin to.

End users do not read these documents, and that is fine. The end user reads the runbook, the worked example, and the compliance mapping. If your published content is all runbooks, the runtime engineer who wants to add your format has nothing to build against, so they either guess or leave.

## Work through one announcement split two ways

Suppose you announce a new quantized release of a public 8B model. The end user version of the announcement says what got faster and links a runbook. The MSP version has to answer a different question, which is how much validation work this release creates.

An MSP typically supports several environments at once. Say they cover 3 minor versions of the serving stack, 2 GPU generations, and 2 quantization variants. The combinations they must validate are 3 x 2 x 2 = 12 environments per release. If your announcement includes a support matrix that promises compatibility for the latest 2 minor versions only, the MSP can drop one minor version, and the count falls to 2 x 2 x 2 = 8 environments. That removes 4 validation runs per release.

Put a cost on it. If one validation run takes about 2 engineer hours, which is an estimate and not a benchmark, the matrix saves 4 x 2 = 8 hours per release. At 12 releases a year that is 8 x 12 = 96 engineer hours. One table in your announcement does that. The end user never sees the table and never misses it.

{% callout type="note" %}
Do not publish a support matrix you do not test. An ecosystem member turns your matrix into promises to their own customers, so an untested entry in your matrix becomes a broken contract in theirs.
{% /callout %}

## Publish both kinds or accept the gap

The transcripts show what happens when a project publishes for only one audience. A project with deep integrator docs and no runbooks gets contributions but few direct deployments, because end users bounce off the first page. A project with polished runbooks and no stability guarantees gets deployments but few integrations, because no runtime or MSP will build on interfaces that might move without notice.

Neither gap announces itself. It shows up as a flat line in the metric you were not watching. So decide on purpose which audiences you serve, and if the answer is both, give each one a named home in your docs rather than mixing the two in one page.

## Try it

This takes about 25 minutes and needs no GPU or code, only a text editor.

1. Pick one feature announcement you have shipped or plan to ship.
2. Take 10 minutes and draft a one page outline for an MSP that will integrate the feature. Include the sections an integrator needs, e.g., stability guarantees, the version matrix, packaging changes, and the deprecation timeline.
3. Take 10 minutes and draft a one page outline for an end user that will deploy the feature. Include the sections a deployer needs, e.g., a worked example, hardware requirements, and a rollback step.
4. Put the outlines side by side and mark every section that appears in both. If your docs live in a repo, you can diff the two files:

   ```bash
   diff --side-by-side msp-outline.md end-user-outline.md
   ```

5. Count the sections that do not overlap at all, and write one sentence per divergent section saying which audience needs it and why.

The self check is the overlap count. The two outlines should share a headline but fewer than half their sections. If they overlap heavily, you have not segmented, you have written one outline twice.

## Check yourself

- **An MSP asks for your deprecation policy and you do not have one written. Which content type is missing?** Expected answer: an API stability guarantee. The MSP cannot write customer contracts on top of interfaces with no stated notice period.
- **In the worked example, why did the support matrix save the MSP 4 validation runs per release?** Expected answer: the matrix promised compatibility for the latest 2 minor versions, so the MSP dropped 1 of the 3 minors they were testing, and 3 x 2 x 2 = 12 fell to 2 x 2 x 2 = 8.
- **Your project has strong deployments but no third party integrations. Which half of your content is likely missing?** Expected answer: the integration surface, meaning stability guarantees, extension points, the version matrix, and packaging conventions.

## Next steps

- Read the [vLLM ecosystem page](/docs/ecosystem/vllm) as an example of an integration surface document.
- Compare it against the [on-prem checklist runbook](/docs/runbooks/on-prem-checklist), which is written for end users, and note how few sections overlap.
- For the buyer side of the end user segment, read [what a hospital CTO asks before running a model on-prem](/blog/hospital-cto-on-prem-ai-questions).

When you can do this, you can produce audience-differentiated content plans for one technical artifact and justify each divergent section.
