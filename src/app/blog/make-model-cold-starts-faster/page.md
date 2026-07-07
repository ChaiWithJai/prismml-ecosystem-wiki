---
title: "How do I make model cold starts faster?"
description: "Cold starts split into four phases: GPU procurement, image load, weight load, and engine startup. Optimize each one separately to make scale-down safe."
audience: inference-engineer
pillar: foundational-concept
book: inference-engineering
chapter_ref: "Ch. 7, sec. 7.2.2 (pp. 188-190)"
status: published
last_reviewed: 2026-07-07
---

Cold start time splits into four phases you optimize separately: GPU procurement, image load, weight load, and engine startup. Smaller images, quantized weights (which also load faster), weight caches in the same datacenter, and cached compiled engines each attack one phase. Fast cold starts are what make scale-down safe. Slow ones force permanent over-provisioning. {% .lead %}

## Understand why cold starts decide your bill

A cold start is the time it takes to bring up a new replica of a model, from the moment the autoscaler asks for one to the moment it serves its first request. Philip Kiely's *Inference Engineering* (Ch. 7, sec. 7.2.2) ties this number directly to cost. He writes that "If you can't spin up replicas fast, it's hard to confidently scale down." The logic is simple. If a replica takes ten minutes to come up, you cannot shut replicas down when traffic dips, because a spike would leave users waiting ten minutes. So you keep extra replicas running at all times, and you pay for GPUs that sit idle. Cutting cold start time is what earns you the right to scale down. See the [autoscaling guide](/docs/technical-guides/autoscaling) for how the scale-down delay setting depends on this number.

## Break the cold start into four phases

Kiely lists four factors, and he is explicit that each one needs its own fix.

- **GPU procurement.** The time your cloud provider takes to hand you a GPU node and attach it to your cluster.
- **Image loading.** The time to pull the container image onto that node.
- **Model loading.** The time to load the model weights into the container.
- **Engine startup.** The time for the inference engine to start, including any compilation.

Procurement is the phase you control least. Kiely notes it is mostly a function of your cloud provider, unless you keep a pool of warm nodes that you move between models. Node start time is also something you can negotiate in a contract. The other three phases are engineering work, and that is where the rest of this piece stays.

## Shrink what you have to move

Image loading and weight loading are both the same problem. You are writing gigabytes, often hundreds of gigabytes, onto a fresh instance. Kiely gives two ways to speed that up: make the data smaller, or get more bandwidth.

Smaller comes first because it is free. For the image, include only the steps and dependencies the server needs, and the image both builds and pulls faster. For the weights, quantization helps twice. A quantized model is cheaper to run, and the same smaller file also loads faster during a cold start. The [quantization guide](/docs/technical-guides/quantization) covers how to quantize without losing quality.

One older habit to drop. Teams used to bake the weights into the container image so there was one thing to cache. Kiely points out that modern models have tens or hundreds of billions of parameters, so the weights dwarf the image, and you should load them separately.

## Move the weights closer

Bandwidth is the second lever, and where you load from sets the ceiling. If you pull weights from a third party such as Hugging Face, their egress speed limits you. An S3 bucket in another region adds network latency and data transfer costs. For models in the hundreds of billions of parameters, Kiely says you need gigabytes per second, and the way to get that is to load from a cache that sits physically in the same datacenter as the GPU instance.

Here is the arithmetic for a small model, with the bandwidth numbers as assumptions rather than measurements. [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf) at FP16 is 2 bytes per parameter, so about 16 GB of weights. The Q4 GGUF is roughly 0.5 bytes per parameter plus overhead, call it 5 GB. Assume a 100 MB/s pull from a busy public source and a 1 GB/s pull from a datacenter local cache.

```text
FP16 from public source:  16 GB / 0.1 GB/s = 160 s
FP16 from local cache:    16 GB / 1.0 GB/s =  16 s
Q4 from local cache:       5 GB / 1.0 GB/s =   5 s
```

The two fixes stack. Quantizing cut the file to about a third, and the local cache raised bandwidth ten times, so the phase went from an estimated 160 seconds to an estimated 5. Your numbers will differ, which is why the exercise below has you measure your own.

## Cache the compiled engine

The last phase depends on which engine you run. Kiely notes that vLLM and SGLang start fast. TensorRT-LLM and optimized PyTorch models instead compile an engine targeted at the exact hardware, and those compilations often take several minutes. Paying that on every cold start would erase everything you saved in the other phases.

The fix is to cache the built engine, and both TensorRT-LLM and PyTorch support this through their image caching mechanisms. The catch Kiely flags is strict. The cached engine only runs on an instance with exactly the same GPU type, CUDA version, and software dependencies as the environment it was built in. A cluster that mixes GPU types needs one cached engine per type.

## Try it

This takes under 30 minutes. You need a machine that can run your model. A GPU box is ideal, but a Mac or CPU machine running llama.cpp or Ollama works for the image, weight, and engine phases. You cannot measure the procurement phase locally, so note it as zero and remember that in the cloud it is not.

1. Clear local state so the start is actually cold. For Docker, remove the image with `docker rmi <image>` and clear any weight cache volume.
2. Start a stopwatch and run the server, e.g., `docker run` for your serving image, or `ollama run bonsai-8b` for a local test.
3. Record three timestamps: when the image pull finishes, when the weight load finishes (most servers log this), and when `curl` to the completions endpoint first returns a valid response.
4. Write the total as four numbers: procurement (zero locally), image, weights, and engine.
5. Repeat the run with the [Bonsai 8B Q4 GGUF](https://huggingface.co/prism-ml/Bonsai-8B-gguf) instead of FP16 and compare the weight phase.

You have done the exercise correctly when the four phase numbers add up to your total, and you can say which phase is largest.

## Check yourself

1. Name the four phases of a cold start. Expected answer: GPU procurement, image loading, model weight loading, and engine startup.
2. Your cold start is 8 minutes, and 6 of them are TensorRT-LLM compilation. What is the fix, and what is the constraint? Expected answer: cache the built engine. The cache only works on instances with the same GPU type, CUDA version, and dependencies as the build environment.
3. Why does quantization help cold starts and not just inference cost? Expected answer: the weight file is smaller, so it takes less time to write onto the instance. A Q4 file is roughly a quarter the size of FP16, so the weight phase shrinks by about the same ratio at the same bandwidth.
4. Why do slow cold starts cost money even when no replica is starting? Expected answer: the autoscaler cannot scale down safely if replacing a replica is slow, so you run extra replicas at all times and pay for idle GPUs.

## Next steps

- [Autoscaling](/docs/technical-guides/autoscaling) covers the scale-down delay and concurrency settings that decide when a cold start happens at all.
- [Quantization](/docs/technical-guides/quantization) explains how to shrink the weights, which speeds up the loading phase.
- [Why does quantization speed up inference?](/blog/why-quantization-speeds-up-inference) covers the runtime side of the same file size reduction.

When you can do this, you can profile a cold start into its four phases and select the highest-leverage optimization for your bottleneck.
