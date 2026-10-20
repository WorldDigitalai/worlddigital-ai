import { NextResponse } from "next/server";
import { SITE_NAME, SITE_URL, absoluteUrl, getCmsPosts, pagesIn, STATIC_BLOG_SLUGS } from "@/lib/seo";

// Regenerated at most hourly so new CMS blog posts are picked up.
export const revalidate = 3600;

const link = (label: string, path: string, summary?: string) =>
  `- [${label}](${absoluteUrl(path)})${summary ? ` — ${summary}` : ""}`;

const WHAT_WE_DO = `WorldDigital.ai is an AI-powered marketing SaaS platform. We manage paid advertising campaigns, generate social media content using AI, and run SEO programs — all from a single dashboard. No setup fees and no long-term contracts.

Platforms supported: Facebook, Instagram, Google Search & Display, TikTok, Snapchat, LinkedIn, X (Twitter), YouTube Shorts.`;

const AI_TOOLS = `- AI Caption & Copy Generation — Platform-native ad copy written by AI for each social platform.
- AI Image Generation — DALL-E 3 powered image creation for ads and social posts.
- AI Reels Generator — Short-form video script and concept generation.
- Keyword Research — AI-powered keyword discovery and competitive analysis.
- Auto AI SEO — Automated on-page SEO optimization and content recommendations.
- Content Studio — Visual content scheduling, approval workflow, and publishing queue.`;

const PRICING = `- Auto AI SEO: $199.99/month
- Ad management and other AI tools: see current plans at ${SITE_URL}/subscribe
- No setup fees. Cancel anytime.`;

export async function GET() {
  const cmsPosts = (await getCmsPosts()).filter((p) => !STATIC_BLOG_SLUGS.has(p.slug));

  const lines = [
    `# ${SITE_NAME} — LLMs.txt`,
    `# AI-readable index for language models and AI assistants`,
    `# https://llmstxt.org`,
    ``,
    `> ${SITE_NAME} automates social media advertising, content creation, and AI SEO for SMBs, SMEs and enterprises across the United States and Canada.`,
    ``,
    `## What We Do`,
    ``,
    WHAT_WE_DO,
    ``,
    `## Solutions`,
    ``,
    ...pagesIn("solutions").map((p) => link(p.label, p.path, p.summary)),
    ``,
    `## Platform Modules`,
    ``,
    ...pagesIn("services").map((p) => link(p.label, p.path, p.summary)),
    ``,
    `## AI Tools`,
    ``,
    AI_TOOLS,
    ``,
    `## Pricing`,
    ``,
    PRICING,
    ``,
    `## Blog & Resources`,
    ``,
    ...pagesIn("blog").map((p) => link(p.label, p.path)),
    ...cmsPosts.map((p) => link(p.title, `/blog/${p.slug}`)),
    ``,
    `## Company`,
    ``,
    ...pagesIn("core").filter((p) => p.path !== "/").map((p) => link(p.label, p.path, p.summary)),
    `- Website: ${SITE_URL}`,
    `- Support email: support@worlddigital.ai`,
    ``,
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
