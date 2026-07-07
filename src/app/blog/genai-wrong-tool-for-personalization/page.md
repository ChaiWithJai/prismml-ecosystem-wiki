---
title: "When is GenAI the wrong tool for personalization?"
description: "Recommendation is mostly traditional AI. Embedding lookups and rankers cost orders of magnitude less than generation, so a 'for you' feed rarely needs an LLM."
audience: inference-engineer
pillar: end-user-case-study
book: building-ai-products
chapter_ref: "Nika, Ch. 1, 'Personalized media' subsection"
status: published
last_reviewed: 2026-07-07
---

GenAI is the wrong tool when the job is ranking, because recommendation is largely traditional AI. Embedding lookups and rankers cost orders of magnitude less than generation, and a Netflix style "for you" feed does not need an LLM in the request path. GenAI adds new content around the feed. It does not replace the recommender, and for a feed the architecture choice dominates cost, because a 1 GB embedding service autoscales on CPUs where an LLM ranker keeps a GPU busy per request. {% .lead %}

## Read what the book actually claims

Marily Nika lists "Personalized media" under GenAI in Building AI-Powered Products (Ch. 1). She writes that platforms such as Netflix and Spotify use AI to suggest shows and music that match user preferences. It is easy to read that as "the feed is GenAI now", but the same chapter blocks that reading. Nika writes that GenAI "does not replace the tasks handled by traditional AI" and instead opens new dimensions (Ch. 1).

The suggestion engine itself is the traditional part. It learns patterns from watch and listen history and picks items from a fixed catalog. Nothing is generated. The GenAI dimensions sit around that engine, e.g., a generated description of a playlist, generated artwork for a row of titles, or Spotify's AI DJ speaking between songs. So a music app has both kinds of AI in it, and an inference engineer should serve them very differently. The rest of this post works out why.

## Work the arithmetic on ranking one feed

Take one feed request: rank 1,000 candidate items for one user. Compare a standard embedding recommender against an LLM asked to do the ranking. All numbers below are derived from parameter counts, not measured, so treat them as estimates of scale rather than benchmarks.

Option A is the embedding path.

- The 1,000 item vectors were computed offline in a nightly batch, so they cost nothing at request time.
- Embedding the user profile with a 100M parameter model over a 200 token profile takes about 2 operations per parameter per token, so about 40 billion operations. You can cache this vector, because a profile changes on the scale of hours, not requests.
- Scoring is 1,000 dot products over 768 dimensions, about 1.5 million operations.

The whole request costs about 40 billion operations on a cold profile, and almost nothing on a cached one.

Option B is an LLM ranker such as [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf). You put the 200 token profile and 1,000 item titles at about 15 tokens each into the prompt, about 15,200 tokens. Prefill on an 8B model costs about 2 operations per parameter per token, so about 243 trillion operations, plus decode for the ranked list.

Divide the two. 243 trillion over 40 billion is about 6,000, so the LLM ranker spends roughly three to four orders of magnitude more compute per request, and the gap grows with profile caching. The LLM also returns text, so you must parse the ranking back out and handle the case where it names an item that is not in the candidate list. The embedding path returns scores by construction.

## Size the serving footprint

The compute gap turns into an architecture gap. Work out the memory for the embedding service. A 250,000 item catalog at 768 dimensions and 4 bytes per value is about 768 MB. The whole scoring service, vectors included, fits in about 1 GB of RAM on a CPU node. When traffic doubles you add another cheap replica, and [batching](/docs/technical-guides/batching) the dot products is straightforward because they have no sequential dependency.

The LLM ranker needs the 8B model resident, about 16 GB at 16 bit or about 5 GB quantized, plus KV cache for a 15,200 token prompt per in-flight request. That means a GPU per replica and a much higher floor cost, and scaling means adding GPUs. The [cost modeling](/docs/technical-guides/cost-modeling) guide walks through turning these footprints into a per request price. Run that model per 1,000 users and the embedding path should come out at least an order of magnitude cheaper on any current pricing, because the compute ratio above is three to four orders of magnitude before serving overheads.

Use the LLM where generation is the job, e.g., writing the one line reason a title was picked for you. That call can run async, cached per title, off the feed's latency path.

## Try it

This takes about 20 minutes on a laptop CPU. No GPU is needed, and the model download is under 100 MB.

1. Install a local embedding model:

   ```bash
   pip install sentence-transformers
   ```

2. Embed 20 items and one user profile, then rank by cosine similarity:

   ```python
   from sentence_transformers import SentenceTransformer, util

   model = SentenceTransformer("all-MiniLM-L6-v2")
   items = [
       "gritty crime drama set in 1970s New York",
       "lighthearted baking competition series",
       "documentary about deep sea creatures",
       # ... add 17 more one-line descriptions
   ]
   profile = "watches slow-burn crime dramas and true crime documentaries"
   item_vecs = model.encode(items)
   user_vec = model.encode(profile)
   scores = util.cos_sim(user_vec, item_vecs)[0]
   for score, item in sorted(zip(scores, items), reverse=True)[:5]:
       print(f"{score:.3f}  {item}")
   ```

3. Sanity check the top five against your intuition. The crime drama should beat the baking show for this profile.
4. Time the script end to end, then estimate what the same ranking costs through an LLM API at 15 tokens per item plus your profile, using the prices on your provider's page.

## Check yourself

- **Roughly how much more compute does an 8B LLM ranker spend per feed request than the embedding path above?** Expected answer: about three to four orders of magnitude. The derived figures were about 243 trillion operations against about 40 billion, and the embedding side drops further with profile caching.
- **Your product team says "Netflix uses GenAI for personalization, so our feed should too." What is the correct split?** Expected answer: the feed ranking is traditional AI over embeddings, and GenAI adds content around it, e.g., generated descriptions or artwork, ideally off the latency path.
- **Why does the embedding recommender autoscale more cheaply than the LLM ranker?** Expected answer: the whole scoring service fits in about 1 GB of RAM and runs on CPU replicas, while the LLM needs a GPU per replica with gigabytes of weights and KV cache resident.
- **Can you estimate cost per 1,000 users for both paths?** Expected answer: yes, by multiplying tokens per request by your provider's prices or by using the compute ratio, and the gap should be at least an order of magnitude in favor of embeddings.

## Next steps

- Read the [batching](/docs/technical-guides/batching) guide, because offline item embedding is a bulk workload with different tradeoffs from the live scoring path.
- Read the [cost modeling](/docs/technical-guides/cost-modeling) guide to turn the operation counts above into a per request price for your own traffic.
- For how the two embedding workloads in this design differ in serving, read [serving embeddings in bulk versus live](/blog/serving-embeddings-bulk-vs-live).

When you can do this, you can prototype an embedding-based recommender and quantify its cost advantage over generative ranking.
