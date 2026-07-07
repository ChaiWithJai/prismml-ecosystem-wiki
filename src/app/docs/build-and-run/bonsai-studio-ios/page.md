---
title: Bonsai Studio on iPhone
status: not_run
audience: DevRel engineer
owner: Recipe author
source_tier: discovery
benchmark_status: not_run
last_reviewed: 2026-07-06
---

Bonsai Studio is PrismML's iPhone app for Bonsai Image 4B, a small open-weight image model that generates images on the phone itself. On this page you can install the app, generate one image fully on-device, and measure how long it takes. {% .lead %}

The model itself is well documented. PrismML's official [release post](https://prismml.com/news/bonsai-image-4b) confirms that Bonsai Image 4B exists, ships in 1-bit and ternary variants, and is licensed Apache 2.0, and the [demo repo](https://github.com/PrismML-Eng/Bonsai-image-demo) shows local image generation working in code. The iPhone app is the unverified part. We have not run these steps on hardware yet, so treat each step as a plan to verify, not a confirmed procedure.

{% callout type="warning" title="Unconfirmed source" %}
The only source that describes the Bonsai Studio app is one X post, [PrismML status 2059339168250253731](https://x.com/PrismML/status/2059339168250253731), and X posts are unconfirmed. We have not yet found the App Store link, the supported device list, the minimum iOS version, or the download size in official PrismML or Apple sources. The steps below tell you how to capture them as you go.
{% /callout %}

## Start from the official sources

- [Bonsai Image 4B release post](https://prismml.com/news/bonsai-image-4b). This is the model announcement. Check here first for an official app link.
- [Bonsai Image demo repo](https://github.com/PrismML-Eng/Bonsai-image-demo). This is the reference implementation of local image generation.
- [PrismML home](https://prismml.com/). Scan it for a Bonsai Studio product or app page.
- [Bonsai Studio launch post on X](https://x.com/PrismML/status/2059339168250253731). It says PrismML launched Bonsai Studio for trying Bonsai Image 4B on iPhone with on-device generation. This claim is unconfirmed until an official page says the same.

## Check what you need

You need an iPhone with about 2 GB of free storage. The model itself is small. PrismML describes the ternary variant as 1.21 GB and the 1-bit variant as 0.93 GB, though those numbers come from X posts ([ternary](https://x.com/PrismML/status/2059339163061940524), [1-bit](https://x.com/PrismML/status/2059339159899390326)) and you should confirm them against the release post or model cards before you cite them. The 2 GB figure is our own estimate to cover the model plus the app, not an official requirement.

| Requirement | What we know | Source |
| --- | --- | --- |
| App | Bonsai Studio on iOS. No App Store URL captured yet. | [X post](https://x.com/PrismML/status/2059339168250253731), unconfirmed |
| Device and OS | iPhone. Supported models and minimum iOS version unknown. | [X post](https://x.com/PrismML/status/2059339168250253731), unconfirmed |
| Model | Bonsai Image 4B, 1-bit and ternary variants, Apache 2.0. Whether the app bundles or downloads it is unknown. | [Release post](https://prismml.com/news/bonsai-image-4b), official |
| Free storage | About 2 GB suggested | Our estimate from the size claims above |

## Generate an image on your iPhone

You can do the first three steps from a desk without an iPhone. Steps 4 to 8 need the phone.

1. **Find the official app link.** Check [prismml.com](https://prismml.com/), the [Bonsai Image 4B post](https://prismml.com/news/bonsai-image-4b), and the [@PrismML](https://x.com/PrismML) profile link for an App Store URL. Record the exact URL and the developer name shown on the listing, so you know the app really comes from PrismML.
2. **Capture the App Store details.** From the listing, record the minimum iOS version, download size, supported devices and chips, in-app purchases, and what the privacy label says about data collection. These replace the unknowns in the table above.
3. **Cross-check the model claims.** Confirm the Apache 2.0 license and the 1.21 GB and 0.93 GB file sizes against the [release post](https://prismml.com/news/bonsai-image-4b) and the Hugging Face model cards, not the X thread.
4. **Install and launch.** Install the app on your iPhone and note the model name and chip. Record whether the model weights download inside the app, with size and duration on Wi-Fi, or ship inside the app binary.
5. **Generate one image online.** Use this fixed prompt so runs are comparable across devices:

   ```text
   A bonsai tree on a desk beside a laptop, soft morning light, photorealistic.
   ```

   Record which model variant, 1-bit or ternary, the app used if it shows you the choice.
6. **Verify offline behavior.** Turn on Airplane Mode with Wi-Fi off, force-quit and relaunch the app, and generate a second image with the same prompt. Record whether it works and whether any features degrade. We inferred this check ourselves, because no official page documents the app's offline behavior yet.
7. **Measure.** Record time to first preview and total generation time with a stopwatch or a screen recording. Note how hot the phone gets and how much battery the run uses. Record peak memory if you can get it through Xcode Instruments over USB, and otherwise write "not measured".
8. **Record your run** with the template below.

## Record your run

Fill in this block so someone else can reproduce your run on their own device. The [device report schema](/docs/benchmarks/device-report-schema) explains each field.

```markdown
- Date:
- Operator:
- App Store URL / developer name:
- App version:
- Device (iPhone model, chip):
- iOS version:
- Model variant (1-bit / ternary) and file size:
- Model delivery (bundled / in-app download, size, duration):
- Prompt:
- Time to first preview:
- Total generation time:
- Peak memory (or "not measured"):
- Free storage before/after:
- Offline generation verified: yes/no (Airplane Mode, relaunch)
- Image output: attached / described
```

## Fix common problems

Nobody has tested these fixes yet. They are the failure modes we expect, and the notes tell you what to record if you hit one.

| Symptom | Likely cause | What to record |
| --- | --- | --- |
| App not found on the App Store | Regional availability, TestFlight only, or a renamed listing | Search terms, region, and date. Check the PrismML site and X profile for the official link. |
| Install blocked or crash on launch | Device or OS below the app's minimum | Exact iPhone model, chip, iOS version, and the listing's stated minimum |
| Model download stalls or fails | Large download over cellular, or storage running out | Network type, free storage, and the download size shown in the app |
| Generation fails offline | The app needs a network call despite the on-device claims | A screen recording of the Airplane Mode attempt and any error text |
| Very slow generation or throttling | Older chip, low memory, or background load | Device model, battery level, ambient conditions, and back-to-back run times |

## Next steps

- [Record what you measured](/docs/benchmarks/device-report-schema) in the shared device report format.
- [Run Bonsai Image on a laptop](/docs/build-and-run/bonsai-image) to compare the same model off the phone.

See something wrong? [Fix it](/docs/contribute/contributor-guide).
