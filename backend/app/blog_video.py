"""Short vertical video (YouTube Shorts / TikTok) for a new blog post, WITH SOUND.

POST /api/admin/blog/video {title, excerpt, body, category, url, cover_url} -> {b64, type, duration, title}

RULE: every video is 8 seconds or less (MAX_SECONDS). Longer voiceovers are sped up slightly; if still too long,
the video is refused.

1. OpenAI writes a 3-part script (hook, 1 key point, call to action) from the post itself.
2. OpenAI text-to-speech reads each part; each slide lasts as long as its voiceover.
3. Pillow draws 720x1280 frames (cover image with slow zoom, brand colors, animated text), piped into ffmpeg.
4. ffmpeg mixes the voiceover with a soft synthesized music bed and a swoosh on each slide change.
5. The audio is measured; a silent or near-silent file is refused (rule: every new video has real sound).
Output is kept under MAX_BYTES so the site can store it next to its images.
"""
from __future__ import annotations

import base64
import io
import os
import re
import subprocess
import tempfile
import textwrap
import wave

import httpx
from PIL import Image, ImageDraw, ImageFilter, ImageFont

from .config import Settings
from .services import ApiError, openai_json, record_usage

W, H, FPS = 720, 1280, 24
MAX_BYTES = 1_850_000
MAX_SECONDS = 8.0
ASSETS = os.path.join(os.path.dirname(__file__), "assets")
NAVY, NAVY2, RED, BLUE, WHITE = (11, 26, 51), (19, 40, 77), (193, 58, 42), (13, 94, 199), (255, 255, 255)
_TTS_MODELS = ["gpt-4o-mini-tts", "tts-1"]


def _font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(os.path.join(ASSETS, "fonts", name), size)


# ── 1. Script ───────────────────────────────────────────────────────────────

def write_script(s: Settings, *, title: str, excerpt: str, body: str) -> dict:
    data = openai_json(s, system=(
        "You write 7-second vertical videos (YouTube Shorts, TikTok) that promote a business blog post for "
        "WorldDigital.ai. Plain, friendly English for small business owners. Only use facts that are in the post: "
        "never invent numbers, results, prices, clients or guarantees."), user=(
        f"Blog post title: {title}\nSummary: {excerpt}\nPost text (start):\n{body[:3500]}\n\n"
        "Return JSON with:\n"
        "- hook: on-screen headline, max 6 words\n"
        "- point: the single most useful takeaway from the post, on screen, max 6 words\n"
        "- cta: on-screen call to action, max 4 words (e.g. 'Read the full guide')\n"
        "- voice: exactly 3 very short voiceover lines in order (hook, point, call to action), max 6 words each, "
        "15 words in total at most, so the whole video fits in 7 seconds. The last line points to worlddigital.ai."),
        max_tokens=700, temperature=0.5)
    pts = [str(data.get("point") or "").strip()] if str(data.get("point") or "").strip() else []
    voice = [str(v).strip() for v in (data.get("voice") or []) if str(v).strip()][:3]
    hook, cta = str(data.get("hook") or title).strip(), str(data.get("cta") or "Read the full guide").strip()
    if len(pts) != 1 or len(voice) != 3:
        raise ApiError("bad video script", 502, "The video script could not be written. Please try again.")
    return {"hook": hook[:70], "points": [p[:60] for p in pts], "cta": cta[:40], "voice": [v[:80] for v in voice]}


# ── 2. Voiceover ────────────────────────────────────────────────────────────

def speak(s: Settings, text: str) -> bytes:
    """One voiceover line as WAV bytes (OpenAI text-to-speech)."""
    last = None
    for model in _TTS_MODELS:
        body = {"model": model, "voice": "onyx", "input": text, "response_format": "wav"}
        if model != "tts-1":
            body["instructions"] = "Warm, upbeat and clear, like a friendly small-business marketing expert. Natural pace."
        res = httpx.post(f"{s.openai_base}/v1/audio/speech", headers={"Authorization": f"Bearer {s.openai_api_key}"},
                         json=body, timeout=90)
        if res.status_code in (400, 403, 404) and "model" in res.text:
            last = res
            continue
        if res.status_code >= 400:
            raise ApiError(f"OpenAI speech {res.status_code}: {res.text[:300]}", 502, "The voiceover could not be made.")
        record_usage("blog_video.voiceover", model, None, units=len(text))  # billed per character
        return res.content
    raise ApiError(f"no speech model: {last.text[:200] if last else ''}", 502, "The voiceover could not be made.")


def _ff(*args: str, data: bytes | None = None) -> subprocess.CompletedProcess:
    return subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *args], input=data,
                          capture_output=True, check=False, timeout=240)


def _duration(path: str) -> float:
    with wave.open(path, "rb") as w:
        return w.getnframes() / float(w.getframerate())


