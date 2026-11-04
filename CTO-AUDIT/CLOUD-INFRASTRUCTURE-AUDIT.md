# Cloud and infrastructure audit

**Scope note:** the Google Cloud and Cloudflare consoles weren't reachable from this audit. Findings come from the deploy
workflows, `backend/setup-gcp.sh`, `wrangler.jsonc` files, workflow annotations, open PR #3, and live behaviour. IAM,
logs, alerts, budgets and billing are **UNVERIFIED**.

## What exists (verified)

| Service | Used for | Config evidence |
|---|---|---|
| Cloud Run `worlddigital-ai-api` | Tools API | `--allow-unauthenticated --min-instances=0 --max-instances=3 --memory=1Gi --timeout=300 --clear-network` |
| Secret Manager | `MONGODB_URI:5`, `OPENAI_API_KEY:2`, `INTERNAL_TOKEN`, `DATAFORSEO_*`, `STRIPE_SECRET_KEY`, `RESEND_API_KEY` | `deploy-backend.yml` `secrets:` |
| Cloud Build / Artifact Registry | Source deploys | `deploy-cloudrun@v2` with `source: backend` |
| Workload Identity Federation | GitHub → GCP sign-in | `WIF_PROVIDER`, `DEPLOY_SA` |
| BigQuery | Search Console bulk export, AI visibility snapshots | `site-audit.yml`, `.us` `tools/bigquery` |
| Cloudflare Workers, Durable Objects, KV, Turnstile, Observability | Both sites, report API, forms | `wrangler.jsonc` (`observability.enabled: true`) |
| Not used | Cloud SQL, Pub/Sub, Cloud Scheduler, Vertex AI, Datastream, Cloud Storage buckets (except build sources) | No references in code or workflows |

## Findings

| ID | Severity | Finding | Evidence | Recommendation | Approval |
|---|---|---|---|---|---|
| CLD-01 | HIGH | **No staging environment, no branch protection, deploy on every push to `main`**, and no automatic rollback | Workflows; GitHub API | Finish **PR #3** (safe deploy: tag new revision, health check with the site token, auto-return traffic). Use `pull_request` test runs (already configured) as the gate | Run PR #3 script |
| CLD-02 | HIGH | Backups missing (DB-01, DB-04) | – | One nightly backup workflow to Cloud Storage | Yes |
| CLD-03 | MEDIUM | Secrets as plain Cloud Run env vars: `TOOLS_API_TOKEN`, `GH_RESEND_API_KEY`, `MERCURY_API_TOKEN` | `env_vars:` block | PR #3 (first two); remove Mercury (SEC-03) | Yes |
| CLD-04 | MEDIUM | Production runs in a project named `cs-poc-0zqkvyxapah85tnxz2byzqa` ("POC") | `deploy-backend.yml` | Confirm it's on a paid billing account you own with a budget (PR #3 adds one), not a trial or partner sandbox that can expire. **UNVERIFIED** | Check |
| CLD-05 | MEDIUM | **No alerting** for the backend or the .ai site | No alert config in either repo; Monitoring **UNVERIFIED** | Reuse what exists: the .us report worker already emails a nightly check, so add `worlddigital.ai` pages and `/api/tools/health` to it. Add one Cloud Monitoring uptime check on `/api/tools/health` (free tier) | No (small) |
| CLD-06 | MEDIUM | Single region and single Atlas M0 cluster: Cloud Run us-central1 and Atlas central US are single points of failure | Config | Acceptable at this size. Cloudflare keeps the sites up if the backend is down (pages are served by the worker; only tools and chat fail) | – |
| CLD-07 | LOW | `min-instances=0` causes cold starts (the first tool request after idle is slower). The workflows wake it first | `flags` | Keep (cost). Revisit with traffic |
| CLD-08 | LOW | Deploy account has broad project roles (`run.admin`, `storage.admin`, `artifactregistry.admin`, `iam.serviceAccountUser`) | PR #3 description | PR #3 narrows them | Run PR #3 script |
| CLD-09 | LOW | Leftovers from the Mercury static-IP work: diagnostic workflows `gcp-static-egress.yml` and `show-egress-ip.yml`, plus possibly a NAT, router and reserved IP still billed | Workflows; earlier session | Delete the workflows; check in the console that the NAT, router and IP are gone (**UNVERIFIED**) | Yes |
| CLD-10 | LOW | GitHub Actions deprecations: Node 20 actions, `ubuntu-latest` → Ubuntu 26 | Annotations on every run | Bump action versions | No |

## Keep as is

- Cloud Run for the API (scale-to-zero, cheap, already wired with WIF and Secret Manager).
- Cloudflare Workers for both sites (fast, cheap, edge-cached).
- GitHub Actions as the scheduler. Cloud Scheduler or Pub/Sub would add nothing at this size.
