---
title: Feature Stores And Data Pipelines
status: published
audience: DevRel engineer
owner: Concept guide author
source_tier: primary_links
benchmark_status: not_applicable
last_reviewed: 2026-07-07
---

A feature store is a system that computes a data value once, stores it with a timestamp and a key, and serves that same value to both your training jobs and your live agent. On this page you can learn when you need one, pick a platform, and run a checklist that keeps your training data and your serving data in agreement. {% .lead %}

{% system-model highlight="data" /%}

Small-model agents fail most often at the data layer, not the model layer. A small local model has less capacity than a frontier model to compensate for noisy context, so a mismatch between what the model trained on and what it sees at inference time hurts a small model more.

## Understand the online and offline split

A feature store keeps two copies of the same values because two consumers read them at very different speeds. Your training job reads months of history from the offline store, e.g., a warehouse or a set of Parquet files. Your agent reads one row per request from the online store, a low-latency key-value lookup. For example, a support agent that personalizes on "tickets opened in the last 30 days" trains on the historical value of that count as it stood at each past ticket, and at serving time it looks up the current count by user ID.

{% concept-diagram name="feature-stores" /%}

| Consumer | Store | Access pattern | Failure if skipped |
| --- | --- | --- | --- |
| Training and fine-tuning jobs | Offline store (warehouse, lake, Parquet) | Point-in-time joins over history | Leakage, where the model trains on future data |
| Agent at inference time | Online store (key-value, low latency) | Lookup by entity key per request | Skew, where the agent sees values training never saw |

For LLM agents, "features" are broader than table columns. Retrieved documents, user and session state, tool-call results, embeddings, and the context assembled into the prompt all count. The same rule applies to all of them. Whatever context the agent gets at inference time must be something you can rebuild, correct as of that moment in time, when you generate the training data.

{% callout type="note" title="When you do not need a feature store" %}
If your agent is stateless (prompt in, answer out, no per-entity lookups) a feature store only adds operational cost. You need one when the agent personalizes on entity state (user, device, account) that changes over time and must match between training and serving.
{% /callout %}

## Pick a platform

If you run a local-first or self-hosted stack, start with Feast. If you are already on Databricks, its feature store records lineage for you. If you want a managed platform that runs your pipelines, look at Tecton. Ray Data is not a feature store at all, but it does the heavy data processing before and after one.

