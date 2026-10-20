"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdminAuth } from "../layout";

interface PublishingJob {
  _id: string;
  id?: string;
  userId: string;
  platforms: string[];
  caption: string;
  customerBusinessName: string;
  scheduledFor?: string;
  status: string;
  platformResults?: Record<string, { success: boolean; error?: string; postUrl?: string }>;
  error?: string;
  rejectionReason?: string;
  retryCount?: number;
  approvedAt?: string;
  publishedAt?: string;
  createdAt: string;
  businessProfile?: { businessName?: string; websiteUrl?: string } | null;
}

const STATUS: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  draft:          { label: "Draft",          color: "#64748B", bg: "rgba(100,116,139,0.1)", dot: "#94A3B8" },
  pending_review: { label: "Pending Review", color: "#D97706", bg: "rgba(217,119,6,0.1)",  dot: "#FBBF24" },
  approved:       { label: "Approved",       color: "#7C3AED", bg: "rgba(124,58,237,0.1)", dot: "#A78BFA" },
  scheduled:      { label: "Scheduled",      color: "#4285C7", bg: "rgba(66,133,199,0.1)", dot: "#60A5FA" },
  publishing:     { label: "Publishing",     color: "#0EA5E9", bg: "rgba(14,165,233,0.1)", dot: "#38BDF8" },
  published:      { label: "Published",      color: "#16A34A", bg: "rgba(22,163,74,0.1)",  dot: "#4ADE80" },
  failed:         { label: "Failed",         color: "#C13A2A", bg: "rgba(193,58,42,0.08)", dot: "#F87171" },
  rejected:       { label: "Rejected",       color: "#DC2626", bg: "rgba(220,38,38,0.08)", dot: "#FCA5A5" },
  cancelled:      { label: "Cancelled",      color: "#9CA3AF", bg: "rgba(0,0,0,0.06)",     dot: "#D1D5DB" },
  queued:         { label: "Queued",         color: "#D97706", bg: "rgba(217,119,6,0.1)",  dot: "#FBBF24" },
};

const PLATFORM_COLORS: Record<string, string> = {
  facebook: "#1877F2", instagram: "#E1306C", tiktok: "#000000",
  youtube: "#FF0000", linkedin: "#0A66C2", x: "#000000", snapchat: "#FFFC00",
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? STATUS["draft"];
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
}

function PlatformChip({ p }: { p: string }) {
  const color = PLATFORM_COLORS[p] ?? "#64748B";
  return (
    <span className="px-2 py-0.5 rounded text-xs font-semibold capitalize"
      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
      {p}
    </span>
  );
}

