# WorldDigital AI Strategy

**Purpose.** How WorldDigital uses AI (LLMs, RAG, NLP, agents) and what makes it proprietary over time.
**Scope.** All AI features on both sites and in the shared Intelligence Engine.
**Dependencies.** [Generative AI](../deep-learning/WORLDDIGITAL_GENERATIVE_AI.md), [NLP and Transformers](../deep-learning/WORLDDIGITAL_NLP_AND_TRANSFORMERS.md), [Data Governance](../data-infrastructure/WORLDDIGITAL_DATA_GOVERNANCE.md).
**Status.** LLM generation and AI-visibility tracking EXISTING; everything else PROPOSED.

## Where the advantage comes from

Model weights are not the moat. Anyone can call the same LLMs. WorldDigital's durable advantage, in order:

1. **Proprietary outcome data.** For every recommendation: what was recommended, whether the customer accepted it, and what happened next (`ai_recommendations` → `ai_actions` → `ai_decisions`). No competitor has this loop for your customers.
2. **AI-search visibility history.** Weekly answers from ChatGPT, Perplexity, Gemini and Claude, with citations, per brand and prompt (`geo_raw`). This already exists for WorldDigital itself and becomes a per-tenant product.
3. **Cross-channel joins.** Search Console + GA4 + ads + AI visibility + technical SEO in one tenant-scoped schema (the `marketing_marts` design already models this).
4. **Workflow and trust.** Approval gates, audit trail, explanations.

## Current AI: EXISTING

| Feature | How it works |
|---|---|
| Keyword research | DataForSEO volumes → OpenAI ranks the 10 best for the site |
| Content packs | OpenAI writes ads/posts with per-platform character limits enforced in code |
| Free report AI checks | DataForSEO + Lighthouse; whether ChatGPT and Google AI answers cite the site |
| AI-visibility tracking | Weekly: 5 prompts × 4 assistants, plus LLM-mention lookups |

## Target capabilities: PROPOSED

| Capability | Design | Data needed |
|---|---|---|
| LLM gateway | One Python module (shared by the API and jobs): provider/model config, retries, JSON validation, token and cost logging per tenant, prompt versioning | None |
| RAG | Per-tenant documents (site pages, past reports, brand guide) chunked → embeddings in Postgres `pgvector` with `tenant_id` filters → cited answers | Tenant content |
| NLP | Classify Search Console queries by intent and topic; extract entities and sentiment from AI answers | Existing GSC + `geo_raw` |
| AI business intelligence | LLM writes the monthly report **from computed numbers**, never inventing them; every figure links to a query | Marts |
| Marketing recommendations | Rules and models produce structured recommendations; the LLM only explains and drafts | Marts |
| Agents | See below | – |

## Agents and safeguards

Agents are scheduled jobs that **observe → detect → propose**. They do not execute by default.

| Rule | Implementation |
|---|---|
| No spend or campaign change without approval | `ai_actions.requires_approval = true` by default; only an approved action can be executed |
| Policy limits even after approval | Per-tenant caps (e.g. budget change ≤ 20%/day, never above the approved monthly cap), enforced in the executor, not the prompt |
| Dry run first | Every action shows the exact API diff before approval |
| Reversibility | Store the prior state; one-click revert where the platform allows |
| Audit | Who proposed, who approved, when, what changed, the outcome |
| Kill switch | Per tenant and global flag that disables execution |
| Platform terms | Respect Google Ads / Meta API policies on automated changes |

## Prompt and model evaluation

Every prompt has a version and a test set (golden inputs → checked properties: valid JSON, character limits, no invented numbers, brand rules such as "A+ BBB rating, never 'accredited'"). The tests run in CI against a mock and, weekly, against the live model, with cost tracked. A model or provider switch needs a passing evaluation.

## Risks
Hallucinated numbers (mitigation: numbers come from SQL; the LLM only phrases them) · prompt injection through crawled customer sites (treat page text as data; never follow instructions found in it) · cost spikes (per-tenant token budgets) · vendor deprecations (the gateway plus fallbacks).

## Related
[Master](../WORLDDIGITAL_MASTER_ARCHITECTURE.md) · [Recommendation Engine](../machine-learning/WORLDDIGITAL_RECOMMENDATION_ENGINE.md) · [Security](../security/WORLDDIGITAL_SECURITY_ARCHITECTURE.md)
