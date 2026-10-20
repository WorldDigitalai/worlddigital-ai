"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdminAuth } from "../layout";

interface CareerApplication {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  experience: string;
  message: string;
  linkedInUrl?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
  coverLetterUrl?: string;
  emailSent: boolean;
  emailError?: string;
  status: string;
  createdAt: string;
}

interface ApiResponse {
  applications: CareerApplication[];
  total: number;
  page: number;
  pages: number;
}

export default function AdminCareersPage() {
  const { token } = useAdminAuth();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<CareerApplication | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Career test email state
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const load = useCallback(async (p = 1) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/career/applications?page=${p}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ApiResponse = await res.json();
      setData(json);
      setPage(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(1); }, [load]);

  const deleteApp = async (id: string) => {
    if (!token || !confirm("Delete this application permanently?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/v1/admin/career/applications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSelected(null);
      load(page);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  const sendTestEmail = async () => {
    if (!token) return;
    setTestSending(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/v1/admin/integrations/send-career-test-email", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const json = await res.json();
      setTestResult({ ok: res.ok, message: json.message || (res.ok ? "Test sent!" : "Failed") });
    } catch {
      setTestResult({ ok: false, message: "Network error" });
    } finally {
      setTestSending(false);
    }
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Career Applications</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {data ? `${data.total} total application${data.total !== 1 ? "s" : ""}` : "Loading…"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {testResult && (
            <span
              className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{
                background: testResult.ok ? "rgba(5,150,105,0.1)" : "rgba(239,68,68,0.1)",
                color: testResult.ok ? "#059669" : "#DC2626",
              }}
            >
              {testResult.message}
            </span>
          )}
          <button
            onClick={sendTestEmail}
            disabled={testSending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }}
          >
            {testSending ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
            Send Career Test Email
          </button>
          <button
            onClick={() => load(page)}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div
        className="rounded-xl px-4 py-3 text-sm flex items-start gap-3"
        style={{ background: "rgba(66,133,199,0.08)", border: "1px solid rgba(66,133,199,0.2)" }}
      >
        <svg className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-blue-800">
          All career applications are delivered to <strong>support@worlddigital.ai</strong>.
          The &quot;Email Sent&quot; column shows whether the notification was delivered via SendGrid.
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl px-4 py-3 text-sm text-red-700" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          {error}
        </div>
      )}

      {/* Table */}
      {loading && !data ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data?.applications.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <svg className="w-12 h-12 mx-auto mb-4 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm font-medium">No applications yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Applicant</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Position</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Experience</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Email Sent</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Submitted</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.applications.map(app => (
                  <tr key={app._id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSelected(app)}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{app.firstName} {app.lastName}</div>
                      <div className="text-xs text-slate-400">{app.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{app.position}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{app.experience}</td>
                    <td className="px-4 py-3">
                      {app.emailSent ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Sent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full" title={app.emailError || "Email not sent"}>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{fmt(app.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={e => { e.stopPropagation(); deleteApp(app._id); }}
                        disabled={deleting === app._id}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50 px-2 py-1"
                      >
                        {deleting === app._id ? "…" : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <p className="text-xs text-slate-500">Page {data.page} of {data.pages} · {data.total} total</p>
              <div className="flex gap-2">
                <button
                  onClick={() => load(page - 1)}
                  disabled={page <= 1 || loading}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => load(page + 1)}
                  disabled={page >= data.pages || loading}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail drawer / modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setSelected(null)}>
          <div
            className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800">{selected.firstName} {selected.lastName}</h3>
                <p className="text-sm text-slate-500 mt-0.5">{selected.position}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <Field label="Email" value={<a href={`mailto:${selected.email}`} className="text-blue-600 hover:underline">{selected.email}</a>} />
                {selected.phone && <Field label="Phone" value={selected.phone} />}
                <Field label="Experience" value={selected.experience} />
                <Field label="Submitted" value={fmt(selected.createdAt)} />
                <Field
                  label="Email Notification"
                  value={
                    selected.emailSent
                      ? <span className="text-emerald-600 font-medium">Sent ✓</span>
                      : <span className="text-red-500 font-medium">Failed</span>
                  }
                />
              </div>

              {selected.emailError && (
                <div className="rounded-lg px-3 py-2 text-xs text-red-700" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <strong>Email error:</strong> {selected.emailError}
                </div>
              )}

              {selected.linkedInUrl && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">LinkedIn</p>
                  <a href={selected.linkedInUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">{selected.linkedInUrl}</a>
                </div>
              )}

              {selected.portfolioUrl && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">Portfolio</p>
                  <a href={selected.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">{selected.portfolioUrl}</a>
                </div>
              )}

              {selected.resumeUrl && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">Resume</p>
                  <a href={selected.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">Download Resume</a>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">Message</p>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 rounded-xl p-4">{selected.message}</p>
              </div>

              <button
                onClick={() => deleteApp(selected._id)}
                disabled={deleting === selected._id}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {deleting === selected._id ? "Deleting…" : "Delete Application"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 mb-0.5">{label}</p>
      <p className="text-sm text-slate-800">{value}</p>
    </div>
  );
}
