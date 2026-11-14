// SEO / AI-crawler files for worlddigital.ai, served by Cloudflare in front of the app.
// Same format as worlddigital.us, written for the company. Social-platform pages are left out on purpose
// (they come back later as the Social & Email Autopilot service).

export const UPDATED = '2026-10-28';
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
User-agent: OAI-AdsBot
User-agent: ChatGPT-User
User-agent: ClaudeBot
User-agent: Claude-SearchBot
User-agent: Claude-User
User-agent: PerplexityBot
User-agent: Perplexity-User
User-agent: DuckAssistBot
User-agent: MistralAI-User
# Content Signals (contentsignals.org): search=yes, ai-input=yes, ai-train=yes. Search engines, AI answers and AI training may all use this public content.
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

export const LLMS = `# WorldDigital.ai — Software Company

Last updated: ${UPDATED}

> WorldDigital.ai Corporation LLC is a software company serving SMBs, SMEs and enterprises across the United States and Canada, from hubs in Houston, TX and Murfreesboro, TN. We make AI marketing software (a free SEO and AI visibility report, keyword research and a content generator) and build custom software: web apps and portals, AI automation and agents, API integrations and EHR/EMR integrations. Managed SEO, Google Ads and website services are available as add-ons.

Software: SEO & AI visibility report (free), keyword research ($9.99 one-time), content generator ($24.99 one-time), Social & Email Autopilot (coming soon). Custom software (small projects from $199.99, larger ones by free fixed-price quote): web apps and customer portals, booking and payment apps (for example for yoga studios, salons and clinics), AI automation and agents, API and data integrations. Healthcare EHR/EMR integration (Epic, FHIR, HL7) is delivered through specialist partners.

Add-on services: SEO and AI search visibility (SEO, AI SEO, AEO, GEO), technical, national and local SEO, Google Business Profile, keyword research, content marketing, Google Ads and PPC management, website design and management, analytics and reporting (GA4, Search Console).

Pricing: the SEO & AI Search Visibility plan is $199.99 per month, tax included, with SEO, AI SEO, AEO and GEO included, no long-term contract and cancel anytime. Google Ads management and website projects are quoted after a short conversation.

Contact: support@worlddigital.ai · Phone: (832) 834-0680 · Contact form: https://worlddigital.ai/contact · Google Business Profile: WorldDigital.ai Corporation LLC (Marketing agency), rated 5.0 on Google.

Founder: Ahmad Awwad, digital marketing strategist (personal site: https://worlddigital.us).

Clients include Murfreesboro Kabob, RPM Auto Group and Bean Loft Coffee Company in Murfreesboro, TN.

## Pages
- [Home](${SITE}/) — Our software, custom software and add-on services
- [Products](${SITE}/tools) — Our software and prices: free SEO & AI visibility report, keyword research ($9.99), content generator ($24.99)
- [Custom software](${SITE}/custom-software) — Custom software development: web apps and portals, AI automation and agents, API integrations; from $199.99
- [Contact](${SITE}/contact) — Contact form for software, custom projects and services
- [About](${SITE}/about) — The company, how we work, founder
- [Services](${SITE}/services) — Add-on managed services
- [AI SEO Agency](${SITE}/ai-seo-agency) — SEO, AI SEO, answer engine optimization (AEO) and generative engine optimization (GEO), $199.99/month
- [AI SEO Pricing](${SITE}/ai-seo-pricing) — what AI SEO (AEO/GEO) costs in 2026, from Fiverr gigs and $100-$500 plans to $1,500+/month agencies, with sources; WorldDigital.ai is $199.99/month, tax included, no long-term contract
- [Local SEO services](${SITE}/local-seo-services) — Google Business Profile, Maps and “near me” rankings, citations and reviews, included in the $199.99/month plan
- [Generative engine optimization](${SITE}/generative-engine-optimization) — GEO so ChatGPT, Google AI Overviews, Gemini and Perplexity mention and cite your brand
- [Google Ads Agency](${SITE}/google-ads-agency) — Google Search, Maps and Performance Max campaign management
- [AI Marketing Automation](${SITE}/ai-marketing-automation) — Automated marketing workflows for growing businesses
- [Website Build](${SITE}/build) — Website design, maintenance and management for SMBs, SMEs and enterprises
- [EHR & EMR Integration](${SITE}/ehr-emr-integration) — Google Ads that book patient visits (cost per booked visit); Epic, EHR and EMR integration through leading regional integration partners, with WorldDigital.ai as single point of contact
- [Free SEO audit](${SITE}/free-seo-report) — Free SEO and AI visibility report (website SEO checker) in about 60 seconds
- [Keyword research](${SITE}/services/keyword-research) — Keyword research tool and services: real Google search volume, CPC and competition (3 keywords free, all 10 for $9.99)
- [SEO content](${SITE}/services/content-marketing) — Content marketing services and an AI content generator for ads and posts on 8 platforms (1 free, 5 for $24.99)
- [Houston, TX](${SITE}/houston) — Local SEO, Google Ads and web design for Houston businesses
- [Murfreesboro, TN](${SITE}/murfreesboro) — Local SEO, Google Ads and web design for Murfreesboro and Rutherford County businesses
- [Multi-location](${SITE}/enterprise) — SEO and Google Ads for brands with many locations
- [Reviews](${SITE}/testimonials) — Client reviews, BBB A+ and Google rating
- [Blog](${SITE}/blog) — Guides on SEO, AI search and Google Ads
- [Social Hub](${SITE}/social) — Our LinkedIn, Instagram, Facebook, TikTok, YouTube and X posts with SEO and AI marketing tips, updated nightly
- [Help Center](${SITE}/help) — Plans, billing, cancelling and results
- [Careers](${SITE}/career)
- [Privacy Policy](${SITE}/privacy-policy)
- [Terms and Conditions](${SITE}/terms-and-conditions)

## Free tools
- [Free SEO & AI visibility report](${SITE}/free-seo-report) — Scores for on-page SEO, mobile speed, Google rankings, backlinks and AI-answer citations in about 60 seconds
- [All free tools and prices](${SITE}/tools) — Free SEO report (free), keyword research (3 free, 10 for $9.99) and content generator (1 free, 5 for $24.99) on one page
- [Keyword research tool](${SITE}/services/keyword-research) — Enter a website, get its top 3 keywords free with Google search volume, CPC and competition; all 10 for $9.99 one-time (PDF, Excel or Word)
- [Content generator](${SITE}/services/content-marketing) — Ads or posts for Google Search Ads, Facebook, Instagram, LinkedIn, X, TikTok, YouTube Shorts or Snapchat; 1 free, 5 for $24.99 one-time

## Optional
- [Full knowledge file](${SITE}/llms-full.txt) — Detailed reference on the company, services, process and common questions
- [Answer API](${SITE}/api/rag/answer) — POST JSON {"query": "your question"}; returns an answer grounded in this website with source links (30 questions a day per IP)
- Any page as Markdown — send \`Accept: text/markdown\`; the front matter lists title, description, canonical URL, language, type and, for blog posts, dates and category
`;

