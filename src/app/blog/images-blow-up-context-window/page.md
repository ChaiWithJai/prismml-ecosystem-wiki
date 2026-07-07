---
title: "Why do images blow up my LLM's context window?"
description: "A high-resolution image adds roughly a thousand visual tokens, so VLM optimization is mostly a long-context and KV cache problem. LLM techniques transfer."
audience: inference-engineer
pillar: foundational-concept
book: inference-engineering
chapter_ref: "Ch. 6, sec. 6.1 (pp. 156-158)"
status: draft
last_reviewed: 2026-07-07
---

A single high-resolution image adds roughly a thousand visual tokens to the input sequence. So most vision language model optimization is a long-context and KV cache problem. Once you treat images as bulk tokens, your LLM playbook transfers directly, e.g., a quantized KV cache works the same way on image tokens as on text tokens. {% .lead %}

## See where the tokens come from

A vision language model is two modules. One is a standard large language model. The other is a small vision encoder that cuts an image into patches and converts each patch into an image token. The encoder is tiny next to the language model. Kiely's Inference Engineering (Ch. 6, sec. 6.1) gives Mistral Large 3 as an example, where the vision encoder is two billion parameters next to a 673B language model.

After encoding, the image tokens enter the input sequence next to your text tokens and flow through prefill and decode like any other tokens. Kiely's rule of thumb is that a high-resolution image "adds about a thousand visual tokens to the input sequence" (Ch. 6, sec. 6.1). A typical chat turn is a few hundred text tokens, so one image can outweigh all the text in the request.

The context window does not care that the tokens came from pixels. Every image token takes a sequence position, gets attended to on every decode step, and holds a slot in the KV cache until the request finishes.

## Count what one image costs

Here is a worked example. The model config is an example, not a benchmark. Take an 8B language model with 32 layers, 8 KV heads, a head dimension of 128, and an FP16 KV cache. Each token stores a key and a value in every layer:

- Bytes per token = 2 (key and value) x 32 layers x 8 heads x 128 dims x 2 bytes = 131,072 bytes, which is 128 KB.
- One high-resolution image at about 1,000 tokens = about 128 MB of KV cache.
- A request with 4 images and 200 text tokens = about 4,200 input tokens and about 525 MB of KV cache, for one request.

Prefill cost grows the same way. The 4,200-token request runs prefill on 21 times more tokens than the 200-token text version of the same question, so time to first token grows with it. This is why a chat app that feels fast on text can stall the moment a user attaches screenshots.

Video is the extreme case. Kiely works the numbers in sec. 6.1.1: cinematic video is 24 frames per second, so at about 1,000 tokens per frame, a four-second clip approaches 100,000 input tokens. No one serves that raw, which is why the book calls downsampling practically obligatory for video.

## Reuse your LLM playbook

Kiely's point in sec. 6.1 is that the primary VLM optimization challenge is the longer input sequence and the larger KV cache, and that every technique from the long-context chapter applies:

- [KV cache quantization](/docs/technical-guides/kv-cache) cuts the memory that those thousand tokens per image hold, e.g., FP8 halves the 128 MB above.
- [Prefix caching](/docs/technical-guides/prefix-caching) reuses the stored keys and values for an image across turns, so a multi-turn chat about one screenshot pays its prefill once.
- Disaggregated prefill moves the image-heavy prefill work to separate workers that scale on their own, so long image requests do not stall decode for everyone else.

One thing differs from text serving. Vision encoders vary a lot across models, so runtime support is more fragmented than for plain LLMs. Check that your serving framework supports your exact model before you plan around it. vLLM and SGLang have the widest VLM coverage.

## Pick a resolution on purpose

VLMs add one knob that text serving does not have: input resolution. Kiely notes that a high-resolution image takes about four times more tokens than a low-resolution one, and provides more detail in return. That is the whole trade. More pixels means more tokens, more KV cache, and slower prefill, in exchange for answers that can read finer detail.

The default in most client libraries is to send the image at whatever size the user uploaded. That default is a policy choice someone else made for you. The exercise below finds the resolution where your task's answer quality stops improving, and that resolution is your downsampling target.

## Try it

Send the same image to a local VLM at three resolutions and log token count, time to first token, and answer quality. This takes under 30 minutes. No GPU is needed. A 7B VLM at 4-bit needs about 6 GB of memory and runs on a laptop, and prefill is slower on CPU than on a GPU, which makes the resolution effect easier to see.

Start a server with a vision model that llama.cpp supports:

```bash
brew install llama.cpp
llama-server -hf ggml-org/Qwen2.5-VL-7B-Instruct-GGUF --port 8080
```

Pick a test image with fine detail, e.g., a dense dashboard screenshot, and a question whose answer sits in that detail. Then run each resolution:

```python
import base64, io, time, requests
from PIL import Image

img = Image.open("test.png")
for width in [336, 672, 1024]:
    scaled = img.resize((width, int(img.height * width / img.width)))
    buf = io.BytesIO(); scaled.save(buf, format="PNG")
    uri = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
    start = time.time()
    r = requests.post("http://localhost:8080/v1/chat/completions", json={
        "messages": [{"role": "user", "content": [
            {"type": "image_url", "image_url": {"url": uri}},
            {"type": "text", "text": "What is the exact value in the top right panel?"}]}]})
    body = r.json()
    print(width, body["usage"]["prompt_tokens"], f"{time.time() - start:.1f}s",
          body["choices"][0]["message"]["content"][:60])
```

The script prints total latency rather than time to first token. Add `"stream": True` and time the first chunk if you want TTFT itself. Fill a table with resolution, prompt tokens, latency, and whether the answer was right. You should see the token count climb steeply with resolution. The check is whether the answer got better along with it. Find the row where quality stopped improving but tokens kept climbing. That resolution is your downsampling target, and one line of resize code before the API call enforces it.

## Check yourself

1. A user sends a request with 3 high-resolution images and 150 words of text. Roughly what fraction of the input tokens are image tokens? Expected answer: about 3,000 image tokens against about 200 text tokens, so image tokens are roughly 94 percent of the input.
2. Your VLM server runs out of KV cache memory under image-heavy load. Name two fixes from the LLM playbook that apply unchanged. Expected answer: quantize the KV cache to cut bytes per token, and use prefix caching so repeated images in multi-turn chats do not hold duplicate entries. Serving at a lower input resolution also works and is the VLM-specific fix.
3. Why does a four-second video clip threaten to produce nearly 100,000 input tokens? Expected answer: cinematic video is 24 frames per second, each frame is an image at about 1,000 tokens, and 4 x 24 x 1,000 is 96,000, so downsampling the resolution and frame rate is required in practice.

## Next steps

- Read the [KV cache guide](/docs/technical-guides/kv-cache) to size and quantize the cache that image tokens fill.
- Read the [prefix caching guide](/docs/technical-guides/prefix-caching) to reuse image prefill across turns.
- For why prefill is the phase that image tokens hurt most, read [What are prefill and decode?](/blog/what-are-prefill-and-decode) from this series.

When you can do this, you can quantify the token and latency cost of image resolution choices and set a downsampling policy.
