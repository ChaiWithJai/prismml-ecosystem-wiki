---
title: "What's the difference between benchmarking and profiling inference?"
description: "Benchmarking tells you how the system performs. Profiling tells you why, down to per-kernel time, and you need it only when you write engine code."
audience: researcher
pillar: ecosystem-player
book: inference-engineering
chapter_ref: "Ch. 4, sec. 4.5.3 Profiling Performance"
status: draft
last_reviewed: 2026-07-07
---

Benchmarking tells you how the system performs. Profiling, with tools like PyTorch Profiler and Nsight, tells you why, down to per-kernel time. You need profiling only when you write or contribute engine code. For a workflow of configuring and benchmarking, it adds nothing. Knowing when to skip it saves days, and knowing when it is required is what finds fused kernel opportunities. {% .lead %}

## Separate the two questions

Kiely's Inference Engineering (Ch. 4, sec. 4.5.3) draws the line in one sentence: "Benchmarking tells you how your system is performing; profiling tells you why". A benchmark returns a single figure, e.g., a P90 TTFT of 350 ms. P90 TTFT is the time to first token that 90 percent of requests beat. A profiler shows where each of those milliseconds went inside the inference process, operation by operation and kernel by kernel. A kernel is one GPU program, e.g., a matrix multiply or an attention step.

So before you open any tool, name your question.

- "Is batch size 16 faster than batch size 8 for my traffic?" is a benchmarking question. You compare two whole-system figures.
- "Why does the forward pass spend 40 percent of its GPU time outside the matrix multiplies?" is a profiling question. You need per-operation timing to answer it.

The tools do not overlap. A benchmark cannot tell you which kernel is slow, and a profiler run under fake single-request load cannot tell you what production latency will be.

## Decide whether you need profiling at all

The book is direct about this. Most inference engineers never need profiling in their daily work. If you serve models through an already fast engine, e.g., TensorRT-LLM or vLLM, your job is a cycle of changing configuration and benchmarking the result. Kiely calls profiling in that workflow extraneous. The engine authors already did the kernel work, and no profiler trace will change which config flag you flip next.

Profiling becomes required in three situations the book names.

- You contribute to an inference framework such as vLLM or SGLang.
- You write your own inference service in PyTorch.
- You work on a new modality, e.g., video generation, where fast engines do not exist yet.

In those cases the profiler is what finds the expensive step. The book's worked case is the fused kernel story. A PyTorch Profiler trace shows activation functions taking too long because of excess memory reads, so you write a fused kernel that runs the activations alongside attention, insert it, and then rerun the system-level benchmark to see if the latency target holds. Note the order. Profiling finds the target, the fix is code, and benchmarking judges the fix.

For a researcher this is the routing rule. If your fix will be a config change, benchmark. If your fix will be code inside the engine, profile first.

## Read a profile as a budget

Here is a made-up but arithmetically honest example of what a profiler gives you that a benchmark cannot. Suppose your benchmark says one decode step takes 40 ms of GPU time. That figure is the whole answer a benchmark can give. A profiler splits it into a table of operations, and the split is where the work is.

| Op (by GPU time) | GPU time | Share of 40 ms |
|---|---|---|
| Matrix multiplies (linear layers) | 22 ms | 55% |
| Attention kernels | 10 ms | 25% |
| Activations and elementwise ops | 6 ms | 15% |
| Everything else | 2 ms | 5% |

These numbers are invented for the arithmetic, not measured. The reading is what transfers. The activations line should be small because those ops do little math, so 6 ms out of 40 ms, which is 15 percent, is a flag. If a fused kernel removed even two thirds of it, you would save 4 ms, which is a 10 percent step-time cut. That estimate is what the profiler buys you, because it turns "make it faster" into "these 6 ms are the cheapest 6 ms to attack". Then you benchmark the fix, because only the whole-system number tells you whether the saving survived batching and real traffic.

{% callout type="note" %}
The tool tiers go deeper as you go down. PyTorch Profiler gives per-op CPU time, GPU time, and memory, and it is the easy first stop. NVIDIA Nsight Systems traces the whole system across GPUs and their links. NVIDIA Nsight Compute analyzes a single CUDA kernel's compute and memory behavior. Start at the top and only go down when the question forces you.
{% /callout %}

## Try it

Time budget is about 20 minutes. PyTorch Profiler runs on CPU anywhere, so you can do this on a laptop. The GPU time column only appears if you have a CUDA GPU, so on a Mac or CPU-only machine read the CPU time column instead and the routing lesson is the same. Any small model works, e.g., a small Hugging Face checkpoint, and if you want a public small model to poke at, [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf) is on the Hub, though for this exercise a model that loads in plain PyTorch is simpler.

1. Install PyTorch, then write a forward pass of about 10 lines:

   ```python
   import torch
   from torch.profiler import profile, ProfilerActivity
   from transformers import AutoModelForCausalLM, AutoTokenizer

   tok = AutoTokenizer.from_pretrained("gpt2")
   model = AutoModelForCausalLM.from_pretrained("gpt2").eval()
   ids = tok("Profiling finds the expensive step.", return_tensors="pt").input_ids
   acts = [ProfilerActivity.CPU] + ([ProfilerActivity.CUDA] if torch.cuda.is_available() else [])
   with profile(activities=acts) as prof, torch.no_grad():
       model(ids)
   print(prof.key_averages().table(sort_by="self_cpu_time_total", row_limit=10))
   ```

2. On a CUDA machine, move the model and ids to `cuda` and sort by `self_cuda_time_total` instead.
3. Read the table and write down the top three ops by GPU time (or CPU time), each with its share of the total.
4. Say in one sentence what you would attack first if you had to cut step time by 10 percent.

## Check yourself

- **A teammate asks whether your server holds its latency target at double the traffic. Benchmark or profile?** Expected answer: benchmark. The question is about a whole-system figure under load, and no per-kernel data changes the answer.
- **Your own PyTorch serving code is slower than the same model in vLLM. Benchmark or profile?** Expected answer: profile your code. You wrote the engine code, so the fix will be code, and you need per-op time to find where yours loses.
- **You run vLLM with default flags and want faster TTFT. Should you reach for Nsight?** Expected answer: no. Kiely's rule is that with a high-performance engine your workflow is configuration and benchmarking, and profiling is extraneous unless you plan to contribute kernel-level changes.
- **In the worked table, why does the 6 ms activations line get attacked before the 22 ms matrix multiply line?** Expected answer: the matrix multiplies are doing the model's math and are already the target of years of kernel work, while the activations line is large relative to the little math it does, so it is the likelier sign of waste, e.g., excess memory reads a fused kernel can remove.

## Next steps

- [Benchmarking guide](/docs/technical-guides/benchmarking) covers how to get the whole-system numbers this post routes to.
- [Observability guide](/docs/technical-guides/observability) covers watching those numbers in production rather than in a test.
- [How do I benchmark an LLM server properly?](/blog/how-to-benchmark-an-llm-server) is the companion post for the benchmarking side, including noise bounds and one variable per comparison.

When you can do this, you can route a performance investigation to benchmarking or profiling and extract a top-ops table from a profiler run.
