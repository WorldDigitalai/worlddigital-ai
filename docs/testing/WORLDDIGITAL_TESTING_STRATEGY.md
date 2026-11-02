# WorldDigital Testing Strategy

**Purpose.** How code, data, models, prompts and tenant isolation are tested.
**Scope.** Both repos and the planned Intelligence Engine.
**Dependencies.** [Deployment](../google-cloud/WORLDDIGITAL_DEPLOYMENT_ARCHITECTURE.md).
**Status.** Per row.

| Layer | What exists | Add |
|---|---|---|
| Unit | `node --test` (ai-site, crawl-files); pytest with mongomock + respx (backend); pytest (report, unsubscribe, follow-ups, monitor, research) | Coverage report in CI |
| End-to-end | Report Worker e2e tests (no network) | Playwright smoke test of the tools flow against a staging revision |
| Pre-deploy site gates | `check_site.py`, `responsive_check.py` (worlddigital-us) | Equivalent link/schema gate for worlddigital-ai |
| Performance | Lighthouse workflows | Budget thresholds that fail the build |
| Data | – | Dataform assertions (not null, unique, accepted values, freshness, row-count deltas) |
| ML | – | Backtests vs baseline; no-leakage tests; per-segment metrics; train/serve skew check |
| LLM / prompts | Character limits enforced in code | Golden-set evaluation in CI (mocked) + weekly live run; "no invented numbers" validator |
| Tenant isolation | – | Two-tenant tests across every endpoint and BigQuery path (must return 0 foreign rows) |
| Security | – | Dependabot, secret scanning, container scanning; annual penetration test before enterprise |
| Automation safety | – | Executor simulation on historical data; policy-limit tests; kill-switch test |

**Rule (from the brief):** no feature is called working until it is implemented and these tests pass.

## Related
[ML Architecture](../machine-learning/WORLDDIGITAL_MACHINE_LEARNING_ARCHITECTURE.md) · [Isolation](../security/WORLDDIGITAL_CUSTOMER_DATA_ISOLATION.md#testing-isolation)