function Svg({ d, size = 16, color = "currentColor" }: { d: string; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

const STATUS_FILTERS = ["all","pending_review","approved","published","failed","rejected","queued","cancelled"];

export default function AdminPublishing() {
  const { token } = useAdminAuth();
  const [jobs, setJobs] = useState<PublishingJob[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, number>>({});

  const flash = (text: string, ok: boolean) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 6000); };

  const adminFetch = useCallback(async (path: string, opts: RequestInit = {}) => {
    const res = await fetch(`/api${path}`, {
      ...opts,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts.headers ?? {}) },
    });
    return { ok: res.ok, data: await res.json() };
  }, [token]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const qs = statusFilter !== "all" ? `?status=${statusFilter}` : "";
    const [qRes, sRes] = await Promise.all([
      adminFetch(`/v1/admin/publishing/queue${qs}`),
      adminFetch("/v1/admin/publishing/stats"),
    ]);
    if (qRes.ok) { setJobs(qRes.data.jobs ?? []); setTotal(qRes.data.total ?? 0); }
    if (sRes.ok) setStats(sRes.data.byStatus ?? {});
    setLoading(false);
  }, [adminFetch, statusFilter, token]);

  useEffect(() => { load(); }, [load]);

  const action = async (id: string, endpoint: string, body?: Record<string, unknown>) => {
    setActionLoading(id + endpoint);
    const res = await adminFetch(`/v1/admin/publishing/${id}/${endpoint}`, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
    flash(res.data.message ?? (res.ok ? "Done" : "Action failed"), res.ok);
    if (res.ok) load();
    setActionLoading(null);
  };

  const doReject = async () => {
    if (!rejectModal) return;
    await action(rejectModal.id, "reject", { reason: rejectReason || "Rejected by admin" });
    setRejectModal(null);
    setRejectReason("");
  };

  const jobId = (j: PublishingJob) => j.id ?? j._id;

  const pendingCount = stats["pending_review"] ?? 0;

  return (
    <div>
      <div className="space-y-6 max-w-6xl">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-black" style={{ color: "#0F172A" }}>Publishing Queue</h2>
            <p className="text-sm mt-1" style={{ color: "#64748B" }}>
              Review, approve and manage content before it goes live — {total} total
            </p>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ background: "rgba(217,119,6,0.1)", border: "1.5px solid rgba(217,119,6,0.3)" }}>
              <Svg d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                size={16} color="#D97706" />
              <span className="text-sm font-bold" style={{ color: "#D97706" }}>{pendingCount} awaiting review</span>
            </div>
          )}
        </div>

        {/* Stats chips */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {["pending_review","approved","published","failed","rejected","cancelled"].map((s) => {
            const st = STATUS[s]!;
            return (
              <button key={s} onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
                className="rounded-xl p-3 text-left transition-all"
                style={{ background: statusFilter === s ? st.bg : "white", border: `1.5px solid ${statusFilter === s ? st.color + "50" : "#E2E8F0"}` }}>
                <p className="text-xl font-black" style={{ color: st.color }}>{stats[s] ?? 0}</p>
                <p className="text-xs font-semibold mt-0.5 leading-tight" style={{ color: "#64748B" }}>{st.label}</p>
              </button>
            );
          })}
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize"
              style={{ background: statusFilter === s ? "#111827" : "white", color: statusFilter === s ? "white" : "#64748B", border: "1.5px solid", borderColor: statusFilter === s ? "#111827" : "#E2E8F0" }}>
              {s === "all" ? "All" : (STATUS[s]?.label ?? s)}{s !== "all" && stats[s] ? ` (${stats[s]})` : ""}
            </button>
          ))}
          <button onClick={load} className="ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: "white", color: "#64748B", border: "1.5px solid #E2E8F0" }}>
            Refresh
          </button>
        </div>

        {/* Flash */}
        {msg && (
          <div className="px-4 py-3 rounded-xl text-sm font-medium"
            style={{ background: msg.ok ? "rgba(22,163,74,0.08)" : "rgba(193,58,42,0.08)", color: msg.ok ? "#16A34A" : "#C13A2A", border: `1px solid ${msg.ok ? "rgba(22,163,74,0.2)" : "rgba(193,58,42,0.2)"}` }}>
            {msg.text}
          </div>
        )}

        {/* Jobs */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl p-12 text-center" style={{ background: "white", border: "1.5px solid #E2E8F0" }}>
            <Svg d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" size={40} color="#CBD5E1" />
            <p className="mt-4 font-semibold" style={{ color: "#94A3B8" }}>No jobs found</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {jobs.map((job) => {
              const id = jobId(job);
              const isExp = expanded === id;
              const st = STATUS[job.status] ?? STATUS["draft"];
              return (
                <div key={id} className="rounded-2xl overflow-hidden"
                  style={{ background: "white", border: "1.5px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: st.bg }}>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: st.dot }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-bold text-sm" style={{ color: "#0F172A" }}>
                            {job.businessProfile?.businessName ?? job.customerBusinessName ?? "Unknown"}
                          </span>
                          <StatusBadge status={job.status} />
                          {(job.retryCount ?? 0) > 0 && (
                            <span className="px-2 py-0.5 rounded text-xs" style={{ background: "rgba(100,116,139,0.1)", color: "#64748B" }}>
                              Retry #{job.retryCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm line-clamp-2 mb-2" style={{ color: "#64748B" }}>{job.caption}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          {(job.platforms ?? []).map((p) => <PlatformChip key={p} p={p} />)}
                          <span className="text-xs" style={{ color: "#94A3B8" }}>
                            {new Date(job.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                        {job.status === "rejected" && job.rejectionReason && (
                          <div className="mt-2 px-3 py-2 rounded-lg text-xs"
                            style={{ background: "rgba(220,38,38,0.06)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.15)" }}>
                            Rejection reason: {job.rejectionReason}
                          </div>
                        )}
                        {job.status === "failed" && job.error && (
                          <div className="mt-2 px-3 py-2 rounded-lg text-xs"
                            style={{ background: "rgba(193,58,42,0.06)", color: "#C13A2A", border: "1px solid rgba(193,58,42,0.15)" }}>
                            Error: {job.error}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {job.status === "pending_review" && (
                          <>
                            <button onClick={() => action(id, "approve")}
                              disabled={!!actionLoading}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold"
                              style={{ background: "#16A34A", color: "white", opacity: actionLoading === id + "approve" ? 0.6 : 1 }}>
                              {actionLoading === id + "approve" ? "…" : "✓ Approve"}
                            </button>
                            <button onClick={() => setRejectModal({ id, name: job.customerBusinessName })}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold"
                              style={{ background: "rgba(220,38,38,0.1)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.2)" }}>
                              ✕ Reject
                            </button>
                          </>
                        )}
                        {["failed","rejected"].includes(job.status) && (
                          <button onClick={() => action(id, "retry")}
                            disabled={!!actionLoading}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold"
                            style={{ background: "rgba(66,133,199,0.1)", color: "#4285C7", border: "1px solid rgba(66,133,199,0.2)", opacity: actionLoading === id + "retry" ? 0.6 : 1 }}>
                            {actionLoading === id + "retry" ? "…" : "↺ Retry"}
                          </button>
                        )}
                        {["approved","publishing","failed"].includes(job.status) && (
                          <button onClick={() => action(id, "manual-complete", { note: "Manually completed by admin" })}
                            disabled={!!actionLoading}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold"
                            style={{ background: "rgba(22,163,74,0.08)", color: "#16A34A", border: "1px solid rgba(22,163,74,0.2)", opacity: actionLoading === id + "manual-complete" ? 0.6 : 1 }}>
                            {actionLoading === id + "manual-complete" ? "…" : "Mark Done"}
                          </button>
                        )}
                        <button onClick={() => setExpanded(isExp ? null : id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: "rgba(100,116,139,0.08)", color: "#64748B" }}>
                          <Svg d={isExp ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExp && (
                    <div className="px-5 pb-5 pt-3 border-t" style={{ borderColor: "#F1F5F9" }}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#94A3B8" }}>Full Caption</p>
                          <p className="text-sm whitespace-pre-wrap" style={{ color: "#374151" }}>{job.caption}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#94A3B8" }}>Customer</p>
                          <p className="text-sm font-semibold" style={{ color: "#0F172A" }}>{job.customerBusinessName}</p>
                          {job.businessProfile?.websiteUrl && (
                            <a href={job.businessProfile.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs underline" style={{ color: "#4285C7" }}>
                              {job.businessProfile.websiteUrl}
                            </a>
                          )}
                          <p className="text-xs mt-2" style={{ color: "#94A3B8" }}>User: {job.userId}</p>
                        </div>
                        {job.platformResults && Object.keys(job.platformResults).length > 0 && (
                          <div className="md:col-span-2">
                            <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "#94A3B8" }}>Platform Results</p>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(job.platformResults).map(([p, r]) => (
                                <div key={p} className="px-3 py-2 rounded-lg text-xs"
                                  style={{ background: r.success ? "rgba(22,163,74,0.08)" : "rgba(193,58,42,0.08)", border: `1px solid ${r.success ? "rgba(22,163,74,0.2)" : "rgba(193,58,42,0.2)"}`, color: r.success ? "#16A34A" : "#C13A2A" }}>
                                  <span className="font-bold capitalize">{p}: </span>
                                  {r.success ? (r.postUrl ? <a href={r.postUrl} target="_blank" rel="noreferrer" className="underline">View post</a> : "Published") : (r.error ?? "Failed")}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="rounded-2xl p-6 w-full max-w-md mx-4" style={{ background: "white", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h3 className="text-lg font-black mb-1" style={{ color: "#0F172A" }}>Reject Publishing Job</h3>
            <p className="text-sm mb-4" style={{ color: "#64748B" }}>
              Provide a reason so <strong>{rejectModal.name}</strong> knows what to fix.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="e.g. Caption too long, missing destination URL, prohibited content…"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
              style={{ border: "1.5px solid #E2E8F0", color: "#0F172A" }}
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setRejectModal(null); setRejectReason(""); }}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm"
                style={{ background: "#F1F5F9", color: "#64748B" }}>
                Cancel
              </button>
              <button onClick={doReject}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm"
                style={{ background: "#DC2626", color: "white" }}>
                Reject Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
