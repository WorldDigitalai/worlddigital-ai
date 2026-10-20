// SEO / AI-crawler files for worlddigital.ai, served by Cloudflare in front of the app.
// Same format as worlddigital.us, written for the company. Social-platform pages are left out on purpose
// (they come back later as the Social & Email Autopilot service).

export const UPDATED = '2026-10-16';
const SITE = 'https://worlddigital.ai';

// One group only: crawlers that find a group naming them ignore the "*" group,
// so listing AI bots in their own groups would let them into /dashboard etc.
export const ROBOTS = `# worlddigital.ai — WorldDigital.ai Corporation LLC
# Search engines and AI assistants are welcome to crawl the public site.
# Private app areas (dashboard, account, checkout, API) are off limits to every crawler.

User-agent: *
User-agent: Googlebot
User-agent: Bingbot
User-agent: DuckDuckBot
User-agent: Applebot
User-agent: Applebot-Extended
User-agent: Google-Extended
User-agent: GPTBot
User-agent: OAI-SearchBot
User-agent: ChatGPT-User
User-agent: ClaudeBot
User-agent: Claude-SearchBot
User-agent: Claude-User
User-agent: PerplexityBot
User-agent: Perplexity-User
User-agent: DuckAssistBot
User-agent: MistralAI-User
Allow: /
Disallow: /admin/
Disallow: /dashboard/
Disallow: /api/
Disallow: /generate
Disallow: /subscribe
Disallow: /auth/
Disallow: /login
Disallow: /signup
Disallow: /forgot-password
Disallow: /reset-password
Disallow: /hp91/
Disallow: /blog-admin

# AI-readable summaries: ${SITE}/llms.txt and ${SITE}/llms-full.txt

Sitemap: ${SITE}/sitemap.xml
`;

export const LLMS = `# WorldDigital.ai — Digital Marketing Company

Last updated: ${UPDATED}

> WorldDigital.ai Corporation LLC is a digital marketing company serving small and local businesses across the United States and Canada, from hubs in Houston, TX and Murfreesboro, TN. We help restaurants, cafés, auto dealers and home-service businesses get more customers from Google Search, Google Maps, ChatGPT and other AI assistants, and Google Ads.

Services: SEO and AI search visibility (SEO, AI SEO, AEO, GEO), local SEO and Google Business Profile, Google Ads and PPC management, website design and management, analytics and reporting (GA4, Search Console).

Pricing: the SEO & AI Search Visibility plan is $199.99 per month, tax included, with SEO, AI SEO, AEO and GEO included, no long-term contract and cancel anytime. Google Ads management and website projects are quoted after a strategy call.

Contact: support@worlddigital.ai · Phone and WhatsApp: (832) 834-0680 · Google Business Profile: WorldDigital.ai Corporation LLC (Marketing agency), rated 5.0 on Google.

Founder: Ahmad Awwad, digital marketing strategist (personal site: https://worlddigital.us).

Clients include Murfreesboro Kabob, RPM Auto Group and Bean Loft Coffee Company in Murfreesboro, TN.

## Pages
- [Home](${SITE}/): What we do and who we help
- [About](${SITE}/about): The company, how we work, founder
- [Services](${SITE}/services): All services
- [AI SEO Agency](${SITE}/ai-seo-agency): SEO, AI SEO, answer engine optimization (AEO) and generative engine optimization (GEO), $199.99/month
- [Google Ads Agency](${SITE}/google-ads-agency): Google Search, Maps and Performance Max campaign management
- [AI Marketing Automation](${SITE}/ai-marketing-automation): Automated marketing workflows for small businesses
- [Website Build](${SITE}/build): Small business website design, maintenance and management
- [Free SEO audit](${SITE}/free-seo-report): Free SEO and AI visibility report (website SEO checker) in about 60 seconds
- [Keyword research](${SITE}/services/keyword-research): Keyword research services for local SEO
- [SEO content](${SITE}/services/content-marketing): SEO content writing and content marketing services
- [Houston, TX](${SITE}/houston): Local SEO, Google Ads and web design for Houston businesses
- [Murfreesboro, TN](${SITE}/murfreesboro): Local SEO, Google Ads and web design for Murfreesboro and Rutherford County businesses
- [Multi-location](${SITE}/enterprise): SEO and Google Ads for brands with many locations
- [Reviews](${SITE}/testimonials): Client reviews, BBB A+ and Google rating
- [Blog](${SITE}/blog): Guides on SEO, AI search and Google Ads
- [Help Center](${SITE}/help): Plans, billing, cancelling and results
- [Careers](${SITE}/career)
- [Privacy Policy](${SITE}/privacy-policy)
- [Terms and Conditions](${SITE}/terms-and-conditions)

## Free tools
- [Free SEO & AI visibility report](${SITE}/free-seo-report): Scores for on-page SEO, mobile speed, Google rankings, backlinks and AI-answer citations in about 60 seconds

## Optional
- [Full knowledge file](${SITE}/llms-full.txt): Detailed reference on the company, services, process and common questions
`;

