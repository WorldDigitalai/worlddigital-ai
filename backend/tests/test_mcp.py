"""MCP server: OAuth sign-in (register, authorize, admin consent, token, refresh, revoke) and the four read-only tools."""
import base64
import hashlib
import json
import secrets
from urllib.parse import parse_qs, urlparse

import httpx
from fastapi.testclient import TestClient

from app import main
from tests.test_rag import H, env  # noqa: F401  (shared fixture)

import pytest

HOST = {"host": "api.test"}


@pytest.fixture(scope="module")
def live():
    with TestClient(main.app) as c:   # the MCP session manager starts once per process
        yield c

CB = "https://claude.ai/api/mcp/auth_callback"


def rpc(c, token, method, params=None, rid=1):
    body = {"jsonrpc": "2.0", "id": rid, "method": method, **({"params": params} if params is not None else {})}
    return c.post("/mcp", json=body, headers={**HOST, "accept": "application/json, text/event-stream", "content-type": "application/json",
                                             **({"authorization": f"Bearer {token}"} if token else {})})


def sign_in(c, allow=True):
    reg = c.post("/register", headers=HOST, json={"client_name": "Claude", "redirect_uris": [CB], "grant_types": ["authorization_code", "refresh_token"],
                                                 "response_types": ["code"], "token_endpoint_auth_method": "none", "scope": "read"})
    assert reg.status_code == 201, reg.text
    evil = c.post("/register", headers=HOST, json={"client_name": "Claude", "redirect_uris": ["https://evil.example/cb"], "token_endpoint_auth_method": "none"})
    assert evil.status_code == 400 and evil.json()["error"] == "invalid_redirect_uri"      # only known assistants may register
    cid = reg.json()["client_id"]
    verifier = secrets.token_urlsafe(40)
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).decode().rstrip("=")
    a = c.get("/authorize", headers=HOST, follow_redirects=False, params={
        "response_type": "code", "client_id": cid, "redirect_uri": CB, "state": "s1", "scope": "read",
        "code_challenge": challenge, "code_challenge_method": "S256", "resource": "https://api.test/mcp"})
    assert a.status_code == 302, a.text
    loc = a.headers["location"]
    assert loc.startswith("https://worlddigital.ai/blog-admin/mcp?req=")
    req = parse_qs(urlparse(loc).query)["req"][0]
    assert c.post("/api/admin/mcp/consent", json={"req": req}).status_code == 403          # only the site may ask
    info = c.post("/api/admin/mcp/consent", headers=H, json={"req": req}).json()
    assert info["client_name"] == "Claude" and info["redirect_host"] == "claude.ai"
    back = c.post("/api/admin/mcp/consent", headers=H, json={"req": req, "email": "Owner@Example.com", "allow": allow}).json()["redirect"]
    assert c.post("/api/admin/mcp/consent", headers=H, json={"req": req, "email": "o@e.co", "allow": True}).status_code == 404   # one use
    q = parse_qs(urlparse(back).query)
    assert back.startswith(CB) and q["state"] == ["s1"]
    return cid, verifier, q


def test_mcp_needs_sign_in_and_describes_how(env, live):
    c = live
    if True:
        r = rpc(c, None, "tools/list")
        assert r.status_code == 401 and "resource_metadata" in r.headers["www-authenticate"]
        assert rpc(c, "not-a-token", "tools/list").status_code == 401
        prm = c.get("/.well-known/oauth-protected-resource/mcp", headers=HOST).json()
        assert prm["resource"] == "https://api.test/mcp" and prm["authorization_servers"][0].rstrip("/") == "https://api.test"
        meta = c.get("/.well-known/oauth-authorization-server", headers=HOST).json()
        assert meta["issuer"].rstrip("/") == "https://api.test" and "S256" in meta["code_challenge_methods_supported"]
        assert meta["registration_endpoint"].endswith("/register") and meta["token_endpoint"].endswith("/token")
        assert c.get("/api/tools/health").status_code == 200    # the rest of the API is untouched


