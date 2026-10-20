"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

interface BlogPost {
  _id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  coverImageUrl: string;
  brandLogo: string;
  brandUrl: string;
  publishedAt: string | null;
  createdAt: string;
  tags: string[];
}

function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-black mt-6 mb-2" style="color:#0F172A">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-black mt-8 mb-3" style="color:#0F172A">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-black mt-8 mb-3" style="color:#0F172A">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li class="ml-5 list-disc leading-relaxed" style="color:#374151">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-5 list-decimal leading-relaxed" style="color:#374151">$2</li>')
    .replace(/\n\n/g, '</p><p class="leading-relaxed mb-4" style="color:#374151">')
    .replace(/^(?!<[hlu]|<li|<\/p|<p)(.+)$/gm, '<p class="leading-relaxed mb-4" style="color:#374151">$1</p>');
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : "";

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) { setNotFound(true); setLoading(false); return; }
    fetch(`/api/v1/blog/${slug}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then((data: BlogPost | null) => {
        if (data && data.slug) { setPost(data); }
        else if (data) { setNotFound(true); }
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [slug]);

  if (loading) {
    return (
      <main style={{ background: "linear-gradient(180deg, #FFE4DC 0%, #FFF5F3 15%, white 40%)", minHeight: "100vh" }}>
        <div className="max-w-3xl mx-auto px-6 pt-32 pb-20 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </main>
    );
  }

  if (notFound || !post) {
    return (
      <main style={{ background: "linear-gradient(180deg, #FFE4DC 0%, #FFF5F3 15%, white 40%)", minHeight: "100vh" }}>
        <div className="max-w-3xl mx-auto px-6 pt-32 pb-20">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium mb-10 hover:underline" style={{ color: "#2B6CB0" }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Back to Blog
          </Link>
          <div className="rounded-3xl p-10 text-center" style={{ background: "white", border: "1px solid #E5EAF2", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            <div className="w-14 h-14 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#4285C7,#C13A2A)" }}>
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <h1 className="text-2xl font-black mb-3" style={{ color: "#111827" }}>Article Not Found</h1>
            <p className="text-base mb-2" style={{ color: "#6B7280" }}>This article may have been moved or unpublished.</p>
            <p className="text-sm font-mono px-3 py-1 rounded-lg inline-block mb-8" style={{ background: "#F3F4F6", color: "#9CA3AF" }}>/blog/{slug}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/blog" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white" style={{ background: "#C13A2A" }}>Browse All Articles</Link>
              <Link href="/ai-marketing-automation" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold" style={{ background: "#F3F4F6", color: "#374151" }}>Explore Our Platform</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const publishDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : new Date(post.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <main style={{ background: "linear-gradient(180deg, #FFE4DC 0%, #FFF5F3 8%, white 30%)", minHeight: "100vh" }}>
      <div className="max-w-3xl mx-auto px-6 pt-28 pb-20">

        <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium mb-8 hover:underline" style={{ color: "#2B6CB0" }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back to Blog
        </Link>

        {post.brandLogo && (
          <div className="mb-6">
            {post.brandUrl ? (
              <a href={post.brandUrl} target="_blank" rel="noopener noreferrer" className="inline-block" title="Visit brand website">
                <Image src={post.brandLogo} alt="Brand logo" width={120} height={48} className="object-contain rounded-xl" unoptimized={post.brandLogo.startsWith("/api/")} style={{ maxHeight: 48 }} />
              </a>
            ) : (
              <Image src={post.brandLogo} alt="Brand logo" width={120} height={48} className="object-contain rounded-xl" unoptimized={post.brandLogo.startsWith("/api/")} style={{ maxHeight: 48 }} />
            )}
          </div>
        )}

        {post.coverImageUrl && (
          <div className="w-full rounded-2xl overflow-hidden mb-8" style={{ aspectRatio: "16/9", position: "relative" }}>
            <Image src={post.coverImageUrl} alt={post.title} fill className="object-cover" unoptimized={post.coverImageUrl.startsWith("/api/")} />
          </div>
        )}

        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(66,133,199,0.1)", color: "#2B6CB0" }}>{tag}</span>
            ))}
          </div>
        )}

        <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-4" style={{ color: "#0F172A" }}>{post.title}</h1>

        <p className="text-sm mb-8 pb-8" style={{ color: "#94A3B8", borderBottom: "1px solid #E5EAF2" }}>
          By <span className="font-semibold" style={{ color: "#64748B" }}>{post.author}</span> · {publishDate}
        </p>

        {post.excerpt && (
          <p className="text-lg leading-relaxed mb-8 italic" style={{ color: "#374151", borderLeft: "3px solid #C13A2A", paddingLeft: "1.25rem" }}>
            {post.excerpt}
          </p>
        )}

        {post.content && (
          <article
            className="prose-like text-base leading-relaxed"
            style={{ color: "#374151" }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
          />
        )}

        <div className="mt-12 pt-8 rounded-2xl p-8 text-center" style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)" }}>
          <p className="text-sm font-semibold mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>Ready to automate your marketing?</p>
          <h3 className="text-xl font-black text-white mb-4">Start with WorldDigital.ai Today</h3>
          <Link href="/subscribe" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity" style={{ background: "linear-gradient(135deg,#4285C7,#C13A2A)" }}>
            View Plans →
          </Link>
        </div>

      </div>
    </main>
  );
}
