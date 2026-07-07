---
title: "vLLM vs SGLang vs TensorRT-LLM — which inference engine should I pick?"
description: "vLLM and SGLang are easy to run with day zero model support and broad hardware. TensorRT-LLM is harder to operate but usually fastest on NVIDIA GPUs."
audience: ml-product-team
pillar: ecosystem-player
book: inference-engineering
chapter_ref: "Ch. 4, secs. 4.3-4.3.3 Inference Engines"
status: draft
last_reviewed: 2026-07-06
---

vLLM and SGLang are easy to run, with day zero support for new models and broad hardware coverage. TensorRT-LLM is harder to operate but usually the fastest option on NVIDIA GPUs. The whole decision fits a five-row table that covers performance, ease of use, model support, hardware, and license, and you should make the choice per deployment, not once per team. {% .lead %}

## Start from the five-row table

Philip Kiely's *Inference Engineering* (Ch. 4, sec. 4.3) says there are three competitive inference engines on the market. An inference engine is the server software that loads an open model onto GPUs and answers API requests fast. Kiely compares the three engines on five criteria, and his table looks like this.

| Criterion | vLLM | SGLang | TensorRT-LLM |
| --- | --- | --- | --- |
| Performance | Good | Good | Best |
| Ease of use | Easy | Easy | Hard |
| Model support | Most | Most | Some |
| Hardware | GPU, TPU | NVIDIA, AMD | NVIDIA only |
| License | Apache 2.0 | Apache 2.0 | Apache 2.0 |

The ratings are categorical, not benchmark numbers, and that is the point. Kiely notes that all three run continuous batching out of the box and support the main optimization techniques, e.g., quantization. So the choice rarely comes down to a missing feature. It comes down to which row is the binding constraint for your deployment.

The license row looks like a tie, and among these three it usually is. One nuance from the book is that TensorRT-LLM gets part of its speed from kernels written by NVIDIA engineers, and some of those kernels are closed source even though the engine itself is Apache 2.0.

## Pick per deployment, not per team

The common mistake is to standardize the whole team on one engine. Kiely writes that inference engineers should know all three and "select on a deployment-by-deployment basis". He also notes that his team at Baseten uses all three in production, with TensorRT-LLM used the most.

The reason is that the binding row changes between deployments. A latency budget can decide one deployment, while the GPUs you can actually rent decide the next one. Fill in the table for each deployment and write down which row made the call. That one sentence is the whole decision record.

## Match each engine to its strengths

**vLLM** is the oldest of the three, first released in the summer of 2023 at UC Berkeley and now hosted by the PyTorch Project. Kiely calls broad support its best selling point. It runs on NVIDIA, AMD, and Intel GPUs and on Google TPUs, and nearly every open model works with it from the day it releases. You start it with one command, `vllm serve`, and it installs with pip. Pick it when you want a solid server quickly for almost any open model, or when your GPUs are smaller or older so TensorRT-LLM would not gain you much. See [/docs/ecosystem/vllm](/docs/ecosystem/vllm).

**SGLang** was first released in December 2023 and is the engine xAI uses for inference. It runs on NVIDIA and AMD GPUs. Kiely notes that it works closely with the labs behind DeepSeek, Qwen, and Kimi, so new model architectures often land there first. It has also invested in serving very large mixture-of-experts models across many machines at once. A mixture-of-experts model only activates part of its weights per token, and serving one well takes engine support. Pick SGLang when you serve a large model of that kind, e.g., DeepSeek, and want strong throughput without deep tuning. See [/docs/ecosystem/sglang](/docs/ecosystem/sglang).

**TensorRT-LLM** is NVIDIA's engine, and Kiely rates it best on performance and hardest to use. It runs only on NVIDIA GPUs and supports fewer models than the other two. Its speed comes from handwritten kernels tuned for recent NVIDIA hardware such as Hopper and Blackwell. Pick it when you run a well supported model on a recent NVIDIA GPU and you will spend engineering time to get the best possible speed. See [/docs/ecosystem/tensorrt-llm](/docs/ecosystem/tensorrt-llm).

{% callout type="warning" title="Two versions of TensorRT-LLM" %}
Kiely flags a naming trap. TensorRT-LLM versions starting with 0 are a plugin for NVIDIA TensorRT, while versions starting with 1 are a standalone package built on PyTorch with no TensorRT dependency. Deployments of the old major version are still common, so check which one you are running before you copy any configuration.
{% /callout %}

## Work one decision through the table

Suppose you need to serve a DeepSeek class model on eight AMD MI300X GPUs, because that is the capacity your provider had available. Fill in the table for this deployment.

1. Hardware. TensorRT-LLM is NVIDIA only, so this row eliminates it. Two engines remain.
2. Model support and ease of use. vLLM and SGLang both support the model and both are easy, so these rows do not separate them.
3. Performance. The table says "Good" for both, but Kiely notes SGLang's investment in large mixture-of-experts serving, and DeepSeek is exactly that kind of model.

The decision record is one sentence. We chose SGLang, and the deciding row was hardware, because it removed TensorRT-LLM before performance was even considered.

Now change one input. The same model on eight H100 GPUs, with a strict latency target and an engineer who can spend a week tuning. Hardware no longer eliminates anything, so the performance row decides, and the answer flips to TensorRT-LLM. Same team, different deployment, different engine.

## Try it

You need an NVIDIA GPU for this exercise; on a CPU-only machine `pip install vllm` will run but crawl. No GPU? Use a hosted notebook with a GPU runtime instead.

Stand up a small model behind vLLM and time yourself from install to a working endpoint. Qwen2.5-0.5B-Instruct has about 0.5 billion parameters at 2 bytes each, so the weights are about 1 GB and fit almost anywhere.

```bash
pip install vllm
vllm serve Qwen/Qwen2.5-0.5B-Instruct
```

Then, from a second terminal, send one request.

```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "Qwen/Qwen2.5-0.5B-Instruct", "messages": [{"role": "user", "content": "Say hello in five words."}]}'
```

Write down two things. How long it took from `pip install` to a valid response, and where the friction was, e.g., the model download or a GPU driver issue. That number is your own data point for the ease of use row.

## Check yourself

1. Your provider can only give you AMD GPUs. Which row decides, and what does it eliminate? Expected answer: the hardware row, and it eliminates TensorRT-LLM.
2. You want the fastest possible serving of a well supported model on Blackwell GPUs and can spend engineering time. Which row decides, and which engine wins? Expected answer: the performance row, and TensorRT-LLM wins.
3. A brand new open model launched this morning and you need an endpoint today. Which rows decide? Expected answer: model support and ease of use, which point to vLLM or SGLang because both usually support new models on release day.
4. Why does the license row rarely decide among these three? Expected answer: all three are Apache 2.0, though some of TensorRT-LLM's kernels are closed source.

## Next steps

- Read the ecosystem pages for each engine at [/docs/ecosystem/vllm](/docs/ecosystem/vllm), [/docs/ecosystem/sglang](/docs/ecosystem/sglang), and [/docs/ecosystem/tensorrt-llm](/docs/ecosystem/tensorrt-llm).
- Place the engine in context with [the three layers of an inference stack](/blog/three-layers-of-an-inference-stack). The engine you pick here is the core of the runtime layer.

When you can do this, you can select an inference engine for a specific deployment using the five-criteria table and document the deciding row.
