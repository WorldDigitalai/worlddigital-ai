import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Private areas that no crawler should spend time on.
const PRIVATE = [
  "/admin/",
  "/dashboard/",
  "/api/",
  "/auth/",
  "/generate",
  "/subscribe",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

// Search engines and AI assistants we want reading the public site. A
// crawler with its own group ignores the "*" group, so each one gets the
// same private-area rules.
const NAMED_CRAWLERS = [
  "Googlebot",
  "Google-Extended",   // Gemini / AI Overviews
  "Bingbot",           // Bing + Microsoft Copilot
  "DuckDuckBot",
  "Applebot",
  "Applebot-Extended", // Apple Intelligence
  "GPTBot",            // OpenAI training
  "OAI-SearchBot",     // ChatGPT search
  "ChatGPT-User",
  "ClaudeBot",         // Anthropic
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "CCBot",             // Common Crawl
  "Amazonbot",
  "meta-externalagent",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: NAMED_CRAWLERS, allow: "/", disallow: PRIVATE },
      { userAgent: "*", allow: "/", disallow: PRIVATE },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
