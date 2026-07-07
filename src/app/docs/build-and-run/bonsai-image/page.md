---
title: Bonsai Image 4B Local Demo
status: published
audience: DevRel engineer
owner: Recipe author
source_tier: primary_links
benchmark_status: not_run
last_reviewed: 2026-07-07
---

Bonsai Image 4B is PrismML's small text-to-image model, released in 1-bit and ternary variants under the Apache 2.0 license. This page gives you the official sources, the setup outline, and a measurement checklist, so you can clone the demo, follow its README to generate one image on your own machine, and record what you measured so someone else can reproduce your run. {% .lead %}

{% callout type="warning" title="We have not run this yet" %}
The commands below come from the official sources linked next to them. We have not yet run them on hardware. Steps marked inferred are our best reading of the upstream docs, so follow the demo README where the two disagree.
{% /callout %}

## Check what you need

You need the official demo code and one model file. The demo lives at [PrismML-Eng/Bonsai-image-demo](https://github.com/PrismML-Eng/Bonsai-image-demo) on GitHub, and its README names the supported runtime, the install steps, and the minimum device requirements. The [Bonsai Image 4B announcement](https://prismml.com/news/bonsai-image-4b) describes the model itself. PrismML positions the model for phones, laptops, and browsers, but the exact RAM and OS requirements come from the README.

The model ships in two variants. Pick one before you download anything.

| Variant | File size | How sure are we? |
| --- | --- | --- |
| Ternary | 1.21 GB | Unconfirmed. From a [PrismML X post](https://x.com/PrismML/status/2059339163061940524), not yet checked against the model card. |
| 1-bit | 0.93 GB | Unconfirmed. From a [PrismML X post](https://x.com/PrismML/status/2059339159899390326), not yet checked against the model card. |

We have not yet captured the Hugging Face model card URLs for either variant. The demo README should link them. When you run the demo, note the size on disk of the file you actually downloaded, because that confirms or corrects the figures above.

## Set up and run the demo

The README in the demo repo is the authority for install and run commands. Step 1 is known from the official repo URL. Steps 2 to 4 are inferred, so follow the README where it differs.

```bash
# 1. Clone the official demo (source: repo URL above)
git clone https://github.com/PrismML-Eng/Bonsai-image-demo
cd Bonsai-image-demo

# 2. INFERRED: install dependencies as the README describes
#    (note the exact command and the lockfile or commit you used)

# 3. INFERRED: download the 1-bit or ternary model file
#    from the official model card linked in the README
#    (note the exact filename, its checksum, and its size on disk)

# 4. INFERRED: run the demo and generate one image
#    (note the exact command, your prompt, and the settings)
```

You have succeeded when the demo writes an image file to disk. As a second check, disconnect from the network after the model download and generate another image. If that works, the demo runs fully offline.

## Record your run

Fill in this block while you run the demo, then submit it as a device report.

```markdown
- Date:
- Operator:
- Device:
- OS:
- CPU:
- GPU:
- RAM / VRAM:
- Runtime (from demo README):
- Demo repo commit:
- Model variant: 1-bit / ternary
- Model file + size on disk:
- Prompt:
- Image resolution / steps / settings:
- Time to first image:
- Total generation time:
- Peak RAM / VRAM:
- Offline mode verified: yes/no
- Output image saved at:
```

Two of these numbers are the ones readers ask about first. Time to first image and total generation time are the image equivalents of time to first token and tokens per second in text generation. If the demo reports steps per second, record that too. Peak RAM and VRAM tell the next person whether their device can run the same variant.

## Troubleshoot

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Install fails | The README changed or a dependency drifted. | Re-run from a pinned repo commit and file an issue upstream. Keep the commit hash and the error log. |
| Model does not load | Wrong variant or file for the runtime the demo uses. | Match the runtime compatibility the model card states. Keep the exact filename and error. |
| Generation is slow | The demo fell back to CPU instead of the GPU path. | Confirm the accelerator path in the README and note the hardware flags you set. |
| Works online, fails offline | The runtime fetches an asset at generation time. | Find the fetched asset in your network log, download it ahead of time, and retest. |

## Next steps

- [Record what you measured as a device report](/docs/benchmarks/device-report-schema) so the next person can reproduce your run.
- [Try Bonsai Image in the browser](/docs/build-and-run/bonsai-image-webgpu) if you want the WebGPU path instead of a local install.
- [Run the Bonsai text model with llama.cpp](/docs/build-and-run/bonsai-llamacpp) to compare text and image generation on the same device.

See something wrong? [Fix it](/docs/contribute/contributor-guide).
