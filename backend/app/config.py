"""Settings, read from environment variables.

Secrets (Cloud Run > worlddigital-ai-api > Variables & Secrets, or GitHub Actions secrets):
  MONGODB_URI, OPENAI_API_KEY, DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD,
  STRIPE_SECRET_KEY, RESEND_API_KEY, TURNSTILE_SECRET (optional), INTERNAL_TOKEN
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field


def _env(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip()


@dataclass(frozen=True)
class Settings:
    mongodb_uri: str = field(default_factory=lambda: _env("MONGODB_URI"))
    mongodb_db: str = field(default_factory=lambda: _env("MONGODB_DB", "worlddigital_ai"))

    openai_api_key: str = field(default_factory=lambda: _env("OPENAI_API_KEY"))
    openai_model: str = field(default_factory=lambda: _env("OPENAI_MODEL", "gpt-4o-mini"))
    openai_base: str = field(default_factory=lambda: _env("OPENAI_BASE", "https://api.openai.com"))

    dataforseo_login: str = field(default_factory=lambda: _env("DATAFORSEO_LOGIN"))
    dataforseo_password: str = field(default_factory=lambda: _env("DATAFORSEO_PASSWORD"))
    dataforseo_base: str = field(default_factory=lambda: _env("DATAFORSEO_BASE", "https://api.dataforseo.com"))

    stripe_secret_key: str = field(default_factory=lambda: _env("STRIPE_SECRET_KEY"))
    stripe_base: str = field(default_factory=lambda: _env("STRIPE_BASE", "https://api.stripe.com"))
    stripe_automatic_tax: bool = field(default_factory=lambda: _env("STRIPE_AUTOMATIC_TAX", "true") != "false")
    stripe_tax_behavior: str = field(default_factory=lambda: _env("STRIPE_TAX_BEHAVIOR", "inclusive"))

    resend_api_key: str = field(default_factory=lambda: _env("RESEND_API_KEY"))
    resend_base: str = field(default_factory=lambda: _env("RESEND_BASE", "https://api.resend.com"))
    email_from: str = field(default_factory=lambda: _env("EMAIL_FROM", "WorldDigital.ai <reports@worlddigital.ai>"))
    email_reply_to: str = field(default_factory=lambda: _env("EMAIL_REPLY_TO", "ahmad.awwad@worlddigital.ai"))

    turnstile_secret: str = field(default_factory=lambda: _env("TURNSTILE_SECRET"))
    # Shared secret the Cloudflare site worker sends; blocks direct calls that skip the site.
    # TOOLS_API_TOKEN comes from the same GitHub secret the site uses, so the two always match.
    # Our own sites: unlimited free previews for testing. Everyone else gets one per website per tool.
    test_domains: tuple = field(default_factory=lambda: tuple(
        d.strip().lower() for d in _env("FREE_TEST_DOMAINS", "worlddigital.ai,worlddigital.us").split(",") if d.strip()))
    internal_token: str = field(default_factory=lambda: _env("TOOLS_API_TOKEN") or _env("INTERNAL_TOKEN"))

    public_origin: str = field(default_factory=lambda: _env("PUBLIC_ORIGIN", "https://worlddigital.ai"))
    # Tests only: fetch customer sites through a mock server.
    test_site_base: str = field(default_factory=lambda: _env("TEST_SITE_BASE"))
    preview_daily_limit: int = field(default_factory=lambda: int(_env("PREVIEW_DAILY_LIMIT", "6") or 6))
