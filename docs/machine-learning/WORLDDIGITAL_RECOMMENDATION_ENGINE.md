# WorldDigital Recommendation Engine

**Purpose.** How recommendations are generated, ranked, explained, approved and learned from.
**Scope.** All recommendation types (ads, SEO, content, AI search, budget).
**Dependencies.** [AI Strategy](../artificial-intelligence/WORLDDIGITAL_AI_STRATEGY.md), [Predictive Analytics](WORLDDIGITAL_PREDICTIVE_ANALYTICS.md).
**Status.** Storage schema IN PROGRESS (`worlddigital_ai.*`, empty); engine PROPOSED.

## Pipeline
1. **Candidate generators** (rules + models) write candidates with `recommendation_type`, `suggested_action` (JSON), `rationale`, `confidence`, `expires_at`.
2. **Ranking:** expected impact (in $ or conversions) × confidence ÷ effort. Show at most 5 per tenant per week to avoid fatigue.
3. **Explanation:** the LLM turns the structured rationale into 2–3 plain sentences. Numbers are inserted from fields, not generated.
4. **Decision:** accept / edit / dismiss with a reason → `ai_actions`.
5. **Outcome:** measured after a fixed window → `ai_decisions.outcome_value`.
6. **Learning:** acceptance rate and realized impact per generator. Generators that underperform are down-weighted, then retired.

## Recommendation types (first set)

| Type | Generator | Needs |
|---|---|---|
| `ads.pause_wasted_terms` | Search terms with spend and 0 conversions over 30 days | Ads connector |
| `ads.shift_budget` | Marginal CPA ranking | Ads connector |
| `seo.improve_ctr` | High impressions, low CTR at position 4–10 → rewrite title/meta | GSC |
| `seo.new_content` | Keyword-universe gaps with no ranking page | GSC + DataForSEO |
| `geo.earn_citation` | Prompts where competitors are cited and the tenant isn't | AI visibility |
| `tech.fix` | Technical audit failures that block indexing | Site audit |

## Deep learning later
Two-tower or sequence recommenders only make sense with thousands of tenants and dense interaction logs. Until then, rules + ranking + feedback weights is the right design. Revisit trigger: ≥ 1,000 active tenants and ≥ 50,000 decisions logged.

## Related
[Advertising Intelligence diagram](../architecture/WORLDDIGITAL_AI_PLATFORM_ARCHITECTURE.md#diagram-3-advertising-intelligence-workflow) · [Customer Data Isolation](../security/WORLDDIGITAL_CUSTOMER_DATA_ISOLATION.md)
