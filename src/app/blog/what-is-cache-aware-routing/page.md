---
title: "What is cache-aware routing and why does round-robin load balancing hurt LLM latency?"
description: "Routing by load alone throws away prefix caches. A returning conversation lands on a replica that never saw its history and pays full prefill. Route it back."
audience: inference-engineer
pillar: ecosystem-player
book: inference-engineering
chapter_ref: "Ch. 5, sec. 5.3.3 (p. 140)"
status: draft
last_reviewed: 2026-07-07
---

With multiple replicas, routing purely by load throws away prefix caches. A returning conversation lands on a replica that has never seen its history and pays full prefill. Sticky, cache-aware routing sends it back to the replica holding its KV cache, so the request is faster and cheaper. Once caching matters, the load balancer is part of the inference stack. {% .lead %}

## See why the load balancer breaks your cache

Prefix caching stores the keys and values for tokens the server has already processed, so a repeat prefix skips prefill. The catch is that the cache lives in the memory of one replica. Replica A can hold the KV cache for a conversation, and replica B knows nothing about it.

A round-robin or least-loaded balancer does not know this. It picks a replica by request count or by load, so a multi-turn conversation bounces between replicas. Turn 1 lands on replica A and builds a cache there. Turn 2 lands on replica B, which has no cache for that history, so it runs prefill on the whole conversation from token one. The cache on replica A sits unused and is later evicted.

Kiely covers this in Inference Engineering (Ch. 5, sec. 5.3.3). In production there will be multiple replicas, and traffic is usually routed by how busy each replica is. His fix is that a user in a long chat "should have their request routed to the same replica whenever possible" so the request gets a cache hit. Figure 5.10 in the book shows a router that assigns each request to the instance already holding its cached prefix instead of splitting traffic evenly.

## Count what a bounced conversation costs

Here is a worked example. The numbers describe the arithmetic, not a benchmark.

Suppose a chat is at turn 5 and its history is 4,000 tokens, and the new user message is 100 tokens.

- Sticky routing sends turn 5 to the replica that served turns 1 through 4. The 4,000 history tokens match the cached prefix, so prefill runs on about 100 tokens.
- Load-based routing sends turn 5 to a cold replica. Prefill runs on all 4,100 tokens.

The cold replica does about 41 times the prefill work for the same answer, and time to first token grows with that work. With two replicas and random routing, each turn has a 1 in 2 chance of landing cold, so on average half your turns pay the full prefill. Multi-turn chat is the worst case for this, because the whole history is resent every turn and the resent part is exactly the part a warm replica could skip.

There is a second option in the same section of the book. You can put the KV cache on shared networked storage so every replica can load any cached sequence. Kiely notes that routing still helps there, because reading a cache from a replica's own VRAM is faster than reading it over the network. A shared cache mostly protects you when replicas restart or scale down, since the cached sequences survive the node.

## Accept the trade-off you are making

Sticky routing gives up some load balance. If one conversation is very heavy, or a hash sends too many sessions to one replica, that replica can run hot while another sits idle. Production routers such as the ones in NVIDIA Dynamo and in gateway projects for vLLM weigh both signals, and they prefer the replica with the cached prefix unless its load is too high. The version you will build below is the simple form: pure stickiness by conversation ID, which is enough to measure the effect.

{% callout type="note" %}
Session stickiness also interacts with autoscaling. When a replica is added or removed, a plain hash reassigns many sessions and their caches go cold. Consistent hashing limits the reshuffle to the sessions on the changed replica.
{% /callout %}

## Try it

You can measure this in under 30 minutes with two llama.cpp servers on one machine. No GPU is needed. An 8B model at 4-bit takes about 6 GB of memory per server, so you need about 12 GB free, and slow CPU prefill makes the difference easier to see.

Start two backends with [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf):

```bash
brew install llama.cpp
llama-server -hf prism-ml/Bonsai-8B-gguf --port 8081 &
llama-server -hf prism-ml/Bonsai-8B-gguf --port 8082 &
```

Then run this proxy. It hashes a conversation ID from a header to one of the two backends, and a `sticky=0` query flag switches it to random routing for the comparison:

```python
import hashlib, random
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.request import Request, urlopen

BACKENDS = ["http://localhost:8081", "http://localhost:8082"]

class Proxy(BaseHTTPRequestHandler):
    def do_POST(self):
        conv = self.headers.get("X-Conversation-Id", "none")
        if "sticky=0" in self.path:
            backend = random.choice(BACKENDS)
        else:
            i = int(hashlib.sha256(conv.encode()).hexdigest(), 16) % len(BACKENDS)
            backend = BACKENDS[i]
        body = self.rfile.read(int(self.headers["Content-Length"]))
        req = Request(backend + "/v1/chat/completions", data=body,
                      headers={"Content-Type": "application/json"})
        resp = urlopen(req).read()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(resp)

HTTPServer(("localhost", 8080), Proxy).serve_forever()
```

Now simulate a two-turn conversation against the proxy. Send turn 1 with a long system prompt of a few thousand tokens and a conversation ID header, then send turn 2 with the same history plus one new message, and time how long the response takes to start. Run the pair about 20 times in sticky mode and 20 times with `?sticky=0`, with a fresh conversation ID each pair. In sticky mode turn 2 always lands on the warm backend. In random mode it lands cold about half the time, so its average turn-2 time to first token should be clearly higher. Your exact numbers depend on your machine, so measure rather than assume.

Also state the trade-off you accepted. With pure hashing, nothing stops many active conversations from hashing to the same backend, so you traded even load for cache hits.

## Check yourself

1. Two replicas serve a chatbot behind a least-loaded balancer with prefix caching enabled on each replica. Why is the measured cache hit rate low even though users have long conversations? Expected answer: the cache is per replica and the balancer moves each turn to whichever replica is less busy, so turns often land on a replica that never processed that conversation's history.
2. A turn arrives with 6,000 tokens of history and a 150-token new message. How many tokens does prefill process on the warm replica versus a cold one? Expected answer: about 150 on the warm replica, since the history matches the cached prefix, and 6,150 on a cold one.
3. What does sticky routing give up, and how do production routers limit the damage? Expected answer: it gives up balanced load, since sessions can pile onto one replica. Production routers use cache location as one signal and fall back to a less loaded replica when the sticky target is too busy.
4. When does a shared networked KV cache help more than routing alone? Expected answer: when replicas restart or autoscale away, because the cached sequences survive on shared storage, while a per-replica cache dies with its node.

## Next steps

- Read the [prefix caching guide](/docs/technical-guides/prefix-caching) for how the per-replica cache is built and evicted.
- Read the [autoscaling guide](/docs/technical-guides/autoscaling) for what scaling events do to sticky sessions and warm caches.
- For the prompt-side half of the same mechanism, read [How should I order my prompt to maximize prefix cache hits?](/blog/prompt-ordering-for-prefix-cache-hits) from this series.

When you can do this, you can implement session-sticky routing and quantify its TTFT benefit for multi-turn traffic.
