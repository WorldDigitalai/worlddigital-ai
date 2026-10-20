"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdminAuth } from "../layout";

type LogTab = "activity" | "audit" | "webhook";

interface ActivityLog {
  _id: string;
  userId: string;
  action: string;
  category: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  createdAt: string;
}

interface AuditLog {
  _id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId?: string;
  targetEmail?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

interface WebhookLog {
  _id: string;
  source: string;
  eventType: string;
  eventId?: string;
  status: string;
  metadata?: Record<string, unknown>;
  error?: string;
  createdAt: string;
}

const CAT_COLORS: Record<string, string> = {
  content: "#4285C7", publishing: "#7C3AED", billing: "#16A34A",
  auth: "#D97706", profile: "#0EA5E9", credits: "#F59E0B",
  ads: "#C13A2A", system: "#64748B",
};

const WH_STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  received:  { color: "#4285C7", bg: "rgba(66,133,199,0.1)" },
  processed: { color: "#16A34A", bg: "rgba(22,163,74,0.1)" },
  failed:    { color: "#C13A2A", bg: "rgba(193,58,42,0.08)" },
  ignored:   { color: "#64748B", bg: "rgba(100,116,139,0.1)" },
};

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ color, background: bg }}>
      {label}
    </span>
  );
}

function MetaRow({ label, value }: { label: string; value: unknown }) {
  if (value === undefined || value === null) return null;
  return (
    <span className="text-xs" style={{ color: "#94A3B8" }}>
      <span style={{ color: "#64748B" }}>{label}: </span>
      {typeof value === "object" ? JSON.stringify(value) : String(value)}
    </span>
  );
}

