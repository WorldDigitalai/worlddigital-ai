# Enterprise and government readiness

**No certification or compliance is claimed.** The platform isn't SOC 2, NIST 800-53/171, HIPAA or FedRAMP certified or
assessed. This is a gap analysis against what those frameworks expect, based on what was verified in this audit.

| Area | Current state (evidence) | Gap | Priority |
|---|---|---|---|
| Data privacy | Privacy policy updated 2026-11-03 (chat questions, 180-day deletion, redaction); minimal data collected | No data map or records of processing; no DPA template for customers | Medium |
| Customer data ownership | Policies state customers own their accounts; customer knowledge bases are deletable per tenant (tested) | No self-serve export or delete (no accounts yet) | Low now |
| Audit logging | Admin actions are logged in the DO (`store.log`); knowledge-base syncs recorded in `rag_sync` | No central, tamper-evident log; backend request logs only in Cloud Run (retention **UNVERIFIED**); no log review | High for enterprise |
| Access controls | Admin magic link + CSRF + one allow-listed admin; WIF for CI | **DB user is `atlasAdmin`** (SEC-02); no branch protection; broad deploy roles (PR #3 pending); single admin, so no separation of duties | High |
| Encryption | TLS everywhere (HSTS preload on .ai); Atlas encrypts at rest by default; secrets mostly in Secret Manager | Some secrets as plaintext env vars (SEC-04, SEC-03) | Medium |
| Disaster recovery | Code in GitHub; infra re-creatable from workflows | **No database backups** (DB-01); no Durable Object export (DB-04); no written recovery steps; RTO/RPO undefined | High |
| Incident response | Nightly monitor email (.us); weekly SEO crawl | No written incident plan, on-call, status page or alerting on the backend (CLD-05) | High |
| Business continuity | Sites keep serving if the backend is down (worker-rendered) | Single region; single person holds all accounts; production in a "POC"-named GCP project (CLD-04) | Medium |
| Documentation | Architecture, RAG, roadmap and security backlog in `docs/`; this audit | No runbooks per failure (DB down, key leak, Stripe outage) | Medium |
| API reliability | Health endpoint; tests gate deploys; quality test nightly | No SLOs or uptime history | Medium |
| Vendor management | Vendors are mainstream (Google, Cloudflare, MongoDB, OpenAI, Stripe, Resend, DataForSEO, Buffer) | No vendor list with DPAs and SOC 2 reports on file | Low |
| SLA readiness | – | No measured uptime, so no SLA can be offered yet | Medium |
| SOC 2 readiness | Some technical controls in place (above) | Policies, access reviews, change management evidence (PR reviews), backups, monitoring, vendor reviews, about 3–6 months of evidence | Planning |
| NIST alignment | Partial: Identify/Protect basics | Detect/Respond/Recover functions weak (logging, alerting, backups, IR plan) | Planning |
| FedRAMP | **Not applicable today.** The stack runs on commercial (non-FedRAMP-authorised-boundary) services and has no federal customers | If federal work is planned, use FedRAMP-authorised offerings (e.g. Google Cloud's authorised services, Atlas for Government) and a 3PAO assessment. Multi-year effort | Only if pursued |
| HIPAA (EHR integration page) | The site offers Epic/EHR integration as a service | The platform doesn't store PHI. Any client project handling PHI needs its own BAA-covered environment, never this stack | Note |

## Shortest path to "enterprise-credible"

1. Backups and a tested restore (DB-01, DB-04).
2. Least-privilege DB user; finish PR #3; remove Mercury.
3. Backend uptime alert plus a one-page incident plan.
4. Branch protection (GitHub Team) for change-management evidence.
5. A short security page with the facts in SECURITY-AUDIT.md, without claiming any certification.
