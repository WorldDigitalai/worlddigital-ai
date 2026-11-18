# 565-question Knowledge Base import — staging checklist

Tracking: #36 / PR #37.

## Current state

The original 565 question-and-answer texts are **not stored in this branch**. The JSON example is a placeholder, **not** an importable dataset. Do not claim the import, RAG audit, or deployment has run.

## Required source data

Export the exact previously approved 565 Q&As, preserving original answers, categories and question numbering. Each record needs: id, category, question, answer, paraphrases, scope, source_url, verified_at and status.

- Q1–525: general digital-marketing education; do not misrepresent these as verified WorldDigital.ai service claims.
- Q526–565: company-specific; review against current official website/code. Block unsupported pricing, compliance, contracts, features and integration claims.
- Maintain private/public/tenant source isolation and admin authorization.

## Validation

Run `python tools/validate_kb_answers.py path/to/reviewed-answers.json`.
Run `python -m unittest discover -s tools -p 'test_validate_kb_answers.py'`.

## Deployment gate

1. Obtain exact source records and review all company-specific facts.
2. Build a dry-run importer compatible with the existing approved-answer API/storage schema.
3. Back up current approved answers and import to staging first; verify idempotency and rollback.
4. Run covered, paraphrased, unsupported, adversarial and ambiguous-question evaluations, plus citation and latency checks.
5. Obtain review and explicit approval before production deployment.
