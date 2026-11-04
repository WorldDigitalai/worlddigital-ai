# Product and customer journey audit

The audit brief lists a 14-step SaaS journey. This is what actually exists on the live sites (checked 2026-11-04 in a
browser; forms were **not** submitted because that sends real emails, leads and charges).

| # | Step | Exists? | Evidence |
|---|---|---|---|
| 1 | Visit the website | ✅ | .ai home 200, 32 internal links, 0 broken; clear header: Products, Custom software, Services, Blog, About, Contact, **Start free** |
| 2 | Register | ❌ | `/signup` shows "Our customer portal is being rebuilt"; `/register` 404 |
| 3 | Sign in | ❌ | The mobile menu has **Sign in → `/login`**, which shows the same placeholder |
| 4 | Onboarding | ❌ | `/onboarding` shows the placeholder |
| 5 | Enter business information | ◑ | Only per tool: website URL for the free report, keyword and content previews; contact form |
| 6 | Connect ad accounts | ❌ | No Google Ads / Meta / TikTok / Snapchat / LinkedIn API integration in live code (only in `archive/`, not deployed) |
| 7 | Generate AI marketing content | ✅ | Content pack: 1 free, 5 for $24.99 (Stripe Checkout). Keyword research: 3 free, 10 for $9.99 |
| 8–9 | Create / publish campaigns | ❌ | Not in the product; offered as a done-for-you service |
| 10 | Analytics | ◑ | Free SEO and AI-visibility report (.us report worker, shared by both sites). No customer dashboard |
| 11 | Manage subscriptions | ◑ | SEO plan $199.99/month by Stripe payment link. Customers manage it in the Stripe customer portal (per chat facts; portal configuration **UNVERIFIED**) |
| 12 | Account settings | ❌ | No accounts |
| 13 | Support | ✅ | `/help`, `/contact` (Turnstile, emails support@), AI Ahmad chat grounded in the knowledge base, support@ email |
| 14 | Cancel or modify | ◑ | Stripe portal (UNVERIFIED); cancellation terms on the site |

**Bottom line:** worlddigital.ai is today a marketing site with self-serve one-time tools and a done-for-you service
business. It isn't yet the multi-tenant marketing platform the brief describes. That isn't a bug; it's the current product
scope after the old app was retired (`LEGACY_APP` switch, `archive/nextjs-app/`).

## Findings

| ID | Severity | Finding | Business impact | Fix |
|---|---|---|---|---|
| UX-01 | HIGH | "Sign in" leads to a "portal is being rebuilt" page, and "Start free" + "Software company" positioning suggests accounts that don't exist | Visitors expecting a SaaS account hit a dead end, which hurts trust and conversion | Until a portal exists: remove the Sign in link and keep the placeholder only for old bookmarks. Product decision |
| UX-02 | HIGH | Paid report delivery depends on returning to the site (BUG-02) | Missed deliveries become support tickets and refunds | Stripe webhook |
| UX-03 | MEDIUM | Mobile home performance fell to 69 (PERF-01) | Slower first impression on phones, which most local-business traffic uses | Fix tag loading |
| UX-04 | MEDIUM | Previews aren't human-checked on the backend (SEC-05) | Cost exposure and possible free-preview exhaustion by bots | Verify Turnstile in the worker |
| UX-05 | LOW | `/pricing` 404 | Common guess URL lost | Redirect |
| UX-06 | LOW | Duplicate blog posts | Thin-content signal | Redirect one + guard |

## What works well (keep)

- **Free tools:** instant value on one page (`/tools`), with clear prices that match `products.py`.
- **Previews:** blurred locked rows. The real data never leaves the server until payment is verified.
- **Paid files:** PDF, Excel and Word downloads plus email delivery.
- **AI Ahmad:** answers from the knowledge base with links, and points to `/contact` when it doesn't know.
- **Speed:** the .us site is very fast (LCP 0.4 s measured).

## Recommendation on the customer portal

Don't rebuild the archived Next.js app wholesale. When there is demand, add accounts in the existing stack:

- Magic-link sign-in like the admin (already built and audited).
- Customer records in MongoDB.
- Each customer's purchases, reports and knowledge base under their own tenant id, reusing the isolation that's already
  tested.

That's a 12-month roadmap item (REMEDIATION-ROADMAP.md).
