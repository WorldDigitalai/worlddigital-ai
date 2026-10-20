"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdminAuth } from "../layout";

interface UserRow {
  userId: string;
  email: string;
  name: string;
  balance: number;
  updatedAt: string;
}

interface TxRow {
  action: string;
  tokensChange: number;
  balanceBefore: number;
  balanceAfter: number;
  note?: string;
  timestamp: string;
}

interface UserDetail {
  userId: string;
  email: string;
  name: string;
  balance: number;
  monthlyUsed: number;
  transactions: TxRow[];
}

interface Analytics {
  totalConsumed: number;
  totalAdded: number;
  totalRevenue: number;
  byAction: Array<{ action: string; total: number; count: number }>;
}

const TX_LABELS: Record<string, string> = {
  signup_bonus:       "Welcome Bonus",
  token_purchase:     "Token Purchase",
  subscription_grant: "Subscription Grant",
  caption:            "AI Caption",
  content:            "AI Content",
  image:              "AI Image",
  video_8s:           "AI Video (8s)",
  video_15s:          "AI Video (15s)",
  video_30s:          "AI Video (30s)",
  blog:               "Blog Post",
  campaign:           "Campaign Plan",
  publish:            "Platform Publish",
  admin_add:          "Admin Credit",
  admin_remove:       "Admin Deduction",
  admin_override:     "Admin Override",
};

