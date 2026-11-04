"""Settings, read from environment variables.

Secrets (Cloud Run > worlddigital-ai-api > Variables & Secrets, or GitHub Actions secrets):
  MONGODB_URI, OPENAI_API_KEY, DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD,
  STRIPE_SECRET_KEY, MERCURY_API_TOKEN, MERCURY_ACCOUNT_ID, RESEND_API_KEY, TURNSTILE_SECRET (optional), INTERNAL_TOKEN
"""
from __future__ import annotations

import os
import re
from dataclasses import dataclass, field


def _env(name: str, default: str = "") -> str:
    """Read a setting, forgiving how it was pasted: spaces, quotes, `export`, or a whole `NAME=value` line."""
    v = os.environ.get(name, default).strip()
    v = re.sub(r"^(export\s+)?[A-Z][A-Z0-9_]*\s*[=:]\s*", "", v) if re.match(r"^(export\s+)?[A-Z][A-Z0-9_]*\s*[=:]\s*\S", v) else v
    return v.strip().strip("'\"").strip()


@dataclass(frozen=True)
class Settings:
    mongodb_uri: str = field(default_factory=lambda: _env("MONGODB_URI"))
    mongodb_db: str = field(default_factory=lambda: _env("MONGODB_DB", "worlddigital_ai"))

    openai_api_key: str = field(default_factory=lambda: _env("OPENAI_API_KEY"))
    openai_model: str = field(default_factory=lambda: _env("OPENAI_MODEL", "gpt-5.4-mini"))
    openai_base: str = field(default_factory=lambda: _env("OPENAI_BASE", "https://api.openai.com"))

    dataforseo_login: str = field(default_factory=lambda: _env("DATAFORSEO_LOGIN"))
    dataforseo_password: str = field(default_factory=lambda: _env("DATAFORSEO_PASSWORD"))
    dataforseo_base: str = field(default_factory=lambda: _env("DATAFORSEO_BASE", "https://api.dataforseo.com"))

    stripe_secret_key: str = field(default_factory=lambda: _env("STRIPE_SECRET_KEY"))
    stripe_base: str = field(default_factory=lambda: _env("STRIPE_BASE", "https://api.stripe.com"))
    stripe_automatic_tax: bool = field(default_factory=lambda: _env("STRIPE_AUTOMATIC_TAX", "true") != "false")
    stripe_tax_behavior: str = field(default_factory=lambda: _env("STRIPE_TAX_BEHAVIOR", "inclusive"))

    # Mercury invoicing (plan + one-off invoices). Token: read-write, bound to the backend's static egress IP.
    mercury_api_token: str = field(default_factory=lambda: _env("MERCURY_API_TOKEN"))
    mercury_account_id: str = field(default_factory=lambda: _env("MERCURY_ACCOUNT_ID"))
    mercury_base: str = field(default_factory=lambda: _env("MERCURY_BASE", "https://api.mercury.com/api/v1"))
    mercury_card: bool = field(default_factory=lambda: _env("MERCURY_CARD", "false") == "true")
    billing_notify: str = field(default_factory=lambda: _env("BILLING_NOTIFY", "support@worlddigital.ai"))

    resend_api_key: str = field(default_factory=lambda: _env("GH_RESEND_API_KEY") or _env("RESEND_API_KEY"))
    resend_base: str = field(default_factory=lambda: _env("RESEND_BASE", "https://api.resend.com"))
    email_from: str = field(default_factory=lambda: _env("EMAIL_FROM", "WorldDigital.ai <reports@worlddigital.ai>"))
    email_reply_to: str = field(default_factory=lambda: _env("EMAIL_REPLY_TO", "support@worlddigital.ai"))

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
    chat_daily_limit: int = field(default_factory=lambda: int(_env("CHAT_DAILY_LIMIT", "40") or 40))
    rag_api_daily_limit: int = field(default_factory=lambda: int(_env("RAG_API_DAILY_LIMIT", "30") or 30))
    rag_api_daily_total: int = field(default_factory=lambda: int(_env("RAG_API_DAILY_TOTAL", "1000") or 1000))
    preview_daily_limit: int = field(default_factory=lambda: int(_env("PREVIEW_DAILY_LIMIT", "6") or 6))
