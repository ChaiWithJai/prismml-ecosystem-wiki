---
title: "Why are GPUs faster than CPUs for AI inference?"
description: "GPUs apply one uniform operation across thousands of data elements at once, which matches inference's matrix math. CPUs optimize for sequential work."
audience: inference-engineer
pillar: foundational-concept
book: inference-engineering
chapter_ref: "Ch. 3, sec. 3.1 GPU Architecture"
status: published
last_reviewed: 2026-07-07
---

GPUs are throughput machines. They apply one uniform operation across thousands of independent data elements at once, and that is exactly the shape of inference's vector and matrix math. CPUs optimize for low latency on branching, sequential work. This mental model predicts which parts of your workload belong on each processor. {% .lead %}

## Understand what each processor optimizes for

A CPU is built to finish one stream of instructions as fast as possible. It spends most of its silicon on things that speed up a single thread, e.g., branch prediction and large per-core caches. A high-end CPU has dozens of cores, and each core is powerful on its own.

A GPU makes the opposite trade. It spends its silicon on thousands of small cores that all run the same instruction on different pieces of data. Kiely's Inference Engineering (Ch. 3, sec. 3.1) puts it directly: GPUs "are designed for simple, massively parallel workloads", while CPUs are better at complex sequential execution.

Inference is almost entirely matrix multiplication. To produce one token, the model multiplies the same weights against activations across thousands of dimensions, and every one of those multiply and add steps is independent of its neighbors. There is no branching inside the math. So the workload is thousands of identical, independent operations, which is the exact case a GPU is built for.

Kiely also notes that the cores inside a GPU are not all the same. Datacenter GPUs have Tensor Cores, which operate on whole vectors and matrices rather than single numbers. One Tensor Core instruction performs a matrix multiply and accumulate, written as D = (A x B) + C. When you compare GPU spec sheets for inference, the Tensor Core FLOPS number is the one to read.

## Do the memory bandwidth arithmetic

The compute gap is only half the story. To generate one token, the processor must read every model weight from memory once. So memory bandwidth sets a hard ceiling on tokens per second when you serve one request at a time.

Here is the arithmetic for a 7 billion parameter model stored in 8-bit weights, which is about 7 GB of data per token.

- A desktop CPU with dual channel DDR5 memory moves roughly 80 GB/s. The ceiling is 80 / 7, which is about 11 tokens per second.
- An H100 GPU moves about 3,350 GB/s from its onboard VRAM. The ceiling is 3,350 / 7, which is about 478 tokens per second.

The bandwidth figures are published specs, and real systems land below these ceilings because no processor reaches its peak bandwidth on every read. But the ratio is the point. The GPU's memory system is about 40 times faster in this comparison, before any difference in compute even enters the picture.

Kiely's Ch. 3 frames this as two separate bottlenecks. Compute is the bottleneck for prefill, the phase where the model reads your whole prompt at once. Memory bandwidth is the bottleneck for decode, the phase where the model produces tokens one at a time. A GPU wins at both, but for different reasons, and knowing which phase you are in tells you which spec to compare.

{% callout type="note" %}
This is also why a Mac with unified memory runs local models better than its CPU cores would suggest. Apple's M series chips move 100 to 400 GB/s depending on the model, which sits between a desktop CPU and a datacenter GPU. The bandwidth arithmetic above predicts their token speeds fairly well.
{% /callout %}

## Keep some work on the CPU

The throughput model also tells you what does not belong on a GPU. Work that branches, waits on the network, or handles one small item at a time gains nothing from thousands of parallel cores.

In a serving system, these parts stay on the CPU:

- Request routing and queueing. Each request takes a different path, so the work branches constantly.
- Tokenization. Turning text into token ids is a string lookup, not matrix math, and it runs on one small input at a time.
- Voice activity detection in audio pipelines. It is a lightweight sequential filter over a stream.

A good serving setup is therefore both processors doing what each is built for. The CPU handles the branching control flow around each request, and the GPU handles the uniform math inside the model.

## Try it

You can measure the gap yourself with llama.cpp in under 30 minutes. The `--n-gpu-layers` flag controls how many of the model's layers run on the GPU, so setting it to 0 forces a pure CPU run.

1. Install llama.cpp and download a small model in GGUF format, e.g., an 8B model at 4-bit quantization. Our [llama.cpp guide](/docs/ecosystem/llama-cpp) covers setup.
2. Run the same prompt on CPU only:

   ```shell
   ./llama-cli -m model.gguf -p "Explain photosynthesis in one paragraph." -n 128 --n-gpu-layers 0
   ```

3. Run it again with every layer offloaded to the GPU:

   ```shell
   ./llama-cli -m model.gguf -p "Explain photosynthesis in one paragraph." -n 128 --n-gpu-layers 99
   ```

4. Record the tokens per second that each run prints at the end.
5. Write one sentence explaining the gap. Your sentence should mention memory bandwidth, because at batch size one that is the ceiling you just measured.

## Check yourself

1. Why does a GPU beat a CPU at matrix multiplication? Expected answer: the multiply and add steps in a matrix multiply are independent and identical, so thousands of simple cores can run them at once. A CPU's few powerful cores cannot match that width.
2. What sets the ceiling on tokens per second when you decode one request at a time? Expected answer: memory bandwidth, because the processor reads every weight once per token.
3. Name one part of a serving system that should stay on the CPU, and say why. Expected answer: routing, tokenization, or voice activity detection. Each one branches or handles one small item at a time, so the uniform parallel model of a GPU does not fit it.
4. On a GPU spec sheet, which compute number do you compare for inference? Expected answer: Tensor Core FLOPS at your target precision, without sparsity, since inference is dense by default.

## Next steps

- Check whether your hardware can hold the model you want to serve in our [hardware requirements guide](/docs/getting-started/hardware-requirements).
- Set up the exercise above with our [llama.cpp guide](/docs/ecosystem/llama-cpp).
- Read Ch. 3 of Kiely's Inference Engineering for the full tour of GPU compute, caches, and VRAM.

When you can do this, you can explain the throughput versus latency processor distinction and demonstrate it with a measured CPU and GPU comparison.
