# WorldDigital Feature Engineering

**Purpose.** The feature catalogue and the rules that keep features correct (no leakage, tenant-scoped, reproducible).
**Scope.** Features for all models in [Model Development](../machine-learning/WORLDDIGITAL_ML_MODEL_DEVELOPMENT.md).
**Dependencies.** [Data Architecture](WORLDDIGITAL_DATA_ARCHITECTURE.md).
**Status.** PROPOSED.

## Rules
1. **Point-in-time:** every feature row has an `as_of_date`; it may only use data with `date < as_of_date` (and respects the conversion lag of each platform, e.g. Google Ads conversions settle over ~30 days).
2. **Tenant-scoped:** windows and normalizations are computed within a tenant, never across tenants unless the pooled-model consent exists.
3. **Defined once:** each feature is one SQL definition in Dataform (`ml_features.*`), reused by training and scoring.
4. **Snapshotted:** training sets are exported with the SQL commit hash.

## Catalogue (first set)

| Group | Features | Source |
|---|---|---|
| Search | impressions, clicks, CTR, position (7/28/90-day), position trend slope, query count, share of branded queries | `seo_raw.gsc_daily` |
| Site behavior | sessions, engaged-session rate, conversions by landing page and source, new vs returning | `analytics_raw`, GA4 export |
| Ads | spend, CPC, CTR, CPA, conversion rate (7/14/28-day), spend pacing vs budget, CTR decay since launch, impression share | `ads_raw`, `worlddigital_core.daily_*` |
| AI visibility | mention rate, citation rate, rank position per assistant, competitor mention rate | `geo_raw` |
| Technical | indexable, schema types, PageSpeed, CWV (LCP, INP, CLS) | `seo_raw.technical_seo_daily` |
| Calendar | weekday, US holidays, month, days since campaign start | generated |
| Text (NLP) | query intent class, topic cluster id | NLP job |
| Creative (CV) | has_text, text_area_ratio, has_price, dominant hue, aspect ratio | Vision job |

## Validation
Feature tests: value ranges, null rates within thresholds, and a "train/serve skew" check comparing the scoring-day distribution with training.

## Related
[ML Architecture](../machine-learning/WORLDDIGITAL_MACHINE_LEARNING_ARCHITECTURE.md)
