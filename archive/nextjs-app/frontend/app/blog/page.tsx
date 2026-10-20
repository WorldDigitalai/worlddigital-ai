"use client";

import type { Metadata } from "next";
import Link from "next/link";
import { useState, useEffect } from "react";
import { NewsletterForm } from "@/components/blog/NewsletterForm";
import Image from "next/image";
import { STATIC_BLOG_SLUGS } from "@/lib/seo";

// Static fallback posts (always shown even if API fails)
const STATIC_POSTS = [
  { slug: "how-ai-marketing-automation-works",        category: "AI & Marketing", title: "How AI Marketing Automation Works — And Why SMBs Need It Now",          excerpt: "AI marketing automation is no longer reserved for enterprise brands. Here's exactly how the technology works, what it does for your ads and content, and why small businesses are the biggest winners.",             date: "May 7, 2026",    author: "WorldDigital.ai Team" },
  { slug: "google-ads-management-local-businesses",   category: "Ad Strategy",    title: "Google Ads Management for Local Businesses — The Complete Guide",        excerpt: "Local businesses can compete with big brands on Google Search without a massive budget. This guide covers campaign structure, keyword strategy, and how AI changes the game.",                                       date: "May 7, 2026",    author: "WorldDigital.ai Team" },
  { slug: "snapchat-marketing-strategies",            category: "Snapchat",       title: "Best Snapchat Marketing Strategies for Small Businesses",                 excerpt: "Snapchat reaches 800M+ users monthly. Here's how small businesses can turn that reach into real customers.",                                                                                                          date: "May 7, 2026",    author: "WorldDigital.ai Team" },
  { slug: "tiktok-vs-instagram-ads",                  category: "Ad Strategy",    title: "TikTok Ads vs Instagram Ads — Which Is Right for Your Business?",        excerpt: "Both platforms offer powerful reach for SMBs, but they serve different audiences and creative formats. Here's a data-driven breakdown to help you choose.",                                                               date: "May 7, 2026",    author: "WorldDigital.ai Team" },
  { slug: "why-businesses-need-omnichannel-ads",      category: "Strategy",       title: "Why Every Growing Business Needs an Omnichannel Ad Strategy",            excerpt: "Running ads on just one platform is leaving money on the table. Discover why omnichannel advertising consistently outperforms single-channel campaigns.",                                                                 date: "May 7, 2026",    author: "WorldDigital.ai Team" },
  { slug: "youtube-shorts-marketing-guide",           category: "YouTube",        title: "The Complete YouTube Shorts Marketing Guide for Small Businesses",        excerpt: "YouTube Shorts gets 70 billion daily views. This guide shows small businesses how to create short-form video ads that drive real traffic and conversions.",                                                                date: "May 7, 2026",    author: "WorldDigital.ai Team" },
  { slug: "essential-strategies-for-effective-digital-marketing-in-2026", category: "AI & Marketing", title: "Essential Strategies For Effective Digital Marketing In 2026", excerpt: "Digital marketing is evolving at a rapid pace, and digital marketing in 2026 will look vastly different from today.",                                                                                                date: "April 20, 2026", author: "Ahmad Awwad" },
  { slug: "best-google-ads-automation-tool",          category: "Ad Strategy",    title: "Best Google Ads Automation Tool",                                        excerpt: "Navigating the world of Google Ads can be daunting. With countless variables to manage, efficiency is key. Enter Google Ads automation.",                                                                               date: "April 20, 2026", author: "Ahmad Awwad" },
  { slug: "best-rated-seo-companies",                 category: "SEO",            title: "Best Rated SEO Companies",                                               excerpt: "In today's digital age, having a strong online presence is crucial for business success. Search engine optimization (SEO) plays a key role.",                                                                        date: "February 1, 2026", author: "Ahmad Awwad" },
  { slug: "ai-advertising-automation-platform",       category: "AI & Marketing", title: "AI Advertising & Automation Platform For Small Businesses",              excerpt: "WorldDigital.ai delivers an AI-powered, multi-channel advertising platform that automates campaign setup, creative generation, audience targeting, and optimization.",                                                   date: "February 1, 2026", author: "Ahmad Awwad" },
  { slug: "how-ai-is-changing-digital-advertising",   category: "AI & Marketing", title: "How AI is Changing Digital Advertising for Small Businesses",            excerpt: "The same AI technology that billion-dollar companies use to run their ad campaigns is now available to businesses of any size. Here's what that means for your growth.",                                               date: "April 18, 2025", author: "Ahmad Awwad" },
  { slug: "google-ads-vs-meta-ads-2025",              category: "Ad Strategy",    title: "Google Ads vs. Meta Ads in 2025: Where Should Your Budget Go?",          excerpt: "With evolving algorithms and shifting consumer behavior, the calculus between search and social has changed. We break down the latest data to help you allocate smarter.",                                             date: "April 10, 2025", author: "Ahmad Awwad" },
];

