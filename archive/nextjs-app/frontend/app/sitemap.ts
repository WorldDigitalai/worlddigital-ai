import type { MetadataRoute } from "next";
import { PUBLIC_PAGES, STATIC_BLOG_SLUGS, absoluteUrl, getCmsPosts } from "@/lib/seo";

// Rebuild the sitemap at most every 10 minutes so new CMS posts show up
// without a redeploy.
export const revalidate = 600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = PUBLIC_PAGES.map((p) => ({
    url: absoluteUrl(p.path),
    changeFrequency: p.changeFrequency,
    priority: p.priority,
    ...(p.lastModified ? { lastModified: new Date(p.lastModified) } : {}),
  }));

  const cmsPosts = await getCmsPosts();
  const cmsEntries: MetadataRoute.Sitemap = cmsPosts
    .filter((p) => !STATIC_BLOG_SLUGS.has(p.slug))
    .map((p) => {
      const date = p.updatedAt || p.publishedAt || p.createdAt;
      return {
        url: absoluteUrl(`/blog/${p.slug}`),
        changeFrequency: "yearly" as const,
        priority: 0.75,
        ...(date ? { lastModified: new Date(date) } : {}),
      };
    });

  // llms.txt and login/signup are intentionally not listed: llms.txt is a
  // machine file, not a page, and auth pages are noindex.
  return [...staticEntries, ...cmsEntries];
}
