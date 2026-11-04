"""Restore a nightly backup into MongoDB (upsert by _id; nothing is deleted).

  1. Download the "backup-<run id>" artifact from the "Backup" workflow run on GitHub and unzip it.
  2. Decrypt:  openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -in backup.tar.gz.enc -out backup.tar.gz -pass env:TOOLS_API_TOKEN
               tar xzf backup.tar.gz           ->  mongo.json, site.json, media-*.json
  3. MongoDB:  MONGODB_URI='mongodb+srv://...' python3 tools/restore_backup.py mongo.json [--db worlddigital_ai] [--dry-run]
  Blog posts, redirects and media (site.json, media-*.json) are restored by POSTing them to the site's
  /api/site/backup (see docs in workers/ai-site/src/index.js); or ask Claude to do it.
"""
import argparse
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from bson import json_util  # noqa: E402
from pymongo import MongoClient  # noqa: E402

from app import backup  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("file")
ap.add_argument("--db", default="worlddigital_ai")
ap.add_argument("--dry-run", action="store_true")
a = ap.parse_args()
raw = open(a.file, encoding="utf-8").read()
if a.dry_run:
    d = json_util.loads(raw)
    print("backup from", d["created"], "counts:", d["counts"])
    sys.exit(0)
print(backup.restore(MongoClient(os.environ["MONGODB_URI"])[a.db], raw))
