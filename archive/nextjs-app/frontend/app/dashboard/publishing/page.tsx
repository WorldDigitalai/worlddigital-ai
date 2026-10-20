"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";

interface PublishingJob {
  id: string;
  platforms: string[];
  caption: string;
  destinationUrl: string;
  customerBusinessName: string;
  scheduledFor?: string;
  status: string;
  platformResults?: Record<string, { success: boolean; error?: string; postUrl?: string }>;
  error?: string;
  rejectionReason?: string;
  createdAt: string;
}

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  queued:         { label: "Queued",          color: "#D97706", bg: "rgba(217,119,6,0.1)" },
  pending_review: { label: "Pending Review",  color: "#7C3AED", bg: "rgba(124,58,237,0.1)" },
  approved:       { label: "Approved",        color: "#16A34A", bg: "rgba(22,163,74,0.1)" },
  publishing:     { label: "Publishing…",     color: "#4285C7", bg: "rgba(66,133,199,0.1)" },
  published:      { label: "Published",       color: "#16A34A", bg: "rgba(22,163,74,0.1)" },
  failed:         { label: "Failed",          color: "#C13A2A", bg: "rgba(193,58,42,0.08)" },
  rejected:       { label: "Rejected",        color: "#DC2626", bg: "rgba(220,38,38,0.08)" },
  cancelled:      { label: "Cancelled",       color: "#9CA3AF", bg: "rgba(0,0,0,0.06)" },
};

