---
title: "How many clicks to first inference? Auditing your docs like a funnel"
description: "Treat your quickstart as a conversion funnel: count every click, copy-paste, and decision between landing and a first successful inference, then cut the count."
audience: ml-product-team
pillar: end-user-case-study
book: transcript-theme
chapter_ref: "Theme 4: Time-to-value as the docs metric"
status: draft
last_reviewed: 2026-07-07
---

Treat your quickstart as a conversion funnel: count every click, copy-paste, and decision between landing and a first successful inference, then cut the count like you would cart abandonment. Watching one real end user's first session, where they stall and what they open in another tab, beats any internal review of the same pages. {% .lead %}

## Measure time-to-value, not page views

A conversion funnel is a sequence of steps where some users drop out at each step. E-commerce teams count how many shoppers add an item to the cart and then leave before paying, and they redesign the steps where the most shoppers leave. The theme this post draws on applies the same method to docs. The metric for a quickstart is not how many people viewed the page. The metric is how long a new user takes to get from the docs landing page to a first successful inference, and how many of them give up before it works.

Page views hide the problem. A quickstart with high traffic and a broken step looks healthy in analytics, because analytics counts arrivals and not completions. Time-to-value counts completions. If a user cannot get one working output in their first session, most of them will not come back for a second one.

## Count every step between landing and a working output

Walk your own quickstart and log three kinds of steps.

- A click is any navigation, e.g., following a link, opening a signup form, or switching to another page to find a value the docs assume you have.
- A copy-paste is any command or code block the user must move into a terminal or editor.
- A decision is any point where the docs offer options and the user must pick one, e.g., pip or conda, CPU or GPU, which model size to download.

Decisions are the most expensive kind of step. A click costs seconds. A decision the user is not equipped to make costs minutes, because the user leaves your page to research it, and some never come back. Every fork in a quickstart should either have a stated default or be removed.

## Work the funnel for one quickstart

Here is the arithmetic on a made-up but realistic audit. The counts below are inputs to the method, not measurements of any real project.

Suppose a colleague who has never seen the project walks the quickstart while you log steps. The log shows 14 clicks, 5 copy-pastes, and 3 decisions, and the session takes 21 minutes.

- Creating an account and an API key takes 5 of the 14 clicks and 8 of the 21 minutes, because the user must sign up, verify an email, and return to the docs.
- One copy-paste fails with a missing dependency error, and the fix takes 6 minutes because the user searches for it in another tab.
- One decision, picking a model size, takes 3 minutes because the docs list four sizes with no default.

Now cut the funnel where it loses the most. Removing the key requirement for the first call cuts 5 of 14 clicks, which is about 36 percent of the clicks and 8 of the 21 minutes. Adding the missing dependency to the install command cuts 6 more minutes. Naming a default model size cuts 3 more. The same quickstart now costs 9 clicks and an estimated 4 minutes, and the estimate is marked as one because you have not timed the new version yet. The next session with a fresh user gives you the measured number.

A local-first quickstart is one way to remove the signup step entirely. A model published as open weights, e.g., [Bonsai 8B on Hugging Face](https://huggingface.co/prism-ml/Bonsai-8B-gguf), can be downloaded and run without an account on your service, so the first inference needs no key at all.

{% callout type="note" %}
Watch the user's other tabs. Every time they leave your docs to search for an error, sign up for something, or look up a term, that is a stall your page caused. The tab switches are the funnel exits, and you only see them by watching a session, not by rereading the page.
{% /callout %}

## Watch one real user before you redesign anything

An internal review of a quickstart finds typos. A watched session finds abandonment. The people who wrote the docs cannot stall on them, because they already know which option to pick and which error to ignore. One recorded session with a real end user shows you the three worst stalls in half an hour, and no amount of internal rereading produces that list.

Ask the user to narrate while they work, and do not help them unless they are fully stuck. The places where you want to interrupt and explain are the places the docs must change.

## Try it

Time a first-inference walk. Budget 30 minutes. Recruit a colleague who has never seen the project, or walk it yourself in a clean environment if no one is available. A colleague is better, because you cannot stall on your own docs. No GPU is needed if your quickstart runs a small quantized model on CPU. If your quickstart requires a GPU, log the hardware setup as part of the funnel, because your users pay that cost too.

First, start a timer and a log file.

```bash
date +%s > /tmp/funnel-start
touch /tmp/funnel-log.md
```

Second, walk from your docs landing page to a first successful inference, e.g., the path that starts at [running your first inference](/docs/getting-started/first-inference). Append one line to the log for every click, copy-paste, and decision, and mark every stall with the reason.

```bash
echo "click: opened install page" >> /tmp/funnel-log.md
echo "STALL 4min: pip error, searched fix in new tab" >> /tmp/funnel-log.md
```

Third, stop the timer and compute the totals.

```bash
echo $(( $(date +%s) - $(cat /tmp/funnel-start) )) seconds
grep -c "click" /tmp/funnel-log.md
grep "STALL" /tmp/funnel-log.md
```

Fourth, rank the three longest stalls and write one proposed cut next to each, e.g., "add the dependency to the install command" or "state a default model size".

## Check yourself

1. What were your numbers? Expected answer: a click count and a minute count, e.g., "14 clicks and 21 minutes to first inference". If you have no numbers, you reviewed the docs instead of walking them, so run the session again with the log open.
2. Which single step cost the most time, and what fraction of the total was it? Expected answer: a named step with derived arithmetic, e.g., "account and key setup took 8 of 21 minutes, which is about 38 percent".
3. Why does a decision cost more than a click? Expected answer: a click takes seconds, but a decision without a stated default sends the user off the page to research options, and some users never return.

## Next steps

- [Running your first inference](/docs/getting-started/first-inference) is the funnel this post asks you to walk and time.
- [Who is your developer ecosystem actually for?](/blog/who-is-your-developer-ecosystem-for) shows how to check whether the docs you audit serve the segment you say you want.

When you can do this, you can instrument a docs funnel with click and time metrics and identify the top abandonment points.
