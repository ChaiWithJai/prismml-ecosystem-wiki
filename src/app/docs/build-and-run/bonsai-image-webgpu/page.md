---
title: Bonsai Image In The Browser (WebGPU)
status: not_run
audience: DevRel engineer
owner: Recipe author
source_tier: primary_links
benchmark_status: not_run
last_reviewed: 2026-07-06
---

Bonsai Image 4B is PrismML's small image generation model, and it can run entirely inside a WebGPU browser with no server. On this page you can load the official demo, generate one image on your own machine, and record how it performed. {% .lead %}

{% callout type="warning" title="Not yet run on hardware" %}
The steps below come from the official announcement and demo repo, but we have not yet run them on a machine. Where a step is a guess, we say so. Do not cite numbers from this page in talks or posts until someone records a run.
{% /callout %}

## Check that your browser has WebGPU

You need a browser with WebGPU enabled and a GPU that the browser can see. Open the browser's GPU status page, e.g., `chrome://gpu` in Chrome, and check that WebGPU is not disabled. This check is general practice, not a PrismML instruction. The exact browsers and minimum versions the demo supports are not confirmed yet, so check the [demo repo README](https://github.com/PrismML-Eng/Bonsai-image-demo) for the current list.

The model comes in two variants. The release thread on X described a 1-bit variant at 0.93 GB and a ternary variant at 1.21 GB, both under an Apache 2.0 license. These three facts come from X posts and are unconfirmed until someone checks them against the model card and the repo LICENSE. The minimum VRAM the demo needs is not documented anywhere yet. If you are unsure, start with the smaller 1-bit variant.

## Run the demo

1. Open the official demo. Start from the [Bonsai Image 4B announcement](https://prismml.com/news/bonsai-image-4b), and if PrismML hosts a live demo, use it for your first run and note its URL. Otherwise use the [demo repo](https://github.com/PrismML-Eng/Bonsai-image-demo).
2. If the repo needs a local build, take the exact commands from its README. A typical path for a static WebGPU demo looks like this, but we have not confirmed it against the repo:

```bash
# INFERRED, replace with the exact commands from the demo repo README
git clone https://github.com/PrismML-Eng/Bonsai-image-demo
cd Bonsai-image-demo
npm install
npm run dev
```

3. Generate one image. Use the same prompt across runs so results are comparable between machines.
4. Reload the page with the network disabled and generate a second image. This tests whether the demo works offline once the model is cached.

You have succeeded when an image appears in the browser and the network panel shows no inference request leaving your machine.

## Record what you measured

Copy this block, fill it in during your run, and save it as a device report.

```markdown
- Date:
- Operator:
- Device:
- OS:
- GPU (as reported by the browser, e.g. chrome://gpu):
- RAM / VRAM:
- Browser + exact version:
- WebGPU status (enabled by default / flag required):
- Demo commit or hosted demo URL:
- Model variant (1-bit / ternary) and file size on disk or in cache:
- Prompt:
- Image output (resolution, saved file):
- Model load time (cold):
- Model load time (warm / cached):
- Time to first image (TTFI):
- Per-image latency after warmup:
- Peak browser tab memory (task manager):
- Offline behavior after first load: yes/no
```

The load times matter most, because on the browser path most of the wait is the model download. Also note the file size you actually downloaded, so we can confirm or correct the 0.93 GB and 1.21 GB figures from the release thread.

## Fix common problems

If WebGPU is unavailable, your browser may be too old, your GPU may be blocklisted, or a flag may be required. Update the browser, check the GPU status page, and note any flag you had to set.

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Model download stalls or fails | Large file over a slow network, or a host issue | Retry, and record the model URL and file size from the network panel |
| Tab crashes during generation | Not enough GPU memory for the chosen variant | Switch to the smaller 1-bit variant and note your VRAM |
| Slow generation on capable hardware | The browser fell back to a software path | Check which adapter the browser selected on the GPU status page |

## Next steps

- [Device report schema](/docs/benchmarks/device-report-schema). Turn your filled-in record into a device report others can compare against.
- [Bonsai with llama.cpp](/docs/build-and-run/bonsai-llamacpp). The reference recipe for running the text model locally.
- [Runtime map](/docs/build-and-run/runtime-map). See every other way to run the Bonsai family.

See something wrong? [Fix it](/docs/contribute/contributor-guide).
