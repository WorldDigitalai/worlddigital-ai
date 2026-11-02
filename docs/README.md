# WorldDigital Documentation

The architecture documentation for the WorldDigital ecosystem: **worlddigital.ai** (this repo) and **worlddigital.us** (repo `WorldDigitalai/worlddigital-us`). Start with the **[Master Architecture](WORLDDIGITAL_MASTER_ARCHITECTURE.md)**. It is the single source of truth and links to everything below.

Status labels used everywhere: **EXISTING** (verified) · **IN PROGRESS** (partly built) · **PROPOSED** (recommended) · **NEEDS VERIFICATION** (not confirmed).

## Index

| Area | Documents |
|---|---|
| Overview | [Master Architecture](WORLDDIGITAL_MASTER_ARCHITECTURE.md) · [Brand and Project Inventory](WORLDDIGITAL_BRAND_AND_PROJECT_INVENTORY.md) |
| Architecture | [Product](architecture/WORLDDIGITAL_PRODUCT_ARCHITECTURE.md) · [WorldDigital.ai Platform](architecture/WORLDDIGITAL_AI_PLATFORM_ARCHITECTURE.md) · [WorldDigital.us](architecture/WORLDDIGITAL_US_ARCHITECTURE.md) · [Technology Stack](architecture/WORLDDIGITAL_TECHNOLOGY_STACK.md) · [Diagrams](architecture/diagrams/) |
| Artificial intelligence | [AI Strategy](artificial-intelligence/WORLDDIGITAL_AI_STRATEGY.md) |
| Machine learning | [ML Architecture](machine-learning/WORLDDIGITAL_MACHINE_LEARNING_ARCHITECTURE.md) · [Model Development](machine-learning/WORLDDIGITAL_ML_MODEL_DEVELOPMENT.md) · [Predictive Analytics](machine-learning/WORLDDIGITAL_PREDICTIVE_ANALYTICS.md) · [Recommendation Engine](machine-learning/WORLDDIGITAL_RECOMMENDATION_ENGINE.md) |
| Deep learning | [DL Architecture](deep-learning/WORLDDIGITAL_DEEP_LEARNING_ARCHITECTURE.md) · [NLP and Transformers](deep-learning/WORLDDIGITAL_NLP_AND_TRANSFORMERS.md) · [Computer Vision](deep-learning/WORLDDIGITAL_COMPUTER_VISION.md) · [Generative AI](deep-learning/WORLDDIGITAL_GENERATIVE_AI.md) |
| Data infrastructure | [Data Architecture](data-infrastructure/WORLDDIGITAL_DATA_ARCHITECTURE.md) · [Data Pipelines](data-infrastructure/WORLDDIGITAL_DATA_PIPELINES.md) · [Feature Engineering](data-infrastructure/WORLDDIGITAL_FEATURE_ENGINEERING.md) · [Data Governance](data-infrastructure/WORLDDIGITAL_DATA_GOVERNANCE.md) |
| Google Cloud | [Google Cloud Architecture](google-cloud/WORLDDIGITAL_GOOGLE_CLOUD_ARCHITECTURE.md) · [Deployment Architecture](google-cloud/WORLDDIGITAL_DEPLOYMENT_ARCHITECTURE.md) |
| Integrations | [API Architecture](integrations/WORLDDIGITAL_API_ARCHITECTURE.md) · [External Integrations](integrations/WORLDDIGITAL_EXTERNAL_INTEGRATIONS.md) |
| Security | [Security Architecture](security/WORLDDIGITAL_SECURITY_ARCHITECTURE.md) · [Customer Data Isolation](security/WORLDDIGITAL_CUSTOMER_DATA_ISOLATION.md) |
| Reliability | [Backup and Disaster Recovery](reliability/WORLDDIGITAL_BACKUP_AND_DISASTER_RECOVERY.md) · [Monitoring and Observability](reliability/WORLDDIGITAL_MONITORING_AND_OBSERVABILITY.md) |
| Roadmap | [Master Roadmap](development-roadmap/WORLDDIGITAL_MASTER_ROADMAP.md) · [Implementation Backlog](development-roadmap/WORLDDIGITAL_IMPLEMENTATION_BACKLOG.md) |
| Testing | [Testing Strategy](testing/WORLDDIGITAL_TESTING_STRATEGY.md) |
| Financial planning | [Cost Analysis](financial-planning/WORLDDIGITAL_COST_ANALYSIS.md) |
| Existing (kept) | [worlddigital-ai-keywords.md](worlddigital-ai-keywords.md): keyword map |

