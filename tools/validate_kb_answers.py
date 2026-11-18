"""Validate reviewed knowledge-base Q&A JSON before any import.

Usage: python tools/validate_kb_answers.py path/to/answers.json
This tool NEVER writes to the production knowledge base.
"""
import json
import re
import sys
from pathlib import Path

SCOPES = {"general_education", "worlddigital_verified", "pending_verification"}
STATUSES = {"draft", "reviewed", "approved", "blocked"}
FIELDS = {"id", "category", "question", "answer", "paraphrases", "scope", "source_url", "verified_at", "status"}

def validate(records):
    errors = []
    if not isinstance(records, list):
        return ["Root must be a JSON array"]
    seen_ids, seen_questions = set(), set()
    for i, item in enumerate(records):
        where = f"record {i + 1}"
        if not isinstance(item, dict):
            errors.append(f"{where}: expected object")
            continue
        missing = FIELDS - item.keys()
        if missing:
            errors.append(f"{where}: missing {', '.join(sorted(missing))}")
            continue
        ident = item["id"]
        if not isinstance(ident, int) or not 1 <= ident <= 565 or ident in seen_ids:
            errors.append(f"{where}: invalid or duplicate id")
        seen_ids.add(ident)
        q, a = item["question"], item["answer"]
        if not isinstance(q, str) or not q.strip() or not isinstance(a, str) or not a.strip():
            errors.append(f"{where}: question and answer must be nonempty strings")
        else:
            norm = re.sub(r"\W+", " ", q.casefold()).strip()
            if norm in seen_questions:
                errors.append(f"{where}: duplicate canonical question")
            seen_questions.add(norm)
        if item["scope"] not in SCOPES or item["status"] not in STATUSES:
            errors.append(f"{where}: invalid scope or status")
        if not isinstance(item["paraphrases"], list) or not all(isinstance(p, str) and p.strip() for p in item["paraphrases"]):
            errors.append(f"{where}: paraphrases must be a list of nonempty strings")
        if item["scope"] == "pending_verification" and item["status"] == "approved":
            errors.append(f"{where}: unverified content cannot be approved")
        if item["status"] == "approved" and item["scope"] == "worlddigital_verified":
            if not (isinstance(item["source_url"], str) and item["source_url"].startswith("https://worlddigital.ai/") and item["verified_at"]):
                errors.append(f"{where}: verified company claim needs website source and verification date")
    return errors

def main():
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python tools/validate_kb_answers.py answers.json")
    records = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    errors = validate(records)
    print(f"Records: {len(records) if isinstance(records, list) else 'invalid'}; errors: {len(errors)}")
    for error in errors:
        print("ERROR:", error)
    if isinstance(records, list) and len(records) != 565:
        print("WARNING: Expected 565 records in final curated dataset")
    raise SystemExit(1 if errors else 0)

if __name__ == "__main__":
    main()