interface ApiPost {
  _id: string;
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  status: string;
  coverImageUrl: string;
  publishedAt: string | null;
  createdAt: string;
  tags: string[];
}

function BlogCard({ slug, title, excerpt, date, author, coverImageUrl }: {
  slug: string; title: string; excerpt: string; date: string; author: string; coverImageUrl?: string;
}) {
  return (
    <Link
      href={`/blog/${slug}`}
      className="block rounded-2xl overflow-hidden group transition-all hover:shadow-md"
      style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)" }}
    >
      {/* Cover image / placeholder */}
      <div className="w-full relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized={coverImageUrl.startsWith("/api/")}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #EEF6FF 0%, #FDE8E2 50%, #DAEEFF 100%)" }}
          >
            <svg className="w-10 h-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="#4285C7" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-5">
        <h2 className="font-black text-gray-900 text-base leading-snug mb-2 group-hover:text-primary transition-colors">
          {title}
        </h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-3 line-clamp-2">{excerpt}</p>
        <p className="text-xs text-gray-500">By {author} — {date}</p>
      </div>
    </Link>
  );
}

export default function BlogPage() {
  const [apiPosts, setApiPosts] = useState<ApiPost[]>([]);

  useEffect(() => {
    fetch("/api/v1/blog")
      .then((r) => r.json())
      .then((data: ApiPost[]) => { if (Array.isArray(data)) setApiPosts(data); })
      .catch(() => { /* silently fall back to static posts */ });
  }, []);

  // Merge: API posts first (they have images), then static posts for any slugs not in the API
  const apiSlugs = new Set(apiPosts.map((p) => p.slug));
  const mergedPosts = [
    ...apiPosts.map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      date: p.publishedAt ? new Date(p.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "",
      author: p.author,
      coverImageUrl: p.coverImageUrl,
    })),
    // Only list built-in posts that actually have a page; others would 404.
    ...STATIC_POSTS.filter((p) => !apiSlugs.has(p.slug) && STATIC_BLOG_SLUGS.has(p.slug)).map((p) => ({ ...p, coverImageUrl: undefined })),
  ];

  return (
    <>
      {/* Hero */}
      <section
        className="pt-24 pb-10 px-6"
        style={{ background: "linear-gradient(160deg, #FDE8E2 0%, #E8F4FD 100%)" }}
      >
        <div className="max-w-lg mx-auto text-center px-4">
          <div className="eyebrow-line justify-center mb-4">Effortless Growth Through AI</div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-4">
            World Digital AI Blog | AI Marketing, Ads Automation
          </h1>
          <p className="text-gray-600 text-sm leading-relaxed max-w-sm mx-auto">
            Stay informed with the latest insights, trends, and updates from the world of digital
            marketing and AI.
          </p>
        </div>
      </section>

      {/* Post list */}
      <section className="py-10 px-6" style={{ background: "#E8F4FD" }}>
        <div className="max-w-lg mx-auto space-y-5 px-4">
          {mergedPosts.map(({ slug, title, excerpt, date, author, coverImageUrl }) => (
            <BlogCard
              key={slug}
              slug={slug}
              title={title}
              excerpt={excerpt}
              date={date}
              author={author}
              coverImageUrl={coverImageUrl}
            />
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-12 px-6" style={{ background: "#EDF5FD" }}>
        <div className="max-w-lg mx-auto text-center px-4">
          <div className="eyebrow-line justify-center mb-4">Newsletter</div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Get Articles in Your Inbox</h2>
          <p className="text-gray-600 text-sm mb-8">
            Weekly insights on AI marketing, ad platform updates, and growth tactics. No spam.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </>
  );
}