# ── 3. Frames ───────────────────────────────────────────────────────────────

def _ease(x: float) -> float:
    x = max(0.0, min(1.0, x))
    return 1 - (1 - x) ** 3


def _wrap(draw: ImageDraw.ImageDraw, text: str, font, width: int) -> list[str]:
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if draw.textlength(t, font=font) <= width or not cur:
            cur = t
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def _text_layer(lines_spec: list[tuple[str, ImageFont.FreeTypeFont, tuple]], width: int, gap: int = 12) -> Image.Image:
    """Stacked text block (transparent background), centered."""
    probe = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    rows = []
    for text, font, color in lines_spec:
        for ln in _wrap(probe, text, font, width):
            box = probe.textbbox((0, 0), ln, font=font)
            rows.append((ln, font, color, box[3] - box[1] + gap, box[1]))
    h = sum(r[3] for r in rows) + 10
    im = Image.new("RGBA", (width, max(h, 10)), (0, 0, 0, 0))
    d, y = ImageDraw.Draw(im), 0
    for ln, font, color, rh, top in rows:
        x = (width - d.textlength(ln, font=font)) / 2
        d.text((x, y - top), ln, font=font, fill=color)
        y += rh
    return im


def _background(cover: Image.Image | None) -> Image.Image:
    bg = Image.new("RGB", (W, H), NAVY)
    d = ImageDraw.Draw(bg)
    for y in range(H):  # vertical navy gradient
        t = y / H
        d.line([(0, y), (W, y)], fill=tuple(int(NAVY2[i] * (1 - t) + NAVY[i] * t) for i in range(3)))
    glow = Image.new("RGB", (W, H), (0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((W - 380, -200, W + 260, 420), fill=(30, 90, 170))
    gd.ellipse((-300, H - 520, 300, H + 120), fill=(120, 40, 40))
    bg = Image.blend(bg, glow.filter(ImageFilter.GaussianBlur(120)), 0.45)
    return bg


def _brand_bar() -> Image.Image:
    bar = Image.new("RGBA", (W, 120), (0, 0, 0, 0))
    icon = Image.open(os.path.join(ASSETS, "icon.png")).convert("RGBA").resize((64, 64))
    d = ImageDraw.Draw(bar)
    f = _font("Poppins-SemiBold.ttf", 34)
    tw = d.textlength("worlddigital.ai", font=f)
    x = int((W - 64 - 16 - tw) / 2)
    bar.alpha_composite(icon, (x, 28))
    d.text((x + 80, 36), "worlddigital.ai", font=f, fill=WHITE)
    return bar


def _cover_card(cover: Image.Image | None) -> Image.Image | None:
    if cover is None:
        return None
    c = cover.convert("RGB").resize((560, 560))
    mask = Image.new("L", c.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, 559, 559), 44, fill=255)
    card = Image.new("RGBA", (600, 600), (0, 0, 0, 0))
    shadow = Image.new("RGBA", (600, 600), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((20, 34, 580, 594), 44, fill=(0, 0, 0, 150))
    card.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(16)))
    card.paste(c, (20, 20), mask)
    return card


def _slides(script: dict, cover: Image.Image | None) -> list[dict]:
    big, mid, small = _font("Poppins-ExtraBold.ttf", 66), _font("Poppins-ExtraBold.ttf", 58), _font("Poppins-SemiBold.ttf", 34)
    out = [{"kind": "hook", "text": _text_layer([(script["hook"], big, WHITE)], W - 100), "card": _cover_card(cover)}]
    for p in script["points"]:
        num = _text_layer([("QUICK TIP", _font("Poppins-ExtraBold.ttf", 44), (255, 140, 110))], W - 100, 0)
        out.append({"kind": "point", "num": num, "text": _text_layer([(p, mid, WHITE)], W - 110)})
    out.append({"kind": "cta", "text": _text_layer([(script["cta"], big, WHITE)], W - 100),
                "sub": _text_layer([("worlddigital.ai/blog", small, (159, 227, 180))], W - 100)})
    return out


def _pill(text: str, font) -> Image.Image:
    d = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    tw = int(d.textlength(text, font=font))
    im = Image.new("RGBA", (tw + 70, 84), (0, 0, 0, 0))
    g = Image.new("RGBA", im.size)
    gd = ImageDraw.Draw(g)
    for x in range(im.size[0]):  # red -> blue gradient
        t = x / im.size[0]
        gd.line([(x, 0), (x, im.size[1])], fill=tuple(int(RED[i] * (1 - t) + BLUE[i] * t) for i in range(3)) + (255,))
    m = Image.new("L", im.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, im.size[0] - 1, im.size[1] - 1), 42, fill=255)
    im.paste(g, (0, 0), m)
    ImageDraw.Draw(im).text((35, 14), text, font=font, fill=WHITE)
    return im


