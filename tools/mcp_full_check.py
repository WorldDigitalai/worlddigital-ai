"""Full MCP connector check against the live server, the same steps Claude takes, end to end:
register -> authorize -> approve (through the site's own consent endpoint, as the owner) -> token -> initialize ->
tools/list -> each tool -> refresh -> revoke. Prints statuses and shapes only: no tokens, no lead details.
Env: API (server base URL), TOKEN (internal token), APPROVER (admin email recorded as the approver)."""
import base64, hashlib, json, os, secrets, sys, urllib.parse
import requests

API, TOKEN, WHO = os.environ["API"].rstrip("/"), os.environ["TOKEN"], os.environ["APPROVER"]
CB = "https://claude.ai/api/mcp/auth_callback"
fails = []


def step(name, ok, detail=""):
    print(("PASS " if ok else "FAIL ") + name + (f" :: {detail}" if detail else ""), flush=True)
    if not ok:
        fails.append(name)
    return ok


def b64(b):
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()


ver = b64(secrets.token_bytes(32)); ch = b64(hashlib.sha256(ver.encode()).digest())
r = requests.post(f"{API}/register", json={"client_name": "Claude (automated check)", "redirect_uris": [CB],
                  "grant_types": ["authorization_code", "refresh_token"], "response_types": ["code"],
                  "token_endpoint_auth_method": "client_secret_post"}, timeout=30)
reg = r.json(); step("register", r.status_code == 201, str(r.status_code))
cid, csec = reg["client_id"], reg.get("client_secret")

r = requests.get(f"{API}/authorize", allow_redirects=False, timeout=30, params={
    "response_type": "code", "client_id": cid, "redirect_uri": CB, "state": "chk", "code_challenge": ch,
    "code_challenge_method": "S256", "scope": "read", "resource": f"{API}/mcp"})
loc = r.headers.get("location", "")
rid = urllib.parse.parse_qs(urllib.parse.urlparse(loc).query).get("req", [""])[0]
step("authorize -> consent page", r.status_code == 302 and bool(rid), f"{r.status_code} {loc.split('?')[0]}")

H = {"x-internal-token": TOKEN}
r = requests.post(f"{API}/api/admin/mcp/consent", headers=H, json={"req": rid}, timeout=30)
step("consent page can read the request", r.status_code == 200, f"{r.status_code} {r.text[:200]}")
r = requests.post(f"{API}/api/admin/mcp/consent", headers=H, json={"req": rid, "email": WHO, "allow": True}, timeout=30)
red = (r.json() or {}).get("redirect", "") if r.headers.get("content-type", "").startswith("application/json") else ""
q = urllib.parse.parse_qs(urllib.parse.urlparse(red).query)
step("approve -> back to Claude with a code", r.status_code == 200 and red.startswith(CB) and "code" in q and q.get("state") == ["chk"],
     f"{r.status_code} {red.split('?')[0] or r.text[:200]}")
code = q.get("code", [""])[0]

r = requests.post(f"{API}/token", timeout=30, data={"grant_type": "authorization_code", "code": code, "redirect_uri": CB,
                  "client_id": cid, "client_secret": csec, "code_verifier": ver, "resource": f"{API}/mcp"})
tok = r.json() if r.ok else {}
step("token exchange", r.ok and "access_token" in tok, f"{r.status_code} {'' if r.ok else r.text[:300]}")
at = tok.get("access_token", "")


def rpc(method, params=None, rid_=1, origin=None, version="2025-06-18"):
    h = {"authorization": f"Bearer {at}", "content-type": "application/json", "accept": "application/json, text/event-stream",
         "mcp-protocol-version": version}
    if origin:
        h["origin"] = origin
    body = {"jsonrpc": "2.0", "id": rid_, "method": method}
    if params is not None:
        body["params"] = params
    return requests.post(f"{API}/mcp", headers=h, json=body, timeout=90)


init = {"protocolVersion": "2025-06-18", "capabilities": {}, "clientInfo": {"name": "claude-ai", "version": "0.1.0"}}
for label, origin, ver_ in [("no Origin", None, "2025-06-18"), ("Origin claude.ai", "https://claude.ai", "2025-06-18"),
                            ("protocol 2025-11-25", None, "2025-11-25")]:
    p = dict(init, protocolVersion=ver_)
    r = rpc("initialize", p, origin=origin, version=ver_)
    step(f"initialize ({label})", r.status_code == 200 and '"result"' in r.text, f"{r.status_code} {r.text[:250]}")

r = rpc("notifications/initialized"); step("initialized notification", r.status_code in (200, 202), str(r.status_code))
r = rpc("tools/list", {}, 2)
names = [t["name"] for t in (r.json().get("result", {}).get("tools", []) if r.ok else [])]
step("tools/list", len(names) == 4, f"{r.status_code} {names}")

for name, args in [("ask_knowledge_base", {"question": "What services does WorldDigital.ai offer?"}),
                   ("visitor_questions", {"days": 7}), ("quality_and_speed", {}), ("leads", {"limit": 3})]:
    r = rpc("tools/call", {"name": name, "arguments": args}, 3)
    res = r.json().get("result", {}) if r.ok else {}
    txt = " ".join(c.get("text", "") for c in res.get("content", []))
    shown = f"{len(txt)} chars" if name == "leads" else txt[:160].replace("\n", " ")
    step(f"tool {name}", r.ok and not res.get("isError") and len(txt) > 0, f"{r.status_code} error={res.get('isError')} {shown if not res.get('isError') else txt[:300]}")

r = requests.post(f"{API}/token", timeout=30, data={"grant_type": "refresh_token", "refresh_token": tok.get("refresh_token", ""),
                  "client_id": cid, "client_secret": csec})
new = r.json() if r.ok else {}
step("refresh token", r.ok and "access_token" in new, f"{r.status_code} {'' if r.ok else r.text[:200]}")
r = requests.post(f"{API}/revoke", timeout=30, data={"token": new.get("refresh_token", ""), "client_id": cid, "client_secret": csec})
step("revoke (clean up)", r.status_code == 200, str(r.status_code))

print("\nRESULT:", "ALL PASSED" if not fails else "FAILED: " + ", ".join(fails))
sys.exit(1 if fails else 0)