export default function PublishingPage() {
  const [jobs, setJobs] = useState<PublishingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    const res = await apiFetch<{ jobs: PublishingJob[] }>(`/v1/dashboard/publishing?${params}`);
    if (res.ok) setJobs(res.data.jobs);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const flash = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 6000);
  };

  const submitForReview = async (id: string) => {
    setActionLoading(id + "review");
    const res = await apiFetch(`/v1/dashboard/publishing/${id}/submit-review`, { method: "POST" });
    if (res.ok) { flash("Submitted for review. You'll be notified when it's approved.", true); load(); }
    else flash((res as { error?: string }).error || "Could not submit", false);
    setActionLoading(null);
  };

  const publish = async (id: string) => {
    setActionLoading(id);
    const res = await apiFetch<{ status: string; platformResults: Record<string, { success: boolean; error?: string }> }>(
      `/v1/dashboard/publishing/${id}/publish`, { method: "POST" }
    );
    if (res.ok) {
      const results = res.data.platformResults;
      const allFailed = Object.values(results).every(r => !r.success);
      if (allFailed) {
        const errors = Object.entries(results).map(([p, r]) => `${p}: ${r.error}`).join("; ");
        flash(`Publishing attempted — platforms need API setup: ${errors}`, false);
      } else {
        flash("Published successfully to configured platforms!", true);
      }
      load();
    } else if (res.status === 403) {
      flash("Not enough tokens. Buy more to continue.", false);
    } else {
      flash((res as { error?: string }).error || "Publishing failed", false);
    }
    setActionLoading(null);
  };

  const cancel = async (id: string) => {
    setActionLoading(id + "cancel");
    const res = await apiFetch(`/v1/dashboard/publishing/${id}/cancel`, { method: "POST" });
    if (res.ok) { flash("Job cancelled", true); load(); }
    else flash((res as { error?: string }).error || "Could not cancel", false);
    setActionLoading(null);
  };

  const FILTER_OPTIONS = ["all", "queued", "pending_review", "approved", "published", "failed", "rejected", "cancelled"];

  const counts = FILTER_OPTIONS.slice(1).reduce((acc, s) => ({
    ...acc,
    [s]: jobs.filter(j => j.status === s).length,
  }), {} as Record<string, number>);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-black" style={{ color: "#111827" }}>Publishing Queue</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
          Track and manage your content publishing jobs
        </p>
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium border ${msg.ok ? "text-green-800 bg-green-50 border-green-200" : "text-red-700 bg-red-50 border-red-200"}`}>
          {msg.text}
        </div>
      )}

      {/* Info banner */}
      <div className="rounded-xl px-4 py-3 text-xs" style={{ background: "rgba(66,133,199,0.06)", border: "1px solid rgba(66,133,199,0.2)", color: "#1E40AF" }}>
        <strong>How publishing works:</strong> Submit your content for review →
        Our team approves → Content is published to your connected social accounts →
        Traffic flows to your destination URL.
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_OPTIONS.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className="px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all"
            style={{
              background: statusFilter === s ? "rgba(193,58,42,0.1)" : "rgba(0,0,0,0.04)",
              border: `1.5px solid ${statusFilter === s ? "#C13A2A" : "rgba(0,0,0,0.08)"}`,
              color: statusFilter === s ? "#C13A2A" : "#6B7280",
            }}>
            {s === "all" ? `All (${jobs.length})` : `${s.replace("_", " ")}${counts[s] ? ` (${counts[s]})` : ""}`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <svg className="w-7 h-7 animate-spin" style={{ color: "#C13A2A" }} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ background: "white", border: "2px dashed rgba(0,0,0,0.1)" }}>
          <p className="text-3xl mb-3">📤</p>
          <p className="text-sm font-semibold" style={{ color: "#111827" }}>No jobs in queue</p>
          <p className="text-xs mt-1 mb-4" style={{ color: "#9CA3AF" }}>Approve content in the library, then add it to the publishing queue</p>
          <a href="/dashboard/content-library" className="inline-flex px-5 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }}>
            Go to Content Library →
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => {
            const s = STATUS_STYLES[job.status] ?? STATUS_STYLES["queued"];
            return (
              <div key={job.id} className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-bold" style={{ color: "#111827" }}>{job.customerBusinessName}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                    </div>
                    <p className="text-xs leading-relaxed line-clamp-2 mb-2" style={{ color: "#6B7280" }}>{job.caption}</p>
                    <div className="flex items-center gap-2 text-[10px] flex-wrap" style={{ color: "#9CA3AF" }}>
                      {job.destinationUrl && <span>→ {job.destinationUrl}</span>}
                      {job.platforms.map(p => (
                        <span key={p} className="px-2 py-0.5 rounded-full capitalize" style={{ background: "rgba(66,133,199,0.08)", color: "#1D4ED8" }}>{p.replace("_", " ")}</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] shrink-0 mt-0.5" style={{ color: "#9CA3AF" }}>
                    {new Date(job.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Status-specific info */}
                {job.status === "pending_review" && (
                  <div className="mb-3 px-3 py-2 rounded-lg text-xs" style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)", color: "#7C3AED" }}>
                    Under review — you'll be notified once it's approved or if changes are needed.
                  </div>
                )}
                {job.status === "approved" && (
                  <div className="mb-3 px-3 py-2 rounded-lg text-xs" style={{ background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.2)", color: "#16A34A" }}>
                    Approved! This content is queued for publishing.
                  </div>
                )}
                {job.status === "rejected" && job.rejectionReason && (
                  <div className="mb-3 px-3 py-2 rounded-lg text-xs" style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)", color: "#DC2626" }}>
                    <strong>Rejected:</strong> {job.rejectionReason}. Please update your content and resubmit.
                  </div>
                )}

                {/* Platform results */}
                {job.platformResults && Object.keys(job.platformResults).length > 0 && (
                  <div className="mb-3 space-y-1">
                    {Object.entries(job.platformResults).map(([platform, result]) => (
                      <div key={platform} className="flex items-center gap-2 text-[10px]">
                        <span className="font-semibold capitalize">{platform}:</span>
                        {result.success ? (
                          <span style={{ color: "#16A34A" }}>
                            Published{result.postUrl ? " — " : ""}{result.postUrl && <a href={result.postUrl} target="_blank" rel="noreferrer" className="underline">View post</a>}
                          </span>
                        ) : (
                          <span style={{ color: "#C13A2A" }}>✗ {result.error}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  {job.status === "queued" && (
                    <>
                      <button onClick={() => submitForReview(job.id)}
                        disabled={actionLoading === job.id + "review"}
                        className="px-4 py-2 rounded-lg text-xs font-bold text-white hover:opacity-90 disabled:opacity-60 transition-all"
                        style={{ background: "linear-gradient(to right,#7C3AED,#4285C7)" }}>
                        {actionLoading === job.id + "review" ? "Submitting…" : "Submit for Review"}
                      </button>
                      <button onClick={() => publish(job.id)}
                        disabled={actionLoading === job.id}
                        className="px-4 py-2 rounded-lg text-xs font-bold text-white hover:opacity-90 disabled:opacity-60 transition-all"
                        style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }}>
                        {actionLoading === job.id ? "Publishing…" : "Publish Now"}
                      </button>
                      <button onClick={() => cancel(job.id)}
                        disabled={actionLoading === job.id + "cancel"}
                        className="px-4 py-2 rounded-lg text-xs font-semibold border hover:bg-gray-50 disabled:opacity-60 transition-all"
                        style={{ border: "1px solid rgba(0,0,0,0.1)", color: "#6B7280" }}>
                        Cancel
                      </button>
                    </>
                  )}
                  {job.status === "rejected" && (
                    <button onClick={() => submitForReview(job.id)}
                      disabled={actionLoading === job.id + "review"}
                      className="px-4 py-2 rounded-lg text-xs font-bold text-white hover:opacity-90 disabled:opacity-60"
                      style={{ background: "linear-gradient(to right,#7C3AED,#4285C7)" }}>
                      {actionLoading === job.id + "review" ? "Submitting…" : "Resubmit for Review"}
                    </button>
                  )}
                  {job.status === "failed" && (
                    <>
                      <button onClick={() => submitForReview(job.id)}
                        disabled={actionLoading === job.id + "review"}
                        className="px-4 py-2 rounded-lg text-xs font-bold text-white hover:opacity-90 disabled:opacity-60"
                        style={{ background: "linear-gradient(to right,#7C3AED,#4285C7)" }}>
                        {actionLoading === job.id + "review" ? "Submitting…" : "Resubmit"}
                      </button>
                      <button onClick={() => publish(job.id)}
                        disabled={actionLoading === job.id}
                        className="px-4 py-2 rounded-lg text-xs font-bold text-white hover:opacity-90 disabled:opacity-60"
                        style={{ background: "#D97706" }}>
                        Retry Direct
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
