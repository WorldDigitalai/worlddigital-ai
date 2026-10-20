"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useUser } from "@/context/UserContext";
import StatCard from "../components/StatCard";
import SetupChecklist from "../components/SetupChecklist";
import SectionHeader from "../components/SectionHeader";

interface SeoStatus {
  profile: {
    domain?: string;
    gscSiteUrl?: string | null;
    domainVerified?: boolean;
    lastKeywordSync?: string | null;
    lastAuditAt?: string | null;
  } | null;
  gscConfigured: boolean;
  serviceAccountEmail: string | null;
  gscOauthConnected: boolean;
}

interface KeywordsResp {
  keywords: Array<{ keyword: string; clicks: number; impressions: number; position: number }>;
  total: number;
}

interface BlogPostsResp {
  posts: Array<{ _id: string; status: string }>;
  total: number;
}

interface AuditResp {
  score?: number;
  healthScore?: number;
  summary?: string;
  fetchedAt?: string;
}

function formatDate(d?: string | null) {
  if (!d) return null;
  try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
  catch { return d; }
}

const SEO_TOOLS = [
  {
    href: "/dashboard/seo",
    label: "Auto SEO Dashboard",
    desc: "Full keyword tracking, blog generation, audits & recommendations",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    color: "#C13A2A",
    bg: "rgba(193,58,42,0.08)",
  },
  {
    href: "/dashboard/tools/keyword-research",
    label: "Keyword Research Tool",
    desc: "AI-generated keyword opportunities for your business and industry",
    icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    color: "#4285C7",
    bg: "rgba(66,133,199,0.08)",
  },
  {
    href: "/dashboard/tools/content-marketing",
    label: "Content Marketing",
    desc: "Generate SEO-optimized blog posts, meta tags, and social captions",
    icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    color: "#7C3AED",
    bg: "rgba(124,58,237,0.08)",
  },
  {
    href: "/dashboard/analytics",
    label: "Analytics Overview",
    desc: "Track organic traffic, rankings, and performance over time",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    color: "#059669",
    bg: "rgba(5,150,105,0.08)",
  },
];