### Diagrams
[Ecosystem](architecture/diagrams/WORLDDIGITAL_ECOSYSTEM_MAP.mmd) · [AI/ML](architecture/diagrams/WORLDDIGITAL_AI_ML_ARCHITECTURE.mmd) · [Deep learning](architecture/diagrams/WORLDDIGITAL_DEEP_LEARNING_ARCHITECTURE.mmd) · [Advertising intelligence](architecture/diagrams/WORLDDIGITAL_ADVERTISING_INTELLIGENCE.mmd) · [Google Cloud](architecture/diagrams/WORLDDIGITAL_GOOGLE_CLOUD_INFRASTRUCTURE.mmd) · [Customer data security](architecture/diagrams/WORLDDIGITAL_CUSTOMER_DATA_SECURITY.mmd) · [Data pipeline](architecture/diagrams/WORLDDIGITAL_DATA_PIPELINE.mmd) · [Deployment](architecture/diagrams/WORLDDIGITAL_DEPLOYMENT_WORKFLOW.mmd)

The `.mmd` files are the source. Each diagram is also embedded in the document that explains it, between `<!-- MERMAID:… -->` / `<!-- /MERMAID -->` markers. Edit the `.mmd` file, then update the embedded copy.

## Notes on file names and placement
- The first brief asked for `WORLDDIGITAL_AI_ML_DL_MASTER_ARCHITECTURE.md`. It is **consolidated into** [WORLDDIGITAL_MASTER_ARCHITECTURE.md](WORLDDIGITAL_MASTER_ARCHITECTURE.md) so there is one master, not two.
- Your local outline listed `WORLDDIGITAL_MASTER/` with `README.md`, `…_ROADMAP.md`, `…_TECHNOLOGY_STACK.md` and `…_COST_ANALYSIS.md`. Those topics live at [development-roadmap/](development-roadmap/WORLDDIGITAL_MASTER_ROADMAP.md), [architecture/](architecture/WORLDDIGITAL_TECHNOLOGY_STACK.md) and [financial-planning/](financial-planning/WORLDDIGITAL_COST_ANALYSIS.md), following the second brief's structure.
- The docs live in **this repo only**, because worlddigital.ai is the platform. worlddigital.us is documented here too ([WorldDigital.us Architecture](architecture/WORLDDIGITAL_US_ARCHITECTURE.md)). A one-line pointer can be added to the worlddigital-us README if wanted.
- Every requested file applies. Documents for capabilities that don't exist yet (computer vision, recommendation engine, deep learning) say so, and define the gate for building them, instead of describing imaginary systems.

## How to keep this the single source of truth
When a technical decision changes:
1. Update the supporting document.
2. Update the [Master Architecture](WORLDDIGITAL_MASTER_ARCHITECTURE.md), including the decision log, if the summary or a decision changed.
3. Update the affected `.mmd` diagram and its embedded copy.
4. Update the [Roadmap](development-roadmap/WORLDDIGITAL_MASTER_ROADMAP.md) and the [Backlog](development-roadmap/WORLDDIGITAL_IMPLEMENTATION_BACKLOG.md).
5. Check that internal links still resolve.

## Open questions that need your input
1. **Local `WorldDigital/` folder:** it wasn't on this laptop's home, Documents or Downloads folders. Where is it (another drive, OneDrive)? Does it contain anything that should be merged here?
2. **Google Cloud project:** are you OK creating `worlddigital-prod` / `worlddigital-dev` under a Google Cloud Organization (AD-9)? Is there an Organization today?
3. **Console-only facts:** Cloud Monitoring alerts, billing budgets, Cloud Storage buckets, MongoDB Atlas tier, backups and network rules, and the Cloudflare plan could not be read from this session.
4. **Customer portal:** when do you want to rebuild it, and do you have design-partner customers willing to connect ad accounts?
5. **Pooled learning:** will customer contracts include an opt-in for anonymized cross-customer benchmarks and models?
6. **Healthcare:** is the Epic/clinic product a priority within 12 months? It needs a separate project and a BAA.
7. **`worlddigitalai.com`:** do you own this domain? It appears once in archived code.
8. **LLM providers:** are you open to Gemini (Vertex AI) and Claude alongside OpenAI, chosen per task by evaluation?
