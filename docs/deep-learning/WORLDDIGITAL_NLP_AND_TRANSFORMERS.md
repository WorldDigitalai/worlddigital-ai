# WorldDigital NLP and Transformers

**Purpose.** The NLP tasks, the models for each and how they're evaluated.
**Scope.** Text understanding across search queries, AI answers, customer sites and reports.
**Dependencies.** [Deep Learning Architecture](WORLDDIGITAL_DEEP_LEARNING_ARCHITECTURE.md), [AI Strategy](../artificial-intelligence/WORLDDIGITAL_AI_STRATEGY.md).
**Status.** PROPOSED (the existing LLM calls are generation, covered in [Generative AI](WORLDDIGITAL_GENERATIVE_AI.md)).

| Task | Input | Output | First approach | Later |
|---|---|---|---|---|
| Search intent | GSC queries (`seo_raw.gsc_daily`) | informational / commercial / transactional / navigational / local | LLM batch classification, cached per query | Fine-tuned small encoder once ≥ 5k labels |
| Topic clustering | Queries + keyword universe | clusters → content hubs | Embeddings + k-means / HDBSCAN | – |
| AI-answer analysis | `geo_raw.ai_visibility_daily` answers | brand mentioned, competitors, sentiment, citation domains | LLM structured extraction | – |
| Site understanding | Crawled customer pages | services, locations, entities (for schema and RAG) | LLM extraction | – |
| Semantic retrieval | Tenant documents | top-k chunks with citations | Embeddings + `pgvector` | Reranker model |

## Evaluation
Per task: a labeled sample of 200+ items checked by a human. Track accuracy and macro-F1, and re-check monthly on fresh data. Results are cached to keep cost bounded.

## Risks
Prompt injection from crawled pages: they are treated as untrusted data, and outputs are validated against a JSON schema. Language coverage: US and Canada are mostly English, so French (Canada) needs its own test set.

## Related
[Recommendation Engine](../machine-learning/WORLDDIGITAL_RECOMMENDATION_ENGINE.md) · [Data Governance](../data-infrastructure/WORLDDIGITAL_DATA_GOVERNANCE.md)
