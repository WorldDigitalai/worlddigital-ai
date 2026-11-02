# WorldDigital Computer Vision

**Purpose.** How ad creatives are analyzed, and what is needed before "creative effectiveness" can be predicted.
**Scope.** Creative Intelligence on worlddigital.ai.
**Dependencies.** [Deep Learning Architecture](WORLDDIGITAL_DEEP_LEARNING_ARCHITECTURE.md), [External Integrations](../integrations/WORLDDIGITAL_EXTERNAL_INTEGRATIONS.md).
**Status.** PROPOSED. No vision code exists. The archived app has AI media and video generation services, but no analysis.

## Stages
1. **Describe (no training).** For each creative pulled from an ad platform: Cloud Vision labels, text (OCR), dominant colors, faces present (count only, no identification), logo presence; multimodal-LLM critique against platform specs (text density, safe zones, aspect ratio).
2. **Correlate (needs data).** Join creative attributes with performance (`daily_ad_metrics`). Report patterns within one tenant, such as "creatives with a visible price had 1.4× CTR," with sample sizes and confidence intervals.
3. **Predict (gate).** A model that scores a new creative before launch needs ≥ 500 creatives with ≥ 1,000 impressions each for the relevant platform and objective. Until then, stage 2 only.

## Constraints
- No facial recognition or demographic inference from faces.
- Creatives stay tenant-private. Cross-tenant pattern mining only with consent and aggregation (k ≥ 20 tenants).
- Stored in Cloud Storage under a `tenant_id/` prefix, with lifecycle deletion tied to the tenant.

## Related
[Generative AI](WORLDDIGITAL_GENERATIVE_AI.md) · [Customer Data Isolation](../security/WORLDDIGITAL_CUSTOMER_DATA_ISOLATION.md)
