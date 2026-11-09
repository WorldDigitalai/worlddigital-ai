"""Feature tests for worlddigital.ai in a real browser (Playwright), the way a visitor uses the site.

  python tools/e2e_check.py [--base https://worlddigital.ai]

Checks (each one independent; a failure in one does not stop the others):
  search    /search returns results that link to our pages; "Get an AI answer" answers with sources
  chat      the AI Ahmad assistant opens, answers a question, and shows no error
  tools     /tools lists the tools; the keyword and content tool forms load (nothing is run: previews need a human check)
  contact   the contact form loads; submitting it empty is refused by the browser and sends nothing
  blog      the blog lists posts; the first post opens with its heading and its images load
  pages     home, services and pricing pages load with a heading, a search icon and no JavaScript errors

Prints one line per check and a summary; exits 1 if any check failed. Uses two AI calls per run (search answer,
chat reply), which the free daily limits cover. Google tags are blocked so tests do not count as visits.
"""
import argparse
import sys
import time

from playwright.sync_api import TimeoutError as PWTimeout, sync_playwright

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36 WorldDigitalSiteTest/1.0"
BLOCK = ("googletagmanager.com", "google-analytics.com", "googleadservices.com", "doubleclick.net", "clarity.ms")


def new_page(browser, errors, mobile=False):
    ctx = browser.new_context(user_agent=UA, viewport={"width": 390, "height": 844} if mobile else {"width": 1366, "height": 900},
                              is_mobile=mobile, has_touch=mobile)
    ctx.route("**/*", lambda r: r.abort() if any(b in r.request.url for b in BLOCK) else r.continue_())
    page = ctx.new_page()
    page.on("pageerror", lambda e: errors.append(str(e)[:200]))
    return page


def check_search(browser, base):
    errors = []
    p = new_page(browser, errors)
    p.goto(f"{base}/search?q=how+much+is+keyword+research", wait_until="domcontentloaded", timeout=45000)
    links = p.locator(".sr-list a.sr-t")
    assert links.count() >= 1, "no search results"
    hrefs = [links.nth(i).get_attribute("href") for i in range(links.count())]
    assert all(h.startswith("/") for h in hrefs), f"result links leave the site: {hrefs[:3]}"
    p.get_by_role("button", name="Get an AI answer").click()
    t0 = time.monotonic()
    p.wait_for_function("() => { const o = document.getElementById('sr-out'); return o && o.textContent.trim().length > 0 }", timeout=60000)
    first = time.monotonic() - t0
    p.wait_for_function("() => document.querySelector('#sr-out ol li a')", timeout=60000)
    full = time.monotonic() - t0
    out = p.locator("#sr-out").inner_text()
    assert "could not get an answer" not in out.lower(), "AI answer failed"
    assert p.locator("#sr-out ol li a").count() >= 1, "AI answer has no sources"
    assert not errors, f"JavaScript error: {errors[0]}"
    p.context.close()
    return f"{len(hrefs)} results (top: {hrefs[0]}); AI answer with sources, first words {first:.1f}s, complete {full:.1f}s"


def check_chat(browser, base):
    errors = []
    p = new_page(browser, errors, mobile=True)
    p.goto(f"{base}/", wait_until="domcontentloaded", timeout=45000)
    p.locator("#aic-btn").click()
    p.locator("#aic-in").fill("What does the free SEO report include?")
    p.locator(".aic-f button").click()
    p.wait_for_function("() => document.querySelectorAll('.aic-log .aic-m.bot').length >= 2 && !document.querySelector('.aic-typing')", timeout=60000)
    last = p.locator(".aic-log .aic-m.bot").last
    cls, text = last.get_attribute("class") or "", last.inner_text()
    assert "err" not in cls.split(), f"chat error: {text[:150]}"
    assert len(text) > 30, f"reply too short: {text!r}"
    assert not errors, f"JavaScript error: {errors[0]}"
    p.context.close()
    return f"reply of {len(text)} characters"


