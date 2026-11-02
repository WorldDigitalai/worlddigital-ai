# WorldDigital Predictive Analytics

**Purpose.** The customer-facing predictive features (forecasts, opportunities, dashboards) and how they're computed.
**Scope.** SEO, AI-search, advertising and business forecasts on both sites.
**Dependencies.** [Model Development](WORLDDIGITAL_ML_MODEL_DEVELOPMENT.md), [Data Architecture](../data-infrastructure/WORLDDIGITAL_DATA_ARCHITECTURE.md).
**Status.** Mart schemas IN PROGRESS (`marketing_marts`, created 2026-08-27, mostly empty); features PROPOSED.

## Existing mart design (reuse it)
`marketing_marts` already defines the right tables. They are not populated:

| Table | Use |
|---|---|
| `continuous_seo_geo_ai_visibility` | Daily wide table joining SEO, GA4, ads, social, AI visibility, technical SEO, backlinks, with sub-scores |
| `content_opportunities`, `keyword_geo_gaps`, `high_value_geo_opportunities` | Opportunity lists |
| `optimization_recommendations` | Action + tier per URL/keyword |
| `ai_citation_leaders`, `prompt_level_ai_visibility`, `visibility_score` | AI-search scorecards |
| `ai_prompt_universe` (8,136 rows), `keyword_universe` (118 rows) | Inputs (populated) |

**Recommendation:** implement these as Dataform models on top of `seo_raw`, `analytics_raw`, `ads_raw` and `geo_raw`, add `tenant_id`, and populate them for WorldDigital first (tenant 0, "dogfooding").

## Features

| Feature | Calculation | First method |
|---|---|---|
| SEO opportunity score | impressions × (expected CTR at target position − actual CTR), for queries at position 4–20 | SQL (CTR curve from the tenant's own GSC data, fallback to an industry curve) |
| AI-visibility score | mention rate and citation rate per assistant and prompt, rank-weighted | SQL |
| GEO gap | keywords where Google position is good but AI assistants don't cite the brand | SQL join |
| Lead / conversion forecast | weekly series per site | Seasonal naïve → `ARIMA_PLUS` at 90 days of data |
| CAC and ROAS | spend ÷ new customers; revenue ÷ spend | SQL, **needs server-side purchases** |
| Marketing ROI estimate | incremental conversions × value − cost | Ranges with confidence intervals, never point claims |

## Presentation rules
Every prediction shows a range, the period it's based on, and a "why" link to the numbers. Forecasts with fewer than 90 days of history are labeled "early estimate."

## Related
[Recommendation Engine](WORLDDIGITAL_RECOMMENDATION_ENGINE.md) · [Feature Engineering](../data-infrastructure/WORLDDIGITAL_FEATURE_ENGINEERING.md)
