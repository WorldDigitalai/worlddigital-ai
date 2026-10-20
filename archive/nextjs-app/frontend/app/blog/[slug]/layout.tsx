import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE_NAME, absoluteUrl, breadcrumbJsonLd, getCmsPost, pageMetadata } from "@/lib/seo";

// Server-side wrapper for CMS blog posts (written in the admin panel).
// The page itself is a client component, so it can't export metadata; this
// layout gives every post a real title, description, canonical URL and
// Article schema, and returns a proper 404 for posts that don't exist
// (instead of a "not found" screen with HTTP 200, which Google treats as a
// soft 404).

type Params = Promise<{ slug: string }>;

function describe(excerpt: string | undefined, content: string | undefined): string {
  const raw = excerpt || (content ?? "").replace(/<[^>]+>/g, " ").replace(/[#*_>`]/g, "");
  const text = raw.replace(/\s+/g, " ").trim();
  return text.length > 158 ? `${text.slice(0, 155).trimEnd()}…` : text;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getCmsPost(slug);
  if (!post) return { title: "Article Not Found", robots: { index: false, follow: true } };

  const base = pageMetadata({
    title: post.title,
    description: describe(post.excerpt, post.content),
    path: `/blog/${post.slug}`,
    type: "article",
  });
  return {
    ...base,
    authors: post.author ? [{ name: post.author }] : undefined,
    openGraph: {
      ...base.openGraph,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt || post.publishedAt,
      authors: post.author ? [post.author] : undefined,
      images: post.coverImageUrl ? [{ url: post.coverImageUrl }] : undefined,
    },
  };
}

export default async function BlogPostLayout({ children, params }: { children: React.ReactNode; params: Params }) {
  const { slug } = await params;
  const post = await getCmsPost(slug);
  if (!post) notFound();

  const url = absoluteUrl(`/blog/${post.slug}`);
  const article = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: describe(post.excerpt, post.content),
    url,
    mainEntityOfPage: url,
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt || post.publishedAt || post.createdAt,
    author: { "@type": post.author ? "Person" : "Organization", name: post.author || SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME, logo: { "@type": "ImageObject", url: absoluteUrl("/logo.jpeg") } },
    // Google requires an image for article rich results; fall back to the site card.
    image: post.coverImageUrl
      ? post.coverImageUrl.startsWith("http") ? post.coverImageUrl : absoluteUrl(post.coverImageUrl)
      : absoluteUrl("/opengraph-image"),
  };
  const crumbs = breadcrumbJsonLd([
    { name: "Blog", path: "/blog" },
    { name: post.title, path: `/blog/${post.slug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([article, crumbs]).replace(/</g, "\\u003c") }} />
      {children}
    </>
  );
}
