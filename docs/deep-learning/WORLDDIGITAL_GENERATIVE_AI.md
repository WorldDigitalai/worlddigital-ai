# WorldDigital Generative AI

**Purpose.** All AI-generated content (ads, posts, reports, explanations): how it's produced, checked and kept honest.
**Scope.** Content packs, keyword explanations, reports, recommendation text and, later, images.
**Dependencies.** [AI Strategy](../artificial-intelligence/WORLDDIGITAL_AI_STRATEGY.md).
**Status.** Text generation EXISTING (tools API); the rest PROPOSED.

## EXISTING
`backend/app/services.py` calls OpenAI chat completions in JSON mode (default `gpt-5.4-mini`, falling back through `gpt-5.5`, `gpt-6-luna`, `gpt-5.4`, `gpt-5.2` if the project lacks access). `products.py` defines the prompts and enforces per-platform character limits for Google Search Ads, Facebook, Instagram, LinkedIn, X, TikTok, YouTube Shorts and Snapchat.

## PROPOSED
| Item | Design |
|---|---|
| Gateway | Move model choice into config; log tokens and cost per request and tenant; try OpenAI, Gemini (Vertex AI) and Claude per task by evaluation |
| Grounding | Generation receives facts (prices, services, locations) from the tenant profile or RAG; must not invent testimonials, results, prices or certifications (an existing repo rule) |
| Brand voice | Per-tenant style profile (tone, banned words, required disclaimers) |
| Reports | Numbers computed in SQL → template → LLM writes the narrative → a validator checks every number in the text appears in the data |
| Images | Generative images only with tenant approval, labeled as AI-generated where platforms require it |
| Safety | Moderation pass; platform ad-policy checks (health, finance, housing claims) |

## Related
[NLP and Transformers](WORLDDIGITAL_NLP_AND_TRANSFORMERS.md) · [Testing](../testing/WORLDDIGITAL_TESTING_STRATEGY.md)
