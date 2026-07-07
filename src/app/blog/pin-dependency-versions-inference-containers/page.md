---
title: "Why should I pin exact dependency versions in my inference container?"
description: "Inference dependency chains are long and fragile. Pinning exact versions preserves a known good build, and one loose pin can break tomorrow's rebuild."
audience: inference-engineer
pillar: ecosystem-player
book: inference-engineering
chapter_ref: "Ch. 7, sec. 7.1.1 (pp. 181-182)"
status: published
last_reviewed: 2026-07-07
---

Inference dependency chains, from the CUDA toolkit to torch to the engine build, are long and fragile, and the ecosystem breaks often. Pinning exact versions in your container preserves a known good build, and a single `>=` pin can turn tomorrow's rebuild into an incident. Day zero model support often runs on nightly builds that you must re-pin once stable releases land. {% .lead %}

## Know what your image actually contains

Philip Kiely's *Inference Engineering* (Ch. 7, sec. 7.1.1) opens with the core claim: "Dependency chains for inference are long and fragile." Getting to a working build is hard, so the point of the container is to preserve a known good build in an ecosystem where breaking changes are common.

Kiely lists four kinds of runtime components inside an inference image.

- The CUDA toolkit. The specific versions of CUDA, cuDNN, and drivers that are compatible with the rest of your stack.
- Python packages, e.g., `torch`, `transformers`, and `diffusers`.
- The inference engine, e.g., a specific version of vLLM, SGLang, or TensorRT-LLM.
- System packages, e.g., `ffmpeg` when you work with audio or video models.

Every one of these has its own release schedule and its own idea of which versions of the others it supports. An unpinned dependency means the version is chosen at build time, not by you. Your image works today because one specific combination of all four kinds happens to be compatible. A rebuild that picks even one newer version is a different combination that nobody has tested.

## Pin exact versions, not ranges

Kiely's Figure 7.2 shows the rule in three lines. `transformers` is marked "No". `transformers>=4.40.0` is also marked "No". Only `transformers==4.56.2` is marked "Yes". A range pin like `>=` reads as cautious, but it still lets the resolver pick a version that did not exist when you tested the build. In practice a `>=` pin behaves like no pin at all on the day a breaking release ships.

The payoff Kiely describes is repeatability. Once a fully pinned image builds successfully, every later build resolves to the same versions and produces the same runtime behavior. Tools like uv, poetry, and pip check the pinned set for conflicts and fail the build with an error instead of silently picking something new. A failed build at build time is a much cheaper problem than a broken model server at request time.

The book also tells you where to start. vLLM and SGLang publish official base images for active releases, and Kiely recommends starting from one of those proven images rather than building your own from scratch. See [/docs/ecosystem/vllm](/docs/ecosystem/vllm) for the vLLM images.

## Count how much a short requirements file leaves open

Here is the arithmetic that surprises most people the first time. Suppose your requirements file has 5 lines: `torch`, `transformers`, `vllm`, `fastapi`, and `uvicorn`, none of them pinned. Build the image and run `pip freeze` inside it, and you will see the full resolved set. On a typical vLLM image that set runs well past 100 packages. Call it 120 for this example, which is an estimate, not a benchmark.

Now subtract. You wrote 5 lines, so 120 minus 5 leaves 115 packages that you never named. Those are transitive dependencies, meaning packages that your packages depend on. Pinning your 5 lines to exact versions still leaves those 115 free to drift, because your direct pins do not fix what `torch` or `vllm` pulls in next week. That is 115 out of 120 packages, or about 96 percent of the image's Python dependencies, chosen fresh on every rebuild.

The fix is to pin the resolved set, not just your direct lines. Run `pip freeze` in the working container and use that full output as your requirements file, or use a lock file from uv or poetry, which records every transitive version. After that, a rebuild resolves all 120 packages to the versions you already tested.

## Re-pin nightlies once stable releases land

Kiely points out that breaking changes are especially common around newly released models. When a new model like DeepSeek is announced, the whole ecosystem races to offer day zero support, and inference engineers often build images from overnight builds or other developer pre-releases because no stable release supports the model yet.

Those early builds are more prone to bugs, and Kiely notes they often need to be rebuilt on stable releases in the days and weeks after the model drop. So the workflow has two steps, not one. First, pin the exact nightly build you tested, e.g., a dated dev version, so your day zero image is at least reproducible. Second, put a dated task in your tracker to swap that pin for the stable release once it ships, rebuild, and re-run your evaluation. A nightly pin without a follow-up task is a known good build today and unowned risk in a month.

## Try it

This takes under 30 minutes and needs no GPU, because you are auditing files, not serving a model. If you cannot run Docker locally, you can still do the audit on the requirements file alone.

Pick one Dockerfile or requirements file from a service you own. Then run these steps.

```bash
# 1. List every unpinned line in your requirements file
grep -vE '==' requirements.txt

# 2. Check the base image tag in your Dockerfile
grep '^FROM' Dockerfile

# 3. In the running container, capture what is actually installed
docker exec <container> pip freeze > pinned.txt
```

Step 1 shows every line that is not pinned to an exact version. Step 2 catches a `latest` or missing tag on the base image, which is the same drift problem one layer down. Step 3 gives you the exact versions that are working right now. Replace your requirements file with `pinned.txt`, or pin each unpinned line to the version shown there, and rebuild to confirm the image still builds and starts.

Write down two numbers: how many lines were unpinned, and how many packages `pip freeze` reported. The gap between them is your transitive exposure.

## Check yourself

1. Your requirements file says `vllm>=0.8.0` and the image built fine last month. Why can today's rebuild fail? Expected answer: `>=` lets the resolver pick a newer vllm release than the one you tested, and a newer release can change or break behavior. Only an exact `==` pin reproduces the tested build.
2. Every direct dependency in your file is pinned with `==`. What can still drift on a rebuild? Expected answer: transitive dependencies, the packages your packages pull in, unless you pin the full resolved set with `pip freeze` output or a lock file.
3. You built a day zero image for a brand new model on a nightly engine build. What two things should you do? Expected answer: pin the exact nightly version so the image is reproducible, and schedule a re-pin to the stable release once it ships, with a rebuild and re-evaluation.
4. Name the four kinds of runtime components Kiely says an inference image includes. Expected answer: the CUDA toolkit versions, Python packages, the inference engine version, and system packages such as ffmpeg.

## Next steps

- Read the vLLM ecosystem page at [/docs/ecosystem/vllm](/docs/ecosystem/vllm), including the official base images that Kiely recommends starting from.
- Build a first pinned image around a real endpoint with [/docs/getting-started/first-inference](/docs/getting-started/first-inference), e.g., serving [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf).
- See how engine choice interacts with your container in [vLLM vs SGLang vs TensorRT-LLM](/blog/vllm-vs-sglang-vs-tensorrt-llm), since the engine version is one of the four components you are pinning.

When you can do this, you can convert a drifting inference build into a fully pinned, reproducible one and explain the nightly to stable re-pin workflow.
