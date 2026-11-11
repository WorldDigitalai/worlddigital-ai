"""Provider layer: which AI provider and model serves each feature, and what a call costs.

OpenAI stays the default. Groq and Cerebras speak the same chat-completions protocol, so they are reached with the same
client and chosen per feature by configuration, never by code:

  AI_ROUTES='{"chat.reply": "groq:openai/gpt-oss-120b", "products.generate_keywords": "cerebras:gpt-oss-120b"}'

A feature is the name already used for AI usage counting ("module.function", or the explicit feature= a caller passes).
"*" sets a route for every feature that has none of its own. A route is used only when that provider's API key is set;
otherwise, and whenever the routed provider fails before it has written anything, the call goes to OpenAI exactly as
before and is counted as a fallback. With AI_ROUTES empty nothing changes.

A model name can also carry the provider ("groq:openai/gpt-oss-120b"), which is how the quality test tries a model
before it is routed for visitors (RAG_ANSWER_MODEL, or the model field of the quality-test workflow).
"""
from __future__ import annotations

import json
from dataclasses import dataclass

from .config import Settings

# US dollars per 1 million tokens at list price: (input, cached input, output). Only prices read from the provider's own
# pricing page are listed; a model that is not here is counted as "unpriced" rather than guessed.
PRICES: dict[str, tuple[float, float | None, float]] = {
    "gpt-5.4-mini": (0.75, 0.075, 4.50),
    "groq:openai/gpt-oss-120b": (0.15, None, 0.60),
    "groq:openai/gpt-oss-20b": (0.075, None, 0.30),
}


@dataclass(frozen=True)
class Target:
    provider: str   # "groq" | "cerebras"
    model: str      # the provider's own model name
    base: str       # API base, ending in /v1
    key: str

    @property
    def label(self) -> str:
        return f"{self.provider}:{self.model}"


def _providers(s: Settings) -> dict[str, tuple[str, str]]:
    return {"groq": (s.groq_base, s.groq_api_key), "cerebras": (s.cerebras_base, s.cerebras_api_key)}


def split(model: str | None) -> tuple[str, str]:
    """"groq:openai/gpt-oss-120b" -> ("groq", "openai/gpt-oss-120b"); a plain name belongs to OpenAI."""
    if model and ":" in model:
        p, m = model.split(":", 1)
        if p in ("groq", "cerebras", "openai") and m:
            return p, m
    return "openai", model or ""


def routes(s: Settings) -> dict[str, str]:
    try:
        r = json.loads(s.ai_routes) if s.ai_routes else {}
    except ValueError:
        print("AI_ROUTES is not valid JSON: ignored", flush=True)
        return {}
    return {str(k): str(v) for k, v in r.items()} if isinstance(r, dict) else {}


def pick(s: Settings, feature: str, model: str | None = None) -> Target | None:
    """The non-OpenAI provider this call should try first, or None for the usual OpenAI path."""
    named = model if split(model)[0] != "openai" else None
    r = routes(s) if not named and not model else {}
    want = named or r.get(feature) or r.get("*")
    provider, name = split(want)
    if provider == "openai" or not name:
        return None
    base, key = _providers(s)[provider]
    if not key:
        return None
    return Target(provider, name, base.rstrip("/"), key)


def effort_for(model: str) -> str | None:
    """Lowest reasoning setting each open model family accepts (Groq API reference); None = send nothing."""
    m = model.lower()
    if "gpt-oss" in m:
        return "low"
    if "qwen" in m:
        return "none"
    return None


def cost_micro(model: str, tokens_in: int, tokens_out: int, cached: int = 0) -> int | None:
    """List-price cost of one call in millionths of a dollar, or None when the model's price is not known."""
    p = PRICES.get(model)
    if not p:
        return None
    cin, ccached, cout = p
    cached = min(max(cached, 0), tokens_in)
    return round((tokens_in - cached) * cin + cached * (ccached if ccached is not None else cin) + tokens_out * cout)
