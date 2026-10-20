/**
 * Single source of truth for every public, indexable page on worlddigital.ai.
 *
 * The sitemap, llms.txt and the footer all read from this file, so a page
 * added here is published everywhere at once. When you add a new public
 * page, add it here too.
 */
import type { Metadata } from "next";
import { MODULES } from "./modules";

export const SITE_URL = (process.env["NEXT_PUBLIC_SITE_URL"] || "https://worlddigital.ai").replace(/\/$/, "");
export const SITE_NAME = "WorldDigital.ai";

export type PageSection = "core" | "solutions" | "services" | "blog" | "legal";

export interface PublicPage {
  path: string;
  label: string;
  /** One line used in llms.txt so AI assistants know what the page is for. */
  summary?: string;
  section: PageSection;
  priority: number;
  changeFrequency: "daily" | "weekly" | "monthly" | "yearly";
  /** ISO date of the last real content change. Omit when unknown. */
  lastModified?: string;
}

const CORE: PublicPage[] = [
  { path: "/",           label: "Home",                     section: "core", priority: 1.0, changeFrequency: "weekly",  summary: "AI marketing automation for SMBs, SMEs and enterprises across the US and Canada." },
  { path: "/services",   label: "Platform & Services",      section: "core", priority: 0.9, changeFrequency: "monthly", summary: "Every ad-management module and AI tool on the platform." },
  { path: "/enterprise", label: "Enterprise",               section: "core", priority: 0.8, changeFrequency: "monthly", summary: "Custom multi-brand and agency plans with dedicated support." },
  { path: "/build",      label: "Build Your Plan",          section: "core", priority: 0.7, changeFrequency: "monthly", summary: "Pick platforms and tools and see the monthly price." },
  { path: "/about",      label: "About Us",                 section: "core", priority: 0.7, changeFrequency: "monthly", summary: "Who we are and how the platform works." },
  { path: "/blog",       label: "Blog",                     section: "core", priority: 0.8, changeFrequency: "weekly",  summary: "Guides on paid ads, social media and AI SEO." },
  { path: "/help",       label: "Help Center",              section: "core", priority: 0.6, changeFrequency: "monthly", summary: "FAQs, billing and account help." },
  { path: "/career",     label: "Careers",                  section: "core", priority: 0.5, changeFrequency: "monthly", summary: "Open roles at WorldDigital.ai." },
];

const SOLUTIONS: PublicPage[] = [
  { path: "/ai-marketing-automation",  label: "AI Marketing Automation",  summary: "Full AI-driven, multi-platform ad management." },
  { path: "/ai-seo-agency",            label: "AI SEO Agency",            summary: "AI-powered search engine optimization and content strategy." },
  { path: "/google-ads-agency",        label: "Google Ads Agency",        summary: "Google Search, Display and Performance Max campaign management." },
  { path: "/meta-ads-agency",          label: "Meta Ads Agency",          summary: "Facebook and Instagram advertising across every ad format." },
  { path: "/facebook-ads-management",  label: "Facebook Ads Management",  summary: "Facebook campaign setup, targeting and optimization." },
  { path: "/instagram-marketing",      label: "Instagram Marketing",      summary: "Reels, Stories and feed ad campaigns." },
  { path: "/tiktok-ads-agency",        label: "TikTok Ads Agency",        summary: "Short-form video ads and creator-style campaigns." },
  { path: "/tiktok-marketing",         label: "TikTok Marketing",         summary: "TikTok content strategy and campaign management." },
  { path: "/snapchat-ads-agency",      label: "Snapchat Ads Agency",      summary: "Full-service Snapchat ad account management." },
  { path: "/snapchat-marketing",       label: "Snapchat Marketing",       summary: "Story ads, geo-targeting and Gen Z audience campaigns." },
  { path: "/linkedin-ads-agency",      label: "LinkedIn Ads Agency",      summary: "B2B LinkedIn advertising and lead generation." },
  { path: "/x-ads-agency",             label: "X (Twitter) Ads Agency",   summary: "Promoted posts and trend campaigns on X." },
  { path: "/youtube-shorts-marketing", label: "YouTube Shorts Marketing", summary: "YouTube Shorts ads and short-form video campaigns." },
].map((p) => ({ ...p, section: "solutions" as const, priority: 0.95, changeFrequency: "monthly" as const }));

const SERVICES: PublicPage[] = MODULES.map((m) => ({
  path: `/services/${m.slug}`,
  label: m.title,
  summary: m.shortDesc,
  section: "services" as const,
  priority: 0.85,
  changeFrequency: "monthly" as const,
}));

