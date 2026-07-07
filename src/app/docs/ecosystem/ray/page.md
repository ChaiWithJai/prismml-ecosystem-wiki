---
title: Ray / Anyscale
status: source_checked
audience: DevRel engineer
owner: Recipe author
source_tier: primary_links
benchmark_status: not_run
last_reviewed: 2026-07-06
---

Ray is an open source Python framework for running data processing, model training, and model serving across many machines. On this page you can see where Ray fits in the supply chain and try its install command. {% .lead %}

## What Ray is

Ray came out of the Berkeley systems group around Ion Stoica ([Ion Stoica home page](https://people.eecs.berkeley.edu/~istoica/), [Ray](https://www.ray.io/)). You write normal Python, and Ray spreads the work across a cluster. It ships three libraries that each cover one layer of the supply chain:

- **Ray Data** ([docs](https://docs.ray.io/en/latest/data/data.html)) handles the data and features layer. It reads, transforms, and writes datasets, and it feeds training jobs and batch inference.
- **Ray Train** ([docs](https://docs.ray.io/)) handles the training and post-training layer. It runs multi-node training jobs alongside fine-tuning stacks such as Unsloth, TRL, OpenRLHF, and LLaMA-Factory.
- **Ray Serve** ([docs](https://docs.ray.io/)) handles the runtime and serving layer. It sits above inference engines such as vLLM and SGLang and handles distribution and autoscaling. It does not replace those engines.

Anyscale is the company behind Ray and sells a managed Ray platform. We have not yet captured an Anyscale product page as a source, so this page makes no claims about the Anyscale platform.

{% callout type="note" title="One project, three layers" %}
Stoica's framing of the ecosystem has three parts, which are data, training, and serving ([Columbia Engineering interview](https://www.engineering.columbia.edu/about/news/ion-stoica-highlights-open-source-efficiency-across-ai-stack)). Ray Data, Ray Train, and Ray Serve map onto those three parts one to one. When you explain the ecosystem in a talk, Ray is the one project that lets you point at all three layers at once.
{% /callout %}

## Decide whether you need Ray

Ray is cluster-scale infrastructure. If you run a small model on one machine with llama.cpp, MLX, Ollama, or LM Studio, you do not need Ray. Start with the [Bonsai on llama.cpp recipe](/docs/build-and-run/bonsai-llamacpp) instead. Ray becomes useful when you move from one device to batch data processing, multi-node training, or serving that scales across machines.

## Try Ray

This is the minimal install path. These commands come from the upstream docs, and we have not yet run them on hardware.

```bash
pip install -U "ray[data,train,serve]"
python -c "import ray; ray.init(); print(ray.cluster_resources())"
```

If the second command prints a dictionary of CPUs and memory, Ray started a local cluster on your machine. See the [Ray docs](https://docs.ray.io/) for what to run next, such as a Ray Data batch job that reads, transforms, and writes a dataset.

## Sources

Every claim on this page comes from one of these pages:

- [ray.io](https://www.ray.io/), the official project site.
- [docs.ray.io](https://docs.ray.io/), the official docs, which cover the install path, Ray Train, and Ray Serve.
- [Ray Data docs](https://docs.ray.io/en/latest/data/data.html), which describe Ray Data as the AI data processing layer.
- [Ion Stoica's home page](https://people.eecs.berkeley.edu/~istoica/) and a [Columbia Engineering interview](https://www.engineering.columbia.edu/about/news/ion-stoica-highlights-open-source-efficiency-across-ai-stack), which cover his role in the Berkeley systems ecosystem and his open source efficiency argument.

We have not yet recorded Ray's license, current release version, or the details of the Ray Serve and vLLM integration from primary sources, so this page does not state them.

## Next steps

- [Supply-chain layers](/docs/ecosystem/supply-chain-layers) shows the full map that Ray's three libraries slot into.
- [Run Bonsai with llama.cpp](/docs/build-and-run/bonsai-llamacpp) is the single-machine path if you do not need a cluster yet.
- These engines run on Kubernetes in production. Build that layer yourself in [Kubernetes The Hard Way](/docs/learning-paths/kubernetes-the-hard-way).

See something wrong? [Fix it](/docs/contribute/contributor-guide).
