# WorldDigital Backup and Disaster Recovery

**Purpose.** What can be lost, how it's backed up, and how fast it can be restored.
**Scope.** All production data stores and services.
**Dependencies.** [Data Architecture](../data-infrastructure/WORLDDIGITAL_DATA_ARCHITECTURE.md), [Deployment](../google-cloud/WORLDDIGITAL_DEPLOYMENT_ARCHITECTURE.md).
**Status.** Per row.

| Asset | Backup today | Target RPO / RTO | Action |
|---|---|---|---|
| Code, config | GitHub (both repos) | 0 / 1 h | EXISTING. Keep a local mirror |
| Blog posts + media (Durable Object SQLite) | Cloudflare point-in-time recovery for SQLite Durable Objects (30 days) **NEEDS VERIFICATION** for this account; seeds in `content/blog/` cover only the original posts | 24 h / 4 h | PROPOSED: nightly export of `posts` + `media` to R2 or Cloud Storage |
| Workers KV (reports, follow-ups) | None | 24 h / 1 day | PROPOSED: accept the loss risk (reports can be regenerated), or mirror lead events to BigQuery |
| MongoDB Atlas | Depends on the tier; **NEEDS VERIFICATION** | 24 h / 4 h | Enable continuous backup (paid tier) once paid orders matter |
| BigQuery | Time travel 7 days + fail-safe 7 days; exports re-deliverable by Google for limited windows | 24 h / 1 day | PROPOSED: table snapshots weekly for `worlddigital_core`, `worlddigital_ai` |
| Cloud SQL (future) | – | 5 min / 1 h | Automated backups + point-in-time recovery; HA when paying tenants exist |
| Secrets | Secret Manager versions | – | Keep an offline, encrypted inventory of which secrets exist and where to rotate them |
| DNS / Cloudflare config | Manual | – | Export zone files; Terraform later |

**Regional failure:** Cloudflare is global. Cloud Run us-central1 can be redeployed to another region from source in < 1 hour. BigQuery US multi-region is resilient. No active-active setup is needed at this stage.

**Restore drills:** quarterly, restore one blog post export and one BigQuery snapshot to a scratch dataset, and record the time taken.

## Related
[Monitoring](WORLDDIGITAL_MONITORING_AND_OBSERVABILITY.md)
