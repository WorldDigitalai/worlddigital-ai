# WorldDigital Customer Data Isolation

**Purpose.** How each customer business's data stays separate in storage, processing, models and deletion.
**Scope.** The multi-tenant Intelligence Engine.
**Dependencies.** [Security](WORLDDIGITAL_SECURITY_ARCHITECTURE.md), [Data Architecture](../data-infrastructure/WORLDDIGITAL_DATA_ARCHITECTURE.md).
**Status.** PROPOSED. The `tenant_id` columns already exist in `worlddigital_core`, `worlddigital_ai`, `worlddigital_audit` and `worlddigital_raw` (IN PROGRESS).

## Diagram 6: Customer data and security

<!-- MERMAID:WORLDDIGITAL_CUSTOMER_DATA_SECURITY.mmd -->
```mermaid
%% Diagram 6: Customer data and security architecture (PROPOSED - no customer accounts exist today).
flowchart LR
  classDef existing fill:#e6f4ea,stroke:#1e7e34,color:#0b3d17
  classDef proposed fill:#fff4e5,stroke:#b26a00,color:#4a2c00,stroke-dasharray: 5 3
  classDef gate fill:#fde8e8,stroke:#b42318,color:#5c0b0b

  user([Customer user]):::proposed
  idp[Identity: email magic link / Google OIDC<br/>MFA for admins]:::proposed
  edge[Cloudflare edge:<br/>WAF, Turnstile, rate limits]:::existing
  gw[API layer: verifies session,<br/>resolves tenant_id + role]:::proposed
  rbac{RBAC check<br/>owner, admin, viewer}:::gate
  svc[Intelligence services]:::proposed
  sql[(Cloud SQL: row-level security<br/>by tenant_id)]:::proposed
  bq[(BigQuery: authorized views +<br/>row access policies by tenant_id)]:::proposed
  tok[(OAuth refresh tokens:<br/>Secret Manager / KMS envelope)]:::proposed
  models[Models: per-tenant by default;<br/>pooled only with consent]:::gate
  audit[(worlddigital_audit +<br/>Cloud Audit Logs)]:::existing
  del[Deletion workflow:<br/>tenant offboarding, 30-day purge]:::proposed

  user --> edge --> idp --> gw --> rbac
  rbac -->|allowed| svc
  rbac -->|denied| audit
  svc --> sql & bq & tok
  svc --> models
  svc --> audit
  del --> sql & bq & tok & models
  del --> audit
```
<!-- /MERMAID -->

**How it flows.** A customer user passes the Cloudflare edge (WAF, Turnstile, rate limits), signs in, and the API layer resolves `tenant_id` and role from the session, never from request input. An RBAC check allows or denies, and denials are logged. Services read and write Postgres under row-level security and BigQuery through authorized views and row access policies. OAuth tokens are fetched from encrypted storage. Models are per-tenant unless the tenant consented to pooling. Every access and action is audited. The deletion workflow purges every store and records the deletion.

## Model
- **Tenant** = a customer account (agency or business). **Business** = a brand or location under a tenant. Both ids are on every row.
- **Roles:** `owner` (billing, connections, approvals), `admin` (approvals), `analyst` (read + recommendations), `viewer` (read).
- WorldDigital staff access a tenant only through a time-boxed "support session" that the tenant can see in its audit log.

## Isolation by layer
| Layer | Mechanism |
|---|---|
| Postgres | Row-level security policies on `tenant_id = current_setting('app.tenant_id')`; app role without `BYPASSRLS` |
| BigQuery | Shared tables clustered by `tenant_id` + row access policies; the API queries through one data-access module that injects the tenant filter; tests prove cross-tenant reads return zero rows |
| Cloud Storage | `gs://<bucket>/tenant_id/…`; signed URLs only; no public objects |
| Secrets | One token record per (tenant, platform, account), encrypted with a KMS key |
| Caches | Cache keys prefixed with `tenant_id` |
| Logs | No C3/C4 data in logs; `tenant_id` included for tracing |
| LLM calls | Only that tenant's context; prompts and outputs are not used for provider training (enterprise or API terms) |

**When to use dataset-per-tenant instead:** enterprise contracts that require physical separation or a customer-managed key. Offer it as an enterprise tier (one dataset or project per tenant).

## Model isolation
Default: models are trained per tenant (or are unsupervised and per tenant). Pooled models need (1) a contract opt-in, (2) aggregated features only, no C3, (3) k-anonymity ≥ 20 tenants for any shared statistic shown back, and (4) removal from the next snapshot on opt-out. Benchmarks such as "your CTR vs similar businesses" use the same rules.

## Testing isolation
Automated tests create two tenants and assert that every API endpoint and every BigQuery access path returns only the caller's rows. These run in CI and nightly against staging.

## Related
[Data Governance](../data-infrastructure/WORLDDIGITAL_DATA_GOVERNANCE.md) · [Testing](../testing/WORLDDIGITAL_TESTING_STRATEGY.md)
