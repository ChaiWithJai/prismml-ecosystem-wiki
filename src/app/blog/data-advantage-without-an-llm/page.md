---
title: "Why do data-rich companies have an AI advantage?"
description: "Models commoditize and datasets do not. Proprietary data compounds in operations and offerings, and the model that uses it can be small and local."
audience: ml-product-team
pillar: end-user-case-study
book: building-ai-products
chapter_ref: "Nika, Ch. 1, competitive-advantage paragraph"
status: draft
last_reviewed: 2026-07-07
---

Data-rich companies have an AI advantage because models commoditize and datasets do not. Proprietary data compounds in two directions, in operations such as forecasting and pricing, and in offerings such as personalization and automation. A local bakery's sales history can feed a modest demand forecast model with no cloud LLM. The defensible thing is the data loop, and the model can be small, local, and boring. {% .lead %}

## Locate the advantage in the data, not the model

Marily Nika makes this point in the opening pages of Building AI-Powered Products. Organizations with a lot of their own data "stand to gain a significant competitive advantage", and she splits that advantage into two directions. The first is operations, where she gives restocking inventory and finding the right price point as examples. The second is offerings, meaning the product itself, where the data supports personalization, recommendations, and automation.

The split is the useful part, because each direction compounds on its own.

- Operations. Your own history predicts your own demand, your own failures, and your own prices. A competitor's model, however large, was not trained on your Tuesdays.
- Offerings. Your users' behavior inside your product teaches the product what to show next, and every session adds rows no one else has.

Notice what is absent from both directions. Neither one says anything about model size. The paragraph is about who owns the rows, not who rents the biggest model. Anyone can call the same frontier API you can, so the API is not an advantage. The rows are.

## Work the bakery example

Here is the worked example, with every number marked for what it is. Take a bakery with three years of point of sale history and 40 products. That is roughly 1,095 days times 40 products, or about 43,800 rows of date, product, and units sold. No other business has these rows.

Now take one product and use illustrative numbers to see what the rows can do. Suppose the croissant costs $1.10 to make and sells for $3.50, so each unsold one loses $1.10 and each missed sale loses $2.40 of margin. Suppose the baker bakes a flat 60 every day, and the history shows a weekday mean of 42 sold and a Saturday mean of 65.

The flat bake count has a derivable cost.

- Weekdays: 60 baked minus 42 sold is 18 wasted per day. Five weekdays times 18 times $1.10 is $99 per week.
- Saturday: 65 wanted minus 60 baked is 5 missed sales, times $2.40 margin, is $12 per week.

That is about $111 per week, or roughly $5,700 per year, on one product. These are illustrative inputs, not benchmarks, but the arithmetic is exact once you plug in your own numbers. The point of the example is what closes the gap. A per product, per weekday average closes most of it. Gradient boosted trees on the full table, with weather and local events joined in, close more. Both run on the shop's own laptop CPU in seconds. No LLM appears anywhere in the loop, and the loop still compounds, because every day of sales makes next week's forecast better.

The offerings direction works from the same table. The bakery can text regulars when the thing they usually buy is about to come out of the oven. That is a lookup over purchase history, not a generative model. If the owner later wants plain language on top, e.g., a drafted weekly supplier order email, a small local model such as [Bonsai 8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf) can do that on the same machine. The language model is a convenience at the edge of the loop. It is not the moat.

## Test whether the advantage is real

The test is one question. Could a competitor replicate this with a bigger model but without our data? If yes, you did not find a data advantage. You found a feature anyone can rent.

Apply it to the bakery. A competitor with a frontier API but no POS history cannot forecast this shop's Saturday croissant demand, because the signal is in rows only this shop has. The advantage passes. Now apply it to "we summarize industry news for our customers with an LLM". A competitor with a bigger model and no data from you produces the same summaries. That fails the test, and no amount of prompt work fixes it.

The test also sizes the model for you. Once the advantage is confirmed to live in the data, pick the smallest model that can extract it, because the model is the replaceable part. Per group averages, linear models, and gradient boosted trees cover most operations uses. The [intelligence density](/docs/concepts/intelligence-density) page covers how to think about capability per unit of compute, and the [cost modeling guide](/docs/technical-guides/cost-modeling) covers what each model class costs to run.

{% callout type="note" %}
A bigger model is not a safer default here. It costs more per prediction, and it does not add rows to your table. When the advantage is the data, extra model capacity past what the data supports is pure spend.
{% /callout %}

## Try it

This is the exercise from the top of the post, and it takes about 25 minutes with no GPU.

1. Take 10 minutes and list datasets your organization uniquely owns. One line each: what it records, roughly how many rows, and since when. "Uniquely owns" excludes anything a competitor can buy or scrape.
2. Pick the one dataset with the most rows and the longest history.
3. Write one operations use for it, meaning a decision your own team makes better with it, e.g., restocking or pricing.
4. Write one product use for it, meaning something a user sees, e.g., a recommendation or an automated step.
5. For each use, name the smallest model class that could exploit it: a group average, a linear model, gradient boosted trees, a small classifier, or a small local language model.
6. Run both uses through the test. Could a competitor replicate this with a bigger model but without our data? Rewrite any use that fails until it passes or admit it is not a data advantage.

If your dataset is tabular sales or usage data, you can get a first baseline in the same sitting:

```bash
python3 -m venv venv && source venv/bin/activate
pip install pandas
python3 - <<'EOF'
import pandas as pd
df = pd.read_csv("sales.csv", parse_dates=["date"])  # columns: date, product, units
df["dow"] = df["date"].dt.day_name()
print(df.groupby(["product", "dow"])["units"].mean().round(1))
EOF
```

That printout is a per product, per weekday demand forecast. It is the zero model baseline that any fancier model has to beat.

## Check yourself

- **Did both of your uses pass the replication test?** Expected answer: yes, and you can say which rows the competitor lacks. If a use passed only because your prompt is clever, it failed.
- **Is your smallest model actually small?** Expected answer: for most operations uses, an average or a tree model, not an LLM. If you wrote "LLM" for a forecasting or pricing use, redo step 5 and justify what the language model adds.
- **What does one more month of data do to each use?** Expected answer: the forecast or recommendation gets measurably better, which is what compounding means here. If more data changes nothing, the advantage is not in the data.
- **What would the bakery's yearly waste be if the weekday mean were 50 instead of 42?** Expected answer: 60 minus 50 is 10 wasted per weekday, times 5 days, times $1.10, is $55 per week, or about $2,860 per year, before the Saturday term.

## Next steps

- Read the [intelligence density](/docs/concepts/intelligence-density) concept page for how to match model capability to the task instead of defaulting to the largest model.
- Use the [cost modeling guide](/docs/technical-guides/cost-modeling) to price the smallest model that passed your test against the API you almost reached for.
- For a case where the generative model was the wrong tool and the data loop was the right one, read [why GenAI is the wrong tool for personalization](/blog/genai-wrong-tool-for-personalization).

When you can do this, you can identify a genuine proprietary data advantage and pair it with a plan for the smallest model that can use it.
