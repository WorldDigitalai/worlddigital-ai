"use client";

import { useState, useEffect } from "react";

interface ToolCreditRecord {
  _id: string;
  userId: string;
  tool: string;
  credits: number;
  used: number;
  lastUsedAt?: string;
  createdAt?: string;
}

interface ToolCreditSummary {
  totalCredits: number;
  totalUsed: number;
  users: number;
}

const TOOL_LABELS: Record<string, string> = {
  "image-generator": "AI Image Generator",
  "reels-generator": "AI Reels Generator",
  "keyword-research": "AI Keyword Research",
  "ai-seo": "Auto AI SEO",
  "content-marketing": "AI Content Marketing",
};

const TOOL_COLORS: Record<string, { color: string; bg: string }> = {
  "image-generator":  { color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  "reels-generator":  { color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
  "keyword-research": { color: "#6366F1", bg: "rgba(99,102,241,0.1)" },
  "ai-seo":           { color: "#10B981", bg: "rgba(16,185,129,0.1)" },
  "content-marketing":{ color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
};

function ToolBadge({ tool }: { tool: string }) {
  const c = TOOL_COLORS[tool] ?? { color: "#6B7280", bg: "rgba(107,114,128,0.1)" };
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: c.bg, color: c.color }}>
      {TOOL_LABELS[tool] ?? tool}
    </span>
  );
}

export default function AdminPurchasesPage() {
  const [records, setRecords] = useState<ToolCreditRecord[]>([]);
  const [summary, setSummary] = useState<Record<string, ToolCreditSummary>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTool, setFilterTool] = useState("all");

  const adminToken = typeof window !== "undefined" ? localStorage.getItem("wdai_admin_token") : null;

  useEffect(() => {
    if (!adminToken) return;
    fetch("/api/v1/admin/tool-credits", { headers: { Authorization: `Bearer ${adminToken}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.records) setRecords(d.records);
        if (d.summary) setSummary(d.summary);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [adminToken]);

  const filtered = records.filter((r) => {
    const matchTool = filterTool === "all" || r.tool === filterTool;
    const matchSearch = !search ||
      r.userId.toLowerCase().includes(search.toLowerCase()) ||
      (TOOL_LABELS[r.tool] || r.tool).toLowerCase().includes(search.toLowerCase());
    return matchTool && matchSearch;
  });

  const totalCreditsIssued = Object.values(summary).reduce((s, v) => s + v.totalCredits + v.totalUsed, 0);
  const totalUsed = Object.values(summary).reduce((s, v) => s + v.totalUsed, 0);
  const totalRemaining = Object.values(summary).reduce((s, v) => s + v.totalCredits, 0);
  const totalUsers = Math.max(...Object.values(summary).map(v => v.users), 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-black text-slate-800">Credit Purchases & Usage</h1>
        <p className="text-sm text-slate-500 mt-0.5">AI tool credit packs purchased and consumed by users</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Credits Issued", value: totalCreditsIssued.toLocaleString() },
          { label: "Credits Used", value: totalUsed.toLocaleString() },
          { label: "Credits Remaining", value: totalRemaining.toLocaleString() },
          { label: "Unique Users", value: totalUsers.toLocaleString() },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl p-4 bg-white border border-slate-100 shadow-sm">
            <p className="text-2xl font-black text-slate-800">{loading ? "—" : value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tool summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {Object.entries(TOOL_LABELS).map(([slug, label]) => {
          const s = summary[slug];
          const c = TOOL_COLORS[slug] ?? { color: "#6B7280", bg: "rgba(107,114,128,0.1)" };
          return (
            <div key={slug} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
              <div className="w-8 h-8 rounded-lg mb-3 flex items-center justify-center" style={{ background: c.bg }}>
                <div className="w-3 h-3 rounded-full" style={{ background: c.color }} />
              </div>
              <p className="text-xs font-bold text-slate-700 mb-2">{label}</p>
              <div className="space-y-1 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Users</span>
                  <span className="font-semibold text-slate-700">{loading ? "—" : (s?.users ?? 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Used</span>
                  <span className="font-semibold text-slate-700">{loading ? "—" : (s?.totalUsed ?? 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Remaining</span>
                  <span className="font-semibold text-slate-700">{loading ? "—" : (s?.totalCredits ?? 0)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Search by user ID or tool…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-4 py-2.5 rounded-xl text-sm outline-none border border-slate-200 bg-white"
        />
        <select
          value={filterTool}
          onChange={(e) => setFilterTool(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm border border-slate-200 bg-white outline-none"
        >
          <option value="all">All Tools</option>
          {Object.entries(TOOL_LABELS).map(([slug, label]) => (
            <option key={slug} value={slug}>{label}</option>
          ))}
        </select>
      </div>

      {/* Records table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400 text-sm">No credit records found</p>
          </div>
        ) : (
          <div className="scroll-x">
          <table className="w-full">
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Tool</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">User ID</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Credits Remaining</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Credits Used</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Usage Rate</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Last Used</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((rec) => {
                const total = rec.credits + rec.used;
                const usagePct = total > 0 ? Math.round((rec.used / total) * 100) : 0;
                return (
                  <tr key={String(rec._id)} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <ToolBadge tool={rec.tool} />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-mono text-slate-500 truncate max-w-[140px] block">{rec.userId}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="font-bold text-sm" style={{ color: rec.credits > 0 ? "#111827" : "#9CA3AF" }}>{rec.credits}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="text-sm text-slate-600">{rec.used}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
                          <div className="h-full rounded-full" style={{ width: `${usagePct}%`, background: usagePct > 70 ? "#EF4444" : "#10B981" }} />
                        </div>
                        <span className="text-xs text-slate-400 w-8 text-right">{usagePct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-slate-400">
                        {rec.lastUsedAt ? new Date(rec.lastUsedAt).toLocaleDateString() : "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
