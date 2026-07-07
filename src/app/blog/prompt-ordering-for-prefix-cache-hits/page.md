---
title: "How should I order my prompt to maximize prefix cache hits?"
description: "The cache match runs from the first token to the first non-repeated token, so variable content early kills all savings after it. Push novel tokens late."
audience: ml-product-team
pillar: foundational-concept
book: inference-engineering
chapter_ref: "Ch. 5, sec. 5.3.1 (pp. 137-138)"
status: published
last_reviewed: 2026-07-07
---

The cache match runs from the first token until the first non-repeated token. So variable content early in the prompt, e.g., a user name, a date, or the query, destroys all savings after that point. Push novel tokens as late as possible. Reordering one prompt template can cut cost and latency with no model changes. {% .lead %}

## Learn the one rule that decides your hit rate

Prefix caching lets the server reuse the stored keys and values for tokens it has already processed in an earlier request. The match starts at the very first token of the prompt and ends at the first token that differs from the earlier request. Nothing after that point is reused, even if the rest of the prompt is identical.

Kiely's Inference Engineering (Ch. 5, sec. 5.3.1) shows this with two four-token prompts. "SF weather today ?" and "NYC weather today ?" share their last three tokens, but the first token differs, so the cache reuses nothing. The book's Figure 5.8 caption states the point plainly: the first tokens are different, so it does not matter that the next three are the same.

The reason is that the model is autoregressive. The stored value for each token depends on every token before it. One new token at position 5 makes the stored values for positions 6 and beyond wrong for the new request, so the server must recompute them.

From this, Kiely gives one rule for prompt layout: "ensure that novel tokens are as late in your context as possible." Everything else in this post follows from that rule.

## Sort your template from most stable to most variable

Take your prompt template and sort its parts by how often they change across requests.

- Put the system prompt, tool definitions, and few-shot examples first. These are identical on every request.
- Put shared documents or retrieved context next, since many requests in a session reuse them.
- Put per-request fields last: the date, the user's name, session IDs, and the user's question.

The common mistake is a header like "Today is 2026-07-07. You are a support agent for..." at the top of the template. The date changes daily and a timestamp changes every request, so the match ends within the first few tokens and the entire system prompt behind it is recomputed at full price.

The fix is a one-line move. Keep the instructions at the top and append the dynamic line at the end, e.g., "For reference, today is 2026-07-07." The model still sees the date, and the whole fixed block in front of it now matches the cache.

## Count the tokens your current ordering throws away

Here is a worked example with a common template shape. Suppose your template has a 12-token header that contains the current date, then 1,800 tokens of fixed instructions and examples, then about 90 tokens of user input. The numbers are an example, not a benchmark.

- With the date first, the match ends inside the header. At best a few tokens hit the cache, so roughly 1,890 of about 1,900 input tokens are recomputed on every request.
- With the date and user input moved to the end, the 1,800 fixed tokens match on every request after the first. Only about 100 tokens are recomputed.

The reorder recovers about 1,790 cached tokens per request. At 10,000 requests per day, that is about 17.9 million input tokens per day that the server no longer prefills. If your API charges $3.00 per million tokens on a miss and $0.30 on a hit, those tokens drop from $53.70 per day to $5.37 per day, and those are example prices. On your own server the same reorder shows up as lower time to first token, because prefill on the fixed block is skipped.

{% callout type="warning" %}
Watch the chat template, not just your own text. The serving framework wraps your messages in role tags and may inject the date or other fields into the rendered prompt. Print the rendered token sequence once and check where the first differing token lands.
{% /callout %}

## Try it

You can A/B the two orderings in under 30 minutes with llama.cpp on a laptop. No GPU is needed. An 8B model at 4-bit needs about 6 GB of memory, and prefill will be slower on CPU than on a GPU or Apple silicon, which makes the cache effect easier to see.

Start a server with [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf). llama-server reuses the matching prompt prefix by default:

```bash
brew install llama.cpp
llama-server -hf prism-ml/Bonsai-8B-gguf --port 8080
```

Then compare time to first token for the two orderings. Each ordering is sent twice, and the second send is the one to compare:

```python
import time, requests

fixed = "You are a support agent. " + ("Policy line to follow. " * 300)

def ttft(system):
    start = time.time()
    with requests.post("http://localhost:8080/v1/chat/completions",
        json={"stream": True, "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": "How do I reset my password?"}]},
        stream=True) as r:
        for line in r.iter_lines():
            if line and line != b"data: [DONE]":
                return time.time() - start

for name, tpl in [("date first", lambda d: f"Today is {d}. " + fixed),
                  ("date last", lambda d: fixed + f" Today is {d}.")]:
    ttft(tpl("2026-07-07"))                      # warm the cache
    print(name, "repeat TTFT:", ttft(tpl("2026-07-08")))  # date changed
```

With the date first, the changed date breaks the match at the front, so the repeat request runs prefill on the whole fixed block. With the date last, the fixed block matches and only the tail is recomputed, so the repeat time to first token should drop by a large factor. Then apply the same reorder to one of your production templates and rerun the comparison.

## Check yourself

1. Two prompts are identical except for one token in the middle. How much of the second prompt can hit the cache? Expected answer: only the tokens before the differing token, because the match runs from the first token to the first non-repeated token and nothing after it is reused.
2. Your template is a 15-token greeting with the user's name, then 2,000 fixed tokens, then the question. About how many cached tokens does this ordering throw away per repeat request? Expected answer: about 2,000, since the name breaks the match inside the first 15 tokens and the fixed block behind it is recomputed.
3. Why does moving the user's question from the top to the bottom of the prompt change cost but not what the model sees? Expected answer: the model still receives every token, so the content is unchanged, but the fixed block now forms an unbroken matching prefix and the server skips prefill on it.

## Next steps

- Read the [prefix caching guide](/docs/technical-guides/prefix-caching) for how the cache is stored and evicted on a real server.
- Read the [cost modeling guide](/docs/technical-guides/cost-modeling) to turn your measured hit rate into a per-request cost estimate.
- For the pricing side of the same mechanism, read [Why do API providers charge less for cached input tokens?](/blog/why-cached-input-tokens-cost-less) from this series.

When you can do this, you can restructure a prompt template for maximal prefix reuse and measure the resulting TTFT and cost delta.