def check_tools(browser, base):
    errors = []
    p = new_page(browser, errors)
    p.goto(f"{base}/tools", wait_until="domcontentloaded", timeout=45000)
    cards = p.locator(".grid3 a[href]").count()
    assert cards >= 2, f"/tools lists {cards} tools"
    for path, field in (("/services/keyword-research", "#wdt-url"), ("/services/content-marketing", "#wdt-offer")):
        p.goto(base + path, wait_until="load", timeout=45000)
        p.wait_for_selector(field, state="visible", timeout=20000)
        assert p.locator("#tool .wdt-go").first.is_visible(), f"{path}: run button missing"
    assert not errors, f"JavaScript error: {errors[0]}"
    p.context.close()
    return f"{cards} tools listed; keyword and content forms ready"


def check_contact(browser, base):
    errors, posts = [], []
    p = new_page(browser, errors)
    p.on("request", lambda r: posts.append(r.url) if r.method == "POST" else None)
    p.goto(f"{base}/contact", wait_until="domcontentloaded", timeout=45000)
    for sel in ("#c-name", "#c-email", "#c-msg"):
        assert p.locator(sel).is_visible(), f"{sel} missing"
    p.locator("form:has(#c-msg) [type=submit]").first.click()
    time.sleep(1.5)
    assert not p.evaluate("document.querySelector('#c-name').checkValidity()"), "empty name accepted"
    assert not posts, f"empty form was sent: {posts[0]}"
    p.locator("#c-email").fill("not-an-email")
    assert not p.evaluate("document.querySelector('#c-email').checkValidity()"), "bad email accepted"
    assert not errors, f"JavaScript error: {errors[0]}"
    p.context.close()
    return "fields present; empty or bad input refused, nothing sent"


def check_blog(browser, base):
    errors = []
    p = new_page(browser, errors)
    p.goto(f"{base}/blog", wait_until="domcontentloaded", timeout=45000)
    posts = p.locator("a.post-card")
    n = posts.count()
    assert n >= 1, "no posts on /blog"
    href = posts.first.get_attribute("href")
    p.goto(base + href, wait_until="load", timeout=45000)
    assert p.locator("h1").count() == 1, "post has no single h1"
    p.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    time.sleep(1.5)
    broken = p.evaluate("[...document.images].filter(i => i.complete && i.getAttribute('loading') !== 'lazy' && !i.naturalWidth).map(i => i.src)")
    assert not broken, f"broken images: {broken[:2]}"
    assert not errors, f"JavaScript error: {errors[0]}"
    p.context.close()
    return f"{n} posts; opened {href}"


def check_pages(browser, base):
    errors = []
    p = new_page(browser, errors)
    for path in ("/", "/services", "/ai-seo-pricing", "/custom-software", "/about"):
        r = p.goto(base + path, wait_until="domcontentloaded", timeout=45000)
        assert r and r.status == 200, f"{path}: HTTP {r.status if r else 'none'}"
        assert p.locator("h1").count() == 1, f"{path}: not exactly one h1"
        assert p.locator("a.srch[href='/search']").count() == 1, f"{path}: search icon missing"
    assert not errors, f"JavaScript error: {errors[0]}"
    p.context.close()
    return "5 pages OK"


CHECKS = [("search", check_search), ("chat", check_chat), ("tools", check_tools),
          ("contact", check_contact), ("blog", check_blog), ("pages", check_pages)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="https://worlddigital.ai")
    ap.add_argument("--only", default="", help="comma-separated check names")
    a = ap.parse_args()
    base = a.base.rstrip("/")
    only = {x.strip() for x in a.only.split(",") if x.strip()}
    failed = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        for name, fn in CHECKS:
            if only and name not in only:
                continue
            t0 = time.monotonic()
            try:
                msg = fn(browser, base)
                print(f"PASS {name}: {msg} ({time.monotonic() - t0:.1f}s)")
            except (AssertionError, PWTimeout) as e:
                failed.append(name)
                print(f"FAIL {name}: {str(e).splitlines()[0][:300]}")
            except Exception as e:  # noqa: BLE001
                failed.append(name)
                print(f"FAIL {name}: {type(e).__name__}: {str(e).splitlines()[0][:300]}")
        browser.close()
    total = len(only) if only else len(CHECKS)
    print(f"SUMMARY {total - len(failed)}/{total} passed" + (f"; failed: {', '.join(failed)}" if failed else ""))
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
