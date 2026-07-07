---
title: Kubernetes The Hard Way
status: published
audience: DevRel
owner: Developer advocate
source_tier: primary_course
benchmark_status: not_applicable
last_reviewed: 2026-07-07
---

Kubernetes The Hard Way is a free course that walks you through building a working Kubernetes cluster by hand, one component at a time, from machines and certificates through etcd, the control plane, workers, networking, and smoke tests. Follow this path to learn what sits underneath every production model-serving deployment, so you can explain and debug the stack that runs vLLM, SGLang, or Ray Serve. {% .lead %}

Start the course here: [bootstrap-your-own-k8s.netlify.app](https://bootstrap-your-own-k8s.netlify.app). The source lives at [github.com/ChaiWithJai/kubernetes-the-hard-way](https://github.com/ChaiWithJai/kubernetes-the-hard-way).

{% callout type="note" title="Why learn the layer under the model server" %}
In production, builders deploy serving stacks like vLLM, SGLang, and Ray Serve on Kubernetes. If you cannot explain certificates, etcd, or pod networking, you cannot debug a builder's "my model server won't start" question past the first abstraction. This course teaches those components.
{% /callout %}

## Learn what each module makes visible

The course builds the cluster in a fixed order, and each module exposes one layer that production serving depends on. Certificates come before the control plane because every component authenticates with TLS. etcd comes next because it holds all cluster state. Then you bootstrap the control plane that `kubectl` talks to, the worker nodes where model-server containers run and GPU device plugins attach, and the pod network that lets replicas of a model server reach each other and the load balancer. The course ends with smoke tests and cleanup, which teach the habit of proving each layer works before you trust the next one.

| Module | What it makes visible |
| --- | --- |
| Prerequisites and machines | Node inventory, SSH access, and OS assumptions. |
| Certificates and kubeconfigs | Why every component authenticates with TLS, and where the certificates come from. |
| etcd | The store that holds all cluster state, and its failure modes. |
| Control plane | What `kubectl` talks to, and how workloads get placed. |
| Worker nodes | Where model-server containers run, and where GPU device plugins attach. |
| Pod networking | How replicas of a model server reach each other and the load balancer. |
| Smoke tests and cleanup | Proof that each layer works, and teardown you can repeat. |

This topic list comes from the course's own materials. We have not yet transcribed the exact module titles from the deployed reader, so wording may differ slightly there. We also have not confirmed which Kubernetes version the course currently targets, or whether it covers GPU node setup or stops at CPU workers.

## Work the path in order

1. Work the prerequisites and machines modules. Record your environment the same way the [Bonsai recipe](/docs/build-and-run/bonsai-llamacpp) environment record does.
2. Complete the certificate and etcd modules before the control plane, because they explain why the control plane's configuration looks the way it does.
3. Bootstrap the control plane, then workers, then networking, in that order. Do not skip ahead when a smoke test fails. Fixing the failure is how you learn what the layer does.
4. Run the final smoke test, then run cleanup.

We have not yet recorded a full run of this course, so we cannot tell you the total time it takes or which versions you will end up with. The commands come from the course itself, which is actively deployed.

## Pair it with Inference The Hard Way

The two Hard Way courses split the stack at the container boundary. [Inference The Hard Way](/docs/learning-paths/inference-the-hard-way) explains how a model turns bytes on disk into tokens on screen, and why decode throughput is memory-bound. Kubernetes The Hard Way explains how that model server gets scheduled, networked, and kept alive in production.

Take Inference The Hard Way first if your job is explaining models. Take Kubernetes The Hard Way first if your job is supporting the builders who deploy them. Both courses teach the same habit. Do not trust an abstraction until you can explain what it hides.

## Next steps

- [Start the course](https://bootstrap-your-own-k8s.netlify.app) and build the cluster module by module.
- [Run Bonsai with llama.cpp](/docs/build-and-run/bonsai-llamacpp) to get a model server you could deploy on the cluster you just built.
- [Take Inference The Hard Way](/docs/learning-paths/inference-the-hard-way) to learn what happens inside the model server.

See something wrong? [Fix it](/docs/contribute/contributor-guide).
