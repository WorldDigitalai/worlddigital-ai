"""Nightly backup of the MongoDB data that cannot be rebuilt (the knowledge-base embeddings can, so they are left out).

export() -> one JSON document (MongoDB Extended JSON, so dates and ids survive) with every backed-up collection.
restore(db, data) -> writes it back (upsert by _id; never deletes anything). Used by tools/restore_backup.py.
"""
from __future__ import annotations

from bson import json_util

from .store import now

# Collections worth keeping. rag_chunks: only private documents (internal + customer docs), without embeddings:
# their text exists nowhere else; website chunks are re-read from the site by the next sync.
COLLECTIONS = ["tool_jobs", "tool_paid", "tool_free_used", "tool_audit", "billing_customers", "billing_invoices",
               "billing_subscriptions", "rag_pages", "rag_tenants", "rag_meta", "rag_questions", "rag_sync"]


def export(db) -> str:
    out = {"format": "worlddigital-backup-v1", "created": now(), "collections": {}}
    for name in COLLECTIONS:
        out["collections"][name] = list(db[name].find({}, {"seen": 0} if name == "rag_sync" else None))
    out["collections"]["rag_chunks"] = list(db["rag_chunks"].find({"kind": "doc"}, {"embedding": 0}))
    out["counts"] = {k: len(v) for k, v in out["collections"].items()}
    return json_util.dumps(out)


def restore(db, raw: str) -> dict:
    data = json_util.loads(raw)
    if data.get("format") != "worlddigital-backup-v1":
        raise ValueError("not a worlddigital backup")
    done = {}
    for name, docs in data["collections"].items():
        for d in docs:
            db[name].replace_one({"_id": d["_id"]}, d, upsert=True)
        done[name] = len(docs)
    return done
