#!/usr/bin/env python3
"""Analyze manually collected, independent AI-search responses. Standard library only."""
import argparse, csv, json, re
from collections import defaultdict
from pathlib import Path
DOMAIN = "worlddigital.ai"
NAME = re.compile(r"\bworld\s*digital(?:\.ai)?\b", re.I)
URL = re.compile(r"https?://[^\s<>\]\)\"']+", re.I)
FIELDS = ["date_utc","platform","prompt_id","run_id","response","source_urls"]

def analyze(path):
    rows = list(csv.DictReader(open(path, encoding="utf-8-sig", newline="")))
    if not rows:
        raise SystemExit("No observations. Do not report a visibility score.")
    if not set(FIELDS).issubset(rows[0]):
        raise SystemExit("Required columns: " + ", ".join(FIELDS))
    groups = defaultdict(list)
    for r in rows:
        if not all(r.get(k, "").strip() for k in ("date_utc","platform","prompt_id","run_id","response")):
            raise SystemExit("Every observation needs date, platform, prompt ID, run ID and response.")
        urls = URL.findall(r["source_urls"] or "")
        from urllib.parse import urlparse
        cited = any((urlparse(u).hostname or "").lower().removeprefix("www.") == DOMAIN
                    or (urlparse(u).hostname or "").lower().endswith("." + DOMAIN) for u in urls)
        mentioned = bool(NAME.search(r["response"]))
        groups[r["platform"].strip().lower()].append({"mentioned": mentioned, "cited": cited})
    report = {"method": "Observed outputs only; no simulated AI answers.", "platforms": {}}
    for platform, data in sorted(groups.items()):
        n = len(data)
        report["platforms"][platform] = {"observations": n,
            "mentions": sum(x["mentioned"] for x in data),
            "citations": sum(x["cited"] for x in data),
            "mention_rate": round(sum(x["mentioned"] for x in data)/n, 4),
            "citation_rate": round(sum(x["cited"] for x in data)/n, 4)}
    return report

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("csv_file", type=Path)
    p.add_argument("--output", type=Path)
    a = p.parse_args()
    output = json.dumps(analyze(a.csv_file), indent=2)
    if a.output: a.output.write_text(output + "\n", encoding="utf-8")
    print(output)
