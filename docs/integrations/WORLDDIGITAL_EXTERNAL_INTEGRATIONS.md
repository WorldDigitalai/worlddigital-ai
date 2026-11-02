# WorldDigital External Integrations

**Purpose.** Every third-party service: what it's used for, how credentials are held, and what's planned.
**Scope.** Both repos and the planned connectors.
**Dependencies.** [Security](../security/WORLDDIGITAL_SECURITY_ARCHITECTURE.md).
**Status.** Per row.

## EXISTING

| Service | Used by | Purpose | Credential location |
|---|---|---|---|
| DataForSEO | report Worker, tools API | Keyword volumes, SERP, backlinks, AI-answer checks | Cloudflare secrets / Secret Manager |
| OpenAI | tools API | Keyword ranking, content generation | Secret Manager |
| Stripe | tools API (Checkout), worlddigital.us (hosted checkout + portal links) | Payments | Secret Manager |
| Resend | report Worker, ai-site editor, tools API | Transactional email, audience segment | Cloudflare secrets / GitHub secret → env var |
| Cloudflare Turnstile | ai-site, report | Bot protection | Worker secret |
| Buffer | ai-site nightly build | Social Hub content | GitHub secret (NEEDS VERIFICATION) |
| Google Search Console | BigQuery bulk export | Search data | Managed |
| GA4 | tags + BigQuery export | Analytics | Managed |
| Google Ads | tag + Data Transfer | Conversions, campaign data | Managed |
| Google Tag Manager | worlddigital.us | Tag container | – |
| Google Calendar | booking links | Calls | – |
| WhatsApp | click-to-chat | Contact | – |
| IndexNow | both sites | Fast indexing | Key file (public by design) |
| Anthropic (Workload Identity) | `anthropic-wif-test.yml` (both repos) | Test of keyless Claude API access from CI | OIDC federation |

## PROPOSED: tenant ad-platform connectors

| Platform | API | Scopes (read first) | Reuse from archive | Notes |
|---|---|---|---|---|
| Google Ads | Google Ads API (current version) | read reporting; later mutate | `services/ads/google.ts` (MCC + refresh token pattern) | Needs a developer token with Standard access for customer accounts |
| Meta (Facebook/Instagram) | Marketing API (current version) | `ads_read`; later `ads_management` | `services/ads/meta.ts` (v19, **upgrade**) | App review required |
| TikTok | Business API v1.3 | reporting read | `services/ads/tiktok.ts` | App review |
| Snapchat | Marketing API | reporting read | `services/ads/snapchat.ts`, `snapTokenManager.ts` | – |
| Google Search Console / GA4 (tenants) | Search Console API / GA4 Data API, or tenant-configured BigQuery export | read | – | Export-to-tenant-dataset is cheapest at scale |
| CRM (HubSpot etc.) | per vendor | read leads + deal stage | – | Needed for lead-scoring labels |

**Connector rules:** read-only scopes at launch; mutate scopes requested only when Autonomous Marketing ships; tokens encrypted and tenant-scoped; every sync logged to `worlddigital_audit.data_sync_events`; respect each platform's rate limits and data-use terms (for example, Google API Services User Data Policy, Meta Platform Terms).

## Related
[Advertising Intelligence](../architecture/WORLDDIGITAL_AI_PLATFORM_ARCHITECTURE.md#diagram-3-advertising-intelligence-workflow) · [API Architecture](WORLDDIGITAL_API_ARCHITECTURE.md)
