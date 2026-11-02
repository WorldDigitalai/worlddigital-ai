# WorldDigital Data Governance

**Purpose.** Consent, retention, deletion, access and data-quality policies.
**Scope.** All personal, customer and analytics data.
**Dependencies.** [Security](../security/WORLDDIGITAL_SECURITY_ARCHITECTURE.md), [Customer Data Isolation](../security/WORLDDIGITAL_CUSTOMER_DATA_ISOLATION.md).
**Status.** Existing TTLs and unsubscribe EXISTING; policies PROPOSED. **Have counsel review before customer launch.** This is an engineering design, not legal advice.

## Data classes

| Class | Examples | Where allowed |
|---|---|---|
| C0 Public | Page content, public SERP data | Anywhere |
| C1 Internal | Aggregated metrics, model outputs | Warehouse, dashboards |
| C2 Customer confidential | A tenant's ad performance, creatives, Search Console | Tenant-scoped tables only |
| C3 Personal data | Lead names and emails, user accounts, IPs | Operational stores; hashed or removed before the warehouse |
| C4 Secrets | API keys, OAuth refresh tokens | Secret Manager / KMS only |
| C5 PHI (healthcare) | Patient data | **Not permitted** in this stack; separate project under a BAA |

## Retention (proposed defaults)

| Data | Retention | Existing behavior |
|---|---|---|
| Tool previews | 30 days | EXISTING (Mongo TTL) |
| Paid tool orders | 1 year | EXISTING (Mongo TTL) |
| AI-visibility runs in KV | 120 days | EXISTING |
| Raw API payloads | 13 months | PROPOSED |
| Core metrics | Tenant lifetime + 30 days | PROPOSED |
| Audit logs | 400 days minimum | PROPOSED |
| Leads (C3) | 24 months since last interaction, or earlier on request | PROPOSED |

## Consent and permitted use
1. Tenant data is used **only** to serve that tenant (contract term).
2. **Pooled training** (cross-tenant) requires an explicit opt-in clause, aggregation, and the exclusion of C3 data. A tenant's opt-out removes its data from the next training snapshot.
3. Website visitors: GA4 / Ads tags already load only after interaction. Add a consent banner and Google Consent Mode v2 before EU/UK traffic is targeted. **NEEDS VERIFICATION** of current legal requirements for your markets (US states, Canada's PIPEDA / Quebec Law 25).
4. Email: unsubscribe EXISTING. Keep suppression lists permanent.

## Deletion
Tenant offboarding job: revoke OAuth tokens → delete Postgres rows → delete BigQuery rows (`DELETE WHERE tenant_id = …` across core, ai, ml, raw) → delete `gs://…/tenant_id/` → remove from future training snapshots → log a deletion certificate in the audit log. Target: within 30 days.

## Data quality and ground truth
- **Purchases must be recorded server-side** (Stripe webhooks). The current client-side `purchase` event on worlddigital.us `/thank-you` can't be used as an ML label.
- Lead outcomes (won/lost, value) need a CRM field or simple admin form. Without them, lead scoring can't be trained.

## Related
[Data Pipelines](WORLDDIGITAL_DATA_PIPELINES.md) · [Backup and DR](../reliability/WORLDDIGITAL_BACKUP_AND_DISASTER_RECOVERY.md)
