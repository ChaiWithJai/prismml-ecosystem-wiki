---
title: "Does the 1-bit Bonsai whitepaper prove the efficiency thesis this wiki is built on?"
description: "The whitepaper is a working example of the argument that memory movement and inference cost, more than training or raw compute, decide where a model can run. Here is what it shows, and what stays unverified."
audience: ml-product-team
pillar: ecosystem-player
book: transcript-theme
chapter_ref: "Orientation: the Stoica and Khosla lenses"
status: published
last_reviewed: 2026-07-07
---

This wiki is organized around two arguments about where AI is heading. The 1-bit Bonsai 8B whitepaper is a concrete test of both. The paper takes an 8B model, stores every weight in about one bit, and reports that the result runs 5 to 8 times faster on the same hardware while keeping most of its benchmark scores. This post explains which parts of the whitepaper support the argument, which numbers are measured versus estimated, and which related claims about the training side are still only social posts. {% .lead %}

## State the argument first

The [orientation page](/docs/start-here/orientation) sets out the two lenses this wiki reads the ecosystem through. Both point at the same shift.

Ion Stoica works on open source AI systems, distributed compute, serving, and evaluation. He splits the stack into three parts, which are data, training, and serving ([Columbia Engineering interview](https://www.engineering.columbia.edu/about/news/ion-stoica-highlights-open-source-efficiency-across-ai-stack)). The systems he is known for, Ray and vLLM, are about making the serving part reliable and cheap across many kinds of hardware. The [Ray page](/docs/ecosystem/ray) covers how those pieces fit together.

Vinod Khosla argues that intelligence should get cheaper and more common, and less limited by energy and datacenter capacity. Because of that, this wiki tracks capability per dollar, per watt, per gigabyte, and per device rather than parameter count.

Put together, the two lenses make one claim. The hard problem in AI is no longer only training a capable model. It is serving that model at a price, a power draw, and a size that let it run where people actually need it, which includes phones, laptops, and edge devices, not only cloud GPUs. Training is a cost you pay once or a few times. Serving is a cost you pay on every request, so at scale it is the cost that dominates.

## Read what the whitepaper measures

The whitepaper is [1-bit Bonsai 8B: End-to-end 1-bit language model deployment](/whitepaper/1-bit-bonsai-8b-whitepaper.pdf) (PrismML, March 31, 2026). The [whitepaper benchmarks page](/docs/prismml/whitepaper-benchmarks) is the plain tour of every number, and this section pulls out the parts that speak to the argument above.

The model is Qwen3-8B with its architecture unchanged. The new part is the storage format. Each weight is kept as one sign bit, plus one shared 16-bit scale for every group of 128 weights, which works out to a little over one bit per weight. The kernel reads the bits and the scale during the matrix multiply, so no full precision copy of the weights is ever built in memory.

The size drop is the first result. The full precision model is 16.38 GB on disk. The 1-bit build is about 1.15 GB in the whitepaper, which the current [Hugging Face file listing](https://huggingface.co/prism-ml/Bonsai-8B-gguf/tree/main) shows as 1.16 GB. That is roughly a 14 times reduction.

The speed and energy results follow from the smaller size. On an RTX 4090, a Mac M4 Pro, and other machines, generating tokens runs 5.4 to 8.4 times faster than the full precision build of the same model on the same machine. Energy per generated token drops 4 to 6 times on the Mac and the desktop GPU. On an iPhone 17 Pro Max the model generates about 44 tokens per second, but the paper is explicit that the phone energy figure is estimated from a profiler and battery drain, not metered, so quote it with that caveat.

The quality results are where the tradeoff shows. Across six benchmarks covering knowledge, reasoning, math, coding, instruction following, and tool calling, the 1-bit model averages 70.5. Its own full precision base averages 79.3, so the 1-bit build gives up points, most visibly on knowledge and tool calling. What it buys with those points is a model one fourteenth the size that still matches or beats several models ten times its size on the average.

The paper's own summary metric is intelligence density, which is capability divided by size in gigabytes, defined so that gains near the top of the scale count for more. The three Bonsai models lead every model in the 1.2B to 9B comparison on this measure. The 8B build scores 1.060 per GB, the next best model scores 0.549, and the full precision Qwen3-8B scores 0.096. The [intelligence density post](/blog/what-is-intelligence-density) explains why this ratio, and not the raw average, is the number to compare.

## See why the speed comes from movement, not math

This is the part that ties the whitepaper to the argument. One-bit weights do not make the arithmetic easier. In fact the kernel does extra work to unpack each bit during the multiply. The model still runs faster because when a model generates one token at a time, the slow step is reading the weights out of memory, not doing the multiplies.

A 14 times smaller weight file means 14 times fewer bytes to read for each token. The [bandwidth ledger guide](/docs/technical-guides/bandwidth-ledger) walks through this arithmetic in full. This is the exact claim behind the two lenses above. The bottleneck people are actually paying for is data movement and memory bandwidth, so a change that cuts the bytes moved per token buys speed, energy, and a smaller footprint at once, without touching the arithmetic.

That is why the whitepaper reads as a test of the argument rather than one more quantization result. It attacks the movement cost at the source, measures the effect on real hardware, and reports the quality it gives up in the same tables, so a reader can see the trade instead of guessing at it.

## Fit the training side, and mark what is unconfirmed

The argument has two halves, which are training a model and serving it. The whitepaper covers the serving half. The training half in the same story is EasyDeL, an open source framework built on JAX for training, fine tuning, and serving large models ([EasyDeL on GitHub](https://github.com/erfanzar/EasyDeL)). Its latest stable release is v0.2.0.2, from January 2026, and its repository documents an inference engine called eSurge with continuous batching and a paged KV cache. Both of those facts come from the repository itself, so they are safe to state.

The rest of the EasyDeL story that circulates with the Bonsai whitepaper comes only from posts on X, so under the [source policy](/docs/sources/source-policy) it stays a lead, not a fact. A developer preview described a development branch called vnext, a v0.4.0 release that had not landed yet, new components named SpectraX, eRay, and ejKernel, more parallelism and reinforcement learning trainers, and a speedup of up to 32 percent over the main branch. A PrismML co founder amplified that preview. None of that is confirmed against a release, a changelog, or a benchmark log, and the claim that EasyDeL and PrismML are the same team also comes only from those posts. The [X discovery notes](/docs/sources/x-discovery-notes) hold these signals in the queue with the sources that could settle them.

So the honest version of the two sided story is this. The serving half is measured and published in a whitepaper you can read and reproduce. The training half has a real, verifiable open source project attached to it, and a set of newer claims about that project that are still waiting for a primary source. Keep the two apart when you present them.

{% callout type="note" title="Keep the halves labeled" %}
When you use this whitepaper to argue that efficiency is the main story in AI, cite the paper for the serving numbers and the model card for the file size. Cite the EasyDeL repository only for the stable release and eSurge. Do not repeat the vnext, SpectraX, or 32 percent claims as fact until they have an official source, because right now they are enthusiasm on X and nothing more.
{% /callout %}

## Try it

You can check the movement claim yourself in about 20 minutes on a laptop or a desktop GPU. No second model download is needed. The goal is to see that the generation speed is set by how fast the weights stream through memory.

1. Download the 1-bit Bonsai 8B model and run it with the [llama.cpp recipe](/docs/build-and-run/bonsai-llamacpp):

   ```bash
   pip install -U "huggingface_hub[cli]"
   hf download prism-ml/Bonsai-8B-gguf --local-dir ./bonsai
   ls -lh ./bonsai/*.gguf   # note the file size in GB, call it S
   ```

2. Generate some tokens and read the tokens per second the tool prints at the end, and call that number R:

   ```bash
   llama-cli -m ./bonsai/<model-file>.gguf \
     -p "Explain what memory bandwidth is in two sentences." \
     -n 128 --temp 0 -no-cnv 2>&1 | tee run.log
   ```

3. Multiply S by R. That product is roughly how many gigabytes of weights the machine reads every second while generating, because the model reads the whole weight file once per token.

4. Look up the memory bandwidth of your chip in gigabytes per second, then compare it to your S times R number.

For a rough check, the paper reports about 368 tokens per second for this model on an RTX 4090. With a 1.15 GB file that is about 423 gigabytes per second of weight reads, against roughly 1000 gigabytes per second of bandwidth on that card. The reads take up a large part of the available bandwidth, which is why generation is limited by movement and not by the math.

## Check yourself

- **Why does storing weights in one bit speed up generation even though the kernel does extra work to unpack each bit?** Expected answer: generation one token at a time is limited by reading the weights out of memory, and a smaller file means fewer bytes read per token, so the saved reading time is larger than the added unpacking time.
- **A colleague says the whitepaper proves 1-bit models are as good as full precision. What is the honest correction?** Expected answer: the 1-bit model averages 70.5 against 79.3 for its full precision base, so it gives up points, most visibly on knowledge and tool calling. It trades some quality for about a 14 times smaller size, and the tables show exactly where.
- **Which claims in the two sided story can you publish today, and which cannot?** Expected answer: the whitepaper serving numbers and the EasyDeL stable release and eSurge engine can be published with their sources. The EasyDeL vnext, SpectraX, and 32 percent claims cannot, because they come only from X posts and have no official source yet.

## Next steps

- [Whitepaper benchmarks](/docs/prismml/whitepaper-benchmarks) gives the full table for every number summarized here.
- [The bandwidth ledger](/docs/technical-guides/bandwidth-ledger) works through why decode speed is set by memory movement.
- [What does intelligence density measure?](/blog/what-is-intelligence-density) explains the capability per gigabyte ratio the paper leads with.
- [Ray and Anyscale](/docs/ecosystem/ray) covers the serving systems behind the argument in this post.
- [X discovery notes](/docs/sources/x-discovery-notes) is where the unverified EasyDeL signals live until someone confirms them.

When you can do this, you can explain the whitepaper as a test of the efficiency argument, separate its measured results from its estimated and unverified ones, and defend the split with numbers.