export default function AiSeoDashboard() {
  const { user } = useUser();
  const [status, setStatus] = useState<SeoStatus | null>(null);
  const [keywords, setKeywords] = useState<KeywordsResp | null>(null);
  const [blogPosts, setBlogPosts] = useState<BlogPostsResp | null>(null);
  const [audit, setAudit] = useState<AuditResp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      apiFetch<SeoStatus>("/v1/seo/status"),
      apiFetch<KeywordsResp>("/v1/seo/keywords"),
      apiFetch<BlogPostsResp>("/v1/seo/blog-posts"),
      apiFetch<AuditResp>("/v1/seo/audit"),
    ]).then(([s, k, b, a]) => {
      if (s.status === "fulfilled" && s.value.ok) setStatus(s.value.data ?? null);
      if (k.status === "fulfilled" && k.value.ok) setKeywords(k.value.data ?? null);
      if (b.status === "fulfilled" && b.value.ok) setBlogPosts(b.value.data ?? null);
      if (a.status === "fulfilled" && a.value.ok) setAudit(a.value.data ?? null);
      setLoading(false);
    });
  }, []);

  const domainConnected = !!(status?.profile?.domain);
  const gscConnected = !!(status?.gscOauthConnected || status?.gscConfigured);
  const keywordCount = keywords?.total ?? 0;
  const blogCount = blogPosts?.posts?.length ?? 0;
  const publishedBlogs = blogPosts?.posts?.filter((p) => p.status === "published").length ?? 0;
  const auditScore = audit?.score ?? audit?.healthScore ?? null;
  const lastSync = formatDate(status?.profile?.lastKeywordSync);
  const lastAudit = formatDate(status?.profile?.lastAuditAt);

  const checklist = [
    { label: "Business profile complete",        done: !!user?.businessName },
    { label: "Domain connected",                 done: domainConnected },
    { label: "Google Search Console linked",     done: gscConnected },
    { label: "First keyword sync completed",     done: !!lastSync },
    { label: "Site audit run",                   done: !!lastAudit },
    { label: "First blog post published",        done: publishedBlogs > 0 },
  ];
  const doneCount = checklist.filter((c) => c.done).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-black leading-tight" style={{ fontSize: "clamp(1.4rem,3vw,1.9rem)", color: "#111827" }}>AI SEO</h1>
          <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
            Automated keyword tracking, site audits, and SEO-optimized content for {user?.businessName || "your business"}
          </p>
        </div>
        <Link
          href="/dashboard/seo"
          className="shrink-0 text-xs font-bold px-4 py-2 rounded-xl transition hover:opacity-90"
          style={{ background: "linear-gradient(135deg,#C13A2A,#4285C7)", color: "white", textDecoration: "none" }}
        >
          Open Full SEO Dashboard →
        </Link>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl p-5 animate-pulse" style={{ background: "#E2E8F0", height: 88 }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="SEO Score"
            value={auditScore !== null ? `${auditScore}/100` : "—"}
            icon="M13 10V3L4 14h7v7l9-11h-7z"
            color={auditScore !== null ? (auditScore >= 70 ? "#16A34A" : auditScore >= 50 ? "#D97706" : "#DC2626") : undefined}
          />
          <StatCard
            label="Keywords Tracked"
            value={keywordCount > 0 ? keywordCount : "—"}
            icon="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
          <StatCard
            label="Blog Posts"
            value={blogCount > 0 ? blogCount : "—"}
            icon="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
          <StatCard
            label="Setup Progress"
            value={`${doneCount}/${checklist.length}`}
            icon="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </div>
      )}

      {/* Domain & GSC status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Domain status */}
        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
          <SectionHeader title="Domain Status" />
          {loading ? (
            <div className="h-12 rounded-xl animate-pulse mt-3" style={{ background: "#F1F5F9" }} />
          ) : domainConnected ? (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: "#16A34A" }} />
                <span className="text-xs font-bold" style={{ color: "#16A34A" }}>Domain connected</span>
              </div>
              <p className="text-sm font-black" style={{ color: "#111827" }}>{status!.profile!.domain}</p>
              {lastSync && <p className="text-[10px]" style={{ color: "#9CA3AF" }}>Last synced: {lastSync}</p>}
            </div>
          ) : (
            <div className="mt-3">
              <p className="text-xs" style={{ color: "#6B7280" }}>No domain connected yet.</p>
              <Link href="/dashboard/seo" className="mt-2 inline-block text-xs font-bold" style={{ color: "#C13A2A", textDecoration: "none" }}>
                Connect your domain →
              </Link>
            </div>
          )}
        </div>

        {/* GSC status */}
        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
          <SectionHeader title="Google Search Console" />
          {loading ? (
            <div className="h-12 rounded-xl animate-pulse mt-3" style={{ background: "#F1F5F9" }} />
          ) : gscConnected ? (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: "#16A34A" }} />
                <span className="text-xs font-bold" style={{ color: "#16A34A" }}>GSC connected</span>
              </div>
              {status?.profile?.gscSiteUrl && (
                <p className="text-xs" style={{ color: "#374151" }}>{status.profile.gscSiteUrl}</p>
              )}
              {status?.serviceAccountEmail && (
                <p className="text-[10px]" style={{ color: "#9CA3AF" }}>via {status.serviceAccountEmail}</p>
              )}
            </div>
          ) : (
            <div className="mt-3">
              <p className="text-xs" style={{ color: "#6B7280" }}>Google Search Console not connected.</p>
              <Link href="/dashboard/seo" className="mt-2 inline-block text-xs font-bold" style={{ color: "#C13A2A", textDecoration: "none" }}>
                Connect GSC →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Tools grid + checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Checklist */}
        <SetupChecklist items={checklist} title="AI SEO Setup" />

        {/* SEO tools */}
        <div className="lg:col-span-2">
          <SectionHeader title="Your SEO Tools" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {SEO_TOOLS.map(({ href, label, desc, icon, color, bg }) => (
              <Link
                key={href}
                href={href}
                className="rounded-2xl p-4 flex items-start gap-3 transition hover:shadow-md hover:-translate-y-0.5"
                style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", textDecoration: "none" }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black" style={{ color: "#111827" }}>{label}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#6B7280" }}>{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Blog posts preview */}
      {!loading && blogCount > 0 && (
        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="flex items-center justify-between mb-3">
            <SectionHeader title="Recent Blog Posts" />
            <Link href="/dashboard/seo" className="text-[10px] font-bold" style={{ color: "#4285C7", textDecoration: "none" }}>
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {(blogPosts?.posts ?? []).slice(0, 4).map((post, i) => (
              <div key={post._id ?? i} className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
                <span
                  className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    background: post.status === "published" ? "rgba(22,163,74,0.1)" : "rgba(245,158,11,0.1)",
                    color: post.status === "published" ? "#16A34A" : "#D97706",
                  }}
                >
                  {post.status}
                </span>
                <span className="text-xs truncate" style={{ color: "#374151" }}>Blog post #{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last audit summary */}
      {!loading && audit?.summary && (
        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
          <SectionHeader title="Latest Audit Summary" />
          <p className="text-xs mt-3" style={{ color: "#374151" }}>{audit.summary}</p>
          {lastAudit && <p className="text-[10px] mt-2" style={{ color: "#9CA3AF" }}>Audit run: {lastAudit}</p>}
          <Link href="/dashboard/seo" className="mt-3 inline-block text-xs font-bold" style={{ color: "#C13A2A", textDecoration: "none" }}>
            View full audit report →
          </Link>
        </div>
      )}

      {/* CTA if not set up */}
      {!loading && !domainConnected && (
        <div className="rounded-2xl p-6 text-center" style={{ background: "linear-gradient(135deg,rgba(193,58,42,0.04),rgba(66,133,199,0.04))", border: "1px solid rgba(193,58,42,0.1)" }}>
          <div className="text-3xl mb-3">🔍</div>
          <p className="text-sm font-black mb-1" style={{ color: "#111827" }}>Connect your domain to get started</p>
          <p className="text-xs mb-4" style={{ color: "#6B7280" }}>
            Link your website to unlock keyword tracking, site audits, and automated SEO blog generation.
          </p>
          <Link
            href="/dashboard/seo"
            className="inline-block text-sm font-bold px-6 py-2.5 rounded-xl transition hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#C13A2A,#4285C7)", color: "white", textDecoration: "none" }}
          >
            Set Up AI SEO →
          </Link>
        </div>
      )}
    </div>
  );
}
