"""MongoDB storage.

Collections (database MONGODB_DB, default "worlddigital_ai"):
  tool_jobs    one document per preview/order: input, generated items, paid status, buyer email
  tool_cache   same request within 24h -> existing job (saves AI/data cost, keeps results stable)
  tool_paid    Stripe checkout session id -> job id
  tool_limits  per-IP daily counter for free previews
All have an `expires_at` TTL index, so MongoDB deletes old documents automatically.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from pymongo import ReturnDocument
from pymongo.collection import Collection
from pymongo.database import Database

PREVIEW_TTL = timedelta(days=30)
PAID_TTL = timedelta(days=365)
CACHE_TTL = timedelta(hours=24)


def now() -> datetime:
    return datetime.now(timezone.utc)


class Store:
    def __init__(self, db: Database):
        self.db = db
        self.jobs: Collection = db["tool_jobs"]
        self.cache: Collection = db["tool_cache"]
        self.paid: Collection = db["tool_paid"]
        self.limits: Collection = db["tool_limits"]

    def ensure_indexes(self) -> None:
        for c in (self.jobs, self.cache, self.paid, self.limits):
            c.create_index("expires_at", expireAfterSeconds=0)
        self.jobs.create_index([("paid", 1), ("paid_at", -1)])

    # jobs
    def get_job(self, job_id: str | None) -> dict | None:
        if not job_id or len(job_id) != 36:
            return None
        return self.jobs.find_one({"_id": job_id})

    def save_job(self, job: dict) -> None:
        job["expires_at"] = now() + (PAID_TTL if job.get("paid") else PREVIEW_TTL)
        self.jobs.replace_one({"_id": job["_id"]}, job, upsert=True)

    def mark_emailed(self, job_id: str) -> bool:
        """Atomically claim the right to send the delivery email; True only for the first caller."""
        res = self.jobs.find_one_and_update({"_id": job_id, "emailed": {"$ne": True}}, {"$set": {"emailed": True}})
        return res is not None

    def unmark_emailed(self, job_id: str) -> None:
        self.jobs.update_one({"_id": job_id}, {"$set": {"emailed": False}})

    # cache
    def cached_job_id(self, key: str) -> str | None:
        doc = self.cache.find_one({"_id": key, "expires_at": {"$gt": now()}})
        return doc["job_id"] if doc else None

    def put_cache(self, key: str, job_id: str) -> None:
        self.cache.replace_one({"_id": key}, {"_id": key, "job_id": job_id, "expires_at": now() + CACHE_TTL}, upsert=True)

    # paid sessions
    def paid_job_id(self, session_id: str) -> str | None:
        doc = self.paid.find_one({"_id": session_id})
        return doc["job_id"] if doc else None

    def put_paid(self, session_id: str, job_id: str) -> None:
        self.paid.replace_one({"_id": session_id}, {"_id": session_id, "job_id": job_id, "expires_at": now() + PAID_TTL},
                              upsert=True)

    # rate limit
    def hit(self, ip: str, limit: int) -> bool:
        """Count one free preview for this IP today; False when over the limit."""
        day = now().strftime("%Y-%m-%d")
        doc = self.limits.find_one_and_update(
            {"_id": f"{day}:{ip}"},
            {"$inc": {"n": 1}, "$setOnInsert": {"expires_at": now() + timedelta(hours=26)}},
            upsert=True, return_document=ReturnDocument.AFTER,
        )
        return doc["n"] <= limit
