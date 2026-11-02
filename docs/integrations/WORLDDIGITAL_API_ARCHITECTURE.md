# WorldDigital API Architecture

**Purpose.** Every API the ecosystem exposes, and the design of the shared Intelligence API.
**Scope.** Public and internal HTTP APIs.
**Dependencies.** [Security](../security/WORLDDIGITAL_SECURITY_ARCHITECTURE.md), [Customer Data Isolation](../security/WORLDDIGITAL_CUSTOMER_DATA_ISOLATION.md).
**Status.** Per section.

## EXISTING APIs

| API | Base | Endpoints | Auth |
|---|---|---|---|
| Tools API (FastAPI) | `worlddigital.ai/api/tools/` → Cloud Run | `keywords/preview`, `content/preview`, `job`, `checkout`, `order`, `download`, `health` | Site Worker adds `X-Internal-Token` (fail-closed); per-IP limits |
| Report API (Python Worker) | `worlddigital-report…workers.dev` (bound to both sites) | `POST /` (report), `/verify-human`, `/research` (key header), `/followups`, `/followups/retry` (key header), `/monitor/responsive` (GitHub OIDC-signed), `?status=monitor`, `?status=ai-visibility` | Turnstile for public calls; SHA-256 key for admin; OIDC for CI |
| Unsubscribe API | Worker `worlddigital-unsubscribe` | unsubscribe link handling | Signed link |
| Site internal | `worlddigital.ai/api/site/*`, `/blog-admin/*` | blog editor | Session cookie after an email link |

## PROPOSED: Intelligence API v1

| Principle | Choice |
|---|---|
| Style | REST + JSON, OpenAPI 3.1 spec checked into the repo; versioned path `/v1` |
| Host | Cloud Run `wd-intel-api`, fronted by the worlddigital.ai Worker at `worlddigital.ai/api/v1/*` (same origin for cookies) |
| Auth | Session (customer users) or OAuth 2.0 client credentials (server-to-server); every request resolves `tenant_id` + role server-side, never from the client body |
| Tenancy | Postgres session variable `app.tenant_id` → row-level security; BigQuery queries go through a data-access layer that always adds the tenant filter, plus row access policies as defense in depth |
| Errors | RFC 9457 problem+json; public messages safe (pattern already used by `ApiError`) |
| Limits | Per-tenant rate limits and LLM token budgets |
| Idempotency | `Idempotency-Key` header on POSTs that create actions |

Initial resources: `GET /v1/tenants/me`, `GET/POST /v1/connections` (start OAuth), `GET /v1/metrics/daily`, `GET /v1/forecasts`, `GET /v1/recommendations`, `POST /v1/recommendations/{id}:accept|dismiss`, `GET /v1/actions`, `POST /v1/actions/{id}:execute` (approved only), `GET /v1/reports`.

## Related
[External Integrations](WORLDDIGITAL_EXTERNAL_INTEGRATIONS.md) · [AI Platform](../architecture/WORLDDIGITAL_AI_PLATFORM_ARCHITECTURE.md)
