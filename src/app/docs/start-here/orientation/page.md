---
title: Orientation
status: draft
audience: DevRel
owner: DevRel maintainer
source_tier: mixed
benchmark_status: not_applicable
last_reviewed: 2026-07-06
---

PrismML is a family of small open-weight language models built to run on ordinary hardware such as laptops, phones, and efficient servers. On this page you will learn what the supply chain around those models is, and you will find the fastest route to running one yourself. {% .lead %}

## Understand the supply chain

A model file on its own does nothing. Before you can type a prompt and get an answer, several tools have to do their part. Someone trains the model, someone compresses the weights so they fit on a small device, a runtime loads them, kernels do the math on your specific chip, and an evaluation loop tells you whether the output is any good. This wiki calls that chain of tools the supply chain, and each stage gets its own set of pages here. This is the short version, and the [supply-chain layers page](/docs/ecosystem/supply-chain-layers) breaks the same chain into nine layers.

For example, when you run the Bonsai model on a laptop with llama.cpp, you touch four stages of the chain at once: the compressed weights on disk, the llama.cpp runtime that loads them, the CPU or GPU kernels that execute them, and the tokens per second you measure at the end.

The diagram below shows every stage and how they connect.

{% supply-chain-diagram /%}

## Why the wiki centers on PrismML

PrismML positions its models around concentrated intelligence, which means packing as much capability as possible into weights small enough for local devices. That positioning makes the tradeoffs of the whole supply chain concrete. Model quality still counts, and these pages also treat memory use, energy use, runtime compatibility, and device-local deployment as primary subjects rather than footnotes.

Two other viewpoints shape what the wiki covers:

- **Ion Stoica.** His work centers on open-source AI systems, distributed compute, serving, and evaluation infrastructure. Because of that, these pages document shared primitives, reproducible systems paths, and benchmark methodology.
- **Vinod Khosla.** He argues that intelligence should become cheaper and more abundant, and less constrained by energy or datacenter bottlenecks. Because of that, these pages track intelligence per dollar, per watt, per gigabyte, and per device.

## Know what to trust here

Every canonical page cites durable evidence such as official docs, repos, papers, model cards, release posts, benchmark logs, or reproducible device reports. Claims that only come from social posts stay labeled as unconfirmed until someone verifies them against a durable source. When a page shows commands we have not yet run on hardware, the page says so in plain words.

## Next steps

- [Run Bonsai on your machine with llama.cpp](/docs/build-and-run/bonsai-llamacpp). This is the fastest way to see the whole supply chain work end to end.
- [Read the supply-chain layers guide](/docs/ecosystem/supply-chain-layers) if you want the concepts before the commands.

See something wrong? [Fix it](/docs/contribute/contributor-guide).
