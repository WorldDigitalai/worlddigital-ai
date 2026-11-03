// Static pages: same addresses as the old worlddigital.ai site, new company design.
import home from './pages/home.html';
import services from './pages/services.html';
import seo from './pages/ai-seo-agency.html';
import pricing from './pages/ai-seo-pricing.html';
import ads from './pages/google-ads-agency.html';
import build from './pages/build.html';
import ehr from './pages/ehr-emr-integration.html';
import about from './pages/about.html';
import houston from './pages/houston.html';
import murfreesboro from './pages/murfreesboro.html';
import automation from './pages/ai-marketing-automation.html';
import testimonials from './pages/testimonials.html';
import help from './pages/help.html';
import career from './pages/career.html';
import contact from './pages/contact.html';
import customSoftware from './pages/custom-software.html';
import enterprise from './pages/enterprise.html';
import keywords from './pages/keyword-research.html';
import content from './pages/content-marketing.html';
import report from './pages/free-seo-report.html';
import localSeo from './pages/local-seo-services.html';
import geo from './pages/generative-engine-optimization.html';
import autopilot from './pages/autopilot-preview.html';
import { socialBody, socialSchema } from './social.js';
import unsubscribe from './pages/unsubscribe.html';
import privacy from '../content/legal/privacy-policy.md';
import terms from '../content/legal/terms-and-conditions.md';
import cookies from '../content/legal/cookies-policy.md';
import { ORG, SITE, crumbs, esc, toolCards, TOOLS } from './layout.js';
import { mdToHtml, parseFrontmatter } from './md.js';

const svc = (name, path, description, serviceType) => ({
  '@context': 'https://schema.org', '@type': 'Service', name, serviceType, description, url: SITE + path,
  provider: { '@id': `${SITE}/#org` }, areaServed: [{ '@type': 'Country', name: 'United States' }, { '@type': 'Country', name: 'Canada' }],
});
const local = (city, region, path) => ({
  '@context': 'https://schema.org', '@type': 'ProfessionalService', '@id': `${SITE}${path}#local`, name: `WorldDigital.ai ${city}`,
  url: SITE + path, telephone: '+1-832-834-0680', email: 'support@worlddigital.ai', priceRange: '$199.99/month+',
  areaServed: { '@type': 'City', name: `${city}, ${region}` }, parentOrganization: { '@id': `${SITE}/#org` },
});

// FAQ block. layout.js turns every <details> FAQ into FAQPage schema, so none is added here.
const faq = (title, items) => ({
  html: `<section class="sec" style="background:#fff;border-top:1px solid #DCE5EF"><div class="wrap" style="max-width:880px">
<div class="eyebrow">FAQ</div><h2 class="h" style="font-size:34px;margin-top:10px">${esc(title)}</h2><div style="margin-top:20px">
${items.map(([q, a], i) => `<details${i ? '' : ' open'}><summary>${esc(q)}</summary><p class="muted" style="line-height:1.6">${a}</p></details>`).join('\n')}
</div></div></section>`,
});

const LOCAL_FAQ = faq('Local SEO questions', [
  ['What are local SEO services?', 'Local SEO services improve how a business shows up when people nearby search for what it sells: the Google Maps “local pack”, “near me” searches, Apple Maps, Bing Places and AI assistants. The work covers your Google Business Profile, location and service pages, consistent listings, reviews and local schema.'],
  ['How much do local SEO services cost?', 'Local SEO is included in our SEO &amp; AI Search Visibility plan at $199.99 a month, with no contract. Brands with many locations are quoted per location on the <a href="/enterprise">multi-location page</a>.'],
  ['How long does local SEO take?', 'Google Business Profile and listing fixes can show results within a few weeks. Competitive “service + city” rankings usually build over three to six months.'],
  ['Do I need a storefront?', 'No. Service-area businesses that travel to customers can rank in local results too. We set up the profile as a service-area business and build pages for the areas you cover.'],
  ['Does local SEO help with ChatGPT and AI answers?', 'Yes. AI assistants lean on the same signals: consistent business details, reviews and clear pages about what you do and where. See our <a href="/generative-engine-optimization">generative engine optimization</a> work.'],
  ['Do you work outside Houston and Murfreesboro?', 'Yes. We work remotely with businesses across the United States and Canada.'],
]);

