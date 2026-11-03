"""Run the API locally with in-memory MongoDB and mocked OpenAI/DataForSEO/Stripe/Resend.
   uv run python tests/dev_server.py   ->  http://127.0.0.1:8090"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.dirname(__file__))
import mongomock
import respx
import uvicorn

import test_api as t
import test_blog_ai as tb
from app import main
from app.store import Store

os.environ.update({"OPENAI_API_KEY": "t", "OPENAI_BASE": "https://openai.test", "DATAFORSEO_LOGIN": "t", "DATAFORSEO_PASSWORD": "t",
                   "DATAFORSEO_BASE": "https://dfs.test", "STRIPE_SECRET_KEY": "sk_test_x", "STRIPE_BASE": "https://stripe.test",
                   "RESEND_API_KEY": "t", "RESEND_BASE": "https://resend.test", "TEST_SITE_BASE": "https://site.test",
                   "PUBLIC_ORIGIN": os.environ.get("PUBLIC_ORIGIN", "http://127.0.0.1:8791"), "PREVIEW_DAILY_LIMIT": "50",
                   "INTERNAL_TOKEN": "dev-token"})
main.settings.cache_clear()
main.set_store(Store(mongomock.MongoClient()["dev"]))
m = t.Mocks()
router = respx.mock(assert_all_called=False)
import httpx
b = tb.Calls()  # blog editor AI assistant mocks (Trends, SERP, ideas, drafts)
router.post("https://openai.test/v1/chat/completions").mock(
    side_effect=lambda req: b.chat(req) if "WorldDigital.ai" in req.content.decode() else m.chat(req))
router.post(url__regex=r"https://dfs\.test/.*(google_trends|serp/google).*").mock(side_effect=b.dfs_route)
router.post(url__regex=r"https://dfs\.test/.*keywords_for_site.*").mock(return_value=httpx.Response(200, json={"tasks": [{"status_code": 20000, "result": [t.kw("plumber", 0)]}]}))
router.post(url__regex=r"https://dfs\.test/.*keywords_for_keywords.*").mock(side_effect=lambda req: b.dfs_route(req) if "seo" in req.content.decode() else httpx.Response(200, json={"tasks": [{"status_code": 20000, "result": [t.kw(f"houston plumbing service {i}", i) for i in range(40)]}]}))
router.post("https://stripe.test/v1/checkout/sessions").mock(side_effect=m.stripe_create)
router.get(url__regex=r"https://stripe\.test/v1/checkout/sessions/.*").mock(side_effect=m.stripe_get)
router.post("https://resend.test/emails").mock(return_value=httpx.Response(200, json={"id": "em"}))
router.get(url__regex=r"https://site\.test/.*").mock(return_value=httpx.Response(200, text=t.CUSTOMER, headers={"content-type": "text/html"}))
router.route(host="127.0.0.1").pass_through()
router.start()
uvicorn.run(main.app, host="127.0.0.1", port=8090, log_level="warning")
