"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "../layout";

interface SEOKeyword {
  _id: string;
  keyword: string;
  pageUrl: string;
  rankingStatus: string;
  trafficEstimate: string;
  conversionNote: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  "not tracked": { bg: "rgba(148,163,184,0.15)", color: "#64748B" },
  "tracking": { bg: "rgba(66,133,199,0.12)", color: "#4285C7" },
  "ranking": { bg: "rgba(22,163,74,0.12)", color: "#16A34A" },
  "improving": { bg: "rgba(234,179,8,0.12)", color: "#CA8A04" },
  "dropped": { bg: "rgba(239,68,68,0.12)", color: "#DC2626" },
};

const SEO_PAGES = [
  "/snapchat-marketing", "/snapchat-ads-agency", "/tiktok-marketing", "/tiktok-ads-agency",
  "/meta-ads-agency", "/instagram-marketing", "/facebook-ads-management", "/google-ads-agency",
  "/youtube-shorts-marketing", "/linkedin-ads-agency", "/x-ads-agency",
  "/ai-marketing-automation", "/ai-seo-agency",
];

const RANKING_STATUSES = ["not tracked", "tracking", "ranking", "improving", "dropped"];

const EMPTY_FORM = { keyword: "", pageUrl: "", rankingStatus: "not tracked", trafficEstimate: "", conversionNote: "" };

export default function AdminSEOKeywordsPage() {
  const { token } = useAdminAuth();
  const [keywords, setKeywords] = useState<SEOKeyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    const r = await fetch("/api/v1/admin/seo-keywords", { headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) setKeywords(await r.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, [token]);

  const openAdd = () => { setEditId(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (kw: SEOKeyword) => {
    setEditId(kw._id);
    setForm({ keyword: kw.keyword, pageUrl: kw.pageUrl, rankingStatus: kw.rankingStatus, trafficEstimate: kw.trafficEstimate, conversionNote: kw.conversionNote });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const url = editId ? `/api/v1/admin/seo-keywords/${editId}` : "/api/v1/admin/seo-keywords";
    await fetch(url, {
      method: editId ? "PUT" : "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowForm(false);
    load();
  };

  const deleteKw = async (id: string) => {
    if (!confirm("Delete this keyword entry?")) return;
    setDeleting(id);
    await fetch(`/api/v1/admin/seo-keywords/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    await load();
    setDeleting(null);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black" style={{ color: "#0F172A" }}>SEO Keyword Tracking</h2>
          <p className="text-sm mt-1" style={{ color: "#64748B" }}>
            {keywords.length} keywords tracked · {keywords.filter(k => k.rankingStatus === "ranking").length} ranking
          </p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }}
        >
          + Add Keyword
        </button>
      </div>

      {/* Quick reference: SEO pages */}
      <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E2E8F0" }}>
        <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "#64748B" }}>SEO Landing Pages (13 pages live)</p>
        <div className="flex flex-wrap gap-2">
          {SEO_PAGES.map((p) => (
            <a key={p} href={p} target="_blank" rel="noopener noreferrer"
              className="px-3 py-1 rounded-full text-xs font-medium hover:opacity-80 transition-all"
              style={{ background: "rgba(66,133,199,0.1)", color: "#4285C7" }}
            >{p}</a>
          ))}
        </div>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid #E2E8F0", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <h3 className="font-bold mb-5" style={{ color: "#0F172A" }}>{editId ? "Edit Keyword" : "Add Keyword"}</h3>
          <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "#475569" }}>Target Keyword *</label>
              <input
                required value={form.keyword} onChange={e => setForm(f => ({ ...f, keyword: e.target.value }))}
                placeholder="e.g. snapchat ads agency"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: "1px solid #E2E8F0" }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "#475569" }}>Page URL *</label>
              <select
                value={form.pageUrl} onChange={e => setForm(f => ({ ...f, pageUrl: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: "1px solid #E2E8F0" }}
              >
                <option value="">Select page or type custom…</option>
                {SEO_PAGES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input
                value={form.pageUrl} onChange={e => setForm(f => ({ ...f, pageUrl: e.target.value }))}
                placeholder="or type /custom-path"
                className="w-full px-3 py-2 rounded-xl text-sm outline-none mt-1"
                style={{ border: "1px solid #E2E8F0" }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "#475569" }}>Ranking Status</label>
              <select
                value={form.rankingStatus} onChange={e => setForm(f => ({ ...f, rankingStatus: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: "1px solid #E2E8F0" }}
              >
                {RANKING_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "#475569" }}>Traffic Estimate (placeholder)</label>
              <input
                value={form.trafficEstimate} onChange={e => setForm(f => ({ ...f, trafficEstimate: e.target.value }))}
                placeholder="e.g. 500/mo · position #8"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: "1px solid #E2E8F0" }}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "#475569" }}>Conversion Note (placeholder)</label>
              <input
                value={form.conversionNote} onChange={e => setForm(f => ({ ...f, conversionNote: e.target.value }))}
                placeholder="e.g. 3 sign-ups traced to this page this month"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: "1px solid #E2E8F0" }}
              />
            </div>
            <div className="sm:col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-80 transition-all" style={{ background: "#F1F5F9", color: "#475569" }}>Cancel</button>
              <button type="submit" disabled={saving || !form.keyword || !form.pageUrl} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }}>
                {saving ? "Saving…" : editId ? "Save Changes" : "Add Keyword"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Keywords table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #E2E8F0" }}>
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : keywords.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(66,133,199,0.08)" }}>
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#4285C7" strokeWidth={1.6}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </div>
            <p className="font-semibold" style={{ color: "#0F172A" }}>No keywords tracked yet</p>
            <p className="text-sm mt-1 mb-6" style={{ color: "#64748B" }}>Add your first target keyword to start tracking.</p>
            <button onClick={openAdd} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }}>
              Add First Keyword
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  {["Keyword", "Page URL", "Status", "Traffic", "Conversion Note", ""].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: "#64748B" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {keywords.map(kw => {
                  const statusStyle = STATUS_COLORS[kw.rankingStatus] || STATUS_COLORS["not tracked"];
                  return (
                    <tr key={kw._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 max-w-[200px]">
                        <p className="font-semibold text-sm truncate" style={{ color: "#0F172A" }}>{kw.keyword}</p>
                      </td>
                      <td className="px-5 py-4">
                        <a href={kw.pageUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium hover:underline truncate block max-w-[180px]" style={{ color: "#4285C7" }}>{kw.pageUrl}</a>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={statusStyle}>{kw.rankingStatus}</span>
                      </td>
                      <td className="px-5 py-4 text-sm max-w-[160px]" style={{ color: "#64748B" }}>
                        <span className="truncate block">{kw.trafficEstimate || "—"}</span>
                      </td>
                      <td className="px-5 py-4 text-sm max-w-[200px]" style={{ color: "#64748B" }}>
                        <span className="truncate block">{kw.conversionNote || "—"}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => openEdit(kw)} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80" style={{ background: "rgba(66,133,199,0.1)", color: "#4285C7" }}>Edit</button>
                          <button onClick={() => deleteKw(kw._id)} disabled={deleting === kw._id} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-40" style={{ background: "rgba(239,68,68,0.1)", color: "#DC2626" }}>
                            {deleting === kw._id ? "…" : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs" style={{ color: "#94A3B8" }}>
        Traffic and conversion fields are manual placeholders. Connect Google Search Console or a rank-tracking API to automate ranking data in the future.
      </p>
    </div>
  );
}
