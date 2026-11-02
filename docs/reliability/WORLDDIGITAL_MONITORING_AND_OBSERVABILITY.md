# WorldDigital Monitoring and Observability

**Purpose.** What is watched today, and what to add for pipelines, models and the platform.
**Scope.** Sites, APIs, data pipelines, ML, cost.
**Dependencies.** [Data Pipelines](../data-infrastructure/WORLDDIGITAL_DATA_PIPELINES.md), [ML Architecture](../machine-learning/WORLDDIGITAL_MACHINE_LEARNING_ARCHITECTURE.md).
**Status.** Per row.

## EXISTING (strong)
- **Nightly 10 pm Chicago check** (report Worker cron): every sitemap page, 404 page, robots, llms, IndexNow key, unsubscribe service, report settings and DataForSEO balance → email to the founder; follow-up email section.
- **Nightly responsive test** (9:30 pm) on 9 viewport sizes, posted into the 10 pm email.
- **Pre-deploy gates:** `check_site.py`, `responsive_check.py`, unit and end-to-end tests.
- **Weekly site audit** (worlddigital-ai `site-audit.yml`) → one GitHub issue updated each run, including Search Console pages.
- **Lighthouse** after each ai-site deploy and weekly.
- **Cloud Run deploy health check**; Workers observability enabled.

## PROPOSED additions
| Signal | Tool | Alert when |
|---|---|---|
| API uptime | Cloud Monitoring uptime check on `/api/tools/health` | 2 failures in 5 min |
| API errors / latency | Cloud Run metrics | 5xx > 2% or p95 > 10 s over 15 min |
| Data freshness | Dataform assertions | any source > 36 h stale → add to the 10 pm email |
| Pipeline failures | `worlddigital_audit.data_sync_events` | any `status = 'error'` for a tenant two days running |
| Model drift / accuracy | scheduled SQL | PSI > 0.2 or accuracy below baseline + margin |
| LLM cost | gateway logs → BigQuery | daily spend > 2× the 7-day average, or a tenant over budget |
| Cloud cost | Billing budgets | 50 / 90 / 100% of the monthly budget |
| Recommendation health | `ai_recommendations` / `ai_actions` | acceptance rate drops 50% week over week |

One place to look: extend the existing 10 pm email with "Data", "Models" and "Costs" sections before building a dashboard.

## Related
[Backup and DR](WORLDDIGITAL_BACKUP_AND_DISASTER_RECOVERY.md) · [Testing](../testing/WORLDDIGITAL_TESTING_STRATEGY.md)
