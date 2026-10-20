"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useUser, type PACKAGE_ID } from "@/context/UserContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import NotificationBadge from "./components/NotificationBadge";

type NavItem = { href: string; label: string; icon: string; sub?: boolean };
type NavGroup = { title: string; items: NavItem[] };

const ALL_NAV: NavGroup[] = [
  {
    title: "MY DASHBOARD",
    items: [
      { href: "/dashboard",                label: "Account Overview",   icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
      { href: "/dashboard/overview",       label: "Enterprise Overview",icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" },
      { href: "/dashboard/meta-ads",       label: "Meta Ads",           icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
      { href: "/dashboard/google-ads",     label: "Google Ads",         icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
      { href: "/dashboard/snapchat-ads",   label: "Snapchat Ads",       icon: "M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
      { href: "/dashboard/tiktok-ads",     label: "TikTok Ads",         icon: "M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" },
      { href: "/dashboard/linkedin-ads",   label: "LinkedIn Ads",       icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
      { href: "/dashboard/youtube-shorts", label: "YouTube Shorts",     icon: "M15 10l4.553-2.069A1 1 0 0121 8.87v6.259a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" },
      { href: "/dashboard/x-ads",          label: "X Ads",              icon: "M6 18L18 6M6 6l12 12" },
    ],
  },
  {
    title: "MY ACCOUNT",
    items: [
      { href: "/dashboard/account",  label: "Personal Info",    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
      { href: "/dashboard/business", label: "Business Profile", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
      { href: "/dashboard/services", label: "My Purchased Services", icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" },
      { href: "/dashboard/billing",  label: "Billing",          icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
      { href: "/dashboard/usage",    label: "Usage & Credits",  icon: "M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" },
    ],
  },
  {
    title: "CAMPAIGNS",
    items: [
      { href: "/dashboard/campaigns", label: "Ad Campaigns", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
    ],
  },
  {
    title: "CONTENT",
    items: [
      { href: "/dashboard/content-studio",  label: "AI Content Studio",  icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
      { href: "/dashboard/content-library", label: "Content Library",     icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
      { href: "/dashboard/strategy",        label: "Strategy Report",     icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    ],
  },
  {
    title: "PUBLISHING",
    items: [
      { href: "/dashboard/publishing", label: "Publishing Queue", icon: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8" },
    ],
  },
  {
    title: "ANALYTICS",
    items: [
      { href: "/dashboard/analytics",                   label: "Overview",        icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
      { href: "/dashboard/analytics/published-posts",   label: "Published Posts", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01", sub: true },
      { href: "/dashboard/analytics/performance",       label: "Performance",     icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6", sub: true },
    ],
  },
  {
    title: "AI TOOLS",
    items: [
      { href: "/dashboard/tools/image-generator",   label: "Image Generator",    icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
      { href: "/dashboard/tools/reels-generator",   label: "Reels Generator",    icon: "M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" },
      { href: "/dashboard/tools/keyword-research",  label: "Keyword Research",   icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
      { href: "/dashboard/ai-seo",                    label: "AI SEO Overview",    icon: "M13 10V3L4 14h7v7l9-11h-7z" },
      { href: "/dashboard/seo",                     label: "Auto SEO Dashboard", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
      { href: "/dashboard/tools/content-marketing", label: "Content Marketing",  icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
    ],
  },
  {
    title: "SUPPORT",
    items: [
      { href: "/dashboard/my-posts", label: "My Posts", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
      { href: "/dashboard/help",     label: "Help Center", icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    ],
  },
];

const SUPPORT_HREFS = ["/dashboard/my-posts", "/dashboard/help"];

const PACKAGE_NAV_MAP: Record<PACKAGE_ID, string[]> = {
  google_ads:       ["/dashboard", "/dashboard/google-ads", "/dashboard/account", "/dashboard/business", "/dashboard/services", "/dashboard/billing", "/dashboard/usage", "/dashboard/campaigns", "/dashboard/content-studio", "/dashboard/content-library", "/dashboard/strategy", "/dashboard/publishing", "/dashboard/analytics", "/dashboard/analytics/published-posts", "/dashboard/analytics/performance", ...SUPPORT_HREFS],
  meta_ads:         ["/dashboard", "/dashboard/meta-ads", "/dashboard/account", "/dashboard/business", "/dashboard/services", "/dashboard/billing", "/dashboard/usage", "/dashboard/campaigns", "/dashboard/content-studio", "/dashboard/content-library", "/dashboard/strategy", "/dashboard/publishing", "/dashboard/analytics", "/dashboard/analytics/published-posts", "/dashboard/analytics/performance", ...SUPPORT_HREFS],
  snapchat_ads:     ["/dashboard", "/dashboard/snapchat-ads", "/dashboard/account", "/dashboard/business", "/dashboard/services", "/dashboard/billing", "/dashboard/usage", "/dashboard/campaigns", "/dashboard/content-studio", "/dashboard/content-library", "/dashboard/strategy", "/dashboard/publishing", "/dashboard/analytics", "/dashboard/analytics/published-posts", "/dashboard/analytics/performance", ...SUPPORT_HREFS],
  tiktok_ads:       ["/dashboard", "/dashboard/tiktok-ads", "/dashboard/account", "/dashboard/business", "/dashboard/services", "/dashboard/billing", "/dashboard/usage", "/dashboard/campaigns", "/dashboard/content-studio", "/dashboard/content-library", "/dashboard/strategy", "/dashboard/publishing", "/dashboard/analytics", "/dashboard/analytics/published-posts", "/dashboard/analytics/performance", ...SUPPORT_HREFS],
  linkedin_ads:     ["/dashboard", "/dashboard/linkedin-ads", "/dashboard/account", "/dashboard/business", "/dashboard/services", "/dashboard/billing", "/dashboard/usage", "/dashboard/campaigns", "/dashboard/content-studio", "/dashboard/content-library", "/dashboard/strategy", "/dashboard/publishing", "/dashboard/analytics", "/dashboard/analytics/published-posts", "/dashboard/analytics/performance", ...SUPPORT_HREFS],
  youtube_shorts:   ["/dashboard", "/dashboard/youtube-shorts", "/dashboard/account", "/dashboard/business", "/dashboard/services", "/dashboard/billing", "/dashboard/usage", "/dashboard/campaigns", "/dashboard/content-studio", "/dashboard/content-library", "/dashboard/strategy", "/dashboard/publishing", "/dashboard/analytics", "/dashboard/analytics/published-posts", "/dashboard/analytics/performance", ...SUPPORT_HREFS],
  x_ads:            ["/dashboard", "/dashboard/x-ads", "/dashboard/account", "/dashboard/business", "/dashboard/services", "/dashboard/billing", "/dashboard/usage", "/dashboard/campaigns", "/dashboard/content-studio", "/dashboard/content-library", "/dashboard/strategy", "/dashboard/publishing", "/dashboard/analytics", "/dashboard/analytics/published-posts", "/dashboard/analytics/performance", ...SUPPORT_HREFS],
  ai_seo:           ["/dashboard", "/dashboard/ai-seo", "/dashboard/seo", "/dashboard/account", "/dashboard/business", "/dashboard/services", "/dashboard/billing", "/dashboard/usage", "/dashboard/content-studio", "/dashboard/content-library", "/dashboard/strategy", "/dashboard/analytics", "/dashboard/analytics/published-posts", "/dashboard/analytics/performance", "/dashboard/tools/keyword-research", "/dashboard/tools/content-marketing", ...SUPPORT_HREFS],
  keyword_research: ["/dashboard", "/dashboard/keyword-research", "/dashboard/account", "/dashboard/business", "/dashboard/services", "/dashboard/billing", "/dashboard/usage", "/dashboard/content-studio", "/dashboard/content-library", "/dashboard/strategy", "/dashboard/analytics", "/dashboard/analytics/published-posts", "/dashboard/analytics/performance", "/dashboard/tools/keyword-research", "/dashboard/tools/ai-seo", ...SUPPORT_HREFS],
  content_marketing:["/dashboard", "/dashboard/content-marketing", "/dashboard/account", "/dashboard/business", "/dashboard/services", "/dashboard/billing", "/dashboard/usage", "/dashboard/content-studio", "/dashboard/content-library", "/dashboard/strategy", "/dashboard/publishing", "/dashboard/analytics", "/dashboard/analytics/published-posts", "/dashboard/analytics/performance", ...SUPPORT_HREFS],
  image_generator:  ["/dashboard", "/dashboard/image-generator", "/dashboard/account", "/dashboard/business", "/dashboard/services", "/dashboard/billing", "/dashboard/usage", "/dashboard/content-studio", "/dashboard/content-library", "/dashboard/strategy", "/dashboard/publishing", "/dashboard/analytics", "/dashboard/analytics/published-posts", "/dashboard/analytics/performance", "/dashboard/tools/image-generator", ...SUPPORT_HREFS],
  reels_generator:  ["/dashboard", "/dashboard/reels-generator", "/dashboard/account", "/dashboard/business", "/dashboard/services", "/dashboard/billing", "/dashboard/usage", "/dashboard/content-studio", "/dashboard/content-library", "/dashboard/strategy", "/dashboard/publishing", "/dashboard/analytics", "/dashboard/analytics/published-posts", "/dashboard/analytics/performance", "/dashboard/tools/reels-generator", ...SUPPORT_HREFS],
  enterprise:       ALL_NAV.flatMap((g) => g.items.map((i) => i.href)),
};

function filterNav(pkg: PACKAGE_ID): NavGroup[] {
  const allowed = new Set(PACKAGE_NAV_MAP[pkg] ?? []);
  return ALL_NAV.map((g) => ({
    ...g,
    items: g.items.filter((i) => allowed.has(i.href)),
  })).filter((g) => g.items.length > 0);
}

const PACKAGE_LABELS: Record<PACKAGE_ID, string> = {
  google_ads: "Google Ads", meta_ads: "Meta Ads", snapchat_ads: "Snapchat Ads", tiktok_ads: "TikTok Ads",
  linkedin_ads: "LinkedIn Ads", youtube_shorts: "YouTube Shorts", x_ads: "X Ads",
  ai_seo: "AI SEO", keyword_research: "Keyword Research", content_marketing: "Content Marketing",
  image_generator: "Image Generator", reels_generator: "Reels Generator", enterprise: "Enterprise",
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user: authUser, loading: authLoading, logout: authLogout } = useAuth();
  const { user, loading: userLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect unauthed
  useEffect(() => {
    if (!authLoading && !authUser) router.replace("/login?next=" + encodeURIComponent(pathname));
  }, [authUser, authLoading, pathname, router]);

  // Redirect to onboarding if not complete (skip onboarding page itself)
  useEffect(() => {
    if (user && !user.onboardingComplete && pathname !== "/dashboard/onboarding") {
      router.replace("/dashboard/onboarding");
    }
  }, [user, pathname, router]);

  if (authLoading || userLoading || !authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F1F5F9" }}>
        <svg className="w-7 h-7 animate-spin" style={{ color: "#C13A2A" }} fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  const pkg = user?.package ?? "enterprise";
  const navGroups = filterNav(pkg);
  const isActive = (href: string) => (href === "/dashboard" ? pathname === href : pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/")));
  const isGroupActive = (items: NavItem[]) => items.some((i) => pathname.startsWith(i.href));

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: "#0F172A" }}>
      {/* Logo */}
      <div className="px-5 py-5 border-b shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
          <img src="/icons/wdlogo.jpeg" alt="WorldDigital.ai" width={28} height={28} style={{ borderRadius: 6, objectFit: "contain", display: "block" }} />
          <span className="text-sm font-black text-white tracking-tight">WorldDigital.ai</span>
        </Link>
        <p className="text-[10px] mt-1 font-medium" style={{ color: "#475569" }}>Customer Dashboard</p>
      </div>

      {/* User card */}
      <div className="mx-3 mt-3 mb-1 p-3 rounded-xl shrink-0" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2.5">
          {user?.logoURL ? (
            <img src={user.logoURL} alt="" className="w-8 h-8 rounded-full object-contain bg-white" />
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0" style={{ background: "linear-gradient(135deg,#4285C7,#C13A2A)" }}>
              {user?.businessName?.[0]?.toUpperCase() || authUser?.name?.[0]?.toUpperCase() || "?"}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">{user?.businessName || authUser?.name || "Your Business"}</p>
            <p className="text-[10px] truncate" style={{ color: "#64748B" }}>{authUser?.email}</p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(22,163,74,0.12)", color: "#16A34A" }}>
            Active
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(66,133,199,0.12)", color: "#4285C7" }}>
            {PACKAGE_LABELS[pkg]}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {navGroups.map(({ title, items }) => (
          <div key={title}>
            <p className="text-[9px] font-black px-3 mb-1" style={{ color: "#334155", letterSpacing: "0.1em" }}>{title}</p>
            <div className="space-y-0.5">
              {items.map(({ href, label, icon, sub }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 rounded-xl text-sm font-medium transition-all"
                    style={{
                      padding: sub ? "0.5rem 0.75rem 0.5rem 1.75rem" : "0.625rem 0.75rem",
                      background: active ? "rgba(193,58,42,0.18)" : "transparent",
                      color: active ? "#FCA5A5" : sub ? "#475569" : "#64748B",
                      fontSize: sub ? "0.75rem" : undefined,
                    }}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : sub ? 1.6 : 1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                    </svg>
                    <span className="truncate">{label}</span>
                    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#C13A2A" }} />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-2 border-t shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <Link href="/subscribe" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2 px-3 py-2 mb-1 rounded-xl text-xs font-semibold transition-all hover:bg-white/5" style={{ color: "#64748B" }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          Upgrade Plan
        </Link>
        <button onClick={authLogout} className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:bg-white/5" style={{ color: "#64748B" }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Sign out
        </button>
      </div>
    </div>
  );

  const pageTitle = navGroups.flatMap((g) => g.items).find((i) => isActive(i.href))?.label || "Dashboard";

  return (
    <div className="flex" style={{ height: "100dvh", overflow: "hidden", background: "#F1F5F9" }}>
      {/* Desktop sidebar — fixed height, its own scroll */}
      <aside className="hidden lg:flex shrink-0 flex-col" style={{ width: 248, height: "100dvh", overflow: "hidden" }}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 flex flex-col" style={{ width: 260, zIndex: 51 }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main column — fills remaining width, scrolls independently */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Header — always visible, never scrolls away */}
        <header className="shrink-0 z-40 flex items-center justify-between px-4 sm:px-6 py-3 border-b" style={{ background: "white", borderColor: "rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 icon-only" style={{ minHeight: "auto" }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#374151" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h2 className="text-sm font-black" style={{ color: "#111827" }}>{pageTitle}</h2>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBadge />
            <span className="hidden sm:inline text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: "rgba(22,163,74,0.1)", color: "#16A34A" }}>
              Active
            </span>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0" style={{ background: "linear-gradient(135deg,#4285C7,#C13A2A)" }}>
              {user?.businessName?.[0]?.toUpperCase() || authUser?.name?.[0]?.toUpperCase() || "?"}
            </div>
          </div>
        </header>

        {/* Scrollable content area — iOS needs explicit WebkitOverflowScrolling */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6" style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}>
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
