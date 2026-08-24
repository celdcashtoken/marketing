"""Gradio demo for Lightricks/LTX-2.5 (text-to-video and image-to-video).

The exact `diffusers` pipeline class shipped with the LTX-2.5 checkpoint
could not be confirmed against the live model card when this Space was
scaffolded (no network access to huggingface.co at the time). `load_pipeline`
below therefore tries the class names used by earlier LTX-Video releases
first, then a couple of plausible "LTX2" names, and finally falls back to
the generic `DiffusionPipeline.from_pretrained(..., trust_remote_code=True)`
loader, which works regardless of the concrete class as long as the repo
declares its pipeline via `custom_pipeline`/`auto_map`. If none of that
matches, adjust `TEXT2VIDEO_CANDIDATES` / `IMAGE2VIDEO_CANDIDATES` to the
real class name from the model card.
"""

import os
import random

import gradio as gr
import numpy as np
import torch
from diffusers.utils import export_to_video

try:
    import spaces  # Hugging Face Spaces ZeroGPU helper

    GPU_DECORATOR = spaces.GPU
except Exception:  # pragma: no cover - not running on HF Spaces
    def GPU_DECORATOR(fn=None, **_kwargs):
        return fn if fn is not None else (lambda f: f)


MODEL_ID = os.environ.get("LTX_MODEL_ID", "Lightricks/LTX-2.5")
DTYPE = torch.bfloat16 if torch.cuda.is_available() else torch.float32
MAX_SEED = np.iinfo(np.int32).max

TEXT2VIDEO_CANDIDATES = ["LTXPipeline", "LTX2Pipeline", "LTXConditionPipeline"]
IMAGE2VIDEO_CANDIDATES = [
    "LTXImageToVideoPipeline",
    "LTX2ImageToVideoPipeline",
    "LTXConditionPipeline",
]

_pipelines = {}


def _load_by_candidates(candidates, **from_pretrained_kwargs):
    import diffusers

    errors = []
    for name in candidates:
        cls = getattr(diffusers, name, None)
        if cls is None:
            continue
        try:
            return cls.from_pretrained(MODEL_ID, torch_dtype=DTYPE, **from_pretrained_kwargs)
        except Exception as exc:  # noqa: BLE001
            errors.append(f"{name}: {exc}")

    try:
        return diffusers.DiffusionPipeline.from_pretrained(
            MODEL_ID, torch_dtype=DTYPE, trust_remote_code=True, **from_pretrained_kwargs
        )
    except Exception as exc:  # noqa: BLE001
        errors.append(f"DiffusionPipeline(trust_remote_code): {exc}")

    raise RuntimeError(
        "Could not load a pipeline for '"
        + MODEL_ID
        + "'. Tried: \n- "
        + "\n- ".join(errors)
    )


def get_pipeline(kind):
    """kind is 'text2video' or 'image2video'; pipelines are cached and moved to GPU lazily."""
    if kind in _pipelines:
        return _pipelines[kind]

    candidates = TEXT2VIDEO_CANDIDATES if kind == "text2video" else IMAGE2VIDEO_CANDIDATES
    pipe = _load_by_candidates(candidates)
    if torch.cuda.is_available():
        pipe.to("cuda")
    try:
        pipe.vae.enable_tiling()
    except Exception:  # noqa: BLE001
        pass

    _pipelines[kind] = pipe
    return pipe


def make_seed(seed, randomize):
    if randomize or seed is None:
        return random.randint(0, MAX_SEED)
    return int(seed)


@GPU_DECORATOR(duration=120)
def generate_text2video(
    prompt,
    negative_prompt,
    width,
    height,
    num_frames,
    fps,
    guidance_scale,
    num_inference_steps,
    seed,
    randomize_seed,
    progress=gr.Progress(track_tqdm=True),
):
    if not prompt or not prompt.strip():
        raise gr.Error("Please enter a prompt.")

    pipe = get_pipeline("text2video")
    used_seed = make_seed(seed, randomize_seed)
    generator = torch.Generator(device="cpu").manual_seed(used_seed)

    output = pipe(
        prompt=prompt,
        negative_prompt=negative_prompt or None,
        width=int(width),
        height=int(height),
        num_frames=int(num_frames),
        guidance_scale=float(guidance_scale),
        num_inference_steps=int(num_inference_steps),
        generator=generator,
    )
    frames = output.frames[0]

    out_path = "output_t2v.mp4"
    export_to_video(frames, out_path, fps=int(fps))
    return out_path, used_seed


@GPU_DECORATOR(duration=120)
def generate_image2video(
    image,
    prompt,
    negative_prompt,
    width,
    height,
    num_frames,
    fps,
    guidance_scale,
    num_inference_steps,
    seed,
    randomize_seed,
    progress=gr.Progress(track_tqdm=True),
):
    if image is None:
        raise gr.Error("Please upload a starting image.")
    if not prompt or not prompt.strip():
        raise gr.Error("Please enter a prompt describing the motion/scene.")

    pipe = get_pipeline("image2video")
    used_seed = make_seed(seed, randomize_seed)
    generator = torch.Generator(device="cpu").manual_seed(used_seed)

    output = pipe(
        image=image,
        prompt=prompt,
        negative_prompt=negative_prompt or None,
        width=int(width),
        height=int(height),
        num_frames=int(num_frames),
        guidance_scale=float(guidance_scale),
        num_inference_steps=int(num_inference_steps),
        generator=generator,
    )
    frames = output.frames[0]

    out_path = "output_i2v.mp4"
    export_to_video(frames, out_path, fps=int(fps))
    return out_path, used_seed


