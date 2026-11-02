# WorldDigital Security Architecture

**Purpose.** Current security controls, gaps, and the target controls for a multi-tenant platform.
**Scope.** Both sites, APIs, cloud accounts, CI/CD and data.
**Dependencies.** [Customer Data Isolation](WORLDDIGITAL_CUSTOMER_DATA_ISOLATION.md), [Data Governance](../data-infrastructure/WORLDDIGITAL_DATA_GOVERNANCE.md).
**Status.** Per row.

## Controls in place: EXISTING
| Control | Where |
|---|---|
| No credentials in source (key-pattern scan of both repos found only prefix checks and placeholders) | both repos |
| Keyless CI → Google (Workload Identity Federation, repo-restricted) | deploy-backend, site-audit |
| Secrets in Secret Manager / Cloudflare secrets | API, Workers |
| Fail-closed internal token, constant-time compare | tools API |
| Turnstile human checks; per-IP limits; daily caps | report, tools, editor |
| One-time hashed email sign-in links, hourly limit, admin allowlist | blog editor |
| HSTS, nosniff, frame and referrer headers, `security.txt` | ai-site |
| Non-root container user | backend Dockerfile |
| SSRF guard when fetching customer sites (`ipaddress` checks) | tools API `services.py` |
| Audit table | Durable Object `audit` |
| Idempotent email sends | report follow-ups |

## Gaps: PROPOSED fixes
| # | Gap | Risk | Fix | Effort |
|---|---|---|---|---|
| S-1 | `TOOLS_API_TOKEN`, Resend key as plain Cloud Run env vars | Visible to anyone with `run.services.get` | Secret Manager references | S |
| S-2 | `github-deploy` holds `run.admin`, `storage.admin`, `artifactregistry.admin` and is also used by the read-only audit | Over-privileged | Separate read-only SA; scope deploy roles to the service | S |
| S-3 | Production in a POC-named project, no dev/prod split | Blast radius; unclear guardrails | Org + folders + separate projects (AD-9) | M |
| S-4 | Admin endpoints on public workers.dev host with a static header key | Key leak = admin access | Cloudflare Access (Zero Trust, free tier) in front of admin paths; rotate keys | S |
| S-5 | Client-side purchase tracking | Data integrity; fake conversions | Stripe webhook → server-side conversions | M |
| S-6 | No customer identity / RBAC | Blocks the platform | See [Isolation](WORLDDIGITAL_CUSTOMER_DATA_ISOLATION.md) | L |
| S-7 | Google Workspace / Cloudflare / GitHub / Stripe / Atlas account MFA | Account takeover | Confirm hardware-key MFA on every admin account; **NEEDS VERIFICATION** | S |
| S-8 | No dependency or container scanning | Supply chain | Dependabot + Artifact Registry scanning | S |
| S-9 | Atlas network access may be `0.0.0.0/0` | Credential-only protection | Static egress IP + allowlist; **NEEDS VERIFICATION** | M |

## Target controls for the platform
Identity (email link + Google OIDC for customers; MFA for WorldDigital staff), RBAC per tenant, row-level security, OAuth tokens encrypted with KMS, audit of every data access and action, per-tenant rate limits, secrets rotation every 90 days, annual penetration test before enterprise sales, and SOC 2 readiness when enterprise demand appears.

## Healthcare and PHI
The EHR/EMR integration offering (Epic, open.epic) **must not** process PHI in this stack. Requirements before any PHI: a separate Google Cloud project under a signed Google Cloud BAA, only HIPAA-eligible services, no PHI to LLM providers without a BAA covering that use, access logging, minimum-necessary data, and a HIPAA risk assessment. Marketing attribution for clinics should use de-identified, aggregated data only. This is an engineering constraint; get qualified legal and compliance advice.

## Related
[Monitoring](../reliability/WORLDDIGITAL_MONITORING_AND_OBSERVABILITY.md) · [Backlog](../development-roadmap/WORLDDIGITAL_IMPLEMENTATION_BACKLOG.md)