const GEO_FAQ = faq('GEO questions', [
  ['What is generative engine optimization (GEO)?', 'GEO is the practice of making a brand easy for AI systems such as ChatGPT, Google AI Overviews, Gemini and Perplexity to find, understand and trust, so they mention or cite it in generated answers.'],
  ['How is GEO different from SEO?', 'SEO aims to rank pages in search results. GEO aims to get your brand named inside AI answers. They share a lot of work (clear content, technical health, trusted mentions), so we run them together.'],
  ['Can you guarantee ChatGPT will recommend my business?', 'No one can guarantee what an AI model says. What we can do is fix the reasons it skips you today and track mentions and citations over time, so you can see progress.'],
  ['How do you measure GEO?', 'We run a fixed set of buyer questions through AI assistants each month and record whether you are mentioned or cited, which competitors are, and which sources the answers rely on.'],
  ['What is llms.txt?', 'llms.txt is a plain-text file at the root of a website that summarizes the business and lists its key pages for AI tools. We write and maintain it as part of GEO.'],
  ['How much do GEO services cost?', 'GEO is included in the SEO &amp; AI Search Visibility plan at $199.99 a month, together with SEO, AI SEO and AEO. No contract.'],
]);

const CUSTOM_FAQ = faq('Custom software questions', [
  ['How much does custom software cost?', 'It depends on scope: the number of screens, users, integrations and the data involved. After a short discovery conversation we send a written proposal with a fixed price and timeline, so you know the full cost before any work starts.'],
  ['How long does a project take?', 'Small tools and integrations often take 2 to 6 weeks. Larger web apps and portals are delivered in phases, with a working demo early so you can give feedback as it is built.'],
  ['Who owns the code?', 'You do. When the project is paid for, the code, data and accounts are yours, and we can keep supporting it or hand it to your own team.'],
  ['Can you connect our existing tools?', 'Yes. We build API and data integrations between CRMs, payment, scheduling, email and ad platforms, and EHR/EMR systems for healthcare.'],
  ['Do you support the software after launch?', 'Yes. We offer monitoring, security updates, fixes and new features after launch, month to month.'],
]);
const TOOLS_FAQ = faq('Tool questions', [
  ['Are the tools really free to try?', 'Yes. The SEO report is completely free. Keyword research shows your top 3 keywords free and the content generator writes your first piece free, with no sign-up and no card.'],
  ['How much do the paid versions cost?', 'All 10 keywords cost $9.99 and a pack of 5 ads or posts costs $24.99. Both are one-time payments through Stripe, with no subscription.'],
  ['How many free tries do I get?', 'One free preview per website for each tool. If you run the same website again, we show you the result you already have and offer the full version.'],
  ['What formats do I get?', 'Paid results download as PDF, Excel or Word, and we also email them to you.'],
  ['What if I want you to do the work?', 'The <a href="/ai-seo-agency">SEO &amp; AI Search Visibility plan</a> is $199.99 a month with no contract and includes keyword research, content and fixes done for you.'],
]);
const TOOLS_BODY = `<section style="background:#fff;border-bottom:1px solid #DCE5EF"><div class="wrap" style="padding-top:64px;padding-bottom:56px">
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> / Products</nav>
<div class="eyebrow" style="margin-top:14px">Products</div>
<h1 class="h hero-h" style="font-size:52px;line-height:1.08;margin-top:14px;max-width:900px">SEO &amp; AI marketing software, <span style="color:#0D5EC7">free to start.</span></h1>
<p style="font-size:19px;line-height:1.6;color:#33445A;margin:20px 0 0;max-width:760px">Check your website, find the keywords you can win and get ready-to-post content, all from real Google data. Every tool has a free version; pay only if you want the full result.</p>
</div></section>
<section class="sec"><div class="wrap">
<h2 class="h" style="font-size:30px">Pick a tool</h2>
<div class="grid3" style="margin-top:20px">${toolCards()}</div>
</div></section>
<section class="sec"><div class="wrap" style="max-width:880px">
<h2 class="h" style="font-size:30px">Prices at a glance</h2>
<div style="margin-top:20px;overflow-x:auto;border:1px solid #DCE5EF;border-radius:16px"><table class="cmp"><thead><tr><th scope="col">Tool or plan</th><th scope="col">Free</th><th scope="col">Full version</th></tr></thead><tbody>
<tr><th scope="row"><a href="/free-seo-report">SEO &amp; AI visibility report</a></th><td>Full report</td><td>Free</td></tr>
<tr><th scope="row"><a href="/services/keyword-research">Keyword research</a></th><td>Top 3 keywords</td><td>All 10 for $9.99, one time</td></tr>
<tr><th scope="row"><a href="/services/content-marketing">Content pack</a></th><td>1 ad or post</td><td>5 for $24.99, one time</td></tr>
<tr><th scope="row"><a href="/ai-seo-agency">SEO &amp; AI Search Visibility plan</a></th><td>Free consultation</td><td>$199.99 a month, no contract</td></tr>
</tbody></table></div>
</div></section>
${TOOLS_FAQ.html}`;
const CHECKER_FAQ = faq('SEO checker questions', [
  ['What does this SEO checker test?', 'It checks on-page SEO (titles, descriptions, headings, schema), mobile speed with Google Lighthouse, where you rank on Google, your backlinks, and whether AI assistants cite your site, then lists your top fixes.'],
  ['Is the SEO audit really free?', 'Yes. Enter your website and you get the report in about a minute, with no credit card.'],
  ['How accurate is it?', 'Speed scores come from Google Lighthouse and rankings and backlinks from live search data, so they reflect what Google sees today. Rankings change daily, so treat it as a snapshot.'],
  ['What should I do after the audit?', 'Start with the top fixes; each one has plain steps and an AI prompt you can paste into ChatGPT, Claude or Gemini. If you would rather have it done for you, the <a href="/ai-seo-agency#plan">$199.99 a month SEO plan</a> covers it.'],
]);