DEFAULT_NEGATIVE_PROMPT = (
    "worst quality, inconsistent motion, blurry, jittery, distorted, low resolution, "
    "watermark, text"
)

EXAMPLE_PROMPTS = [
    "A majestic sailboat cutting through turquoise ocean waves at golden hour, cinematic drone shot",
    "A close-up of steaming coffee being poured into a white ceramic cup, soft morning light",
    "A neon-lit cyberpunk city street at night, rain reflecting the lights, cars passing by",
    "A field of sunflowers swaying gently in the wind under a bright blue sky",
]


def build_controls(prefix):
    with gr.Accordion("Advanced settings", open=False):
        with gr.Row():
            width = gr.Slider(256, 1280, value=704, step=32, label="Width")
            height = gr.Slider(256, 1280, value=480, step=32, label="Height")
        with gr.Row():
            num_frames = gr.Slider(9, 257, value=121, step=8, label="Number of frames")
            fps = gr.Slider(8, 30, value=24, step=1, label="FPS")
        with gr.Row():
            guidance_scale = gr.Slider(1.0, 15.0, value=4.0, step=0.1, label="Guidance scale")
            num_inference_steps = gr.Slider(10, 100, value=40, step=1, label="Inference steps")
        negative_prompt = gr.Textbox(
            label="Negative prompt", value=DEFAULT_NEGATIVE_PROMPT, lines=2
        )
        with gr.Row():
            seed = gr.Slider(0, MAX_SEED, value=0, step=1, label="Seed")
            randomize_seed = gr.Checkbox(value=True, label="Randomize seed")
    return {
        "width": width,
        "height": height,
        "num_frames": num_frames,
        "fps": fps,
        "guidance_scale": guidance_scale,
        "num_inference_steps": num_inference_steps,
        "negative_prompt": negative_prompt,
        "seed": seed,
        "randomize_seed": randomize_seed,
    }


with gr.Blocks(title="LTX-2.5 Video Generator") as demo:
    gr.Markdown(
        """
        # 🎬 LTX-2.5 Video Generator
        Generate short video clips with [Lightricks/LTX-2.5](https://huggingface.co/Lightricks/LTX-2.5).
        Choose **Text-to-Video** to generate a clip purely from a text prompt, or
        **Image-to-Video** to animate a starting frame.

        > First generation will take longer while the model weights download and load onto the GPU.
        """
    )

    with gr.Tabs():
        with gr.TabItem("Text-to-Video"):
            with gr.Row():
                with gr.Column(scale=1):
                    t2v_prompt = gr.Textbox(
                        label="Prompt", placeholder="Describe the video you want to generate...", lines=3
                    )
                    t2v_controls = build_controls("t2v")
                    t2v_button = gr.Button("Generate video", variant="primary")
                    gr.Examples(examples=EXAMPLE_PROMPTS, inputs=t2v_prompt)
                with gr.Column(scale=1):
                    t2v_output = gr.Video(label="Generated video")
                    t2v_seed_used = gr.Number(label="Seed used", interactive=False)

            t2v_button.click(
                fn=generate_text2video,
                inputs=[
                    t2v_prompt,
                    t2v_controls["negative_prompt"],
                    t2v_controls["width"],
                    t2v_controls["height"],
                    t2v_controls["num_frames"],
                    t2v_controls["fps"],
                    t2v_controls["guidance_scale"],
                    t2v_controls["num_inference_steps"],
                    t2v_controls["seed"],
                    t2v_controls["randomize_seed"],
                ],
                outputs=[t2v_output, t2v_seed_used],
            )

        with gr.TabItem("Image-to-Video"):
            with gr.Row():
                with gr.Column(scale=1):
                    i2v_image = gr.Image(label="Starting image", type="pil")
                    i2v_prompt = gr.Textbox(
                        label="Prompt",
                        placeholder="Describe how the scene should move/evolve...",
                        lines=3,
                    )
                    i2v_controls = build_controls("i2v")
                    i2v_button = gr.Button("Generate video", variant="primary")
                with gr.Column(scale=1):
                    i2v_output = gr.Video(label="Generated video")
                    i2v_seed_used = gr.Number(label="Seed used", interactive=False)

            i2v_button.click(
                fn=generate_image2video,
                inputs=[
                    i2v_image,
                    i2v_prompt,
                    i2v_controls["negative_prompt"],
                    i2v_controls["width"],
                    i2v_controls["height"],
                    i2v_controls["num_frames"],
                    i2v_controls["fps"],
                    i2v_controls["guidance_scale"],
                    i2v_controls["num_inference_steps"],
                    i2v_controls["seed"],
                    i2v_controls["randomize_seed"],
                ],
                outputs=[i2v_output, i2v_seed_used],
            )

    gr.Markdown(
        "Model: [Lightricks/LTX-2.5](https://huggingface.co/Lightricks/LTX-2.5) · "
        "Built with [Gradio](https://gradio.app) and 🤗 diffusers."
    )


if __name__ == "__main__":
    demo.queue(max_size=20).launch()