export const LLMS_FULL = `# WorldDigital.ai — Full Reference

Last updated: ${UPDATED}

## Company
- Legal name: WorldDigital.ai Corporation LLC
- Type: Software company (SaaS marketing tools and custom software development), with managed marketing services as add-ons
- Founded: 2023
- Service area: the whole United States and Canada (remote). Hubs: Houston, Texas and Murfreesboro, Tennessee
- Languages: English, Arabic and Urdu (marketing and content in Arabic and Urdu too). Spanish is not offered.
- Guarantees: WorldDigital.ai does not guarantee first-page Google rankings or AI citations, because Google and AI assistants decide those; the work and a monthly report of what changed are what is committed to.
- Website: ${SITE}
- Email: support@worlddigital.ai
- Phone: (832) 834-0680
- Contact form: https://worlddigital.ai/contact
- Official profiles: Google Business Profile: https://share.google/FB4831wKavklYkwE8; LinkedIn: https://www.linkedin.com/company/103999920; Facebook: https://www.facebook.com/270977466108280; Instagram: https://www.instagram.com/worlddigitalai; X: https://x.com/Worlddigitalai; YouTube: https://www.youtube.com/channel/UCQnMWxPXt_OyldvmKizBJNA; TikTok: https://www.tiktok.com/@worlddigitalai; Snapchat: https://www.snapchat.com/@worlddigitalai
- Founder: Ahmad Awwad, digital marketing strategist; MBA in Strategic Marketing Analytics (in progress) and Bachelor's in Integrated Studies, Middle Tennessee State University; Google Digital Marketing & E-commerce and HubSpot Academy certifications. Personal site: https://worlddigital.us
- Trust: BBB A+ rated; Google Business Profile rated 5.0

## Who we help
SMBs, SMEs and enterprises across the United States and Canada: owner-led local businesses (restaurants, auto dealers, home services, clinics, retail), growing companies with several services or regions, and multi-location brands and franchises.

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
Search, Maps and Performance Max campaigns built around calls, bookings and cost per lead, tracked in GA4, with A/B testing of ads, keywords, landing pages and bidding. Existing accounts are audited before changes. Priced by custom proposal after a short call; ad spend is separate and paid directly to Google. SEM (search engine marketing) means paid search ads, mainly Google Ads, that put a business at the top of search results from day one, while SEO earns free rankings over months.

### Website design & management (custom quote)
Planning, mobile-first design and development, domain/DNS/SSL/hosting (including Cloudflare), SEO-ready launch with schema, sitemap, GA4 and Search Console, conversion optimization and ongoing maintenance.

### Healthcare: Google Ads for patient bookings, and EHR & EMR integration partners (custom quote)
WorldDigital.ai itself runs Google Ads for healthcare that are measured by booked patient visits (cost per booked visit); only de-identified conversion counts go to ad platforms. WorldDigital.ai does not build Epic, EHR or EMR integrations itself: for hospitals, health systems and large clinics it brings in leading integration firms in their region with experience on their EHR (Epic FHIR API, SMART on FHIR, HL7), and stays the single point of contact. The partner builds the integration and signs any Business Associate Agreement needed for patient data. ${SITE}/ehr-emr-integration

### Keyword research tool ($9.99 one-time)
Enter a website and market (United States or Canada). The tool reads the site, pulls Google Ads keyword data (monthly search volume, cost per click, competition) and ranks the 10 keywords most likely to bring customers, with intent and target page. Top 3 are free; all 10 are $9.99, delivered as PDF, Excel or Word and by email. One free preview per website. ${SITE}/services/keyword-research

### Content generator ($24.99 one-time)
Five ads or posts written from the website's real offer, within each platform's character limits: Google Search Ads, Facebook, Instagram, LinkedIn, X (Twitter), TikTok, YouTube Shorts or Snapchat. One is free to preview; all five are $24.99, as PDF, Excel or Word and by email. One free preview per website. ${SITE}/services/content-marketing

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

Q: How much does SEO cost?
A: $199.99 per month, tax included, with SEO, AI SEO, AEO and GEO included and no long-term contract. Larger sites or several locations are quoted separately.

Q: How much does Google Ads management cost?
A: It depends on goals, monthly ad budget and campaign complexity; WorldDigital.ai sends a custom proposal after a short conversation.

Q: How long does SEO take?
A: Google Business Profile and on-page fixes can show results within weeks; competitive rankings usually build over three to six months.

Q: How do we get started?
A: Start free with any tool at https://worlddigital.ai/tools, send a message through https://worlddigital.ai/contact, or email support@worlddigital.ai.

## Coming soon
Social & Email Autopilot: weekly AI-drafted social posts the client approves before they publish, plus email from the client's own domain.
`;

// Public pages of the live app. Social-platform service pages are intentionally not listed.
const PAGES = [
  ['/', 'weekly', '1.0'],
  ['/about', 'monthly', '0.8'],
  ['/services', 'monthly', '0.8'],
  ['/ai-seo-agency', 'monthly', '0.95'],
  ['/ai-seo-pricing', 'monthly', '0.8'],
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
