---
title: "Do inference optimizations like quantization and speculation stack together?"
description: "Not automatically. Quantizing the KV cache helps disaggregation, but big batches starve speculation. Finding a balanced set by config search is the work."
audience: inference-engineer
pillar: foundational-concept
book: inference-engineering
chapter_ref: "Ch. 5, intro (pp. 119-120)"
status: published
last_reviewed: 2026-07-07
---

Not automatically. The techniques interact, and the interactions cut both ways. Quantizing the KV cache helps disaggregation, while big batches starve speculative decoding of the idle compute it needs. The job is to compose a balanced set through patient experimentation. One practitioner tried 77 configurations before finding a combination that doubled throughput. Config search is the actual work. {% .lead %}

## Learn the five families and how they touch

Kiely's Inference Engineering (Ch. 5 intro) groups the acceleration techniques into five families: quantization, speculation, caching, parallelism, and disaggregation. Each one trades a different resource. Quantization cuts memory and memory traffic. Speculation spends spare compute to produce more tokens per step. Caching skips repeated prefill work. Parallelism and disaggregation split work across GPUs.

Because they trade different resources, they meet in the same budget. Kiely writes that "sometimes techniques are symbiotic and sometimes they are incompatible." His two examples from the chapter intro are the ones in the lead. Quantizing the KV cache shrinks the state that a disaggregated setup has to move between prefill and decode machines, so those two techniques help each other. Increasing the batch size uses up the compute that speculative decoding needs, so those two fight.

The chapter's goal statement is worth keeping in mind whenever you tune a server. The engineer's job, Kiely writes, is "a balanced set of optimizations that delivers more than the sum of its parts." A balanced set is not the union of every technique turned to maximum.

## Work through why batching starves speculation

Here is the compute budget behind the batch and speculation conflict, with round illustrative numbers. Take an 8B model at FP16, so about 16 GB of weights. Each decoded token costs about 2 FLOPs per parameter, which is 16 GFLOPs per token. Suppose the GPU reads memory at 1 TB/s and computes at 100 TFLOPS. These are estimates chosen for easy arithmetic, not benchmarks.

```text
memory time per decode step = 16 GB / 1 TB/s            = 16 ms
compute time at batch 1     = 16 GFLOPs / 100 TFLOPS    = 0.16 ms
compute time at batch 100   = 100 x 16 GFLOPs / 100 TFLOPS = 16 ms
```

At batch 1, the step takes 16 ms because of memory, and the compute units are busy for 0.16 ms of it. That idle 15.84 ms is what speculative decoding spends. Verifying several draft tokens in one step multiplies the compute per step but barely changes the memory time, so the extra tokens are close to free.

At batch 100, compute time has grown to match memory time and there is no slack left. Now every draft token verified is compute the batch needed for regular decoding, so speculation slows the server down instead of speeding it up. Both settings help alone. Together, one cancels the other. This is the shape of interaction the chapter warns about, and quantization adds a third dial, because 4-bit weights cut the memory time to about 4 ms and move the crossover point again.

## Search configurations instead of trusting intuition

Kiely tells a story from a Baseten hackathon. An engineer tuning an autocomplete model for code tried 77 configurations with a handwritten script before finding a combination that doubled tokens per second for a customer, and the winning combination was not obvious. The lesson is not the number 77. The lesson is that he wrote a script and swept, rather than reasoning his way to one config and shipping it.

The chapter also says the size of your search should match your traffic. Techniques like KV-aware routing and dynamic disaggregation only pay off with many GPUs serving one model, and tuning is not a one-time task, because traffic changes. For a small deployment, a sweep over quantization level, cache precision, batch limits, and draft length covers most of what you can turn.

## Try it

This takes about 25 minutes. You need llama.cpp, two quantizations of one model, e.g., the Q4_K_M and Q8_0 files of [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf), and a small GGUF draft model that shares the same tokenizer for the speculation runs. No GPU is required, but note what your machine is. On a CPU or a laptop there is little idle compute during decode, so speculation often loses there, and seeing that is part of the exercise.

Sweep 8 configurations: two weight quantizations, two KV cache types, and speculation off or on.

```bash
PROMPT="Write a 300 word explanation of how a hash table works."
for MODEL in Bonsai-8B-Q4_K_M.gguf Bonsai-8B-Q8_0.gguf; do
  for KV in f16 q8_0; do
    for DRAFT in 0 8; do
      if [ "$DRAFT" = "0" ]; then SPEC=""; else SPEC="-md draft.gguf --draft-max 8"; fi
      echo "=== $MODEL kv=$KV draft=$DRAFT ==="
      llama-cli -m "$MODEL" -p "$PROMPT" -n 256 --temp 0 --seed 1 \
        --cache-type-k "$KV" -fa on $SPEC 2>&1 | grep "eval time"
    done
  done
done
```

Record the decode tokens per second from each run in a small table. Then look for a pair of settings where each helps alone but the combination is worse than either. A common find is that speculation helps the Q8_0 model more than the Q4_K_M model, because the 4-bit weights already shrank the memory time that speculation was hiding compute inside. If your draft model rarely agrees with the target, lower `--draft-max` and rerun, since rejected drafts are pure wasted compute.

## Check yourself

1. Name one pair of techniques from the chapter that help each other and one pair that conflict. Expected: quantizing the KV cache helps disaggregation because there is less cache state to hand between prefill and decode. Large batches conflict with speculation because they consume the idle compute that verification needs.
2. Why does speculative decoding get cheaper as decode gets more memory bound? Expected: in a memory bound step the compute units are idle most of the step, so verifying draft tokens uses time the GPU was wasting anyway.
3. Your server runs 4-bit weights at batch 64, and adding a draft model made throughput drop. What happened? Expected: at that batch size and precision, decode is near compute bound, so draft verification competes with regular decoding instead of filling idle compute.
4. A teammate benchmarks each optimization alone, keeps every winner, and ships all of them together without a combined test. What is the flaw? Expected: the gains are not independent. Two settings that each help can conflict in combination, so the combined config has to be measured itself.

## Next steps

- [Speculative decoding guide](/docs/technical-guides/speculative-decoding) for draft models, acceptance rates, and verification cost.
- [Quantization guide](/docs/technical-guides/quantization) for number formats and which components to quantize first.
- [How does speculative decoding work?](/blog/how-speculative-decoding-works) for the mechanism this post treats as one dial among several.

When you can do this, you can design a small configuration sweep and detect a negative interaction between two optimizations.
