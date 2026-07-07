---
title: "How do I benchmark an LLM server properly?"
description: "A good benchmark mirrors production on sequence lengths, traffic, request contents, and sampling settings, and changes one variable at a time."
audience: inference-engineer
pillar: ecosystem-player
book: inference-engineering
chapter_ref: "Ch. 4, secs. 4.5-4.5.2 Benchmarking"
status: draft
last_reviewed: 2026-07-06
---

A good benchmark mirrors production on four axes: sequence lengths, traffic volume and pattern, request contents, and sampling parameters. The best way to get there is to shadow real traffic onto the test system. Then measure a baseline and change one variable at a time. If you tune against unrealistic inputs, the gains disappear in production, and some optimizations conflict, e.g., speculative decoding works against large batches. {% .lead %}

## Mirror production on four axes

Kiely's Inference Engineering (Ch. 4, sec. 4.5) states the goal directly: "A high-quality benchmark simulates real life as closely as possible." The best version of this is shadowing. Shadowing means you copy incoming production requests onto the test system, so you can measure the test system without touching the original request.

If you cannot shadow real usage, you have to simulate it, and the book lists four dimensions your simulated traffic has to match.

- **Sequence lengths.** Time to first token and memory use depend on the input sequence length and the output sequence length, which are the token counts of the prompt and the response. A benchmark with 100-token prompts says nothing about a product where users paste 8,000-token documents.
- **Volume and pattern of traffic.** Batching and server load depend on how many requests arrive at once. The book also says to jitter the traffic, which means adding random variation to request timing so it looks like real usage instead of a fixed drumbeat.
- **Request contents.** The actual text of each request changes results through factors like the cache hit rate and, for speculative decoding, the draft token acceptance rate. Sending the same prompt 1,000 times gives you a cache hit rate no real workload will ever have.
- **Sampling parameters.** Settings like temperature and reasoning effort change how inference runs, so set them to the values production will use.

Kiely's summary of why this list exists is blunt. If you maximize benchmark performance against bad inputs, performance in production will not match your expectations. The numbers you publish to your team will be true for a workload that does not exist.

For request contents, the book suggests open eval datasets, e.g., MMLU for general prompts or SWE-bench for coding prompts. These datasets give you varied, realistic inputs, and you can also spot check that a performance change did not hurt output quality. Pick the dataset that matches your product, e.g., HumanEval when you are tuning a code completion system.

## Start from a baseline and change one thing

Kiely (sec. 4.5.2) adds a second requirement on top of realism. A benchmark also has to be consistent. Send enough traffic that one slow outlier cannot sway the result, and when in doubt run the benchmark several times and average.

Before any optimization work, record a solid baseline at a fixed configuration. Then test each optimization on its own, and also together, so you know which change actually drives the improvement. The book warns that in some cases "optimizations can work against each other", and its example is running speculative decoding with large batch sizes. Speculative decoding spends spare compute to guess tokens ahead, and large batches consume that same spare compute, so stacking both can be worse than either alone.

The same discipline applies to the benchmark setup itself. You will want to test different traffic patterns and sequence shapes, but change only one variable per comparison, or you cannot say which change caused the result.

## Work one comparison with noise bounds

Here is a made-up but arithmetically honest example. Suppose you run your baseline three times at batch size 8, and the P90 TTFT comes back as 402 ms, 418 ms, and 410 ms. P90 TTFT is the time to first token that 90 percent of requests beat. The spread across the three runs is 16 ms around a mean of 410 ms. That 16 ms is your noise bound. Any change smaller than that is indistinguishable from run-to-run noise.

Now change exactly one flag, batch size 8 to 16, and rerun.

| Metric | Batch size 8 (baseline) | Batch size 16 |
|---|---|---|
| P90 TTFT | 410 ms (402 to 418 across runs) | 455 ms |
| Total tokens/sec | 240 | 380 |

The TTFT moved 45 ms, which is about three times the 16 ms noise bound, so the latency regression is real. The throughput gain of 140 tokens/sec is also real. Neither number is good or bad on its own. The comparison tells you the price of the throughput, and your latency target tells you whether to pay it.

{% callout type="warning" %}
If you had changed batch size and quantization level in the same run, this table would be unreadable. You could not assign the 45 ms to either change. One variable per comparison is what makes the table mean something.
{% /callout %}

## Try it

Time budget is about 30 minutes. You need a local model server running, e.g., llama.cpp's server on a small model.

1. Pick fixed settings and write them down: model, quant level, batch size, prompt set, temperature, and concurrency.
2. Run a baseline three times. With llama.cpp you can use its built-in tool for a quick single-machine read:

   ```bash
   llama-bench -m model.gguf -p 512 -n 128
   ```

   For concurrent traffic against a running server, use Locust with a small script that posts your real prompt set:

   ```bash
   pip install locust
   locust -f llm_bench.py --headless -u 8 -r 2 -t 3m --host http://localhost:8080
   ```

   SGLang's genai-bench is another option built for exactly this job. Record P50 and P90 TTFT and tokens/sec for each run, and note the spread across the three runs as your noise bound.
3. Change exactly one flag. Either double the batch size or drop one quant level, not both.
4. Rerun the same benchmark and put the before and after numbers in one table next to your noise bound.

## Check yourself

- **Which four axes does your benchmark match against production?** Expected answer: sequence lengths, traffic volume and pattern, request contents, and sampling parameters. If you cannot say how your prompt set matches production lengths and contents, the benchmark is not mirroring anything.
- **What is your noise bound, and how did you get it?** Expected answer: a number like "16 ms on P90 TTFT", taken from repeated baseline runs at identical settings, not guessed.
- **In your before and after table, how many variables changed?** Expected answer: exactly one, and you can name it. If two changed, the comparison is invalid and you rerun it.
- **Is your measured change bigger than your noise bound?** Expected answer: yes by a clear multiple, or you treat the result as no change.

## Next steps

- [Benchmarking guide](/docs/technical-guides/benchmarking) covers tool setup in more depth.
- [llama.cpp](/docs/ecosystem/llama-cpp) documents the local server this exercise runs against.
- [What do TTFT and TPS actually measure?](/blog/what-do-ttft-and-tps-measure) defines the metrics you just recorded, and why per-user and system tokens/sec are different numbers.

When you can do this, you can design a benchmark that mirrors production and run a valid comparison where only one variable changed, with known noise bounds.
