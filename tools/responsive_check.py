"""Responsive check for worlddigital.ai at phone, tablet and desktop sizes (ported from the worlddigital.us repo).

Usage:  python tools/responsive_check.py <base-url> [--out results.json] [--shots DIR] [--pages /,/tools]
Loads every page in <base-url>/sitemap.xml (or --pages) at 9 viewport sizes and fails (exit 1) on:
  - horizontal scrolling (page wider than the screen)
  - visible elements running off the right edge
  - tap targets (buttons, links outside paragraphs) smaller than 24x24 px on touch sizes
  - body text smaller than 12 px
  - the header menu wrapping onto a second line on desktop/tablet
  - the main heading missing or cut off
  - on the home page: the main call to action not reachable in the first screen on a 390x844 phone
  - JavaScript errors
"""
import argparse
import asyncio
import json
import re
import sys

from playwright.async_api import async_playwright

PAGES: list[str] = []  # filled from the sitemap
SIZES = [  # name, width, height, touch
    ("phone-small", 360, 740, True), ("phone", 390, 844, True), ("phone-large", 430, 932, True),
    ("tablet-portrait", 768, 1024, True), ("tablet-air", 820, 1180, True), ("tablet-landscape", 1024, 768, True),
    ("laptop", 1280, 800, False), ("desktop", 1440, 900, False), ("desktop-wide", 1920, 1080, False),
]

PROBE = r"""(touch) => {
  const de = document.documentElement, W = de.clientWidth, out = {};
  out.overflow = de.scrollWidth > W + 1 ? de.scrollWidth - W : 0;
  const vis = (e) => { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false;
                       const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const inFixed = (e) => { for (let x = e; x; x = x.parentElement) { const p = getComputedStyle(x).position; if (p === 'fixed' || p === 'sticky') return true; } return false; };
  const clipped = (e) => { for (let x = e.parentElement; x && x !== document.body; x = x.parentElement) { const s = getComputedStyle(x);
                       if (s.overflowX === 'auto' || s.overflowX === 'scroll' || s.overflowX === 'hidden' || s.overflow === 'hidden') return true; } return false; };
  out.offRight = [...document.querySelectorAll('body *')].filter(e => vis(e) && !inFixed(e) && !clipped(e) && e.getBoundingClientRect().right > W + 2)
     .slice(0, 5).map(e => (e.tagName + '.' + String(e.className || '').split(' ')[0]).slice(0, 50) + ' +' + Math.round(e.getBoundingClientRect().right - W) + 'px');
  if (touch) {
    out.smallTaps = [...document.querySelectorAll('a[href],button,input,select,textarea,summary')].filter(e => {
      if (!vis(e) || e.closest('p,li,td,small,figcaption,.crumbs,.rp-fine,.agree-note')) return false;
      const r = e.getBoundingClientRect(); return r.height < 24 || r.width < 24; })
      .slice(0, 5).map(e => ((e.innerText || e.getAttribute('aria-label') || e.tagName).trim().slice(0, 30)) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));
  } else out.smallTaps = [];
  out.tinyText = [...document.querySelectorAll('p,li,span,a,label,small,td,figcaption,summary')].filter(e => vis(e) && e.childNodes.length &&
      [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 2) && parseFloat(getComputedStyle(e).fontSize) < 12)
      .slice(0, 5).map(e => e.innerText.trim().slice(0, 30) + ' ' + getComputedStyle(e).fontSize);
  const nav = document.querySelector('header nav.nav, nav[aria-label="Main"]');
  if (nav && vis(nav) && getComputedStyle(nav).flexDirection !== 'column') {
    const tops = [...nav.querySelectorAll('a')].filter(vis).map(a => Math.round(a.getBoundingClientRect().top));
    out.navWraps = tops.length ? Math.max(...tops) - Math.min(...tops) > 8 : false;
  } else out.navWraps = false;
  const h1 = document.querySelector('h1');
  out.h1 = !h1 ? 'missing' : (h1.scrollWidth > h1.clientWidth + 2 ? 'cut off' : 'ok');
  const btn = document.querySelector('main a.btn.red, main .btn.red');
  out.reportBtnBottom = btn && vis(btn) ? Math.round(btn.getBoundingClientRect().bottom + scrollY) : null;
  out.height = de.scrollHeight;
  return out;
}"""