def render_frames(script: dict, cover: Image.Image | None, durations: list[float]):
    """Yields raw RGB frames for the whole video."""
    bg, bar = _background(cover), _brand_bar()
    slides = _slides(script, cover)
    pill = _pill("Read more", _font("Poppins-ExtraBold.ttf", 40))
    starts, t0 = [], 0.0
    for d in durations:
        starts.append(t0)
        t0 += d
    total = int(t0 * FPS)
    for n in range(total):
        t = n / FPS
        k = max(i for i, s0 in enumerate(starts) if s0 <= t)
        lt, sl = t - starts[k], slides[k]
        fr = bg.copy().convert("RGBA")
        fr.alpha_composite(bar, (0, 60))
        a = _ease(lt / 0.3)
        dy = int((1 - a) * 70)
        if sl["kind"] == "hook":
            if sl["card"] is not None:
                z = 1 + 0.06 * (lt / max(durations[k], 1))
                card = sl["card"].resize((int(600 * z), int(600 * z)))
                fr.alpha_composite(card, ((W - card.size[0]) // 2, 250 - (card.size[1] - 600) // 2))
                ty = 900
            else:
                ty = 520
            fr.alpha_composite(_fade(sl["text"], a), ((W - sl["text"].size[0]) // 2, ty + dy))
        elif sl["kind"] == "point":
            na = _ease(lt / 0.3)
            fr.alpha_composite(_fade(sl["num"], na), ((W - sl["num"].size[0]) // 2, 500 + int((1 - na) * -40)))
            fr.alpha_composite(_fade(sl["text"], a), ((W - sl["text"].size[0]) // 2, 620 + dy))
        else:
            fr.alpha_composite(_fade(sl["text"], a), ((W - sl["text"].size[0]) // 2, 470 + dy))
            pa = _ease((lt - 0.15) / 0.3)
            s = 0.9 + 0.1 * pa + (0.03 if (lt * 2) % 1 < 0.5 and lt > 0.8 else 0)
            p2 = pill.resize((int(pill.size[0] * s), int(pill.size[1] * s)))
            fr.alpha_composite(_fade(p2, pa), ((W - p2.size[0]) // 2, 760))
            fr.alpha_composite(_fade(sl["sub"], pa), ((W - sl["sub"].size[0]) // 2, 900))
        # quick white flash-in on slide change
        if lt < 0.12 and k > 0:
            fr = Image.blend(fr, Image.new("RGBA", (W, H), (255, 255, 255, 255)), 0.35 * (1 - lt / 0.12))
        yield fr.convert("RGB").tobytes()


def _fade(im: Image.Image, a: float) -> Image.Image:
    if a >= 1:
        return im
    r = im.copy()
    r.putalpha(r.getchannel("A").point(lambda v: int(v * max(0.0, a))))
    return r


# ── 4 + 5. Audio mix, encode, check ─────────────────────────────────────────

def max_volume_db(path: str) -> float:
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", path, "-af", "volumedetect", "-f", "null", "-"],
                       capture_output=True, text=True, timeout=120)
    m = re.search(r"max_volume:\s*(-?[\d.]+|-inf) dB", r.stderr)
    return float(m.group(1)) if m and m.group(1) != "-inf" else -99.0


def _fit_voice(tmp: str, raws: list[str]) -> tuple[list[float], list[str]]:
    """Normalize each line (trim silence, 0.15 s pause) and make the whole video fit MAX_SECONDS."""
    tail = 0.5  # last slide holds a moment after the voice
    for tempo in (1.0, 1.12, 1.25):
        durations, parts = [], []
        for i, raw in enumerate(raws):
            p = os.path.join(tmp, f"vo{i}_{int(tempo * 100)}.wav")
            af = ("silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
                  "silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
                  + (f"atempo={tempo}," if tempo != 1.0 else "") + "apad=pad_dur=0.15")
            if _ff("-i", raw, "-ar", "44100", "-ac", "2", "-af", af, p).returncode:
                raise ApiError("voice convert failed", 502, "The voiceover could not be made.")
            parts.append(p)
            durations.append(_duration(p))
        durations[-1] += tail
        if sum(durations) <= MAX_SECONDS:
            return durations, parts
    raise ApiError(f"video too long ({sum(durations):.1f}s)", 502,
                   f"The video came out longer than {MAX_SECONDS:g} seconds, so it was not used.")


def make_video(s: Settings, *, title: str, excerpt: str, body: str, cover_url: str = "") -> dict:
    if not s.openai_api_key:
        raise ApiError("OPENAI_API_KEY missing", 503, "The video maker is being set up.")
    script = write_script(s, title=title, excerpt=excerpt, body=body)
    cover = None
    if cover_url.startswith("https://"):
        try:
            r = httpx.get(cover_url, timeout=30, follow_redirects=True)
            if r.status_code == 200 and r.headers.get("content-type", "").startswith("image/"):
                cover = Image.open(io.BytesIO(r.content))
        except Exception as e:  # noqa: BLE001
            print("video cover fetch failed", e, flush=True)
    with tempfile.TemporaryDirectory() as tmp:
        durations, parts = [], []
        for i, line in enumerate(script["voice"]):
            raw = os.path.join(tmp, f"raw{i}.wav")
            open(raw, "wb").write(speak(s, line))
            parts.append(raw)
        durations, parts = _fit_voice(tmp, parts)
        lst = os.path.join(tmp, "list.txt")
        open(lst, "w").write("".join(f"file '{p}'\n" for p in parts))
        vo = os.path.join(tmp, "vo.wav")
        _ff("-f", "concat", "-safe", "0", "-i", lst, "-af", f"apad=whole_dur={sum(durations):.3f}", vo)
        total = sum(durations)
        # Music bed (soft chord + gentle 100 bpm pulse) and a swoosh at each slide change, all synthesized here.
        cuts = [sum(durations[:i]) for i in range(1, len(durations))]
        music = (f"aevalsrc='0.05*(sin(2*PI*220*t)+sin(2*PI*277.18*t)+sin(2*PI*329.63*t))*(0.75+0.25*sin(2*PI*0.25*t))"
                 f"+0.20*sin(2*PI*(55+80*exp(-30*mod(t,0.6)))*t)*exp(-9*mod(t,0.6))':s=44100:d={total:.3f}")
        swoosh = "+".join(f"0.5*exp(-pow((t-{c - 0.15:.3f})/0.09,2))" for c in cuts) or "0"
        noise = f"anoisesrc=color=pink:amplitude=0.6:d={total:.3f}:r=44100"
        mix = os.path.join(tmp, "mix.m4a")
        r = _ff("-i", vo, "-f", "lavfi", "-i", music, "-f", "lavfi", "-i", noise, "-filter_complex",
                f"[1:a]aformat=channel_layouts=stereo,volume=0.55[m];"
                f"[2:a]aformat=channel_layouts=stereo,highpass=f=800,lowpass=f=5000,volume='{swoosh}':eval=frame[w];"
                f"[0:a]asplit=2[v1][v2];[m][v1]sidechaincompress=threshold=0.05:ratio=6:attack=20:release=300[md];"
                f"[v2][md][w]amix=inputs=3:duration=first:normalize=0,"
                f"afade=t=in:d=0.3,afade=t=out:st={max(total - 0.6, 0):.3f}:d=0.6,alimiter=limit=0.9[a]",
                "-map", "[a]", "-c:a", "aac", "-b:a", "96k", mix)
        if r.returncode:
            raise ApiError(f"audio mix failed: {r.stderr[-300:]!r}", 502, "The video sound could not be made.")
        out = os.path.join(tmp, "out.mp4")
        vbit = max(250, int((MAX_BYTES * 8 * 0.92 / total - 100_000) / 1000))
        enc = subprocess.Popen(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
                                "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-i", mix, "-map", "0:v", "-map", "1:a",
                                "-c:v", "libx264", "-preset", "veryfast", "-crf", "26", "-maxrate", f"{vbit}k",
                                "-bufsize", f"{vbit * 2}k", "-pix_fmt", "yuv420p", "-c:a", "copy", "-shortest",
                                "-movflags", "+faststart", out], stdin=subprocess.PIPE, stderr=subprocess.PIPE)
        try:
            for fr in render_frames(script, cover, durations):
                enc.stdin.write(fr)
            enc.stdin.close()
            err = enc.stderr.read().decode(errors="ignore")
            enc.wait(timeout=240)
        except Exception as e:  # noqa: BLE001
            enc.kill()
            raise ApiError(f"encode failed: {e}", 502, "The video could not be made.") from e
        if enc.returncode or not os.path.exists(out):
            raise ApiError(f"encode failed: {err[-300:]}", 502, "The video could not be made.")
        loud = max_volume_db(out)
        if loud < -30:  # rule: never ship a silent video
            raise ApiError(f"video audio too quiet ({loud} dB)", 502, "The video came out without sound, so it was not used.")
        data = open(out, "rb").read()
    if len(data) > MAX_BYTES:
        raise ApiError(f"video too large ({len(data)} bytes)", 502, "The video came out too large.")
    return {"b64": base64.b64encode(data).decode(), "type": "video/mp4", "duration": round(total, 1),
            "max_volume_db": loud, "title": textwrap.shorten(title, 90, placeholder="…"), "script": script}
