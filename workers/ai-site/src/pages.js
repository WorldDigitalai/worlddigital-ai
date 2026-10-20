// Static pages: same addresses as the old worlddigital.ai site, new company design.
import home from './pages/home.html';
import services from './pages/services.html';
import seo from './pages/ai-seo-agency.html';
import ads from './pages/google-ads-agency.html';
import build from './pages/build.html';
import about from './pages/about.html';
import houston from './pages/houston.html';
import murfreesboro from './pages/murfreesboro.html';
import automation from './pages/ai-marketing-automation.html';
import testimonials from './pages/testimonials.html';
import help from './pages/help.html';
import career from './pages/career.html';
import enterprise from './pages/enterprise.html';
import keywords from './pages/keyword-research.html';
import content from './pages/content-marketing.html';
import report from './pages/free-seo-report.html';
import unsubscribe from './pages/unsubscribe.html';
import privacy from '../content/legal/privacy-policy.md';
import terms from '../content/legal/terms-and-conditions.md';
import cookies from '../content/legal/cookies-policy.md';
import { ORG, SITE, crumbs, esc } from './layout.js';
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

function legal(md, path) {
  const { meta, body } = parseFrontmatter(md);
  return {
    path, title: `${meta.title} | WorldDigital.ai`, description: `${meta.title} for WorldDigital.ai Corporation LLC: how we handle your information and the rules for using our services.`,
    body: `<section style="background:#fff;border-bottom:1px solid #DCE5EF"><div class="wrap" style="padding-top:56px;padding-bottom:40px;max-width:860px">
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> / ${esc(meta.title)}</nav>
<div class="eyebrow" style="margin-top:14px">Legal</div><h1 class="h" style="font-size:44px;margin-top:10px">${esc(meta.title)}</h1>
<p class="muted">Last updated: ${esc(meta.updated)}</p></div></section>
<section class="sec" style="padding-top:40px"><div class="wrap prose" style="max-width:860px">${mdToHtml(body)}</div></section>`,
    cta: false, schema: [crumbs([['Home', '/'], [meta.title, path]])], sitemap: { priority: '0.3', changefreq: 'yearly' },
  };
}

