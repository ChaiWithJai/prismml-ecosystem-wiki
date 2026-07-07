---
title: "What is a CUDA kernel in simple terms?"
description: "A CUDA kernel is a function of parallel code that runs on an NVIDIA GPU, with one thread typically handling one data element."
audience: researcher
pillar: ecosystem-player
book: inference-engineering
chapter_ref: "Ch. 4, sec. 4.1 CUDA"
status: published
last_reviewed: 2026-07-07
---

A CUDA kernel is a function of parallel code that runs on an NVIDIA GPU, with one thread typically handling one data element. The field's center of gravity has shifted from algorithms to implementations. Attention fits in dozens of lines of math, but FlashAttention takes tens of thousands of lines to run it in a memory-efficient way. {% .lead %}

## Learn what a kernel is before the acronym

CUDA stands for Compute Unified Device Architecture, though almost nobody expands the acronym anymore. It is NVIDIA's platform and programming model for running parallel work on its GPUs. It is not a programming language. You write CUDA programs in a language, most often C++, and a compiler such as nvcc splits the result into CPU code and GPU code.

The kernel is the GPU part. Kiely's Inference Engineering (Ch. 4, sec. 4.1) defines it in one line: "A kernel is just a function that does some parallel computation." Whenever you read "CUDA kernel" in a paper or a repository, you can substitute "a function written to run on an NVIDIA GPU" and lose nothing.

The book breaks CUDA into four parts, and the kernel is the one you will see cited most.

- A CUDA kernel is a user-defined function that runs parallel code on the GPU.
- A CUDA graph is a directed graph of kernels, used to speed up workflows that repeat.
- The CUDA driver is the low-level interface between an application and the GPU hardware.
- The CUDA runtime is the developer-facing API for launching kernels and managing memory.

## Work through one kernel line by line

The book's first example kernel takes an array of length n and doubles every element. Here is that kernel, adapted from Figure 4.1 of Inference Engineering.

```cpp
__global__ void doubleArray(float *arr, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) {
        arr[i] *= 2.0f;
    }
}
```

On a CPU this loop would run in linear time, one element after another. On a GPU, the runtime launches thousands of copies of this function at once, and each copy is called a thread. Each thread computes its own index `i` and touches exactly one element. That pattern, one thread per element, is the core mental model.

Threads are organized into blocks, and the index arithmetic is how each thread finds its element. Suppose the array has 1,000,000 elements and you choose 256 threads per block. You need 1,000,000 / 256 blocks, which rounds up to 3,907. The thread with `blockIdx.x = 2` and `threadIdx.x = 10` computes i = 2 x 256 + 10, which is element 522. The last block has 3,907 x 256 = 1,000,192 thread slots, which is 192 more than the array holds, and the `if (i < n)` guard is what stops those extra threads from writing past the end.

## See why implementation beat algorithm

Kiely draws the conclusion that gives this post its point. Writing kernels shifts inference engineering from thinking about algorithms to thinking about implementations. The attention equation at the heart of every transformer fits in a few dozen lines of code. FlashAttention computes the same math, and it takes tens of thousands of lines, because those lines arrange when data moves between GPU memory and compute units.

That gap is why two programs that compute identical math can differ widely in speed. The slow one reads and writes GPU memory more times than it needs to. The fast one keeps intermediate values close to the compute units and touches main GPU memory as little as possible. The floating point operations are the same in both. The memory traffic is not.

The book's section 4.1.3 shows the simplest version of this idea, called kernel fusion. If you run a multiply_by_2 kernel and then a multiply_by_3 kernel on the same vector, the GPU writes the intermediate result to memory and reads it back for no reason. Fusing them into one multiply_by_6 kernel removes that round trip. Memory bandwidth limits decode, the phase of LLM inference that produces tokens one at a time, so removing round trips is the main way to make decode faster. Our [inference stack overview](/docs/concepts/inference-stack) shows where kernels sit under the frameworks and engines you actually call.

Most practitioners never write a kernel. Kiely notes that frameworks and engines pick kernels for you, and that hand-picking one, e.g., swapping in DeepGEMM for FP8 matrix multiplication on Hopper GPUs, is an optimization step, not a starting point. Kernels are also tied to specific hardware. The book warns that a kernel written for an H100 will likely waste the extra capability of a B200, so each GPU generation triggers a round of porting work.

## Try it

This exercise takes about 20 minutes and needs no GPU, because you are reading code, not running it.

1. Open the FlashAttention repository at github.com/Dao-AILab/flash-attention in your browser.
2. Browse the `csrc/` directory, where the CUDA source lives, and skim the file and folder names.
3. List three hardware concerns you find in the code structure that the textbook attention equation never mentions. Look for these:
   - Tiling, meaning code that splits matrices into small blocks sized to fit fast on-chip memory.
   - Shared memory management, meaning explicit code for moving data into and out of each block's scratch space.
   - Architecture variants, meaning separate code paths or folders for different GPU generations, e.g., Ampere versus Hopper.
4. Write one sentence for each concern saying why the math notation has no symbol for it.

If you do have an NVIDIA GPU and want to go further, compile the doubleArray kernel above with `nvcc` and launch it with `doubleArray<<<3907, 256>>>(arr, 1000000)`.

## Check yourself

1. What is a CUDA kernel in one sentence? Expected answer: a function that runs parallel code on an NVIDIA GPU, where each thread usually handles one data element.
2. In the doubleArray kernel, what does `i = blockIdx.x * blockDim.x + threadIdx.x` compute, and why does the kernel check `i < n`? Expected answer: it computes which array element this thread owns, and the check stops the extra threads in the last block from writing past the end of the array.
3. Two programs compute mathematically identical attention, and one is far faster. What is the likely cause? Expected answer: memory movement, not arithmetic. The fast one moves less data between GPU memory and compute units, e.g., by fusing kernels or tiling to fit fast on-chip memory.
4. Why does a new GPU generation create work for kernel authors? Expected answer: kernels hard-code hardware details such as memory sizes and Tensor Core layout, so a kernel tuned for one architecture must be ported to use the next one well.

## Next steps

- Place kernels in the full serving picture with our [inference stack concepts guide](/docs/concepts/inference-stack).
- Read our [KV cache guide](/docs/technical-guides/kv-cache) to see the memory structure that attention kernels read on every decode step.
- Read our post on [FlashAttention versus PagedAttention](/blog/flashattention-vs-pagedattention) for how two famous kernels attack different memory problems.
- Read Ch. 4 of Kiely's Inference Engineering for kernel selection and kernel fusion in depth.

When you can do this, you can describe the thread and block execution model and explain why implementation, not math, is the modern performance frontier.
