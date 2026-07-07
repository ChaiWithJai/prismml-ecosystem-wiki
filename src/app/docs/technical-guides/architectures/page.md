---
title: Architectures Beyond The Transformer
status: published
audience: DevRel engineer
owner: Docs librarian
source_tier: primary_links
benchmark_status: not_run
last_reviewed: 2026-07-07
---

State space models and hybrid designs are alternatives to the transformer that trade some recall ability for much lower compute and memory at long context. On this page you can learn why these alternatives exist, how Mamba and Liquid's LFM2 approach the problem, and when you would pick one over a standard transformer for a device with limited memory. {% .lead %}

{% system-model highlight="architecture" /%}

## Understand why transformers are the default

The transformer ([Vaswani et al., 2017](https://arxiv.org/abs/1706.03762)) replaced recurrence with self-attention, where every token can attend to every other token in the context. That design has three properties the current ecosystem is built on.

{% concept-diagram name="architectures" /%}

1. Training is fully parallel across sequence positions, which is what made large-scale pretraining affordable.
2. The model has direct random access to any earlier token, which favors in-context learning, retrieval-style prompting, and precise copying.
3. A decade of tooling assumes attention. Kernels (FlashAttention), serving stacks (vLLM, SGLang), file formats, and fine-tuning stacks are all built around it.

The cost shows up at inference. Attention compute at prefill grows with the square of the sequence length. Decoding needs a KV cache that grows with context length, and that cache dominates memory at long context or high batch. Every architecture on this page is a response to that cost profile.

## Learn what state space models change

[S4](https://arxiv.org/abs/2111.00396) showed that structured state space models could be trained efficiently as sequence models and handle very long-range dependencies. Its main result was strong performance on the Long Range Arena suite, including the Path-X task where prior sequence models had failed ([S4 repo](https://github.com/state-spaces/s4)).

[Mamba](https://arxiv.org/abs/2312.00752) made SSMs competitive as language model backbones by adding selectivity. The state transition parameters depend on the input, so the model can decide what to keep in its fixed-size state. The paper and [repo](https://github.com/state-spaces/mamba) report these properties:

- Compute grows linearly with sequence length, with no quadratic attention step.
- Decoding is recurrent with a fixed-size state, so there is no KV cache that grows with context.
- The paper reports roughly 5x higher inference throughput than a comparable transformer, and quality matching transformers of about twice the size at the scales tested (up to about 3B parameters).

For example, if you run a chat session with a 100k-token history on a laptop, a transformer must hold a KV cache for all 100k tokens in memory, while a Mamba-style model holds only its fixed-size state.

## Decide between an SSM and a transformer

An SSM is strongest when your constraint is memory and throughput on long streams at small batch, which is the typical edge and local profile. A transformer wins when the task needs precise retrieval from context, or when you need the mature serving stack today. The table below summarizes the tradeoffs.

| Dimension | SSM (Mamba-style) | Transformer | Source |
| --- | --- | --- | --- |
| Long-context cost | Linear compute, constant-size state | Quadratic prefill, KV cache that grows linearly | [Mamba](https://arxiv.org/abs/2312.00752), [Attention](https://arxiv.org/abs/1706.03762) |
| Decode memory at batch 1 | Fixed state, favorable for edge devices | KV cache scales with context length | [Mamba](https://arxiv.org/abs/2312.00752) |
| Exact recall and copying from context | Weaker, because the state is a lossy compression of history | Strong, with direct attention to any token | [Mamba paper, discussion](https://arxiv.org/abs/2312.00752) |
| In-context learning, few-shot prompting | Less proven at frontier scale | Ecosystem default, best documented | [Attention](https://arxiv.org/abs/1706.03762) |
| Kernel and runtime support | Custom scan kernels and thinner runtime coverage | FlashAttention, vLLM, SGLang, and llama.cpp all assume attention | [Mamba repo](https://github.com/state-spaces/mamba) |
| Frontier-scale evidence | Validated to low billions of parameters in the paper | Validated at every deployed scale | [Mamba](https://arxiv.org/abs/2312.00752) |

## See how hybrids split the difference

Liquid AI's LFM2 family is the clearest public example of designing the architecture for the deployment target rather than compressing a transformer afterward. Per the [LFM2 report](https://arxiv.org/html/2511.23404v1) and [Liquid docs](https://docs.liquid.ai/lfm/getting-started/welcome), LFM2 uses a hybrid backbone that mixes gated short-convolution blocks with a small number of attention blocks. Liquid selected the mix with hardware-in-the-loop search that targets prefill and decode latency on the device. The [model library](https://docs.liquid.ai/lfm/models/complete-library) lists the released checkpoints, sizes, and supported deployment paths. Check the licensing terms per checkpoint there before you recommend commercial use, because we have not confirmed them.

The hybrid design keeps a few attention layers for recall and in-context ability, and replaces the rest with operators whose cost is linear. This resolves the same tradeoff the table above describes, per layer instead of per model.

{% callout type="note" title="Compression is a different layer" %}
PrismML built the Bonsai models to address edge constraints with compression (1-bit and ternary weights on a transformer-style backbone), not with a new architecture. Architecture choice and compression compound, so a model can use both.
{% /callout %}

## Compare the three edge strategies

There are three ways to fit a model onto a small device. Liquid changes the architecture. PrismML's Bonsai changes the weight format. A conventional small transformer is quantized after training with a format such as GGUF or AWQ.

| Property | Liquid LFM2 | PrismML Bonsai 8B | Conventional small transformer |
| --- | --- | --- | --- |
| Approach | Hybrid conv + attention, hardware-aware search ([LFM2 report](https://arxiv.org/html/2511.23404v1)) | Transformer-style backbone with 1-bit and ternary weights ([Bonsai 8B](https://prismml.com/news/bonsai-8b), [Ternary Bonsai](https://prismml.com/news/ternary-bonsai)) | Standard attention stack ([Attention](https://arxiv.org/abs/1706.03762)) |
| What changes | The architecture | The weight format | Quantization after training |
| Official local path | [Liquid model library](https://docs.liquid.ai/lfm/models/complete-library) | [Bonsai 8B GGUF](https://huggingface.co/prism-ml/Bonsai-8B-gguf), [MLX 1-bit](https://huggingface.co/prism-ml/Bonsai-8B-mlx-1bit) | llama.cpp, Ollama, or LM Studio |

We have not yet run these models side by side on a shared device, so we do not publish speed, memory, or quality numbers for them. If you want to measure them yourself, start with the [Bonsai llama.cpp recipe](/docs/build-and-run/bonsai-llamacpp).

{% callout type="warning" title="Unconfirmed size claims" %}
Vinod Khosla's X posts describe Bonsai 8B as about 1.15 GB and "more energy efficient". We have not confirmed those numbers against a primary source. Use the [official Bonsai 8B post](https://prismml.com/news/bonsai-8b) or the model card for size and efficiency numbers instead.
{% /callout %}

## Next steps

- [Training and alignment](/docs/technical-guides/training-and-alignment) covers how these backbones are trained and tuned.
- [KV cache](/docs/technical-guides/kv-cache) explains the memory cost that SSMs and hybrids are designed to avoid.

See something wrong? [Fix it](/docs/contribute/contributor-guide).