export const PAGES = {
  '/': { keywords: 'local seo services, seo company, seo services for small business, small business seo, local seo company, seo agency, digital marketing agency for small business, ai seo, seo services canada', body: home, cta: false, title: 'Local SEO Company for Small Business | WorldDigital.ai',
    description: 'SEO services for small business across the US and Canada: local SEO, AI search (GEO and AEO) and Google Ads. One flat plan, $199.99/month, no contract.',
    schema: [ORG, { '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${SITE}/#site`, name: 'WorldDigital.ai', url: `${SITE}/`, publisher: { '@id': `${SITE}/#org` } }],
    sitemap: { priority: '1.0', changefreq: 'weekly' } },
  '/services': { keywords: 'digital marketing services for small business, digital marketing company, seo services, google ads management, small business website design', body: services, cta: false, title: 'Digital Marketing Services for Small Business | WorldDigital.ai',
    description: 'Digital marketing services for small business from one company: local SEO, AI SEO, keyword research, SEO content, Google Ads management and website design.',
    schema: [crumbs([['Home', '/'], ['Services', '/services']])], sitemap: { priority: '0.9' } },
  '/ai-seo-agency': { keywords: 'ai seo, ai seo agency, ai seo services, generative engine optimization, generative engine optimization services, answer engine optimization, aeo seo, geo seo, llm seo, chatgpt seo, ai search optimization', body: seo, cta: false, title: 'AI SEO Agency: GEO, AEO & AI SEO Services | WorldDigital.ai',
    description: 'AI SEO agency for small businesses: generative engine optimization (GEO), answer engine optimization (AEO) and AI SEO services to rank on Google and get cited by ChatGPT. $199.99/month.',
    schema: [svc('SEO & AI Search Visibility', '/ai-seo-agency', 'SEO, AI SEO, AEO and GEO for local businesses, $199.99 per month.', 'Search engine optimization'),
      { '@context': 'https://schema.org', '@type': 'Offer', name: 'SEO & AI Search Visibility plan', price: '199.99', priceCurrency: 'USD', url: `${SITE}/ai-seo-agency#plan`, seller: { '@id': `${SITE}/#org` } },
      crumbs([['Home', '/'], ['Services', '/services'], ['SEO & AI Search', '/ai-seo-agency']])], sitemap: { priority: '0.9' } },
  '/google-ads-agency': { keywords: 'google ads agency, google ads management, google ads management services, ppc management services, ppc agency, ppc management, google ads expert, local service ads', body: ads, cta: false, title: 'Google Ads Agency & PPC Management Services | WorldDigital.ai',
    description: 'Google Ads agency for small businesses: PPC management services, Google Ads management and Local Service Ads built around calls and cost per lead, tracked in GA4.',
    schema: [svc('Google Ads & PPC management', '/google-ads-agency', 'Search, Maps and Performance Max campaigns built around calls, bookings and cost per lead.', 'Pay-per-click advertising management'),
      crumbs([['Home', '/'], ['Services', '/services'], ['Google Ads & PPC', '/google-ads-agency']])], sitemap: { priority: '0.9' } },
  '/build': { keywords: 'small business website design, website design for small business, website design services for small business, website maintenance services, website management services, web design company', body: build, cta: false, title: 'Small Business Website Design & Maintenance | WorldDigital.ai',
    description: 'Website design services for small business plus website maintenance and management: fast, mobile-first, SEO-ready sites with hosting, GA4 and Search Console.',
    schema: [svc('Web design & website management', '/build', 'Planning, design, development, hosting, SEO-ready launch and ongoing management.', 'Web design'),
      crumbs([['Home', '/'], ['Services', '/services'], ['Web design', '/build']])], sitemap: { priority: '0.8' } },
  '/about': { body: about, cta: false, title: 'About WorldDigital.ai | Digital Marketing Company',
    description: 'WorldDigital.ai Corporation LLC is a digital marketing company with hubs in Houston, TX and Murfreesboro, TN, helping businesses across the US and Canada grow on Google, Maps and AI search.',
    schema: [ORG, crumbs([['Home', '/'], ['About us', '/about']])], sitemap: { priority: '0.7' } },
  '/houston': { keywords: 'houston seo company, seo company houston tx, seo houston, houston seo, web design houston, houston web design, digital marketing agency houston', body: houston, cta: false, title: 'Houston SEO Company & Web Design Houston | WorldDigital.ai',
    description: 'Houston SEO company and digital marketing agency for small businesses: local SEO, AI search, Google Ads (PPC) and web design in Houston, TX, from $199.99/month.',
    schema: [local('Houston', 'TX', '/houston'), crumbs([['Home', '/'], ['Houston, TX', '/houston']])], sitemap: { priority: '0.8' } },
  '/murfreesboro': { keywords: 'web design murfreesboro tn, murfreesboro web design, murfreesboro seo, seo murfreesboro tn, seo nashville', body: murfreesboro, cta: false, title: 'Web Design & SEO in Murfreesboro, TN | WorldDigital.ai',
    description: 'Web design in Murfreesboro, TN and local SEO for Rutherford County small businesses: Google Maps, AI search, Google Ads and websites, from $199.99/month.',
    schema: [local('Murfreesboro', 'TN', '/murfreesboro'), crumbs([['Home', '/'], ['Murfreesboro, TN', '/murfreesboro']])], sitemap: { priority: '0.8' } },
  '/ai-marketing-automation': { keywords: 'ai marketing agency, ai marketing automation, ai digital marketing, ai powered marketing automation, marketing automation for small business', body: automation, title: 'AI Marketing Agency & AI Marketing Automation | WorldDigital.ai',
    description: 'AI marketing agency for small businesses: AI marketing automation for SEO, Google Ads monitoring and reporting, checked by real strategists. Social & Email Autopilot coming soon.',
    schema: [svc('AI marketing automation', '/ai-marketing-automation', 'AI-assisted research, content drafts, ad monitoring and reporting, reviewed by strategists.', 'Marketing automation'),
      crumbs([['Home', '/'], ['Services', '/services'], ['AI marketing automation', '/ai-marketing-automation']])], sitemap: { priority: '0.7' } },
  '/services/keyword-research': { keywords: 'keyword research services, keyword research, local keyword research, seo keyword research', body: keywords, title: 'Keyword Research Services for Local SEO | WorldDigital.ai',
    description: 'Keyword research services for local businesses: the Google searches and AI questions your customers use, grouped by service and city. Included in the $199.99/month SEO plan.',
    schema: [svc('Keyword research', '/services/keyword-research', 'Search and AI-question research grouped by service and city.', 'Keyword research'),
      crumbs([['Home', '/'], ['Services', '/services'], ['Keyword research', '/services/keyword-research']])], sitemap: { priority: '0.6' } },
  '/services/content-marketing': { keywords: 'seo content writing, seo content writing services, content marketing services, seo copywriting, content writing for seo', body: content, title: 'SEO Content Writing & Content Marketing Services | WorldDigital.ai',
    description: 'SEO content writing and content marketing services for small businesses: service pages, FAQs and guides that rank on Google and get quoted by AI assistants.',
    schema: [svc('SEO content', '/services/content-marketing', 'Service pages, FAQs, guides and Google Business Profile posts.', 'Content marketing'),
      crumbs([['Home', '/'], ['Services', '/services'], ['SEO content', '/services/content-marketing']])], sitemap: { priority: '0.6' } },
  '/testimonials': { body: testimonials, title: 'Reviews & Testimonials | WorldDigital.ai',
    description: 'What local businesses say about WorldDigital.ai. BBB A+ rated and 5.0 on Google Business Profile.',
    schema: [crumbs([['Home', '/'], ['Reviews', '/testimonials']])], sitemap: { priority: '0.6' } },
  '/help': { body: help, title: 'Help Center | WorldDigital.ai',
    description: 'Answers about WorldDigital.ai plans, billing, cancelling, results and reporting. Contact support@worlddigital.ai or (832) 834-0680.',
    schema: [crumbs([['Home', '/'], ['Help center', '/help']])], sitemap: { priority: '0.5' } },
  '/career': { body: career, title: 'Careers at WorldDigital.ai | Digital Marketing Jobs',
    description: 'Join WorldDigital.ai: remote-friendly digital marketing and AI roles with flexible hours, learning and growth. Apply online.',
    schema: [crumbs([['Home', '/'], ['Careers', '/career']])], sitemap: { priority: '0.4' } },
  '/enterprise': { keywords: 'multi location seo, multi-location local seo, franchise seo, multi location marketing, enterprise local seo', body: enterprise, title: 'Multi-Location SEO & Franchise SEO | WorldDigital.ai',
    description: 'Multi-location SEO and franchise SEO for brands with many locations: location pages, Google Business Profiles, AI search and Google Ads, priced per location.',
    schema: [svc('Multi-location marketing', '/enterprise', 'Local SEO, AI search and Google Ads across many locations.', 'Multi-location SEO'),
      crumbs([['Home', '/'], ['Multi-location', '/enterprise']])], sitemap: { priority: '0.5' } },
  '/free-seo-report': { keywords: 'free seo audit, free seo report, website seo checker, seo checker, free website audit, seo audit, ai visibility checker', body: report, title: 'Free SEO Audit & Website SEO Checker | WorldDigital.ai',
    description: 'Free SEO audit and website SEO checker: on-page SEO, mobile speed (Google Lighthouse), Google rankings, backlinks and ChatGPT citations, with your top fixes in 60 seconds.',
    schema: [{ '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Free SEO & AI Visibility Report', url: `${SITE}/free-seo-report`, applicationCategory: 'BusinessApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, provider: { '@id': `${SITE}/#org` } },
      crumbs([['Home', '/'], ['Free SEO report', '/free-seo-report']])], sitemap: { priority: '0.9', changefreq: 'monthly' } },
  '/unsubscribe': { body: unsubscribe, cta: false, noindex: true, title: 'Unsubscribe | WorldDigital.ai', description: 'Unsubscribe from WorldDigital.ai marketing emails.', sitemap: null },
  '/privacy-policy': legal(privacy, '/privacy-policy'),
  '/terms-and-conditions': legal(terms, '/terms-and-conditions'),
  '/cookies-policy': legal(cookies, '/cookies-policy'),
};

// Addresses that permanently move (301).
export const REDIRECTS = {
  // social-platform service pages: back later as Social & Email Autopilot
  '/meta-ads-agency': '/services', '/facebook-ads-management': '/services', '/instagram-marketing': '/services',
  '/tiktok-ads-agency': '/services', '/tiktok-marketing': '/services', '/snapchat-ads-agency': '/services',
  '/snapchat-marketing': '/services', '/linkedin-ads-agency': '/services', '/x-ads-agency': '/services',
  '/youtube-shorts-marketing': '/services',
  '/services/meta-ads': '/services', '/services/tiktok-ads': '/services', '/services/linkedin-ads': '/services',
  '/services/x-ads': '/services', '/services/snapchat-ads': '/services', '/services/youtube-shorts': '/services',
  '/services/reels-generator': '/services', '/services/image-generator': '/services',
  // duplicates of main service pages
  '/services/ai-seo': '/ai-seo-agency', '/services/google-ads': '/google-ads-agency',
  // common alternates
  '/seo-ai-visibility': '/ai-seo-agency', '/paid-media': '/google-ads-agency', '/sem-paid-media': '/google-ads-agency',
  '/website-build-management': '/build', '/privacy': '/privacy-policy', '/terms': '/terms-and-conditions', '/careers': '/career',
  '/reviews': '/testimonials', '/contact': '/help',
};
