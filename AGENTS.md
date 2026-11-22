# Repository guidance for Codex and other coding agents

## Project scope
- This repository powers the public marketing website at https://worlddigital.ai.
- Keep all work in this repository scoped to the .ai website. Do not change the separate worlddigital.us repository.
- The public site is primarily a Cloudflare Worker in `workers/ai-site/`; its Durable Object stores blog, lead and editor data. The repository also contains a Python backend and legacy application code. Inspect the relevant package and deployment manifests before changing any component.

## Safe engineering rules
- Start with read-only inspection. Work on a feature branch and propose changes through a pull request.
- Never deploy to production, alter live Cloudflare bindings/secrets, run destructive database operations, or change production data unless the repository owner explicitly requests and approves that exact action.
- Never print, copy into reports, commit, or expose secrets, API keys, tokens, session cookies, customer data, or personal information.
- Prefer the smallest targeted fix. Preserve existing behavior outside the affected path.
- Before modifying a file, inspect its current implementation and relevant callers. Do not infer runtime configuration from filenames alone.
- Add or update tests for behavior changes where the project has a suitable test harness. Discover the actual commands from manifests and CI workflows; do not invent test commands.
- Report checks that could not be run. Do not claim a test, security scan, performance measurement, or deployment succeeded unless it actually did.
- Do not merge a pull request or push changes to the default branch without explicit owner approval.

## Independent review mode
When asked to review work produced by Claude Code or another contributor:
1. Review the complete diff and relevant surrounding code independently; do not rely on the author's summary.
2. Prioritize exploitable security flaws, data loss, broken customer flows, regressions, SEO/indexing errors, and operational risks.
3. For each finding, provide severity, exact file and line, concrete failure or abuse scenario, impact, and a specific remediation.
4. Distinguish confirmed defects from hypotheses and false positives. Cite the code path or test evidence.
5. If asked for review only, do not edit code. If asked to fix findings, make focused changes on a separate branch and add regression tests where practical.
6. Re-check the final diff after fixes and state what remains unverified.

## Website-specific checks
- Preserve correct canonical URLs, redirects, robots.txt, XML sitemap, RSS feed, llms.txt and IndexNow behavior.
- Ensure draft, unpublished, archived and duplicate blog posts are never exposed as live or advertised to crawlers/social channels.
- Keep public pricing, product descriptions, company positioning, legal pages and structured data consistent.
- Validate origin/authentication/CSRF protections on form and admin routes; avoid weakening Content Security Policy or security headers.
