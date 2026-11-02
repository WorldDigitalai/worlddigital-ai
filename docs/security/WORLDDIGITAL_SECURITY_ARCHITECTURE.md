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
| S-1 (IN PROGRESS) | `TOOLS_API_TOKEN`, Resend key as plain Cloud Run env vars | Visible to anyone with `run.services.get` | Secret Manager references | S |
| S-2 (IN PROGRESS) | `github-deploy` holds `run.admin`, `storage.admin`, `artifactregistry.admin` and is also used by the read-only audit | Over-privileged | Separate read-only SA; scope deploy roles to the service | S |
| S-3 | Production in a POC-named project, no dev/prod split | Blast radius; unclear guardrails | Org + folders + separate projects (AD-9) | M |
| S-4 | Admin endpoints on public workers.dev host with a static header key | Key leak = admin access | Cloudflare Access (Zero Trust, free tier) in front of admin paths; rotate keys | S |
| S-5 | Client-side purchase tracking | Data integrity; fake conversions | Stripe webhook → server-side conversions | M |
| S-6 | No customer identity / RBAC | Blocks the platform | See [Isolation](WORLDDIGITAL_CUSTOMER_DATA_ISOLATION.md) | L |
| S-7 (IN PROGRESS, see checklist below) | Google Workspace / Cloudflare / GitHub / Stripe / Atlas account MFA | Account takeover | Confirm hardware-key MFA on every admin account; **NEEDS VERIFICATION** | S |
| S-8 | No dependency or container scanning | Supply chain | Dependabot + Artifact Registry scanning | S |
| S-9 | Atlas network access may be `0.0.0.0/0` | Credential-only protection | Static egress IP + allowlist; **NEEDS VERIFICATION** | M |

## Account security checklist (S-7)
This session can't read account settings (GitHub only exposes repository-level data to it), so the founder confirms these by hand. Tick each one and note the date.

| Account | Check | Where |
|---|---|---|
| GitHub (personal) | 2FA on, with a passkey or security key; recovery codes stored offline | github.com/settings/security |
| GitHub org `WorldDigitalai` | "Require two-factor authentication" on; remove members who no longer need access | Organization → Settings → Authentication security; People |
| Google (Workspace / Cloud owner, Ads, Search Console, GA4) | 2-Step Verification on, passkey or security key; Advanced Protection for the owner account | myaccount.google.com/security; Workspace admin: enforce 2SV |
| Google Cloud | Only intended principals hold Owner/Editor; no user-managed service-account keys | IAM & Admin → IAM; Service accounts → Keys |
| Cloudflare | 2FA on (security key preferred); review account members and API tokens; delete unused tokens | dash.cloudflare.com → My Profile → Authentication; Manage Account → Members, API Tokens |
| Stripe | 2FA on for every team member; restrict roles; review API keys | Dashboard → Settings → Team and security |
| MongoDB Atlas | MFA on; review organization and project users; check Network Access (see S-9) | Account → Security; Organization → Access Manager |
| Resend | 2FA on; review API keys | Settings → Account; API Keys |
| DataForSEO | Strong unique password; API password separate from the login password | Profile → API access |
| Buffer, Replit (legacy), Hugging Face, OpenAI | 2FA on; revoke unused keys; close Replit apps that held old secrets | each account's security settings |

**GitHub plan finding:** the organization is on GitHub's free plan, which doesn't support branch protection on private repositories. Moving to GitHub Team (per-user monthly price; check github.com/pricing) enables required status checks and blocks direct pushes to `main`. Until then, keep using pull requests by convention.

## Target controls for the platform
Identity (email link + Google OIDC for customers; MFA for WorldDigital staff), RBAC per tenant, row-level security, OAuth tokens encrypted with KMS, audit of every data access and action, per-tenant rate limits, secrets rotation every 90 days, annual penetration test before enterprise sales, and SOC 2 readiness when enterprise demand appears.

## Healthcare and PHI
The EHR/EMR integration offering (Epic, open.epic) **must not** process PHI in this stack. Requirements before any PHI: a separate Google Cloud project under a signed Google Cloud BAA, only HIPAA-eligible services, no PHI to LLM providers without a BAA covering that use, access logging, minimum-necessary data, and a HIPAA risk assessment. Marketing attribution for clinics should use de-identified, aggregated data only. This is an engineering constraint; get qualified legal and compliance advice.

## Related
[Monitoring](../reliability/WORLDDIGITAL_MONITORING_AND_OBSERVABILITY.md) · [Backlog](../development-roadmap/WORLDDIGITAL_IMPLEMENTATION_BACKLOG.md)