def test_mcp_sign_in_tools_refresh_and_revoke(env, live, monkeypatch):
    c = live
    c.post("/api/admin/rag/index", headers=H, json={})
    if True:
        cid, verifier, q = sign_in(c, allow=False)
        assert q["error"] == ["access_denied"] and "code" not in q
        cid, verifier, q = sign_in(c)
        form = {"grant_type": "authorization_code", "code": q["code"][0], "redirect_uri": CB, "client_id": cid, "code_verifier": "wrong" * 10}
        assert c.post("/token", headers=HOST, data=form).status_code == 400                # PKCE is enforced
        tok = c.post("/token", headers=HOST, data={**form, "code_verifier": verifier})
        assert tok.status_code == 200, tok.text
        t = tok.json()
        assert t["token_type"].lower() == "bearer" and t["expires_in"] == 3600 and t["refresh_token"]
        assert c.post("/token", headers=HOST, data={**form, "code_verifier": verifier}).status_code == 400   # a code works once
        stored = json.dumps(list(main.store().db["mcp_tokens"].find({})), default=str)
        assert t["access_token"] not in stored and t["refresh_token"] not in stored         # only hashes are kept

        init = rpc(c, t["access_token"], "initialize", {"protocolVersion": "2025-06-18", "capabilities": {}, "clientInfo": {"name": "t", "version": "1"}})
        assert init.status_code == 200 and init.json()["result"]["serverInfo"]["name"] == "worlddigital-ai"
        tools = {x["name"]: x for x in rpc(c, t["access_token"], "tools/list").json()["result"]["tools"]}
        assert set(tools) == {"ask_knowledge_base", "visitor_questions", "quality_and_speed", "leads"}
        assert all(x["annotations"]["readOnlyHint"] is True for x in tools.values())

        call = lambda name, args: rpc(c, t["access_token"], "tools/call", {"name": name, "arguments": args}).json()["result"]  # noqa: E731
        a = call("ask_knowledge_base", {"question": "How much is keyword research 9.99?"})
        assert a.get("isError") is not True and "worlddigital.ai/tools" in a["content"][0]["text"]
        v = json.loads(call("visitor_questions", {"days": 7})["content"][0]["text"])
        assert v["days"] == 7 and "could_not_answer" in v and "handoffs" not in v
        qs = json.loads(call("quality_and_speed", {})["content"][0]["text"])
        assert "quality_test" in qs and "ready_answers" in qs
        seen = {}
        monkeypatch.setattr(main.mcp_server.services.http, "post", lambda url, **kw: seen.update(url=url, h=kw["headers"]) or httpx.Response(200, json={
            "leads": [{"kind": "contact", "at": "2026-11-13", "name": "Pat", "email": "pat@example.com", "message": "Need a site"}] * 3}))
        ld = json.loads(call("leads", {"limit": 2})["content"][0]["text"])
        assert ld["count"] == 2 and ld["leads"][0]["email"] == "pat@example.com"
        assert seen["url"] == "https://worlddigital.ai/api/internal/leads" and seen["h"]["x-internal-token"] == "t"
        monkeypatch.undo()
        assert call("ask_knowledge_base", {"question": ""}).get("isError") is True

        new = c.post("/token", headers=HOST, data={"grant_type": "refresh_token", "refresh_token": t["refresh_token"], "client_id": cid}).json()
        assert new["access_token"] != t["access_token"]
        assert rpc(c, t["access_token"], "tools/list").status_code == 401                   # rotated away
        assert rpc(c, new["access_token"], "tools/list").status_code == 200
        rv = c.post("/revoke", headers=HOST, data={"token": new["access_token"], "client_id": cid, "client_secret": ""})
        assert rv.status_code == 200, rv.text
        assert rpc(c, new["access_token"], "tools/list").status_code == 401
