"""Fetch WorldDigital.ai's published social posts and their metrics from Buffer.

Usage:  BUFFER_API_TOKEN=... python tools/fetch_social.py [--out workers/ai-site/data/social.json] [--max 500]
Writes a JSON file the /social page is built from. If the token is missing or Buffer fails,
the existing file is kept (the site still builds) and the script exits 0 with a warning.
"""
import argparse
import json
import os
import pathlib
import sys
import urllib.request

API = "https://api.buffer.com"
ROOT = pathlib.Path(__file__).resolve().parents[1]

Q_ORG = "query { account { organizations { id name } } }"
Q_POSTS = """query Posts($org: OrganizationId!, $after: String) {
  posts(first: 100, after: $after, input: {organizationId: $org, filter: {status: [sent]}, sort: [{field: dueAt, direction: desc}]}) {
    pageInfo { hasNextPage endCursor }
    edges { node {
      id text sentAt channelService externalLink
      channel { displayName name }
      assets { type thumbnail source }
      metrics { type value }
    } }
  }
}"""

# Weighted engagement: deeper actions count more than likes.
WEIGHTS = {"reactions": 1, "likes": 1, "comments": 3, "shares": 4, "reposts": 4, "saves": 3, "clicks": 2, "quotes": 3}
LABEL = {"tiktok": "TikTok", "instagram": "Instagram", "facebook": "Facebook", "linkedin": "LinkedIn",
         "twitter": "X", "youtube": "YouTube", "googlebusiness": "Google Business"}


def gql(token, query, variables=None):
    req = urllib.request.Request(API, data=json.dumps({"query": query, "variables": variables or {}}).encode(),
                                 headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json",
                                          "User-Agent": "WorldDigitalSocialSync/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = json.load(r)
    if data.get("errors"):
        raise RuntimeError("; ".join(e.get("message", "?") for e in data["errors"])[:300])
    return data["data"]


def score(m):
    eng = sum(m.get(k, 0) * w for k, w in WEIGHTS.items())
    views = m.get("views") or m.get("impressions") or m.get("reach") or 0
    return round(eng + views / 100, 3)


def shape(node):
    m = {x["type"]: x["value"] for x in (node.get("metrics") or [])}
    asset = (node.get("assets") or [{}])[0] if node.get("assets") else {}
    text = " ".join((node.get("text") or "").split())
    return {
        "id": node["id"],
        "platform": node["channelService"],
        "platformLabel": LABEL.get(node["channelService"], node["channelService"].title()),
        "account": (node.get("channel") or {}).get("displayName") or (node.get("channel") or {}).get("name") or "",
        "date": (node.get("sentAt") or "")[:10],
        "text": text[:400],
        "link": node.get("externalLink") or (asset.get("source") if (asset.get("source") or "").startswith("https://www.tiktok.com/") else None),
        "thumb": asset.get("thumbnail") or None,
        "type": asset.get("type") or "text",
        "metrics": {k: m[k] for k in ("views", "reach", "impressions", "reactions", "comments", "shares", "saves", "clicks", "engagementRate") if k in m},
        "score": score(m),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(ROOT / "workers/ai-site/data/social.json"))
    ap.add_argument("--max", type=int, default=500)
    a = ap.parse_args()
    token = os.environ.get("BUFFER_API_TOKEN", "").strip()
    if not token:
        print("::warning::BUFFER_API_TOKEN not set; keeping the existing social data")
        return 0
    try:
        orgs = gql(token, Q_ORG)["account"]["organizations"]
        posts, after = [], None
        for org in orgs:
            while len(posts) < a.max:
                res = gql(token, Q_POSTS, {"org": org["id"], "after": after})["posts"]
                posts += [shape(e["node"]) for e in (res.get("edges") or [])]
                if not res["pageInfo"]["hasNextPage"]:
                    break
                after = res["pageInfo"]["endCursor"]
            after = None
    except Exception as e:  # never break the site build because Buffer is down
        print(f"::warning::Buffer sync failed, keeping the existing social data: {str(e)[:200]}")
        return 0
    posts.sort(key=lambda p: p["date"], reverse=True)
    out = {"updated": __import__("datetime").datetime.utcnow().strftime("%Y-%m-%dT%H:%MZ"), "count": len(posts), "posts": posts}
    pathlib.Path(a.out).write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
    by = {}
    for p in posts:
        by[p["platformLabel"]] = by.get(p["platformLabel"], 0) + 1
    print(f"::notice::Buffer sync: {len(posts)} posts ({', '.join(f'{k} {v}' for k, v in sorted(by.items()))})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
