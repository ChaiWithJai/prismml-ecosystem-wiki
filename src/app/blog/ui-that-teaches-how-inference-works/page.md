---
title: "What if your UI taught users how inference works?"
description: "Showing retrieval, prefill, and decode as visible stages turns the chat window into a systems lesson, and the same visibility doubles as an audit record."
audience: ml-product-team
pillar: end-user-case-study
book: transcript-theme
chapter_ref: "Theme 5: The visible inference surface as an education channel"
status: published
last_reviewed: 2026-07-07
---

Show retrieval, prefill, and decode as separate visible stages in your chat window. A user who can see the stages learns how the system works and starts to debug retrieval quality without filing a ticket. For a compliance team the same visibility is an audit record, because it shows what data touched the answer. The UI is an underused education channel. {% .lead %}

## Treat the chat window as a lesson, not a curtain

Most AI products hide the pipeline behind a spinner. The user types a question, watches a dot pulse for twenty seconds, and gets an answer. When the answer is wrong or slow, the user has one theory, which is that the AI is bad. The transcripts behind Theme 5 show a different pattern in teams that expose the stages. When the window says "searching your documents", then "reading 4 passages", then streams the answer, users form a correct model of the system within a few sessions. They stop reporting "the AI hallucinated" and start reporting "it pulled the wrong document", which is a bug someone can fix.

The design pattern is called progressive disclosure. In plain words, everyone sees a simple view, one click opens a detailed view, and a settings toggle opens an expert view. Each layer should answer a specific question a user actually asks.

- Layer one, visible to everyone: the current stage and its elapsed time. This answers "is it stuck?" and "why is it slow?".
- Layer two, one click on the finished answer: the retrieved passages with their sources, and the time each stage took. This answers "why this answer?" and "what data touched this?".
- Layer three, an expert toggle in settings: token counts for the prompt and the answer, the split between prefill and decode time, and the exact model file and version. This answers "why does cost grow with context?" and gives an auditor the record they need.

If a layer does not answer a named user question, cut it. A wall of internals teaches nothing.

## Work through what the stages reveal

Here is the arithmetic for one question in a document chat app running [Bonsai 8B in GGUF format](https://huggingface.co/prism-ml/Bonsai-8B-gguf) at 4-bit on a laptop with no GPU. Every number below is an estimate derived from the setup, not a measurement, so label it the same way in your own sketch.

- The prompt: a 200 token system prompt, a 100 token question, and 4 retrieved passages of 500 tokens each. Total: 2,300 prompt tokens.
- Retrieval: embed the question and search the index, roughly 0.3 seconds.
- Prefill: at an estimated 250 prompt tokens per second on a laptop CPU, 2,300 tokens take about 9 seconds.
- Decode: a 300 token answer at an estimated 12 tokens per second takes about 25 seconds.

Total, about 34 seconds. With only a spinner, the user experiences 34 bad seconds and blames the model. With layer two open, the user sees that 9 seconds went to reading the retrieved passages and that 2,000 of the 2,300 prompt tokens are retrieved context. A user who sees that can act on it. Dropping to 2 passages cuts the prompt to 1,300 tokens, so prefill falls to about 5 seconds, and the user made that trade themselves. The stage display taught them the lesson that prefill cost scales with context length, which is the same lesson the [prefill and decode concept page](/docs/concepts/prefill-decode) teaches in prose.

The compliance reading of the same screen is different but uses the same data. Layer two lists exactly which passages entered the prompt, so a reviewer can answer "what data touched this answer?" for any logged conversation. The [regulated deployment case study](/docs/case-studies/regulated-deployment) shows a team that passed an internal review with this display, because the audit feature was already built for end users.

{% callout type="note" %}
Show measured times, never estimated ones. The runtime reports real per-stage timings on every request, so the display costs you no extra instrumentation. An estimated number shown as a measurement will be wrong on the user's hardware, and users notice.
{% /callout %}

## Map every element to the question it answers

Before you build anything, write the mapping as a table. The transcripts show that teams who skip this step ship debug panels, and users ignore debug panels because no question of theirs is answered there. The test for each element is that you can name the user question in the user's own words.

1. "Is it stuck?" is answered by the stage name and a live elapsed time.
2. "Why is it slow?" is answered by per-stage timing on the finished answer.
3. "Why this answer?" is answered by the retrieved passages with source names.
4. "What data touched this?" is answered by the same passage list plus the model version, kept in the conversation log.
5. "Why does a long document cost more?" is answered by the token counts next to the timings.

Questions 3 and 4 are answered by one element read by two audiences. That overlap is the point of the theme. You do not build an education feature and an audit feature. You build one honest display.

## Try it

This takes about 25 minutes. No GPU is needed, and the commands run on CPU. The inference step gives you real timings to put in your sketch.

1. Download the model and start a local server, following the [first inference guide](/docs/getting-started/first-inference):

   ```bash
   pip install -U "huggingface_hub[cli]"
   hf download prism-ml/Bonsai-8B-gguf --local-dir ./bonsai
   llama-server -m ./bonsai/<model-file>.gguf --port 8080
   ```

2. Send one request with a long pasted paragraph as context and read the timing fields in the response:

   ```bash
   curl -s http://localhost:8080/completion \
     -d '{"prompt": "Context: <paste two paragraphs> Question: summarize this.", "n_predict": 200}' \
     | python3 -c "import json,sys; t=json.load(sys.stdin)['timings']; print(t)"
   ```

   The `timings` object separates prompt processing from generation. Those are your prefill and decode numbers.

3. Sketch the three layers for your own AI feature on one page. For each layer, write the elements it shows and, next to each element, the user question it answers in the user's words.
4. Check the sketch against your logs or support tickets. Every frequent question of the form "why did it..." should map to some layer. If one does not, add the element that answers it.

## Check yourself

- **A user complains that answers about one topic are always wrong. Which layer do they open, and what do they find?** Expected answer: layer two. They read the retrieved passages and see whether the right documents were pulled. If the passages are off topic, the problem is retrieval, not the model, and the user can say so in their report.
- **Your prefill time doubles after a release. Which displayed number explains it without opening a profiler?** Expected answer: the prompt token count in layer three. If tokens doubled, someone added context, e.g., more retrieved passages. The [prefill and decode page](/docs/concepts/prefill-decode) explains why prefill time tracks prompt length.
- **An auditor asks what data produced an answer from last March. What must the UI have logged for you to answer?** Expected answer: the layer two contents for that conversation, meaning the retrieved passages with sources and the model file and version. Live timings alone do not answer the question.

## Next steps

- Read the [prefill and decode concept page](/docs/concepts/prefill-decode) so the stage names in your UI match the docs your expert users will find.
- Read the [regulated deployment case study](/docs/case-studies/regulated-deployment) to see the audit reading of a stage display during a real review.
- For what to do when the timings look fine but users still call the app slow, see [inference is fast but the app feels slow](/blog/inference-fast-but-app-feels-slow).

When you can do this, you can design a staged disclosure of inference internals in which each layer answers a named user question and covers a named audit need.
