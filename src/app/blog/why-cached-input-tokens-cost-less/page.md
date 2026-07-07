---
title: "Why do API providers charge less for cached input tokens?"
description: "Prefix caching reuses the KV cache of a shared prompt prefix and skips prefill for those tokens. The cheap cache-hit price reflects compute never spent."
audience: ml-product-team
pillar: foundational-concept
book: inference-engineering
chapter_ref: "Ch. 5, sec. 5.3.1 (pp. 136-137)"
status: published
last_reviewed: 2026-07-07
---

Prefix caching reuses the KV cache of a shared prompt prefix, so the server skips prefill compute for those tokens entirely. The cheap cache-hit price reflects compute the provider never spent. This means your prompt design maps straight to cost per request on any pay-per-token API, before you change a single model setting. {% .lead %}

## Understand what the server skips on a cache hit

During prefill, the inference engine runs the model over every input token and stores the result in the KV cache. The KV cache is a store of keys and values for each token, and the model reads it on every later step. Prefill is the expensive part of handling your input, and its cost grows with the length of the prompt.

Now suppose two requests start with the same tokens. The first request already computed the KV cache entries for that shared prefix. With prefix caching turned on, the server keeps those entries and reads them back for the second request instead of recomputing them. The second request only runs prefill on the tokens that come after the shared prefix.

Kiely's Inference Engineering (Ch. 5, sec. 5.3.1) explains the pricing directly. When an API charges less for cache-hit input tokens than for cache-miss tokens, "re-using cached tokens takes very little compute power or time." The discount is not a promotion. It is the provider passing through work it did not do.

## See why the cache stops at the first new token

The cache only helps for an unbroken run of identical tokens from position zero. LLM inference is autoregressive, which means the value stored for each token depends on every token before it. So one new token at position 50 changes the correct values for token 51 and everything after it, even if those later tokens look identical in both prompts.

Kiely shows this with a four-token example. The prompts "Weather in SF ?" and "Weather in NYC ?" share the first two tokens, so the cache covers those two. Both prompts end with the same question mark, but the cache cannot cover it, because the token before it differs. Flip the order to "SF weather today ?" and "NYC weather today ?" and the savings drop to zero, since the very first token differs.

The practical rule from the book is to put new tokens as late in your context as possible. Put the fixed system prompt, tool definitions, and shared documents first. Put the user's question, timestamps, and request IDs last.

## Work the arithmetic on a real prompt shape

Take a support chatbot with a 2,000-token system prompt and about 100 tokens of user input per request, at 10,000 requests per day. The prices below are example prices, not a quote from any provider.

- Without caching, you pay full price for 2,100 input tokens per request. That is 21 million input tokens per day. At $3.00 per million input tokens, input costs $63.00 per day.
- With caching, the 2,000-token prefix hits the cache on almost every request after the first. If cache hits cost $0.30 per million tokens, the prefix costs $6.00 per day and the 100 fresh tokens cost $3.00 per day, for a total of $9.00.

The same prompt now costs about one seventh as much on the input side, and you changed no model setting. You only arranged the prompt so the shared part comes first. This is why prompt layout is a cost decision and not only a quality decision.

{% callout type="warning" %}
The discount only applies to the matched prefix. If your system prompt embeds anything that changes per request, e.g., a timestamp near the top, every token after it is a cache miss at full price.
{% /callout %}

## Try it

You can measure this on your own machine in under 30 minutes with vLLM and any small model.

Start a server with prefix caching enabled:

```bash
pip install vllm
vllm serve Qwen/Qwen2.5-0.5B-Instruct --enable-prefix-caching --port 8000
```

Build a system prompt of roughly 2,000 tokens and send two requests that share it. This script measures the time to the first streamed token:

```python
import time, json, requests

system = "You are a support agent. " + ("Policy line for the agent to follow. " * 250)

def ttft(question):
    start = time.time()
    with requests.post(
        "http://localhost:8000/v1/chat/completions",
        json={"model": "Qwen/Qwen2.5-0.5B-Instruct", "stream": True,
              "messages": [{"role": "system", "content": system},
                           {"role": "user", "content": question}]},
        stream=True,
    ) as r:
        for line in r.iter_lines():
            if line and line != b"data: [DONE]":
                return time.time() - start

print("first request TTFT:", ttft("How do I reset my password?"))
print("second request TTFT:", ttft("How do I close my account?"))
```

The first request runs prefill on the full system prompt. The second request reuses the cached prefix and only runs prefill on the short user message, so its time to first token should drop by a large factor. Run the second request a few times to confirm the drop is stable.

## Check yourself

1. In the two requests above, at which token position do the prompts diverge? Expected answer: at the first token of the user message, right after the shared system prompt, since the chat template repeats the system prompt exactly.
2. Why was everything after that position recomputed, even though both user messages end with a question mark? Expected answer: the model is autoregressive, so each cached value depends on every earlier token, and one different token invalidates all later entries.
3. Your system prompt starts with "Request time: 2026-07-06 09:14". How many of its tokens can hit the cache on the next request? Expected answer: only the tokens before the timestamp, which is close to none, because the prefix ends at the first token that differs.

## Next steps

- Read the [prefix caching guide](/docs/technical-guides/prefix-caching) for how the cache is stored and evicted on a real server.
- Read the [cost modeling guide](/docs/technical-guides/cost-modeling) to fold cache-hit rates into a per-request cost estimate.
- If prefill and decode are still fuzzy, start with [What are prefill and decode?](/blog/what-are-prefill-and-decode) from this series.

When you can do this, you can demonstrate and quantify prefix-cache reuse on a local server and map it to API pricing.
