---
title: "Why do GPU kernels break when you upgrade GPUs?"
description: "Fast kernels hard-code hardware details like shared memory sizes and Tensor Core layouts, so a kernel tuned for one GPU architecture often breaks on the next."
audience: inference-engineer
pillar: ecosystem-player
book: inference-engineering
chapter_ref: "Ch. 4, sec. 4.1.2 CUDA Kernel Selection"
status: published
last_reviewed: 2026-07-07
---

Fast GPU kernels hard-code details of one specific chip, e.g., how much shared memory each block can use. A kernel tuned for one architecture often underperforms or simply fails on the next. Adopting a specialized kernel like DeepGEMM for FP8 on Hopper also means adopting a migration liability. When you move to Blackwell, you swap the kernel back, wait for support, or port it. {% .lead %}

## Understand why a fast kernel is tied to one chip

A kernel is a function that runs on the GPU. Philip Kiely's *Inference Engineering* (Ch. 4, sec. 4.1.2) explains that kernel authors make their implementation decisions from the exact specifications of the hardware they write for. Kiely notes that kernels "often have hard-coded values" based on the memory bandwidth or the layout of Tensor Cores on a given GPU.

The hard coding is not sloppiness. It is where the speed comes from. A generic kernel has to work on any GPU, so it cannot assume how much fast on-chip memory it has or which matrix multiply instructions exist. A tuned kernel assumes both, and those assumptions are exactly what changes between GPU generations. Kiely gives the direction of failure in both cases. A kernel written for an H100 will likely waste the extra memory and new instructions of a B200, and a kernel written for a B200 can fail outright on the older Hopper architecture, because it calls instructions that Hopper does not have.

Most of the time you never see this, because kernel selection is automatic. PyTorch and TensorRT-LLM pick a working kernel for your architecture during compilation. The problem appears when you opt out of automatic selection and pin a specific fast kernel as a plugin.

## Work one shared memory budget through the arithmetic

Here is the most common concrete failure. A matrix multiply kernel loads tiles of the input matrices into shared memory, which is the small fast memory on each GPU processing unit. To hide load latency, the kernel keeps several tiles in flight at once. The number of tiles in flight is usually a hard coded constant.

Suppose a kernel stages a 128 by 64 tile of matrix A and a 256 by 64 tile of matrix B, both in BF16 at 2 bytes per value, and it keeps 4 stages in flight.

- One A tile is 128 x 64 x 2 = 16,384 bytes.
- One B tile is 256 x 64 x 2 = 32,768 bytes.
- One stage is 16,384 + 32,768 = 49,152 bytes, which is 48 KB.
- Four stages are 4 x 48 KB = 192 KB.

NVIDIA's CUDA programming guide lists the shared memory limits per block. On Hopper (H100) a block can use up to 227 KB, so this kernel launches and runs well. On Ampere (A100) the limit is 163 KB, so a launch that asks for 192 KB fails with an error before it computes anything. The kernel is not slow on the older chip. It does not run at all. To make it run you would cut the pipeline to 3 stages, which is 144 KB, and that change alters the performance the kernel was tuned for. The byte counts above are derived from the tile sizes and the published limits, not measured benchmarks.

Instruction sets fail the same way but harder. Hopper added new Tensor Core instructions and Blackwell replaced them with a different set. No amount of resizing fixes a kernel built on an instruction the chip does not have. That part is a port, not a config change.

## Treat a plugin kernel as a migration liability

Kiely's running example is DeepGEMM. Most production GEMM kernels come from NVIDIA's cuBLAS library, which NVIDIA updates for each new architecture. When the DeepSeek lab released the updated DeepSeek-V3, they also released DeepGEMM, a set of faster kernels for FP8 matrix multiplication on the Hopper architecture. Inserting DeepGEMM as a plugin speeds up a specific step of inference on Hopper.

The book then states the cost. If you upgrade to a B200, Kiely writes, you would have to "swap the kernel back, wait for Blackwell support in DeepGEMM," or port it yourself. He adds that DeepGEMM had gained Blackwell support by the time of publication, which shows the wait branch can resolve, but you do not control when.

{% callout type="warning" title="Supported is a per-variant claim" %}
Check support at the level of the exact compute capability, not the marketing name. A kernel built for compute capability 9.0a (H100) may still exclude other chips in the same family, and a project's README can say "Hopper" while the build files gate on one variant. The build files are the truth, so read them.
{% /callout %}

Write the decision tree down for every pinned kernel before you buy new GPUs.

- **Revert.** Swap back to the generic kernel, e.g., cuBLAS. This is cheap and immediate, but you give back the speedup you adopted the kernel for.
- **Wait.** Stay on the old GPUs until the kernel project supports the new architecture. This costs calendar time you do not control, and you keep paying for the old fleet.
- **Port.** Rewrite the kernel for the new architecture yourself. Kiely calls porting handwritten kernels to a new generation substantial engineering work, and few teams have kernel engineers.

A serving stack usually pins more than one kernel, e.g., an attention kernel in addition to the GEMM kernels. Each pinned kernel gets its own copy of this tree, which is why the audit below is the useful unit of work rather than a debate over each kernel in the middle of the migration.

## Try it

Time budget is about 25 minutes, and no GPU is needed, because you audit source code rather than run it.

Clone vLLM and find the kernels that are guarded by GPU architecture. CUDA identifies architectures by compute capability numbers, where 8.0 is Ampere, 9.0 is Hopper, and 10.0 is Blackwell.

```bash
git clone --depth 1 https://github.com/vllm-project/vllm
cd vllm
grep -n "CUDA_ARCHS" CMakeLists.txt | head -40
grep -rn "9\.0a\|10\.0" CMakeLists.txt | head -40
```

Each match gates a kernel or extension so it only builds for the listed architectures. Make a table with one row per kernel target, e.g., the FP8 and MoE extensions, and one column per architecture. Mark which cells are supported. Then pick one row that only supports Hopper and write its decision tree for a move to Blackwell, with a one-line cost estimate for each branch. If you serve a GGUF model such as [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf) through llama.cpp instead, the same audit applies to the CUDA sources in its `ggml` backend.

## Check yourself

1. A kernel asks for 192 KB of shared memory per block. It runs on an H100 and fails to launch on an A100. Why? Expected answer: Hopper allows up to 227 KB of shared memory per block and Ampere allows 163 KB, so the request exceeds the older chip's limit and the launch fails.
2. Why does a kernel written for a newer architecture sometimes fail outright on an older one, rather than just running slower? Expected answer: it can use Tensor Core instructions that the older architecture does not have, so there is nothing to run.
3. You pinned DeepGEMM for FP8 GEMM on Hopper and your provider offers you B200s. What are your three options? Expected answer: revert to the generic cuBLAS path and lose the speedup, wait for the kernel project to support Blackwell, or port the kernel yourself.
4. Why do most teams never hit this problem? Expected answer: they rely on automatic kernel selection in PyTorch or their inference engine, which picks a working kernel per architecture, so the liability only appears when you manually pin a kernel.

## Next steps

- Read the ecosystem pages for [/docs/ecosystem/vllm](/docs/ecosystem/vllm) and [/docs/ecosystem/tensorrt-llm](/docs/ecosystem/tensorrt-llm). TensorRT-LLM's speed rests on exactly this kind of architecture-specific kernel, written by NVIDIA.
- See how the engines compare overall in [vLLM vs SGLang vs TensorRT-LLM](/blog/vllm-vs-sglang-vs-tensorrt-llm), where hardware support is one of the five deciding rows.

When you can do this, you can audit a serving stack for architecture-specific kernel dependencies and plan a GPU migration around them.
