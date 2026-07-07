---
title: Use These Docs With AI
status: published
audience: DevRel
owner: DevRel maintainer
source_tier: internal_canonical
benchmark_status: not_applicable
last_reviewed: 2026-07-07
---

These docs are built for coding agents as much as for people. Point Claude Code, Cursor, or any agent at one URL and it can read every page as clean Markdown. {% .lead %}

## Give your agent the index

The whole site is indexed for machines at two URLs:

- [`/llms.txt`](https://yourwildcard.ai/llms.txt) lists every page with a one-line description, grouped by section. Agents read this first to decide what to fetch.
- [`/llms-full.txt`](https://yourwildcard.ai/llms-full.txt) is the full text of every page in one file, small enough to fit in a large context window.

Every docs page also has a raw Markdown twin. Append `.md` to any page URL:

```text
https://yourwildcard.ai/docs/prismml/whitepaper-benchmarks.md
```

## Start a coding agent on Bonsai

Paste this into Claude Code, Cursor, or your agent of choice as the first message:

```text
Read https://yourwildcard.ai/llms.txt and use it as your
map of the PrismML docs. Then get Bonsai 8B running on this machine by
following https://yourwildcard.ai/docs/build-and-run/bonsai-llamacpp.md
Record tokens per second, time to first token, and peak memory, and format
the result using the device report schema page.
```

The agent gets the model file from the [Bonsai 8B GGUF model card](https://huggingface.co/prism-ml/Bonsai-8B-gguf) (1.16 GB, Apache 2.0). Before it downloads anything, have it check whether the file already exists on disk; weights are large and often already local.

## Trust the metadata

Every raw Markdown page carries frontmatter your agent can parse before trusting the prose:

```yaml
status: verified          # verified | source_checked | draft | not_run
source_tier: primary      # how close the evidence is to an official source
benchmark_status: partial # not_run | partial | reproducible | published
last_reviewed: 2026-07-06
```

Tell your agent the rule the site itself follows: numbers with `status: verified` trace to an official source; anything labeled `discovery` came from social posts and is not yet confirmed. The [claim and source matrix](/docs/prismml/claim-source-matrix) is the machine-checkable ledger behind that rule.

## Know what the site does not have

There is no MCP server and no search API; the site is static files. That is deliberate: static Markdown plus an index is the most portable agent interface, and every major docs platform we benchmarked (Vercel, LangChain, Hugging Face) converges on this shape.

## Next steps

- [Run Bonsai with llama.cpp](/docs/build-and-run/bonsai-llamacpp), the page your agent will follow.
- [Whitepaper benchmarks](/docs/prismml/whitepaper-benchmarks), the numbers your agent should compare its run against.

See something wrong? [Fix it](/docs/contribute/contributor-guide).
