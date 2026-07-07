---
title: Page Types, Front Matter, and Contribution Templates
status: source_checked
audience: Page owner
owner: DevRel maintainer
source_tier: internal_note
benchmark_status: not_applicable
last_reviewed: 2026-07-06
---

Every page in this wiki is one of seven page types, and each type comes with a fixed front matter block and a template. Use this page to pick the type for a page you are about to write, copy the matching front matter, and fill in the ownership fields before you publish. {% .lead %}

## Pick a page type

A page type says what job a page does for the reader. A page holds exactly one type. If your draft mixes two, e.g., a concept explanation that also walks through install commands, split it into two pages.

For example, "Bonsai 8B with llama.cpp" is a runtime recipe. It exists so a reader can run the model, so it must list the device, the runtime, the install steps, the exact command, and the output the reader should expect. See [/docs/build-and-run/bonsai-llamacpp](/docs/build-and-run/bonsai-llamacpp) for the reference shape. A recipe that no reviewer has run yet says so in plain words on the page, e.g., "These commands come from the upstream docs; we have not yet run them on hardware."

| Page type | Use when | Required content |
| --- | --- | --- |
| Orientation | A reader needs context before choosing a task. | Audience, prerequisite knowledge, map location, next three links. |
| Concept guide | A technical idea needs an explanation independent of one vendor. | Definition, why it matters, tradeoffs, diagrams, canonical sources, related recipes. |
| Runtime recipe | A reader should be able to run something. | Device, OS, runtime, model, install steps, command, expected output, troubleshooting, benchmark notes. |
| Ecosystem entry | A project needs a stable place in the map. | Official URL, layer, contribution, install status, benchmark status, source tier, owner. |
| Benchmark report | A result should be comparable over time. | Model, runtime, device, prompt set, metrics, raw logs, date, reproduction notes, caveats. |
| DevRel playbook | A team needs a repeatable community workflow. | Goal, audience, trigger, artifacts, owner, feedback loop, success metric. |
| Source note | A social or news signal needs triage before it becomes canonical. | Discovery URL, source tier, claim, primary-source fallback, status, next action. |

## Copy the front matter

Front matter is the YAML block at the top of each page file. Readers never see it. Maintainers and tooling use it to filter, review, and refresh pages by field. Start every new page from this example and change the values.

```yaml
title: "Bonsai 8B with llama.cpp"
page_type: "runtime_recipe"
audience: ["devrel_engineer", "developer_advocate"]
ecosystem_layer: ["runtime_serving", "compression_formats"]
status: "draft" # seed | draft | verified | canonical | needs_review | retired
owner: "unassigned"
last_reviewed: "2026-07-06"
source_tier: "primary_confirmed"
benchmark_status: "not_run"
supported_runtimes: ["llama.cpp"]
supported_devices: ["apple_silicon", "linux_cuda"]
claim_matrix: "./benchmarks/claim-source-matrix.md"
related_pages:
  - "../ecosystem-map/prismml.md"
  - "../concepts/kv-cache.md"
```

Follow these field rules:

- `ecosystem_layer` lists exactly one primary layer. Add secondary layers only when they help contributors route work.
- `source_tier` uses the tiers defined in the [source policy](/docs/sources/source-policy). The tiers are primary confirmed, primary social, secondary technical, secondary social, and internal note.
- `benchmark_status` is one of `not_run`, `partial`, `reproducible`, `published`, or `not_applicable`. A result stays `partial` until another reviewer repeats it.
- `owner` is a role from the operating model, e.g., Page owner or Benchmark owner. It is never "unassigned" at publication.

## Fill the owner block

The owner block is a short checklist near the top or bottom of each maintained page. It records who maintains the page and where it sits in the maintenance workflow, which the front matter deliberately does not track. Copy it as is and fill in each line.

```markdown
## Page ownership

- Page owner:
- Reviewer:
- Source owner:
- Primary supply chain layer:
- Benchmark owner, if any:
- Last source check:
- Last runnable check:
- Next refresh:
- Current status: draft | source checked | runnable checked | published | refresh due | quarantined
```

Every published page needs a named page owner and a named reviewer. One person can hold both roles on different pages, but not on the same page.

## File an intake card

An intake card is a short form you file before starting any new page, recipe, benchmark, source update, or ecosystem entry. It forces two decisions up front. You define the acceptance test before work starts, and you name a primary source for every product claim. A claim with no primary source is rejected or quarantined at intake. Quarantined means the claim is held out of published pages until someone finds a primary source for it.

```markdown
### Intake card

- Title:
- Work type: page | recipe | benchmark | source update | ecosystem entry
- Target page:
- Supply chain layer:
- Contributor:
- Page owner:
- Reviewer:
- Source owner:
- Source state: primary | discovery only | mixed | unsourced
- Expected output:
- Acceptance test:
- Open questions:
- Publish blocker:
```

## Use the three status vocabularies correctly

The wiki runs three separate status vocabularies on purpose. Each one answers a different question, and mixing them hides risk. For example, a page can be trustworthy as a whole (`verified` in front matter) while one new claim on it is still `discovery`. If both facts shared one label, you could not see the risky claim.

| Vocabulary | Lives in | Question it answers |
| --- | --- | --- |
| Page lifecycle (`seed`, `draft`, `verified`, `canonical`, `needs_review`, `retired`) | Front matter `status` | Is this page trustworthy as a whole? |
| Operational state (`draft`, `source checked`, `runnable checked`, `published`, `refresh due`, `quarantined`) | Owner block `Current status` | Where is this page in the maintenance workflow? |
| Uncertainty labels (`discovery`, `partial`, `not verified`, `stale`, `quarantined`) | Inline on claims and recipes | Can this specific claim or command be trusted? |

The three vocabularies connect through gates:

- **Claims gate the owner block.** A page cannot reach `source checked` while any claim on it is `discovery` or `stale`. It cannot reach `runnable checked` while a recipe on it is `not verified`. If any claim is `quarantined`, the whole page stays `quarantined` until you remove the claim.
- **The owner block gates the front matter.** `verified` in front matter requires `source checked`, and for recipes it also requires `runnable checked`. `canonical` requires `published` plus maintainer review. `refresh due` in the owner block maps to `needs_review` in front matter.
- **Promotion is never automatic.** Fixing one stale claim does not promote a page on its own. Promotion always goes through the reviewer named in the owner block.

{% callout type="warning" title="Do not invent status values" %}
Tools and reviewers filter on these exact strings. A page marked `checked` or `done` is invisible to the review queue. Copy values verbatim from the tables above.
{% /callout %}

## Next steps

- Read the [source policy](/docs/sources/source-policy) to learn how source tiers are assigned before you fill in `source_tier`.
- Check the [claim and source matrix](/docs/prismml/claim-source-matrix) to see how claims are traced to primary sources.
- Return to the [contributor guide](/docs/contribute/contributor-guide) for the overall contribution workflow.