function legal(md, path) {
  const { meta, body } = parseFrontmatter(md);
  return {
    path, title: `${meta.title} | WorldDigital.ai`, description: `${meta.title} for WorldDigital.ai Corporation LLC: how we handle your information and the rules for using our services.`,
    body: `<section style="background:#fff;border-bottom:1px solid #DCE5EF"><div class="wrap" style="padding-top:56px;padding-bottom:40px;max-width:860px">
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> / ${esc(meta.title)}</nav>
<div class="eyebrow" style="margin-top:14px">Legal</div><h1 class="h" style="font-size:44px;margin-top:10px">${esc(meta.title)}</h1>
<p class="muted">Last updated: ${esc(meta.updated)}</p></div></section>
<section class="sec" style="padding-top:40px"><div class="wrap prose" style="max-width:860px">${mdToHtml(body)}</div></section>`,
    cta: false, tools: false, schema: [crumbs([['Home', '/'], [meta.title, path]])], sitemap: { priority: '0.3', changefreq: 'yearly' },
  };
}

export const PAGES = {
  '/': { keywords: 'seo software, ai seo tools, marketing software for small business, custom software development, ai automation, software company, seo services, ai visibility checker', body: home, cta: false, tools: false, title: 'SEO & AI Marketing Software, Custom Software | WorldDigital.ai',
    description: 'WorldDigital.ai is a software company: AI tools for SEO and AI search visibility, plus custom software, AI automation and integrations for SMBs and enterprises.',
    schema: [ORG, { '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${SITE}/#site`, name: 'WorldDigital.ai', url: `${SITE}/`, publisher: { '@id': `${SITE}/#org` } }],
    sitemap: { priority: '1.0', changefreq: 'weekly' } },
  '/services': { keywords: 'digital marketing services for small business, digital marketing company, seo services, google ads management, small business website design', body: services, cta: false, title: 'Managed SEO, Google Ads & Website Services | WorldDigital.ai',
    description: 'Managed services from WorldDigital.ai: SEO and AI search ($199.99/month), Google Ads management and websites for SMBs, SMEs and enterprises in the US and Canada.',
    schema: [crumbs([['Home', '/'], ['Services', '/services']])], sitemap: { priority: '0.9' } },
  '/ai-seo-agency': { keywords: 'ai seo, ai seo agency, ai seo services, ai seo company, ai search optimization agency, ai search agency, generative engine optimization, generative engine optimization services, answer engine optimization, aeo seo, geo seo, llm seo, chatgpt seo, ai search optimization', body: seo, cta: false, title: 'AI SEO Agency: GEO, AEO & AI SEO Services | WorldDigital.ai',
    description: 'AI SEO agency for SMBs, SMEs and enterprises: GEO, AEO and AI SEO services to rank on Google and get cited by ChatGPT and AI Overviews. $199.99/month.',
    schema: [svc('SEO & AI Search Visibility', '/ai-seo-agency', 'SEO, AI SEO, AEO and GEO for SMBs, SMEs and enterprises, $199.99 per month.', 'Search engine optimization'),
      { '@context': 'https://schema.org', '@type': 'Offer', name: 'SEO & AI Search Visibility plan', price: '199.99', priceCurrency: 'USD', url: `${SITE}/ai-seo-agency#plan`, seller: { '@id': `${SITE}/#org` } },
      crumbs([['Home', '/'], ['Services', '/services'], ['SEO & AI Search', '/ai-seo-agency']])], sitemap: { priority: '0.9' } },
  '/ai-seo-pricing': { keywords: 'ai seo pricing, ai seo cost, how much does ai seo cost, aeo pricing, geo pricing, affordable ai seo, ai seo services for small business, ai seo agency pricing', body: pricing, cta: false,
    title: 'AI SEO Pricing 2026: $200/mo vs Agencies | WorldDigital.ai',
    description: 'How much AI SEO (AEO/GEO) costs in 2026: Fiverr gigs, $100-$500 plans, $500-$2,500 packages and $1,500+ agencies compared with sources. Our plan: $199.99/mo.',
    schema: [{ '@context': 'https://schema.org', '@type': 'Article', headline: 'AI SEO pricing in 2026: what $200 a month gets you vs. agencies and Fiverr', datePublished: '2026-10-27', dateModified: '2026-10-27', author: { '@id': 'https://worlddigital.us/#person' }, publisher: { '@id': `${SITE}/#org` }, mainEntityOfPage: `${SITE}/ai-seo-pricing` },
      { '@context': 'https://schema.org', '@type': 'Offer', name: 'SEO & AI Search Visibility plan', price: '199.99', priceCurrency: 'USD', url: `${SITE}/ai-seo-agency#plan`, seller: { '@id': `${SITE}/#org` } },
      crumbs([['Home', '/'], ['SEO & AI Search', '/ai-seo-agency'], ['AI SEO pricing', '/ai-seo-pricing']])], sitemap: { priority: '0.8' } },
  '/google-ads-agency': { keywords: 'google ads agency, google ads management, google ads management services, ppc management services, ppc agency, ppc management, google ads expert, local service ads', body: ads, cta: false, title: 'Google Ads Agency & PPC Management | WorldDigital.ai',
    description: 'Google Ads agency for SMBs, SMEs and enterprises: PPC management, Performance Max and Local Service Ads built around leads and cost per lead.',
    schema: [svc('Google Ads & PPC management', '/google-ads-agency', 'Search, Maps and Performance Max campaigns built around calls, bookings and cost per lead.', 'Pay-per-click advertising management'),
      crumbs([['Home', '/'], ['Services', '/services'], ['Google Ads & PPC', '/google-ads-agency']])], sitemap: { priority: '0.9' } },
  '/build': { keywords: 'small business website design, website design for small business, website design services for small business, website maintenance services, website management services, web design company', body: build, cta: false, title: 'Website Design & Maintenance | WorldDigital.ai',
    description: 'Website design services for small business plus website maintenance and management: fast, mobile-first, SEO-ready sites with hosting, GA4 and Search Console.',
    schema: [svc('Web design & website management', '/build', 'Planning, design, development, hosting, SEO-ready launch and ongoing management.', 'Web design'),
      crumbs([['Home', '/'], ['Services', '/services'], ['Web design', '/build']])], sitemap: { priority: '0.8' } },
  '/ehr-emr-integration': { keywords: 'epic integration, integrate with epic, ehr integration, emr integration, epic ehr integration, ehr integration services, emr integration services, epic fhir api, smart on fhir, fhir integration, hl7 integration, ehr vs emr, patient portal integration, medical website design, healthcare web design', body: ehr, cta: false, tools: false,
    title: 'Epic, EHR & EMR Integration Services | WorldDigital.ai',
    description: 'Epic integration and EHR and EMR integration services: Epic FHIR API apps, SMART on FHIR, HL7 integration, patient portal tools and medical websites.',
    schema: [svc('EHR & EMR integration', '/ehr-emr-integration', 'Epic and FHIR-based integrations, AI booking and attribution for Epic clinics, patient-facing AI tools, medical websites and workflow automation for clinics, health systems and health tech companies.', 'Epic integration, EHR and EMR integration, FHIR and HL7 integration'),
      crumbs([['Home', '/'], ['Services', '/services'], ['EHR & EMR integration', '/ehr-emr-integration']])], sitemap: { priority: '0.9', lastmod: '2026-10-27' } },
  '/about': { body: about, cta: false, title: 'About WorldDigital.ai | Software Company',
    description: 'WorldDigital.ai is a software company in Houston, TX and Murfreesboro, TN making AI marketing tools and custom software for businesses across the US and Canada.',
    schema: [ORG, crumbs([['Home', '/'], ['About us', '/about']])], sitemap: { priority: '0.7' } },
  '/houston': { keywords: 'houston seo company, seo company houston tx, seo houston, houston seo, web design houston, houston web design, digital marketing agency houston', body: houston, cta: false, title: 'Houston SEO Company & Web Design Houston | WorldDigital.ai',
    description: 'Houston SEO company and digital marketing agency for small businesses: local SEO, AI search, Google Ads (PPC) and web design in Houston, TX, from $199.99/month.',
    schema: [local('Houston', 'TX', '/houston'), crumbs([['Home', '/'], ['Houston, TX', '/houston']])], sitemap: { priority: '0.8' } },
  '/murfreesboro': { keywords: 'web design murfreesboro tn, murfreesboro web design, murfreesboro seo, seo murfreesboro tn, seo nashville', body: murfreesboro, cta: false, title: 'Web Design & SEO in Murfreesboro, TN | WorldDigital.ai',
    description: 'Web design in Murfreesboro, TN and local SEO for Rutherford County small businesses: Google Maps, AI search, Google Ads and websites, from $199.99/month.',
    schema: [local('Murfreesboro', 'TN', '/murfreesboro'), crumbs([['Home', '/'], ['Murfreesboro, TN', '/murfreesboro']])], sitemap: { priority: '0.8' } },
  '/ai-marketing-automation': { keywords: 'ai marketing agency, ai marketing automation, ai digital marketing, ai powered marketing automation, marketing automation for small business', body: automation, title: 'AI Marketing Agency & Automation | WorldDigital.ai',
    description: 'AI marketing agency for growing businesses: AI marketing automation for SEO, Google Ads monitoring and reporting, checked by real strategists.',
    schema: [svc('AI marketing automation', '/ai-marketing-automation', 'AI-assisted research, content drafts, ad monitoring and reporting, reviewed by strategists.', 'Marketing automation'),
      crumbs([['Home', '/'], ['Services', '/services'], ['AI marketing automation', '/ai-marketing-automation']])], sitemap: { priority: '0.7' } },
  '/services/keyword-research': { keywords: 'keyword research services, keyword research, local keyword research, seo keyword research', body: keywords, tool: 'keywords', title: 'Keyword Research Tool: 10 Keywords, $9.99 | WorldDigital.ai',
    description: 'Keyword research for SMBs, SMEs and enterprises in the US and Canada: real Google volume and CPC. 3 keywords free, all 10 for $9.99 as PDF, Excel or Word.',
    schema: [svc('Keyword research', '/services/keyword-research', 'Search and AI-question research grouped by service and city.', 'Keyword research'),
      crumbs([['Home', '/'], ['Services', '/services'], ['Keyword research', '/services/keyword-research']])], sitemap: { priority: '0.6' } },
  '/services/content-marketing': { keywords: 'seo content writing, seo content writing services, content marketing services, seo copywriting, content writing for seo', body: content, tool: 'content', title: 'Content Marketing Services & SEO Content | WorldDigital.ai',
    description: 'Content marketing for SMBs, SMEs and enterprises: posts and ads for Google, LinkedIn, Facebook, Instagram, TikTok and more. 1 free, 5 pieces for $24.99.',
    schema: [svc('SEO content', '/services/content-marketing', 'Service pages, FAQs, guides and Google Business Profile posts.', 'Content marketing'),
      crumbs([['Home', '/'], ['Services', '/services'], ['SEO content', '/services/content-marketing']])], sitemap: { priority: '0.6' } },
  '/testimonials': { body: testimonials, title: 'Reviews & Testimonials | WorldDigital.ai',
    description: 'What clients say about WorldDigital.ai: reviews from businesses we help with SEO, AI search and Google Ads. A+ BBB rating and 5.0 on Google.',
    schema: [crumbs([['Home', '/'], ['Reviews', '/testimonials']])], sitemap: { priority: '0.6' } },
  '/help': { body: help, title: 'Help Center: Plans, Billing & Results | WorldDigital.ai',
    description: 'Answers about WorldDigital.ai plans, billing, cancelling, results and reporting. Contact support@worlddigital.ai or (832) 834-0680.',
    schema: [crumbs([['Home', '/'], ['Help center', '/help']])], sitemap: { priority: '0.5' } },
  '/career': { body: career, title: 'Careers at WorldDigital.ai | Software & AI Jobs',
    description: 'Join WorldDigital.ai: remote-friendly software, AI and digital marketing roles with flexible hours, learning and growth. Apply online.',
    schema: [crumbs([['Home', '/'], ['Careers', '/career']])], sitemap: { priority: '0.4' } },
  '/local-seo-services': { keywords: 'local seo services, local seo, local seo company, google business profile optimization, near me seo, google maps seo, local seo agency', body: localSeo + LOCAL_FAQ.html, title: 'Local SEO Services: Google Maps & Near Me | WorldDigital.ai',
    description: 'Local SEO services for SMBs, SMEs and multi-location brands in the US and Canada: Google Business Profile, Maps rankings, citations and reviews. $199.99/month.',
    schema: [svc('Local SEO services', '/local-seo-services', 'Google Business Profile, location pages, citations, reviews and local schema.', 'Local SEO'),
      crumbs([['Home', '/'], ['Services', '/services'], ['Local SEO services', '/local-seo-services']])], sitemap: { priority: '0.9' } },
  '/generative-engine-optimization': { keywords: 'generative engine optimization, geo, generative engine optimization services, generative engine optimization agency, ai search optimization, chatgpt seo, how to rank in chatgpt, llm seo', body: geo + GEO_FAQ.html, title: 'Generative Engine Optimization (GEO) | WorldDigital.ai',
    description: 'Generative engine optimization (GEO) services: get your brand mentioned and cited by ChatGPT, Google AI Overviews, Gemini and Perplexity. $199.99/month.',
    schema: [svc('Generative engine optimization', '/generative-engine-optimization', 'GEO so AI assistants mention and cite your brand.', 'Generative engine optimization'),
      crumbs([['Home', '/'], ['Services', '/services'], ['Generative engine optimization', '/generative-engine-optimization']])], sitemap: { priority: '0.9' } },
  '/enterprise': { keywords: 'multi location seo, multi-location local seo, franchise seo, multi location marketing, enterprise local seo', body: enterprise, title: 'Multi-Location SEO & Franchise SEO | WorldDigital.ai',
    description: 'Multi-location SEO and franchise SEO for brands with many locations: location pages, Google Business Profiles, AI search and Google Ads, priced per location.',
    schema: [svc('Multi-location marketing', '/enterprise', 'Local SEO, AI search and Google Ads across many locations.', 'Multi-location SEO'),
      crumbs([['Home', '/'], ['Multi-location', '/enterprise']])], sitemap: { priority: '0.5' } },
  '/custom-software': { keywords: 'custom software development, software development company, custom web app development, ai automation services, api integration services, software company for small business', body: customSoftware + CUSTOM_FAQ.html,
    title: 'Custom Software Development & AI Automation | WorldDigital.ai',
    description: 'Custom software development for SMBs, SMEs and enterprises: web apps and portals, AI automation and agents, API and EHR/EMR integrations. Fixed-scope proposals.',
    schema: [svc('Custom software development', '/custom-software', 'Web apps and customer portals, AI automation and agents, API and data integrations, and EHR/EMR integrations.', 'Software development'),
      crumbs([['Home', '/'], ['Custom software', '/custom-software']])], sitemap: { priority: '0.9' } },
  '/contact': { body: contact, cta: false, tools: false, title: 'Contact WorldDigital.ai | Software & Custom Development',
    description: 'Contact WorldDigital.ai about our marketing software, a custom software or AI automation project, an integration or a managed service. We reply in one business day.',
    schema: [{ '@context': 'https://schema.org', '@type': 'ContactPage', name: 'Contact WorldDigital.ai', url: `${SITE}/contact`, about: { '@id': `${SITE}/#org` } },
      crumbs([['Home', '/'], ['Contact', '/contact']])], sitemap: { priority: '0.6' } },
  '/tools': { keywords: 'free seo tools, free keyword research tool, ai content generator, free seo checker, seo tools for small business', body: TOOLS_BODY, tools: false,
    title: 'Products: SEO & AI Marketing Software | WorldDigital.ai',
    description: 'WorldDigital.ai software, free to start: SEO and AI visibility report (free), keyword research (3 free, 10 for $9.99) and content generator (1 free, 5 for $24.99).',
    schema: [{ '@context': 'https://schema.org', '@type': 'ItemList', name: 'WorldDigital.ai SEO tools', itemListElement: TOOLS.map((t, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + t.path, name: t.name })) },
      ...TOOLS.map((t) => ({ '@context': 'https://schema.org', '@type': 'WebApplication', name: t.name, url: SITE + t.path, applicationCategory: 'BusinessApplication', operatingSystem: 'Any',
        offers: { '@type': 'Offer', price: t.price === 'Free' ? '0' : t.price.slice(1), priceCurrency: 'USD' }, provider: { '@id': `${SITE}/#org` } })),
      crumbs([['Home', '/'], ['Products', '/tools']])], sitemap: { priority: '0.8', changefreq: 'monthly' } },
  '/free-seo-report': { keywords: 'free seo audit, free seo report, website seo checker, seo checker, free website audit, seo audit, ai visibility checker', body: report + CHECKER_FAQ.html, title: 'Free SEO Audit & Website SEO Checker | WorldDigital.ai',
    description: 'Free SEO audit and website SEO checker: on-page SEO, mobile speed, Google rankings, backlinks and ChatGPT citations, with your top fixes in 60 seconds.',
    schema: [{ '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Free SEO & AI Visibility Report', url: `${SITE}/free-seo-report`, applicationCategory: 'BusinessApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, provider: { '@id': `${SITE}/#org` } },
      crumbs([['Home', '/'], ['Free SEO report', '/free-seo-report']])], sitemap: { priority: '0.9', changefreq: 'monthly' } },
  '/social': { keywords: 'worlddigital.ai social media, seo tips, ai marketing tips, small business marketing tips, social media marketing', body: socialBody, schema: socialSchema,
    title: 'Social Hub: SEO & AI Marketing Tips | WorldDigital.ai',
    description: 'The WorldDigital.ai Social Hub: our best LinkedIn, Instagram, Facebook, TikTok, YouTube and X posts with SEO, AI search and marketing tips.',
    sitemap: { priority: '0.6', changefreq: 'daily' } },
  // Private product preview: not linked, not in the sitemap, noindex.
  '/autopilot/preview': { body: autopilot, cta: false, noFloat: true, noChat: true, noindex: true, title: 'Autopilot preview | WorldDigital.ai', description: 'Preview of the Social & Email Autopilot dashboard.', sitemap: null },
  '/unsubscribe': { body: unsubscribe, cta: false, noindex: true, noChat: true, title: 'Unsubscribe | WorldDigital.ai', description: 'Unsubscribe from WorldDigital.ai marketing emails.', sitemap: null },
  '/privacy-policy': legal(privacy, '/privacy-policy'),
  '/terms-and-conditions': legal(terms, '/terms-and-conditions'),
  '/cookies-policy': legal(cookies, '/cookies-policy'),
};

// Addresses that permanently move (301).
export const REDIRECTS = {
  // social-platform service pages: back later as Social & Email Autopilot
  '/meta-ads-agency': '/services', '/facebook-ads-management': '/services', '/instagram-marketing': '/services',
  '/tiktok-ads-agency': '/services', '/tiktok-marketing': '/services', '/snapchat-ads-agency': '/services',
  '/snapchat-marketing': '/blog/snapchat-marketing-strategies', '/linkedin-ads-agency': '/services', '/x-ads-agency': '/services',
  '/youtube-shorts-marketing': '/blog/youtube-shorts-marketing-guide',
  // old blog posts Google still shows (Search Console, Oct 2026): send to the closest live page
  '/blog/ai-search-optimization-is-exploding-in-2026': '/ai-seo-agency',
  '/blog/seo-visibility-score-south-fix-searchmetrics-drops': '/free-seo-report',
  '/blog/ai-news-today-2026-trends-smbs-must-know': '/blog/how-ai-marketing-automation-works',
  '/blog/ai-trend-marketing-turn-tech-news-into-local-leads': '/blog/how-ai-marketing-automation-works',
  '/blog/ai-marketing-for-small-businesses-seo-ads': '/blog/how-ai-marketing-automation-works',
  '/blog/ai-marketing-agency-for-small-business-growth': '/ai-marketing-automation',
  '/blog/what-is-a-buffer-meaning-definition-and-examples': '/ai-marketing-automation',
  '/blog/what-is-an-sme-sme-and-smb-meaning-for-growth': '/services',
  '/blog/why-is-nike-stock-down-so-much-key-reasons-lessons': '/blog',
  '/blog/ai-search-optimization-get-found-on-chatgpt-google': '/ai-seo-agency',
  '/blog/best-rated-seo-companies': '/ai-seo-agency',
  '/blog/how-ai-is-changing-digital-advertising': '/blog/best-google-ads-automation-tool',
  '/blog/ai-advertising-automation-platform': '/blog/best-google-ads-automation-tool',
  '/blog/google-ads-vs-meta-ads-2025': '/google-ads-agency',
  '/blog/google-gemini-ai-news-features-use-cases-comparisons': '/blog/how-ai-marketing-automation-works',
  '/blog/machine-learning-in-2026-ai-news-tools-business-uses': '/blog/how-ai-marketing-automation-works',
  '/feed.xml': '/blog/feed.xml',
  // old blog posts linked from our social posts (Social Hub): closest live page
  '/blog/trending-keywords-in-2026-ai-seo-guide-for-small-businesses': '/services/keyword-research',
  '/blog/how-small-businesses-can-use-trending-keywords-to-win-online': '/services/keyword-research',
  '/blog/insurance-marketing-with-ai-more-local-leads': '/local-seo-services',
  '/blog/weather-based-marketing-how-small-businesses-win-local-demand': '/local-seo-services',
  '/blog/ai-marketing-for-small-businesses-seo-ads-leads': '/ai-seo-agency',
  '/blog/car-search-trends-2026-ai-marketing-guide-for-smbs': '/blog/how-ai-marketing-automation-works',
  '/blog/from-usps-to-tiktok-ai-marketing-trends-for-small-businesses': '/blog/how-ai-marketing-automation-works',
  '/blog/google-iphone-email-trends-ai-marketing-for-smbs': '/blog/how-ai-marketing-automation-works',
  '/blog/paypal-for-small-business-payments-crm-ai-marketing': '/blog/how-ai-marketing-automation-works',
  '/blog/book-marketing-trends-small-businesses-win-search': '/blog',
  '/blog/cat-in-the-hat-trend-ai-marketing-guide-small-businesses': '/blog',
  '/blog/sophie-cunningham-trend-ai-marketing-lessons-for-smbs': '/blog',
  '/blog/dolly-parton-trends-small-business-search-marketing-guide': '/blog',
  '/blog/voicemails-for-isabelle-ai-trend-marketing-for-smbs': '/blog',
  '/blog/nolan-wells-trend-update-ai-marketing-plays-for-smb': '/blog',
  '/blog/payment-options-for-small-business-paypal-ach-apple-pay': '/blog',
  '/blog/world-cup-bracket-2026-marketing-ideas-for-small-business': '/blog',
  '/local-seo': '/local-seo-services', '/services/local-seo': '/local-seo-services',
  '/geo': '/generative-engine-optimization', '/generative-engine-optimization-agency': '/generative-engine-optimization', '/services/geo': '/generative-engine-optimization',
  '/blog/ai-marketing-for-small-businesses-turn-tech-trends-into-seo-wins': '/blog/how-ai-marketing-automation-works',
  '/services/meta-ads': '/services', '/services/tiktok-ads': '/services', '/services/linkedin-ads': '/services',
  '/services/x-ads': '/services', '/services/snapchat-ads': '/services', '/services/youtube-shorts': '/services',
  '/services/reels-generator': '/services', '/services/image-generator': '/services',
  // duplicates of main service pages
  '/services/ai-seo': '/ai-seo-agency', '/services/google-ads': '/google-ads-agency',
  // common alternates
  '/seo-ai-visibility': '/ai-seo-agency', '/paid-media': '/google-ads-agency', '/sem-paid-media': '/google-ads-agency',
  '/website-build-management': '/build', '/privacy': '/privacy-policy', '/terms': '/terms-and-conditions', '/careers': '/career',
  '/reviews': '/testimonials', '/contact-us': '/contact', '/software-development': '/custom-software', '/products': '/tools',
};
