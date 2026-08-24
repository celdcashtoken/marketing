---
title: LTX 2.5 Video Generator
emoji: 🎬
colorFrom: purple
colorTo: pink
sdk: gradio
sdk_version: 5.9.1
app_file: app.py
pinned: false
license: other
models:
  - Lightricks/LTX-2.5
short_description: Text/Image-to-video demo powered by Lightricks LTX-2.5
---

# LTX-2.5 Video Generator

A Gradio demo for [Lightricks/LTX-2.5](https://huggingface.co/Lightricks/LTX-2.5), Lightricks'
latent-diffusion video generation model. Generate short video clips from a text
prompt, or animate a starting image, directly in the browser.

## Features

- **Text-to-video** — describe a scene and generate a video clip.
- **Image-to-video** — upload a reference frame and animate it from a prompt.
- Adjustable resolution, duration, guidance scale, inference steps, and seed.
- Runs on Hugging Face Spaces GPU hardware (ZeroGPU-compatible via the
  `spaces` package).

## Running locally

```bash
pip install -r requirements.txt
python app.py
```

A CUDA GPU with enough VRAM to hold the LTX-2.5 weights (bfloat16) is
required. On first launch the model weights are downloaded from the
`Lightricks/LTX-2.5` repository on the Hugging Face Hub.

## Notes

This Space was scaffolded without live access to the `Lightricks/LTX-2.5`
model card, so `app.py` is defensive about the exact `diffusers` pipeline
class name: it tries the most likely LTX pipeline classes
(`LTXPipeline`/`LTXImageToVideoPipeline` and their `LTX2*` equivalents) and
falls back to `DiffusionPipeline.from_pretrained` with `trust_remote_code`
if needed. If the checkpoint ships a different pipeline entry point, update
`load_pipelines()` in `app.py` accordingly — the rest of the UI and
generation flow does not need to change.

## Credits

Model by [Lightricks](https://huggingface.co/Lightricks). Demo built with
[Gradio](https://gradio.app) and 🤗 [diffusers](https://github.com/huggingface/diffusers).
