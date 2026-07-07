---
title: "Should I use safetensors or ONNX for my model?"
description: "Safetensors holds only tensor data, so it is safe and fast to load. ONNX bundles weights with a graph for portability. Many teams ship safetensors into vLLM."
audience: inference-engineer
pillar: ecosystem-player
book: inference-engineering
chapter_ref: "Ch. 4, secs. 4.2.2-4.2.3 Model File Formats"
status: draft
last_reviewed: 2026-07-07
---

Safetensors stores only tensor data that a loader can memory map. It contains no executable code, so it is safer and faster to load. ONNX bundles the weights with an execution graph, so the same file runs anywhere an ONNX runtime exists. Many teams now skip ONNX export and ship safetensors straight into vLLM or TensorRT-LLM, especially for new architectures like multi-latent attention that make graph export painful. {% .lead %}

## Separate the code from the data

A model is two things. The weights are the numbers learned in training. The architecture is the code that says what to do with those numbers. The two formats split these differently.

A safetensors file holds only the weights. Kiely's *Inference Engineering* (sec. 4.2.2) explains that the safety in the name comes from this restriction. An older generic format like a pickled `.bin` file can run arbitrary Python code while it loads, so a malicious model file can attack the machine that opens it. A safetensors file cannot do that, because there is nothing in it to execute. The architecture lives elsewhere, in a `config.json` file plus model code in a library or an inference engine.

An ONNX file holds the weights and an execution graph together. The graph records every operation the model performs, so any ONNX runtime can run the model without knowing the architecture in advance. That is the portability case for ONNX, and Kiely calls it a good alternative when you want to store model graphs, not just weights.

You may also see GGUF, a third format used by llama.cpp. Like ONNX it packs the weights and the metadata to run them into one file, e.g., the public [Bonsai 8B GGUF](https://huggingface.co/prism-ml/Bonsai-8B-gguf) release on Hugging Face. The same code and data question applies to it.

## Understand why export breaks on new architectures

To make an ONNX file, you export the model from PyTorch. The exporter traces the model and rewrites every operation into the ONNX standard. The standard does not cover every PyTorch data structure, type, and operation, so export fails when the model uses something the standard cannot express.

New architectures hit this first. Kiely's example (sec. 4.2.3) is DeepSeek V3, which introduced multi-latent attention. The PyTorch implementation of that attention variant is difficult to export, because the exporter has to rewrite it into standard operations that were not designed for it.

The safetensors path avoids the problem. The weights are just tensors, and tensors always serialize. The architecture ships as code inside the inference engine instead, so supporting a new model means the vLLM or TensorRT-LLM maintainers write the model code once, and every user loads the same safetensors weights into it. This is why day zero support for a new model usually appears in the engines before any working ONNX export exists. Kiely writes that the industry "is bifurcating between the control of handwritten PyTorch code or the convenience of prebuilt inference engines" (sec. 4.2.3). In plain terms, both ends of that split load safetensors, and the ONNX step in the middle is the part teams drop. ONNX Runtime and TensorRT remain common where export is easy, and Kiely notes TensorRT is still strong for image and video models.

## Work through what loading actually costs

Here is a worked example with derived numbers, not benchmarks. Take an 8B parameter model such as Bonsai 8B stored at 16-bit precision. Each parameter is 2 bytes, so the weights are 8 billion times 2 bytes, which is 16 GB. Hugging Face splits weights this large across several safetensors shards, e.g., four shards of about 4 GB each.

Assume an SSD that reads at 3 GB/s. Reading 16 GB from disk takes 16 / 3, which is about 5.3 seconds, and any format pays that.

The difference is what happens around the read. A pickle loader deserializes the whole file into CPU memory first, so you need roughly 16 GB of free RAM before the weights ever reach the GPU, and the unpickler runs code while it works. A safetensors loader memory maps the file instead. It reads a small header that lists each tensor's name, type, shape, and byte offset, then copies tensors to the GPU directly from the mapped file. You never need the full 16 GB in RAM at once, and nothing executes. Kiely's summary (sec. 4.2.2) is that memory mapping makes loading weights faster and safer.

{% callout type="note" %}
The header design is simple enough to inspect by hand. The first 8 bytes of a safetensors file are a little-endian integer giving the header length, and the header itself is plain JSON. The exercise below reads it.
{% /callout %}

## Try it

Download a small model, inspect its safetensors shards and its `config.json`, and find where the architecture actually lives. This takes under 30 minutes, needs about 1 GB of disk, and needs no GPU.

1. Download a small public model.

```bash
pip install -U huggingface_hub
hf download HuggingFaceTB/SmolLM2-135M --local-dir ./smollm2
ls -lh ./smollm2
```

2. Read the safetensors header. This prints every tensor's name, shape, and byte offset.

```bash
python3 -c "
import json, struct
with open('./smollm2/model.safetensors','rb') as f:
    n = struct.unpack('<Q', f.read(8))[0]
    h = json.loads(f.read(n))
for k, v in list(h.items())[:10]:
    print(k, v)
"
```

3. Read the architecture file.

```bash
python3 -m json.tool ./smollm2/config.json
```

4. Answer this from what you see. The header names tensors like `model.layers.0.self_attn.q_proj.weight`, but nothing in the file says what self attention is or in what order to apply the layers. The `config.json` names an architecture class, e.g., `LlamaForCausalLM`, plus sizes like hidden dimension and layer count. The code for that class lives in the `transformers` library or in an inference engine, not in anything you downloaded. That is the code and data split in one directory listing.

## Check yourself

1. Why is loading a safetensors file safer than loading a pickled `.bin` file? Expected answer: a pickle can run arbitrary Python code during deserialization, and a safetensors file holds only tensor data with a JSON header, so there is nothing in it to execute.
2. A team ships a model with a novel attention variant. Why does ONNX export break while the safetensors path still works? Expected answer: the exporter must rewrite the new attention into standard graph operations and fails when the standard cannot express them, while safetensors only carries the weights and the engine implements the architecture as code.
3. You are choosing a distribution format for a model that vLLM already supports. Which format do you ship and why? Expected answer: safetensors, because the engine provides the architecture code and the export step adds work and risk without adding capability. ONNX earns its place when you need one portable file for a runtime like ONNX Runtime, or a TensorRT image or video pipeline.

## Next steps

- Read the ecosystem pages on [vLLM](/docs/ecosystem/vllm) and [TensorRT-LLM](/docs/ecosystem/tensorrt-llm) to see what the safetensors plus engine path looks like in practice.
- Read [vLLM vs SGLang vs TensorRT-LLM](/blog/vllm-vs-sglang-vs-tensorrt-llm) to choose the engine that receives those weights.

When you can do this, you can articulate the code and data split in each format and choose a distribution format for a given serving path.