| Platform | Model | Core abstractions | Fit for small-model agents |
| --- | --- | --- | --- |
| [Feast](https://docs.feast.dev/) | Open source, bring your own infra | Entities, feature views, offline/online stores, `materialize` | Default for local-first and self-hosted stacks |
| [Tecton](https://docs.tecton.ai/docs/concepts/tecton-concepts) | Managed platform | Data sources, feature views, feature services | Teams that want pipelines as code with managed orchestration and serving |
| [Databricks Feature Store](https://docs.databricks.com/aws/en/machine-learning/feature-store/) | Bundled with Databricks and Unity Catalog | Feature tables, online tables, automatic lineage to models | Teams already on Databricks, since the platform records lineage automatically |
| [Ray Data](https://docs.ray.io/en/latest/data/data.html) | Not a feature store. It is a distributed data processing tool | Datasets, `map_batches`, streaming execution | Multimodal preprocessing and offline batch inference feeding any of the above |

Limits, pricing, and exact API surfaces change often. Treat the linked docs as the authority and this table as a routing decision only.

## Use Ray Data around the store

Ray Data covers the pipeline work upstream and downstream of a feature store rather than replacing it. Use it for:

- Distributed preprocessing of multimodal inputs (images, audio, documents) into features or embeddings before they land in an offline store.
- Offline batch inference, which means running a small model over a large dataset to generate labels, embeddings, or synthetic training data. With streaming execution, the working set never has to fit in memory.
- Mixed CPU and GPU pipelines, where decode and transform steps run on CPU workers while model steps run on GPU workers.

The source for all of this is the [Ray Data docs](https://docs.ray.io/en/latest/data/data.html).

## Check training and serving consistency

Run this checklist before you ship an agent that personalizes on stored state:

1. **Single definition.** Every feature is defined once, in a feature view or feature table, and both the training export and online serving read that definition. Do not copy SQL between the notebook and the service.
2. **Point-in-time joins.** Build training sets with as-of joins against event timestamps, never with "latest value" joins.
3. **Timestamp discipline.** Give every feature row an event timestamp and, ideally, an ingested timestamp, so you can detect data that arrives late.
4. **Freshness budget.** State a maximum staleness for each online feature, and document what the agent does on a cache miss or a stale read.
5. **Same transformations.** Pin tokenization, normalization, embedding model version, and prompt template version identically for dataset generation and serving.
6. **Skew measurement.** Log served feature values and periodically diff their distribution against the training export for the same window.
7. **Replayability.** Given a request ID, you can reconstruct the exact feature values and context the agent saw.

## Hunt for leakage

Leakage means the model trained on information that was not available at prediction time. Check for it like this:

- Grep every training join for reads of mutable tables that are not point-in-time. Each one is a suspected leak.
- Verify that label timestamps are strictly later than all feature timestamps used to predict them.
- For agent traces used as training data, strip fields that were only knowable after the labeled outcome, e.g., resolution codes, final status, or human corrections.
- Hold out by entity and by time, not only by random row split. Random splits let the model memorize individual entities when you use personalization features.
- Re-run your eval with each suspicious feature removed. A large accuracy drop from one feature is a sign of leakage, not a win.

{% callout type="warning" title="Leakage looks like success" %}
Leaked features raise offline metrics while online behavior gets worse, and the damage is easy to miss. Do not trust any offline agent accuracy number that does not state its split strategy and its point-in-time policy.
{% /callout %}

## Document your features and datasets

Write these four documents as you build. None of them needs a GPU, and everything downstream of the data layer depends on them.

| Artifact | Minimum fields | Where it lives |
| --- | --- | --- |
| Feature definition doc | Name, entity, source, transformation, owner, freshness budget, online/offline availability | Next to the feature repo or registry |
| Lineage note | Raw source, transformations, feature, and the models that consume it. On Databricks, capture the [automatic lineage view](https://docs.databricks.com/aws/en/machine-learning/feature-store/) | Per feature table |
| Dataset card | Provenance, collection window, license, split strategy, known leakage risks, intended use, contact | Alongside the dataset artifact |
| Leakage check log | Checks run (from the section above), date, findings, fixes | Linked from the dataset card |

## Try a minimal Feast loop

These commands come from the [Feast docs](https://docs.feast.dev/). We have not yet run them on hardware, so treat them as a starting point rather than a verified recipe.

```bash
pip install feast
feast init agent_features
cd agent_features/feature_repo
feast apply                       # register entities and feature views
feast materialize-incremental $(date -u +%Y-%m-%dT%H:%M:%S)  # load online store
```

To confirm the loop works on your machine, define one entity and one feature view over a local Parquet file. Then build a training dataframe with `get_historical_features` and confirm the point-in-time join drops future rows. Finally, read the same feature online with `get_online_features` and confirm the value matches the latest offline row.

We also do not yet have a measured answer for which online store backend (SQLite, Redis, or an embedded key-value store) works best for a fully local agent stack, or for Ray Data throughput on small quantized models. The platform docs today focus on tabular ML, so agent-specific guidance is thinner than the rest of this page.

## Next steps

- [Evaluation concepts](/docs/technical-guides/evaluation-concepts). Once your data layer is clean, learn how to measure whether the model actually improved.
- [Evaluation harness](/docs/benchmarks/evaluation-harness). Turn those concepts into runs you can repeat and compare.

See something wrong? [Fix it](/docs/contribute/contributor-guide).
