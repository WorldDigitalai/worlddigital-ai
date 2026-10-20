"use client";

import { useState, useCallback } from "react";

interface SecretResult {
  name: string;
  service: string;
  exists: boolean;
  format_valid: boolean;
  live_test: "pass" | "fail" | "skipped" | "untestable";
  error: string | null;
  fix?: string;
}

interface HealthReport {
  overall_status: "pass" | "fail";
  checked_at: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    untestable: number;
    missing: number;
  };
  results: SecretResult[];
}

function StatusBadge({ result }: { result: SecretResult }) {
  if (!result.exists) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
        <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
        MISSING
      </span>
    );
  }
  if (!result.format_valid) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
        <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
        BAD FORMAT
      </span>
    );
  }
  if (result.live_test === "pass") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        PASS
      </span>
    );
  }
  if (result.live_test === "fail") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
        <span className="h-1.5 w-1.5 rounded-full bg-[#C93434]" />
        FAIL
      </span>
    );
  }
  if (result.live_test === "untestable") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
        <span className="h-1.5 w-1.5 rounded-full bg-[#1D7FE8]" />
        CONFIGURED
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-700">
      <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
      SKIPPED
    </span>
  );
}

function rowClass(result: SecretResult): string {
  if (!result.exists || result.live_test === "fail" || !result.format_valid) return "bg-red-50";
  if (result.live_test === "pass") return "bg-green-50";
  return "bg-white";
}

export default function SecretHealthPage() {
  const [token, setToken] = useState("");
  const [report, setReport] = useState<HealthReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "fail" | "pass" | "missing">("all");

  const runCheck = useCallback(async () => {
    if (!token.trim()) {
      setError("Please enter your ADMIN_HEALTH_TOKEN.");
      return;
    }
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const resp = await fetch(`/api/health/secrets?token=${encodeURIComponent(token.trim())}`);
      const data = await resp.json() as HealthReport | { error: string };
      if (!resp.ok) {
        setError(("error" in data ? data.error : null) ?? `HTTP ${resp.status}`);
      } else {
        setReport(data as HealthReport);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const filtered = report?.results.filter((r) => {
    if (filter === "fail") return !r.exists || r.live_test === "fail" || !r.format_valid;
    if (filter === "pass") return r.live_test === "pass";
    if (filter === "missing") return !r.exists;
    return true;
  }) ?? [];

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="rounded-lg bg-[#C93434] p-2">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Secrets Health Dashboard</h1>
              <p className="text-sm text-gray-500">WorldDigital.ai — Admin Only</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Tests every API key and secret. No values are displayed — only pass/fail status and fix instructions.
          </p>
        </div>

        {/* Token input */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Admin Health Token
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Set <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">ADMIN_HEALTH_TOKEN</code> in your Replit Secrets tab, then paste it here. It is never sent to any third party.
          </p>
          <div className="flex gap-3">
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runCheck()}
              placeholder="Paste your ADMIN_HEALTH_TOKEN here"
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#1D7FE8] focus:outline-none focus:ring-2 focus:ring-[#1D7FE8]/20"
            />
            <button
              onClick={runCheck}
              disabled={loading}
              className="rounded-lg bg-[#C93434] px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Running…" : "Run Full Check"}
            </button>
          </div>
          {error && (
            <p className="mt-3 rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="rounded-xl border border-gray-200 bg-white p-12 shadow-sm text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#1D7FE8]" />
            <p className="text-sm text-gray-600">Testing all services — this may take 15–30 seconds…</p>
          </div>
        )}

        {/* Results */}
        {report && !loading && (
          <>
            {/* Summary cards */}
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 lg:grid-cols-5">
              {[
                { label: "Total", value: report.summary.total, color: "text-gray-700", bg: "bg-gray-100" },
                { label: "Passed", value: report.summary.passed, color: "text-green-700", bg: "bg-green-100" },
                { label: "Failed", value: report.summary.failed, color: "text-red-700", bg: "bg-red-100" },
                { label: "Missing", value: report.summary.missing, color: "text-orange-700", bg: "bg-orange-100" },
                { label: "Configured", value: report.summary.untestable, color: "text-blue-700", bg: "bg-blue-100" },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl ${s.bg} p-4 text-center`}>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className={`text-xs font-medium ${s.color} mt-0.5`}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Overall status banner */}
            <div className={`mb-6 rounded-xl border px-6 py-4 flex items-center gap-3 ${report.overall_status === "pass" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
              <span className={`text-2xl`}>{report.overall_status === "pass" ? "✅" : "❌"}</span>
              <div>
                <p className={`font-semibold ${report.overall_status === "pass" ? "text-green-800" : "text-red-800"}`}>
                  {report.overall_status === "pass" ? "All live tests passed" : "Some services have issues — see table below"}
                </p>
                <p className="text-xs text-gray-500">Checked at {new Date(report.checked_at).toLocaleString()}</p>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="mb-4 flex gap-2 flex-wrap">
              {(["all", "fail", "missing", "pass"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${filter === f ? "bg-[#1D7FE8] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                >
                  {f === "all" ? "All secrets" : f === "fail" ? "Issues only" : f === "missing" ? "Missing" : "Passing"}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="scroll-x">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                    <th className="px-4 py-3 text-left">Secret Name</th>
                    <th className="px-4 py-3 text-left">Service</th>
                    <th className="px-4 py-3 text-center">Exists</th>
                    <th className="px-4 py-3 text-center">Format</th>
                    <th className="px-4 py-3 text-center">Live Test</th>
                    <th className="px-4 py-3 text-left">Error / Fix</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">
                        No secrets match this filter.
                      </td>
                    </tr>
                  )}
                  {filtered.map((r) => (
                    <tr key={r.name} className={`${rowClass(r)} hover:brightness-95 transition-all`}>
                      <td className="px-4 py-3 font-mono font-semibold text-gray-800 text-xs">{r.name}</td>
                      <td className="px-4 py-3 text-gray-600">{r.service}</td>
                      <td className="px-4 py-3 text-center">
                        {r.exists
                          ? <span className="text-green-600 font-bold">✓</span>
                          : <span className="text-red-600 font-bold">✗</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {!r.exists
                          ? <span className="text-gray-400">—</span>
                          : r.format_valid
                            ? <span className="text-green-600 font-bold">✓</span>
                            : <span className="text-orange-600 font-bold">✗</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge result={r} />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 max-w-xs">
                        {r.error && <span className="text-red-700 block">{r.error}</span>}
                        {r.fix && <span className="text-blue-700 block mt-0.5">Fix: {r.fix}</span>}
                        {!r.error && !r.fix && <span className="text-gray-400">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-gray-400">
              Secret values are never displayed. This page is for admin use only.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