async def run(base, shots):
    results, problems = {}, []
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        for name, w, h, touch in SIZES:
            ctx = await browser.new_context(viewport={"width": w, "height": h}, is_mobile=touch and w < 768, has_touch=touch)
            for path in PAGES:
                page = await ctx.new_page()
                await page.route(re.compile(r"(googletagmanager|google-analytics|doubleclick|/5cex/)"), lambda r: r.abort())
                errors = []
                page.on("pageerror", lambda e, errs=errors: errs.append(str(e)[:120]))
                where = f"{path} at {name} ({w}x{h})"
                try:
                    await page.goto(base.rstrip("/") + path, wait_until="load", timeout=60000)
                    await page.wait_for_timeout(800)
                    await page.evaluate("document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in'))")
                    await page.wait_for_timeout(300)
                    r = await page.evaluate(PROBE, touch)
                except Exception as err:  # a page that fails to load is itself a problem; keep checking the rest
                    problems.append(f"{where}: page failed to load or check ({str(err).splitlines()[0][:120]})")
                    await page.close()
                    continue
                r["jsErrors"] = errors
                key = f"{name} {w}x{h} {path}"
                results[key] = r
                if r["overflow"]:
                    problems.append(f"{where}: page scrolls sideways by {r['overflow']}px ({', '.join(r['offRight'][:2])})")
                elif r["offRight"]:
                    problems.append(f"{where}: element runs off the screen: {r['offRight'][0]}")
                if r["smallTaps"]:
                    problems.append(f"{where}: small tap targets: {', '.join(r['smallTaps'][:3])}")
                if r["tinyText"]:
                    problems.append(f"{where}: text under 12px: {', '.join(r['tinyText'][:2])}")
                if r["navWraps"]:
                    problems.append(f"{where}: header menu wraps onto two lines")
                if r["h1"] != "ok":
                    problems.append(f"{where}: main heading {r['h1']}")
                if path == "/" and name == "phone" and (r["reportBtnBottom"] or 9999) > h - 70:
                    problems.append(f"{where}: main call to action is below the first screen ({r['reportBtnBottom']}px)")
                if errors:
                    problems.append(f"{where}: JavaScript error: {errors[0]}")
                if shots:
                    await page.screenshot(path=f"{shots}/{name}{('_home' if path == '/' else path.replace('/', '_'))}.png", full_page=True)
                await page.close()
            await ctx.close()
        await browser.close()
    return results, problems


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("base")
    ap.add_argument("--out")
    ap.add_argument("--shots")
    ap.add_argument("--pages", help="comma-separated paths instead of the sitemap")
    a = ap.parse_args()
    if a.pages:
        PAGES.extend(p.strip() for p in a.pages.split(",") if p.strip())
    else:
        import re
        import urllib.request
        req = urllib.request.Request(a.base.rstrip("/") + "/sitemap.xml", headers={"User-Agent": "Mozilla/5.0 (compatible; WorldDigitalResponsiveCheck/1.0)"})
        xml = urllib.request.urlopen(req, timeout=30).read().decode()
        base = a.base.rstrip("/")
        PAGES.extend(dict.fromkeys(re.sub(r"^https?://[^/]+", "", u) or "/" for u in re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", xml)))
    results, problems = asyncio.run(run(a.base, a.shots))
    summary = {"ok": not problems, "checked": f"{len(PAGES)} pages x {len(SIZES)} sizes",
               "sizes": [f"{n} {w}x{h}" for n, w, h, _ in SIZES], "problems": problems[:60]}
    if a.out:
        with open(a.out, "w") as f:
            json.dump({**summary, "details": results}, f, indent=1)
    print(json.dumps(summary, indent=1))
    sys.exit(0 if not problems else 1)


if __name__ == "__main__":
    main()
