# WorldDigital ML Model Development

**Purpose.** The list of candidate models, the data gate each must pass before it is built, its baseline, its metric and its first implementation.
**Scope.** Every ML opportunity named in the project brief.
**Dependencies.** [ML Architecture](WORLDDIGITAL_MACHINE_LEARNING_ARCHITECTURE.md), [Feature Engineering](../data-infrastructure/WORLDDIGITAL_FEATURE_ENGINEERING.md).
**Status.** All PROPOSED.

## Data reality (verified 2026-11-02)

| Source | Window | Volume |
|---|---|---|
| Search Console, worlddigital.ai | 2026-09-21 → 10-31 | 25,141 impressions, 27 clicks |
| Search Console, worlddigital.us | 2026-10-05 → 10-31 | 3,005 impressions, 3 clicks |
| GA4, worlddigital.ai | 2026-08-20 → today | 42,768 events, 11,232 pseudo-users |
| GA4, worlddigital.us | 2026-10-05 → today | 2,765 events, 440 pseudo-users |
| Google Ads (account 442-763-5466) | 2026-10-22 → 10-29 | 29 clicks, ≈$14 spend |
| AI visibility | 2 weekly runs | 233 rows |
| Customer tenants | – | 0 |

**Conclusion:** none of the supervised models below can be trained responsibly on today's data. Conversions number in the single digits. The first year of "intelligence" must be rules, statistics, forecasting at aggregate level, and LLM explanation, **while the instrumentation captures labels.** The gates below say when each model becomes worth building.

## Model catalogue

Gates are rules of thumb for a first credible model. Confirm each with a learning curve once data exists.

| Model | Business question | Baseline (ship first) | Gate to build ML | First ML | Metric |
|---|---|---|---|---|---|
| Marketing performance forecast | Clicks/leads next 4–12 weeks | Seasonal naïve (same weekday, last 4 weeks) | ≥ 90 days of daily data per series | BQML `ARIMA_PLUS` | MAPE / MASE vs baseline |
| Predictive ad performance | Expected CPA/CTR per campaign | Trailing 14-day CPA | ≥ 30 campaigns with ≥ 30 conversions each, across tenants with consent | BQML `BOOSTED_TREE_REGRESSOR` | MAE vs baseline |
| Spend anomaly / inefficient spend | Is today's spend abnormal? | Rule: spend > 3× trailing median, or spend with 0 conversions for N days | ≥ 60 days per account | BQML `ARIMA_PLUS` + `ML.DETECT_ANOMALIES` | Precision at alert |
| Budget allocation | Where should the next dollar go? | Marginal CPA ranking | ≥ 3 campaigns with budget variation history | Diminishing-returns curves per campaign | Simulated CPA improvement, then A/B |
| Conversion probability | Will this session convert? | Rate by landing page × source | ≥ 1,000 conversions | BQML `LOGISTIC_REG` → `BOOSTED_TREE_CLASSIFIER` | AUC-PR, calibration |
| Lead scoring | Which leads to call first? | Rules: plan interest + site size + reply | ≥ 500 leads with ≥ 50 won | BQML `LOGISTIC_REG` | AUC, lift in top decile |
| Customer segmentation | Which customers are alike? | Industry × size | ≥ 50 tenants | BQML `KMEANS` | Silhouette + usefulness review |
| Customer lifetime value | What is a customer worth? | Average revenue × average tenure | ≥ 100 paying customers with ≥ 6 months | BG/NBD + Gamma-Gamma (Python) | Calibration on holdout |
| Churn | Who will cancel? | Rules: usage drop, failed payment, no login 30 days | ≥ 30 churn events | BQML `BOOSTED_TREE_CLASSIFIER` | AUC-PR |
| Keyword opportunity | Which keywords to target? | Score = volume × (1 − difficulty) × intent fit × position gap | Exists now (DataForSEO + GSC) | Learned weights once outcome data exists | Ranking gain after 90 days |
| Business growth forecast | Next-quarter leads and revenue | Linear trend | ≥ 12 months | BQML `ARIMA_PLUS_XREG` | MAPE |

## Development workflow (per model)
1. Write the model card: question, decision it changes, metric, baseline.
2. Build the feature view; check for leakage (only data available at prediction time).
3. Implement and measure the baseline, and ship it if it helps.
4. Train the BQML model on a time-based split; backtest over ≥ 3 folds.
5. Ship only if it beats the baseline by ≥ 10% on the primary metric and is not worse for any tenant segment.
6. Register: model id, SQL commit, data snapshot, metrics.
7. Batch-score daily; monitor; retrain on trigger.

## Foundation models
Training a foundation model from scratch is **out of scope**. The business case would need tens of millions of dollars, specialized staff and data WorldDigital does not have. Fine-tuning a small open model (e.g. a classifier for query intent) becomes reasonable once there are ≥ 5,000 labeled examples and an LLM-API baseline proves too slow or costly.

## Related
[Predictive Analytics](WORLDDIGITAL_PREDICTIVE_ANALYTICS.md) · [Roadmap](../development-roadmap/WORLDDIGITAL_MASTER_ROADMAP.md)
