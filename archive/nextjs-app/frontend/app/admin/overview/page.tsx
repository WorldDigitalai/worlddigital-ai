"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "../layout";
import Link from "next/link";

interface Overview {
  totalUsers: number;
  activeSubscriptions: number;
  businessProfiles: number;
  totalContent: number;
  totalPublished: number;
  pendingJobs: number;
  totalImpressions: number;
  totalClicks: number;
  recentUsers: Array<{ _id: string; name: string; email: string; subscriptionStatus: string; createdAt: string }>;
}

function Svg({ d, size = 20, color = "currentColor" }: { d: string; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

function StatCard({ label, value, sub, color, iconD }: { label: string; value: string | number; sub?: string; color: string; iconD: string }) {
  return (
    <div className="rounded-2xl p-5 flex items-start gap-4" style={{ background: "white", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
        <Svg d={iconD} size={20} color={color} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-black" style={{ color: "#0F172A" }}>{typeof value === "number" ? value.toLocaleString() : value}</p>
        <p className="text-sm font-semibold mt-0.5" style={{ color: "#64748B" }}>{label}</p>
        {sub && <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>{sub}</p>}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    active: { bg: "rgba(22,163,74,0.1)", text: "#16A34A" },
    none: { bg: "rgba(100,116,139,0.1)", text: "#64748B" },
    paused: { bg: "rgba(234,179,8,0.1)", text: "#CA8A04" },
    cancelled: { bg: "rgba(239,68,68,0.1)", text: "#DC2626" },
  };
  const c = colors[status] || colors.none;
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: c.bg, color: c.text }}>
      {status || "none"}
    </span>
  );
}

const STATS = [
  { label: "Total Users",          key: "totalUsers",           color: "#4285C7", iconD: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { label: "Active Subscriptions", key: "activeSubscriptions",  color: "#16A34A", iconD: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "Business Profiles",    key: "businessProfiles",     color: "#7C3AED", iconD: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
  { label: "Content Generated",    key: "totalContent",         color: "#F59E0B", iconD: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" },
  { label: "Posts Published",      key: "totalPublished",       color: "#06B6D4", iconD: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8" },
  { label: "Pending Jobs",         key: "pendingJobs",          color: "#EF4444", iconD: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "Total Impressions",    key: "totalImpressions",     color: "#4285C7", iconD: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" },
  { label: "Total Clicks",         key: "totalClicks",          color: "#C13A2A", iconD: "M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" },
] as const;

const QUICK = [
  { href: "/admin/blogs/new", label: "New Blog Post",    color: "#4285C7", iconD: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
  { href: "/admin/customers", label: "View Customers",   color: "#7C3AED", iconD: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { href: "/admin/publishing", label: "Publishing Queue", color: "#06B6D4", iconD: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8" },
  { href: "/admin/integrations", label: "Integrations",  color: "#F59E0B", iconD: "M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" },
];

export default function AdminOverview() {
  const { token } = useAdminAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch("/api/v1/admin/overview", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return <div className="text-red-500 p-4">Failed to load overview</div>;

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="text-2xl font-black" style={{ color: "#0F172A" }}>Dashboard Overview</h2>
        <p className="text-sm mt-1" style={{ color: "#64748B" }}>Real-time snapshot of your platform.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, key, color, iconD }) => {
          const raw = data[key as keyof Overview];
          const value = typeof raw === "number" ? raw : 0;
          const sub = key === "pendingJobs" ? (value > 0 ? "Needs attention" : "All clear") : undefined;
          return <StatCard key={key} label={label} value={value.toLocaleString()} sub={sub} color={color} iconD={iconD} />;
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {QUICK.map(({ href, label, color, iconD }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
            style={{ background: `${color}15`, color }}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d={iconD} />
            </svg>
            {label}
          </Link>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #E2E8F0" }}>
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "#F1F5F9" }}>
          <h3 className="font-bold text-sm" style={{ color: "#0F172A" }}>Recent Sign-ups</h3>
          <Link href="/admin/customers" className="text-xs font-semibold" style={{ color: "#4285C7" }}>View all →</Link>
        </div>
        <div className="divide-y divide-slate-100">
          {data.recentUsers.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: "#94A3B8" }}>No users yet</p>
          ) : data.recentUsers.map((u) => (
            <div key={u._id} className="flex items-center gap-4 px-5 py-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: "linear-gradient(135deg,#4285C7,#C13A2A)" }}>
                {(u.name || u.email)?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "#0F172A" }}>{u.name || "—"}</p>
                <p className="text-xs truncate" style={{ color: "#64748B" }}>{u.email}</p>
              </div>
              <StatusBadge status={u.subscriptionStatus} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