export const LLMS_FULL = `# WorldDigital.ai — Full Reference

Last updated: ${UPDATED}

## Company
- Legal name: WorldDigital.ai Corporation LLC
- Type: Digital marketing company (Google Business Profile category: Marketing agency)
- Founded: 2023
- Service area: the whole United States and Canada (remote). Hubs: Houston, Texas and Murfreesboro, Tennessee
- Languages: English, Arabic
- Website: ${SITE}
- Email: support@worlddigital.ai
- Phone and WhatsApp: (832) 834-0680
- Founder: Ahmad Awwad, digital marketing strategist; MBA in Strategic Marketing Analytics (in progress) and Bachelor's in Integrated Studies, Middle Tennessee State University; Google Digital Marketing & E-commerce and HubSpot Academy certifications. Personal site: https://worlddigital.us
- Trust: BBB A+ rated; Google Business Profile rated 5.0

## Who we help
Local businesses that get customers from Google, Maps and word of mouth: restaurants and cafés, auto dealers and repair shops, home-service businesses (plumbers, HVAC, cleaners, contractors), and shops, salons and local brands.

## Services
### SEO & AI Search Visibility ($199.99/month)
SEO, AI SEO, AEO and GEO in one flat plan, tax included, no contract, cancel anytime.
- Keyword and search-intent research
- On-page and technical SEO fixes
- Content optimization to rank on Google
- AEO: answer-ready FAQ content and schema markup for featured snippets, "People also ask" and voice search
- GEO: consistent brand and business information so ChatGPT, Gemini, Perplexity and Google AI Overviews can cite the business
- Local SEO: Google Business Profile, "near me" searches, consistent listings
- Monthly one-page progress report

### Google Ads & PPC management (custom quote)
Search, Maps and Performance Max campaigns built around calls, bookings and cost per lead, tracked in GA4, with A/B testing of ads, keywords, landing pages and bidding. Existing accounts are audited before changes.

### Website design & management (custom quote)
Planning, mobile-first design and development, domain/DNS/SSL/hosting (including Cloudflare), SEO-ready launch with schema, sitemap, GA4 and Search Console, conversion optimization and ongoing maintenance.

## How we work
1. Listen: what customers ask Google, ChatGPT and Gemini, and who shows up today.
2. Strategize: keyword priorities, page fixes and a plan tied to the client's services and cities.
3. Launch: technical fixes, answer-ready content, schema and consistent listings.
4. Optimize: monthly tracking in GA4 and Search Console, then the next round of improvements.
Clients always own their website, Google Business Profile, ad and analytics accounts.

## Common questions
Q: What is GEO (Generative Engine Optimization)?
A: Making a brand visible inside AI-generated answers from ChatGPT, Google AI Overviews, Gemini and Perplexity, through clear, trustworthy content and consistent brand information across the web.

Q: What is AEO (Answer Engine Optimization)?
A: Structuring a website so search engines and voice assistants can pull direct answers from it, using question-and-answer content, concise explanations and schema markup.

Q: How much does SEO cost for a small business?
A: $199.99 per month, tax included, with SEO, AI SEO, AEO and GEO included and no long-term contract. Larger sites or several locations are quoted separately.

Q: How much does Google Ads management cost?
A: It depends on goals, monthly ad budget and campaign complexity; WorldDigital.ai sends a custom proposal after a short strategy call.

Q: How long does SEO take?
A: Google Business Profile and on-page fixes can show results within weeks; competitive rankings usually build over three to six months.

Q: How do we get started?
A: Book a strategy call, message on WhatsApp at (832) 834-0680, or email support@worlddigital.ai.

## Coming soon
Social & Email Autopilot: weekly AI-drafted social posts the client approves before they publish, plus email from the client's own domain.
`;

// Public pages of the live app. Social-platform service pages are intentionally not listed.
const PAGES = [
  ['/', 'weekly', '1.0'],
  ['/about', 'monthly', '0.8'],
  ['/services', 'monthly', '0.8'],
  ['/ai-seo-agency', 'monthly', '0.95'],
  ['/google-ads-agency', 'monthly', '0.9'],
  ['/ai-marketing-automation', 'monthly', '0.8'],
  ['/build', 'monthly', '0.8'],
  ['/testimonials', 'monthly', '0.6'],
  ['/blog', 'weekly', '0.8'],
  ['/blog/how-ai-marketing-automation-works', 'monthly', '0.7'],
  ['/blog/google-ads-management-local-businesses', 'monthly', '0.7'],
  ['/blog/essential-strategies-for-effective-digital-marketing-in-2026', 'monthly', '0.7'],
  ['/blog/best-google-ads-automation-tool', 'monthly', '0.7'],
  ['/blog/why-businesses-need-omnichannel-ads', 'monthly', '0.6'],
  ['/blog/snapchat-marketing-strategies', 'monthly', '0.5'],
  ['/blog/tiktok-vs-instagram-ads', 'monthly', '0.5'],
  ['/blog/youtube-shorts-marketing-guide', 'monthly', '0.5'],
  ['/help', 'monthly', '0.5'],
  ['/career', 'monthly', '0.4'],
  ['/privacy-policy', 'yearly', '0.3'],
  ['/terms-and-conditions', 'yearly', '0.3'],
  ['/cookies-policy', 'yearly', '0.2'],
];