function Spinner() {
  return (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function AdminTokensPage() {
  const { token } = useAdminAuth();

  const [analytics, setAnalytics]     = useState<Analytics | null>(null);
  const [analyticsLoading, setAlLoad] = useState(true);
  const [period, setPeriod]           = useState<"day" | "week" | "month">("month");

  const [search, setSearch]           = useState("");
  const [users, setUsers]             = useState<UserRow[]>([]);
  const [usersLoading, setULoad]      = useState(false);

  const [selected, setSelected]       = useState<UserDetail | null>(null);
  const [detailLoading, setDLoad]     = useState(false);

  const [adjustAmt, setAdjustAmt]     = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjusting, setAdjusting]     = useState(false);
  const [adjustMode, setAdjustMode]   = useState<"add" | "remove" | "override">("add");

  const [actionMsg, setActionMsg]     = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const adminFetch = useCallback(async (url: string, opts?: RequestInit) => {
    return fetch(url, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        ...(opts?.headers ?? {}),
      },
    });
  }, [token]);

  const loadAnalytics = useCallback(async () => {
    setAlLoad(true);
    const res = await adminFetch(`/api/v1/admin/tokens/analytics?period=${period}`);
    if (res.ok) setAnalytics(await res.json());
    setAlLoad(false);
  }, [adminFetch, period]);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  const searchUsers = useCallback(async (q: string) => {
    setULoad(true);
    const res = await adminFetch(`/api/v1/admin/tokens/users?search=${encodeURIComponent(q)}`);
    if (res.ok) {
      const d = await res.json();
      setUsers(d.users ?? []);
    }
    setULoad(false);
  }, [adminFetch]);

  useEffect(() => {
    const t = setTimeout(() => searchUsers(search), 350);
    return () => clearTimeout(t);
  }, [search, searchUsers]);

  useEffect(() => { searchUsers(""); }, [searchUsers]);

  const selectUser = useCallback(async (userId: string) => {
    setDLoad(true);
    setSelected(null);
    setActionMsg(null);
    setAdjustAmt("");
    setAdjustReason("");
    const res = await adminFetch(`/api/v1/admin/tokens/user/${userId}`);
    if (res.ok) setSelected(await res.json());
    setDLoad(false);
  }, [adminFetch]);

  const handleAdjust = async () => {
    if (!selected) return;
    const amount = Number(adjustAmt);
    if (!amount || isNaN(amount)) {
      setActionMsg({ type: "err", text: "Enter a valid number" });
      return;
    }

    setAdjusting(true);
    setActionMsg(null);

    try {
      let res: Response;

      if (adjustMode === "override") {
        res = await adminFetch("/api/v1/admin/tokens/set-balance", {
          method: "POST",
          body: JSON.stringify({ userId: selected.userId, balance: amount, reason: adjustReason || "Admin balance override" }),
        });
      } else {
        const delta = adjustMode === "remove" ? -Math.abs(amount) : Math.abs(amount);
        res = await adminFetch("/api/v1/admin/tokens/adjust", {
          method: "POST",
          body: JSON.stringify({ userId: selected.userId, amount: delta, reason: adjustReason || (adjustMode === "add" ? "Admin credit" : "Admin deduction") }),
        });
      }

      if (res.ok) {
        const d = await res.json();
        setActionMsg({ type: "ok", text: `Done — new balance: ${d.balance.toLocaleString()} tokens` });
        setAdjustAmt("");
        setAdjustReason("");
        await selectUser(selected.userId);
        await loadAnalytics();
      } else {
        const d = await res.json();
        setActionMsg({ type: "err", text: d.message || "Action failed" });
      }
    } catch {
      setActionMsg({ type: "err", text: "Network error" });
    }

    setAdjusting(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-black text-slate-900">Token Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">Search users, adjust balances, and view token analytics</p>
      </div>

      {/* ── Analytics Dashboard ───────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #E2E8F0" }}>
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-800">Platform Overview</p>
          <div className="flex gap-1">
            {(["day", "week", "month"] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: period === p ? "#4285C7" : "rgba(0,0,0,0.04)",
                  color: period === p ? "white" : "#64748B",
                }}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {analyticsLoading ? (
          <div className="flex items-center justify-center py-10 text-slate-400"><Spinner /></div>
        ) : analytics ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-x divide-slate-100">
            {[
              { label: "Revenue Generated",  value: `$${analytics.totalRevenue.toFixed(2)}`,       color: "#16A34A" },
              { label: "Tokens Sold",        value: analytics.totalAdded.toLocaleString(),           color: "#4285C7" },
              { label: "Tokens Consumed",    value: analytics.totalConsumed.toLocaleString(),        color: "#C13A2A" },
              { label: "Top Action",         value: analytics.byAction[0]?.action?.replace(/_/g," ") || "—", color: "#7C3AED" },
            ].map(s => (
              <div key={s.label} className="px-5 py-5 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{s.label}</p>
                <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-8">Failed to load analytics</p>
        )}

        {analytics && analytics.byAction.length > 0 && (
          <div className="px-5 pb-5 pt-2 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Consumption by Action</p>
            <div className="space-y-1.5">
              {analytics.byAction.map(a => {
                const pct = analytics.totalConsumed > 0 ? Math.round((a.total / analytics.totalConsumed) * 100) : 0;
                return (
                  <div key={a.action} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-36 truncate shrink-0">{TX_LABELS[a.action] ?? a.action}</span>
                    <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#4285C7" }} />
                    </div>
                    <span className="text-xs font-bold text-slate-600 w-20 text-right shrink-0">{a.total.toLocaleString()} ({a.count}x)</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── User Search + Detail ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Left: search + user list */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden flex flex-col" style={{ background: "white", border: "1px solid #E2E8F0" }}>
          <div className="px-4 py-4 border-b border-slate-100">
            <p className="text-sm font-bold text-slate-800 mb-3">Users</p>
            <div className="relative">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name or email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto" style={{ maxHeight: 520 }}>
            {usersLoading ? (
              <div className="flex items-center justify-center py-10 text-slate-400"><Spinner /></div>
            ) : users.length === 0 ? (
              <div className="text-center py-10 text-sm text-slate-400">No users found</div>
            ) : (
              users.map(u => (
                <button
                  key={u.userId}
                  onClick={() => selectUser(u.userId)}
                  className="w-full px-4 py-3 text-left border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                  style={{ background: selected?.userId === u.userId ? "rgba(66,133,199,0.06)" : undefined }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{u.name || "—"}</p>
                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                  </div>
                  <span className="text-sm font-black shrink-0" style={{ color: u.balance < 10 ? "#C13A2A" : "#16A34A" }}>
                    {u.balance.toLocaleString()}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: user detail */}
        <div className="lg:col-span-3 space-y-4">
          {detailLoading && (
            <div className="rounded-2xl flex items-center justify-center py-20 text-slate-400" style={{ background: "white", border: "1px solid #E2E8F0" }}>
              <Spinner />
            </div>
          )}

          {!detailLoading && !selected && (
            <div className="rounded-2xl flex flex-col items-center justify-center py-16 gap-2" style={{ background: "white", border: "1px solid #E2E8F0" }}>
              <svg className="w-10 h-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm text-slate-400 font-medium">Select a user to manage their tokens</p>
            </div>
          )}

          {!detailLoading && selected && (
            <>
              {/* User header card */}
              <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E2E8F0" }}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-base font-black text-slate-900">{selected.name}</p>
                    <p className="text-xs text-slate-400">{selected.email}</p>
                    <p className="text-[10px] text-slate-300 mt-0.5 font-mono">{selected.userId}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-3xl font-black" style={{ color: selected.balance < 10 ? "#C13A2A" : "#111827" }}>
                      {selected.balance.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400">tokens</p>
                    <p className="text-[10px] text-slate-300 mt-0.5">{selected.monthlyUsed.toLocaleString()} used this month</p>
                  </div>
                </div>

                {/* Adjust form */}
                <div className="rounded-xl p-4 space-y-3" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Adjust Tokens</p>

                  {/* Mode tabs */}
                  <div className="flex gap-1">
                    {(["add", "remove", "override"] as const).map(m => (
                      <button
                        key={m}
                        onClick={() => setAdjustMode(m)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                        style={{
                          background: adjustMode === m
                            ? m === "add" ? "#16A34A" : m === "remove" ? "#C13A2A" : "#7C3AED"
                            : "white",
                          color: adjustMode === m ? "white" : "#94A3B8",
                          border: "1px solid #E2E8F0",
                        }}
                      >
                        {m === "add" ? "Add" : m === "remove" ? "Remove" : "Set to"}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={0}
                      placeholder={adjustMode === "override" ? `Set balance to…` : `Amount of tokens…`}
                      value={adjustAmt}
                      onChange={e => setAdjustAmt(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: "white", border: "1px solid #E2E8F0" }}
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Reason (e.g. Customer support credit, Refund, Bonus)"
                    value={adjustReason}
                    onChange={e => setAdjustReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: "white", border: "1px solid #E2E8F0" }}
                  />

                  {actionMsg && (
                    <p className="text-xs font-semibold px-3 py-2 rounded-lg"
                      style={{
                        color: actionMsg.type === "ok" ? "#15803D" : "#B91C1C",
                        background: actionMsg.type === "ok" ? "rgba(22,163,74,0.08)" : "rgba(239,68,68,0.08)",
                      }}
                    >
                      {actionMsg.text}
                    </p>
                  )}

                  <button
                    onClick={handleAdjust}
                    disabled={adjusting || !adjustAmt}
                    className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-40"
                    style={{
                      background: adjustMode === "add" ? "#16A34A" : adjustMode === "remove" ? "#C13A2A" : "#7C3AED"
                    }}
                  >
                    {adjusting ? <Spinner /> : null}
                    {adjustMode === "add"
                      ? `Add ${adjustAmt ? Number(adjustAmt).toLocaleString() : "?"} tokens`
                      : adjustMode === "remove"
                      ? `Remove ${adjustAmt ? Number(adjustAmt).toLocaleString() : "?"} tokens`
                      : `Set balance to ${adjustAmt ? Number(adjustAmt).toLocaleString() : "?"}`}
                  </button>
                </div>
              </div>

              {/* Transaction history */}
              <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #E2E8F0" }}>
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-800">Transaction History</p>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-500">
                    {selected.transactions.length} records
                  </span>
                </div>
                <div style={{ maxHeight: 380, overflowY: "auto" }}>
                  {selected.transactions.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8">No transactions yet</p>
                  ) : selected.transactions.map((tx, i) => {
                    const isDebit = tx.tokensChange < 0;
                    const d = new Date(tx.timestamp);
                    return (
                      <div key={i} className="px-5 py-3 flex items-center justify-between gap-3 border-b border-slate-50 last:border-0">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: isDebit ? "rgba(193,58,42,0.08)" : "rgba(22,163,74,0.08)" }}>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24"
                              stroke={isDebit ? "#C13A2A" : "#16A34A"} strokeWidth={2.5}>
                              {isDebit
                                ? <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4"/>
                                : <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>}
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-700 truncate">
                              {TX_LABELS[tx.action] ?? tx.action.replace(/_/g, " ")}
                            </p>
                            {tx.note && tx.note !== tx.action && (
                              <p className="text-[11px] text-slate-400 truncate">{tx.note}</p>
                            )}
                            <p className="text-[10px] text-slate-300">
                              {d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · {d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-black" style={{ color: isDebit ? "#C13A2A" : "#16A34A" }}>
                            {isDebit ? "" : "+"}{tx.tokensChange.toLocaleString()}
                          </p>
                          <p className="text-[10px] text-slate-300">bal: {tx.balanceAfter.toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