/** Blog posts that ship as hand-built pages under app/blog/<slug>. */
export const STATIC_BLOG_POSTS: PublicPage[] = [
  { path: "/blog/how-ai-marketing-automation-works",                            label: "How AI Marketing Automation Works",                         lastModified: "2026-05-09" },
  { path: "/blog/google-ads-management-local-businesses",                       label: "Google Ads Management for Local Businesses",                lastModified: "2026-05-09" },
  { path: "/blog/essential-strategies-for-effective-digital-marketing-in-2026", label: "Essential Strategies for Effective Digital Marketing in 2026", lastModified: "2026-05-09" },
  { path: "/blog/best-google-ads-automation-tool",                              label: "Best Google Ads Automation Tool",                           lastModified: "2026-05-09" },
  { path: "/blog/snapchat-marketing-strategies",                                label: "Best Snapchat Marketing Strategies for Small Businesses",    lastModified: "2026-05-09" },
  { path: "/blog/tiktok-vs-instagram-ads",                                      label: "TikTok Ads vs Instagram Ads",                               lastModified: "2026-05-09" },
  { path: "/blog/why-businesses-need-omnichannel-ads",                          label: "Why Businesses Need Omnichannel Advertising",               lastModified: "2026-05-09" },
  { path: "/blog/youtube-shorts-marketing-guide",                               label: "YouTube Shorts Marketing Guide",                            lastModified: "2026-05-09" },
].map((p) => ({ ...p, section: "blog" as const, priority: 0.8, changeFrequency: "yearly" as const }));

export const STATIC_BLOG_SLUGS = new Set(STATIC_BLOG_POSTS.map((p) => p.path.replace("/blog/", "")));

const LEGAL: PublicPage[] = [
  { path: "/privacy-policy",       label: "Privacy Policy",       section: "legal", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms-and-conditions", label: "Terms and Conditions", section: "legal", priority: 0.3, changeFrequency: "yearly" },
  { path: "/cookies-policy",       label: "Cookies Policy",       section: "legal", priority: 0.2, changeFrequency: "yearly" },
];

export const PUBLIC_PAGES: PublicPage[] = [...CORE, ...SOLUTIONS, ...SERVICES, ...STATIC_BLOG_POSTS, ...LEGAL];

export function pagesIn(section: PageSection): PublicPage[] {
  return PUBLIC_PAGES.filter((p) => p.section === section);
}

export function absoluteUrl(path: string): string {
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}

// ── CMS blog posts (written in the admin panel) ─────────────────────────────

export interface CmsPost {
  slug: string;
  title: string;
  excerpt?: string;
  author?: string;
  coverImageUrl?: string;
  publishedAt?: string;
  updatedAt?: string;
  createdAt?: string;
  content?: string;
}

/**
 * Base URL for server-side calls to the API. Server code can't use the
 * relative "/api" path the browser uses, so this needs an absolute origin.
 * Set API_INTERNAL_URL (e.g. http://localhost:8080/api) in production for
 * the fastest path; otherwise it falls back to the public site.
 */
function serverApiBase(): string {
  const internal = process.env["API_INTERNAL_URL"];
  if (internal) return internal.replace(/\/$/, "");
  const pub = process.env["NEXT_PUBLIC_API_URL"];
  if (pub && /^https?:\/\//.test(pub)) return pub.replace(/\/$/, "");
  return `${SITE_URL}/api`;
}

async function fetchJson<T>(path: string, revalidateSeconds: number): Promise<T | null> {
  try {
    const res = await fetch(`${serverApiBase()}${path}`, {
      next: { revalidate: revalidateSeconds },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Published CMS posts. Returns [] if the API is unreachable, so builds never fail on it. */
export async function getCmsPosts(): Promise<CmsPost[]> {
  const data = await fetchJson<CmsPost[]>("/v1/blog", 600);
  return Array.isArray(data) ? data.filter((p) => p && typeof p.slug === "string" && p.slug) : [];
}

/** One published CMS post, or null if it doesn't exist (or the API is down). */
export async function getCmsPost(slug: string): Promise<CmsPost | null> {
  const data = await fetchJson<CmsPost>(`/v1/blog/${encodeURIComponent(slug)}`, 600);
  return data && data.slug ? data : null;
}

// ── Metadata helpers ────────────────────────────────────────────────────────

/**
 * Standard metadata for a public page: title, description, canonical URL,
 * Open Graph and Twitter card. The title gets " | WorldDigital.ai" from the
 * root layout's template, so don't add the brand here.
 */
export function pageMetadata(opts: { title: string; description: string; path: string; type?: "website" | "article" }): Metadata {
  const url = absoluteUrl(opts.path);
  const fullTitle = `${opts.title} | ${SITE_NAME}`;
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url, languages: { "en-US": url, "en-CA": url, "x-default": url } },
    openGraph: { type: opts.type ?? "website", url, siteName: SITE_NAME, title: fullTitle, description: opts.description },
    twitter: { card: "summary_large_image", title: fullTitle, description: opts.description },
  };
}

/** For pages that must never appear in search results (login, signup, etc.). */
export function noIndexMetadata(title: string): Metadata {
  return { title, robots: { index: false, follow: true } };
}

/** BreadcrumbList JSON-LD for a page path. */
export function breadcrumbJsonLd(trail: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...trail].map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: absoluteUrl(t.path),
    })),
  };
}