function fmt(date: string) {
  return new Date(date).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function AdminLogsPage() {
  const { token } = useAdminAuth();
  const [tab, setTab] = useState<LogTab>("activity");
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [totals, setTotals] = useState<Record<LogTab, number>>({ activity: 0, audit: 0, webhook: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [limit, setLimit] = useState(50);

  const adminFetch = useCallback(async (path: string) => {
    const res = await fetch(`/api${path}`, { headers: { Authorization: `Bearer ${token}` } });
    return res.ok ? res.json() : null;
  }, [token]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);

    const buildQs = (extra?: string) => {
      const p = new URLSearchParams({ limit: String(limit) });
      if (search) p.set("search", search);
      if (filter) p.set(tab === "activity" ? "category" : tab === "audit" ? "targetType" : "source", filter);
      if (extra) p.set(tab === "webhook" ? "status" : "skip", extra);
      return p.toString();
    };

    if (tab === "activity") {
      const data = await adminFetch(`/v1/admin/logs/activity?${buildQs()}`);
      if (data) { setActivityLogs(data.logs ?? []); setTotals((t) => ({ ...t, activity: data.total ?? 0 })); }
    } else if (tab === "audit") {
      const data = await adminFetch(`/v1/admin/logs/audit?${buildQs()}`);
      if (data) { setAuditLogs(data.logs ?? []); setTotals((t) => ({ ...t, audit: data.total ?? 0 })); }
    } else {
      const data = await adminFetch(`/v1/admin/logs/webhook?${buildQs()}`);
      if (data) { setWebhookLogs(data.logs ?? []); setTotals((t) => ({ ...t, webhook: data.total ?? 0 })); }
    }
    setLoading(false);
  }, [adminFetch, tab, search, filter, limit, token]);

  useEffect(() => { load(); }, [load]);

  const TABS: { key: LogTab; label: string; count: number }[] = [
    { key: "activity", label: "Activity Logs", count: totals.activity },
    { key: "audit",    label: "Admin Audit",   count: totals.audit },
    { key: "webhook",  label: "Webhooks",       count: totals.webhook },
  ];

  const CATEGORY_OPTS = ["content","publishing","billing","auth","profile","credits","ads","system"];
  const TARGET_OPTS   = ["user","publishing_job","content","subscription","feature_flag","integration","system"];
  const SOURCE_OPTS   = ["stripe","meta","snapchat","tiktok","other"];
  const STATUS_OPTS   = ["received","processed","failed","ignored"];

  const filterOpts = tab === "activity" ? CATEGORY_OPTS : tab === "audit" ? TARGET_OPTS : SOURCE_OPTS;

  return (
    <div className="space-y-5 max-w-6xl">
      <div>
        <h2 className="text-2xl font-black" style={{ color: "#0F172A" }}>System Logs</h2>
        <p className="text-sm mt-1" style={{ color: "#64748B" }}>
          Activity, admin audit trail, and webhook event history.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(({ key, label, count }) => (
          <button key={key} onClick={() => { setTab(key); setFilter(""); setSearch(""); }}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: tab === key ? "#111827" : "white", color: tab === key ? "white" : "#64748B", border: "1.5px solid", borderColor: tab === key ? "#111827" : "#E2E8F0" }}>
            {label}
            {count > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs" style={{ background: tab === key ? "rgba(255,255,255,0.2)" : "rgba(100,116,139,0.1)" }}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          placeholder={`Search ${tab} logs…`}
          className="flex-1 min-w-48 px-3 py-2 rounded-xl text-sm outline-none"
          style={{ border: "1.5px solid #E2E8F0", color: "#0F172A" }}
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ border: "1.5px solid #E2E8F0", color: "#64748B", background: "white" }}>
          <option value="">{tab === "activity" ? "All categories" : tab === "audit" ? "All target types" : "All sources"}</option>
          {filterOpts.map((o) => <option key={o} value={o}>{o}</option>)}
          {tab === "webhook" && STATUS_OPTS.map((o) => <option key={"s:" + o} value={o}>{o} (status)</option>)}
        </select>
        <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ border: "1.5px solid #E2E8F0", color: "#64748B", background: "white" }}>
          {[25,50,100,200].map((n) => <option key={n} value={n}>Last {n}</option>)}
        </select>
        <button onClick={load} className="px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: "#111827", color: "white" }}>
          Search
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1.5px solid #E2E8F0" }}>
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === "activity" ? (
          <div className="scroll-x">
          <table className="w-full">
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                {["Time","User ID","Category","Action","IP"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: "#64748B" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activityLogs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-sm" style={{ color: "#94A3B8" }}>No activity logs yet</td></tr>
              ) : activityLogs.map((log) => (
                <tr key={log._id} className="border-b last:border-0 hover:bg-slate-50 transition-colors" style={{ borderColor: "#F1F5F9" }}>
                  <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "#94A3B8" }}>{fmt(log.createdAt)}</td>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: "#64748B" }}>{log.userId?.slice(-8) ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge label={log.category ?? "unknown"} color={CAT_COLORS[log.category] ?? "#64748B"} bg={`${CAT_COLORS[log.category] ?? "#64748B"}18`} />
                  </td>
                  <td className="px-4 py-3 text-xs font-medium max-w-xs" style={{ color: "#374151" }}>
                    <span>{log.action}</span>
                    {log.metadata && (
                      <div className="mt-0.5 flex flex-wrap gap-x-3">
                        {Object.entries(log.metadata).slice(0, 3).map(([k, v]) => (
                          <MetaRow key={k} label={k} value={v} />
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: "#94A3B8" }}>{log.ip ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        ) : tab === "audit" ? (
          <div className="scroll-x">
          <table className="w-full">
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                {["Time","Admin","Target Type","Action","Details"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: "#64748B" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-sm" style={{ color: "#94A3B8" }}>No audit logs yet. Admin actions will appear here.</td></tr>
              ) : auditLogs.map((log) => (
                <tr key={log._id} className="border-b last:border-0 hover:bg-slate-50 transition-colors" style={{ borderColor: "#F1F5F9" }}>
                  <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "#94A3B8" }}>{fmt(log.createdAt)}</td>
                  <td className="px-4 py-3 text-xs font-medium" style={{ color: "#0F172A" }}>{log.adminId}</td>
                  <td className="px-4 py-3">
                    <Badge label={log.targetType} color="#7C3AED" bg="rgba(124,58,237,0.1)" />
                  </td>
                  <td className="px-4 py-3 text-xs font-medium" style={{ color: "#374151" }}>{log.action.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#94A3B8" }}>
                    {log.targetId && <span className="font-mono mr-2">#{log.targetId.slice(-8)}</span>}
                    {log.targetEmail && <span className="mr-2">{log.targetEmail}</span>}
                    {log.metadata && Object.entries(log.metadata).slice(0, 2).map(([k, v]) => (
                      <MetaRow key={k} label={k} value={v} />
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        ) : (
          <div className="scroll-x">
          <table className="w-full">
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                {["Time","Source","Event Type","Event ID","Status","Error"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: "#64748B" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {webhookLogs.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-sm" style={{ color: "#94A3B8" }}>No webhook logs yet. Stripe events will appear here.</td></tr>
              ) : webhookLogs.map((log) => {
                const sc = WH_STATUS_COLORS[log.status] ?? WH_STATUS_COLORS["ignored"];
                return (
                  <tr key={log._id} className="border-b last:border-0 hover:bg-slate-50 transition-colors" style={{ borderColor: "#F1F5F9" }}>
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "#94A3B8" }}>{fmt(log.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-bold capitalize" style={{ background: "rgba(66,133,199,0.1)", color: "#4285C7" }}>{log.source}</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: "#374151" }}>{log.eventType}</td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: "#94A3B8" }}>{log.eventId?.slice(-12) ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge label={log.status} color={sc.color} bg={sc.bg} />
                    </td>
                    <td className="px-4 py-3 text-xs max-w-xs truncate" style={{ color: "#C13A2A" }}>{log.error ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <p className="text-xs text-center" style={{ color: "#94A3B8" }}>
        Showing up to {limit} records. Use search to narrow results.
      </p>
    </div>
  );
}
