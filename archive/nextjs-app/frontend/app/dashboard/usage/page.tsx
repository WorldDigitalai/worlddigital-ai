"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";

const TOKEN_COSTS = [
  { action: "AI Caption",         cost: 10,  icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" },
  { action: "AI Content Post",    cost: 15,  icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
  { action: "AI Image",           cost: 85,  icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { action: "8s Video (Runway)",  cost: 200, icon: "M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" },
  { action: "15s Video (Runway)", cost: 350, icon: "M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" },
  { action: "30s Video (Runway)", cost: 500, icon: "M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" },
  { action: "Blog Post",          cost: 50,  icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h6m-6-4h6" },
  { action: "Campaign Plan",      cost: 125, icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { action: "Publish / Platform", cost: 0,   icon: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8" },
];

function calcTokens(dollars: number): number {
  if (dollars < 10)  return Math.floor(dollars * 20);
  if (dollars < 25)  return Math.floor(dollars * 25);
  if (dollars < 50)  return Math.floor(dollars * 30);
  if (dollars < 100) return Math.floor(dollars * 35);
  if (dollars < 200) return Math.floor(dollars * 40);
  if (dollars < 350) return Math.floor(dollars * 45);
  return                    Math.floor(dollars * 50);
}

function getTier(dollars: number): { label: string; rate: number; color: string } {
  if (dollars < 10)  return { label: "Starter",       rate: 20, color: "#9CA3AF" };
  if (dollars < 25)  return { label: "Good Value",    rate: 25, color: "#4285C7" };
  if (dollars < 50)  return { label: "Great Value",   rate: 30, color: "#7C3AED" };
  if (dollars < 100) return { label: "Best Value",    rate: 35, color: "#059669" };
  if (dollars < 200) return { label: "Pro Value",     rate: 40, color: "#D97706" };
  if (dollars < 350) return { label: "Elite Value",   rate: 45, color: "#C13A2A" };
  return                     { label: "Maximum Value", rate: 50, color: "#C13A2A" };
}

function SpinIcon() {
  return (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function TokenSliderModal({ onClose }: { onClose: () => void }) {
  const [dollars, setDollars] = useState(50);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const tokens = calcTokens(dollars);
  const tier   = getTier(dollars);
  const tooLow = dollars < 1;

  const handleCheckout = async () => {
    setLoading(true);
    setErr(null);
    const res = await apiFetch<{ url: string }>("/v1/stripe/checkout-tokens", {
      method: "POST",
      body: { dollars },
    });
    if (res.ok && res.data?.url) {
      window.location.href = res.data.url;
    } else {
      setErr(res.error || "Checkout failed. Please try again.");
      setLoading(false);
    }
  };

  const trackPct = `${((dollars - 1) / 498) * 100}%`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-y-auto"
        style={{ background: "white", boxShadow: "0 30px 90px rgba(0,0,0,0.28)", maxHeight: "92dvh" }}
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(0,0,0,0.15)" }} />
        </div>

        {/* Header */}
        <div className="px-6 pt-4 sm:pt-6 pb-4 flex items-center justify-between border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
          <div>
            <h2 className="text-xl font-black" style={{ color: "#111827" }}>Buy Tokens</h2>
            <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>Drag the slider — more tokens per dollar as you spend more</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Dollar + tokens display */}
          <div className="text-center py-2">
            <p className="text-6xl font-black leading-tight" style={{ color: "#111827" }}>${dollars}</p>
            <div className="mt-3 inline-flex items-center gap-2 px-5 py-2 rounded-full" style={{ background: `${tier.color}18`, border: `1.5px solid ${tier.color}35` }}>
              <span className="text-xl font-black" style={{ color: tier.color }}>{tokens.toLocaleString()} tokens</span>
            </div>
            <p className="text-xs font-bold mt-2 uppercase tracking-wider" style={{ color: tier.color }}>{tier.label} · {tier.rate} tokens / dollar</p>
          </div>

          {/* Slider */}
          <div className="relative pt-1 pb-2">
            <div className="relative h-3 rounded-full" style={{ background: "rgba(0,0,0,0.07)" }}>
              <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: trackPct, background: `linear-gradient(90deg, #9CA3AF, ${tier.color})` }} />
            </div>
            <div
              className="absolute top-0 -translate-y-0 flex items-center justify-center text-[9px] font-black rounded-full shadow-lg pointer-events-none"
              style={{
                left: `calc(${trackPct} - 14px)`, top: "-4px",
                width: 30, height: 30,
                background: tier.color, color: "white",
                boxShadow: `0 4px 14px ${tier.color}55`,
              }}
            >
              ${dollars}
            </div>
            <input
              type="range" min={1} max={499} value={dollars}
              onChange={e => setDollars(Number(e.target.value))}
              className="absolute inset-0 w-full h-3 opacity-0 cursor-pointer"
              style={{ WebkitAppearance: "none" }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-bold -mt-2" style={{ color: "#9CA3AF" }}>
            <span>$1</span><span>$50</span><span>$100</span><span>$250</span><span>$499</span>
          </div>

          {/* Tier breakdown */}
          <div className="rounded-xl p-3 space-y-1.5" style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)" }}>
            <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: "#9CA3AF" }}>Purchase Tiers</p>
            {[
              { range: "$1–$9",    rate: 20 },
              { range: "$10–$24",  rate: 25 },
              { range: "$25–$49",  rate: 30 },
              { range: "$50–$99",  rate: 35 },
              { range: "$100–$199",rate: 40 },
              { range: "$200–$349",rate: 45 },
              { range: "$350–$499",rate: 50 },
            ].map(t => {
              const active = tier.rate === t.rate;
              return (
                <div key={t.range} className="flex items-center justify-between" style={{ opacity: active ? 1 : 0.45 }}>
                  <span className="text-[11px]" style={{ color: active ? "#111827" : "#9CA3AF", fontWeight: active ? 700 : 500 }}>{t.range}</span>
                  <span className="text-[11px] font-bold" style={{ color: active ? tier.color : "#9CA3AF" }}>{t.rate} tokens / $</span>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="rounded-2xl p-4" style={{ background: "rgba(66,133,199,0.04)", border: "1px solid rgba(66,133,199,0.1)" }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              {[
                { label: "Amount",   value: `$${dollars}`,                    color: "#111827" },
                { label: "Tokens",   value: tokens.toLocaleString(),           color: "#C13A2A" },
                { label: "Rate",     value: `${tier.rate} per dollar`,         color: "#16A34A" },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#9CA3AF" }}>{item.label}</p>
                  <p className="text-sm font-black" style={{ color: item.color }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {err && <p className="text-center text-sm" style={{ color: "#C13A2A" }}>{err}</p>}

          <button
            onClick={handleCheckout}
            disabled={tooLow || loading}
            className="w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
            style={{ background: "#C13A2A", fontSize: 15 }}
          >
            {loading ? <><SpinIcon /> Processing…</> : `Get ${tokens.toLocaleString()} Tokens for $${dollars}`}
          </button>
          <p className="text-center text-[11px]" style={{ color: "#9CA3AF" }}>Powered by Stripe · Secure checkout · Tokens added instantly on payment</p>
        </div>
      </div>
    </div>
  );

}

interface Transaction {
  action: string;
  tokensChange: number;
  balanceBefore: number;
  balanceAfter: number;
  note?: string;
  timestamp: string;
}

interface BalanceData { balance: number; monthlyUsed: number; }

const ACTION_LABELS: Record<string, string> = {
  signup_bonus:        "Welcome Bonus",
  token_purchase:      "Token Purchase",
  subscription_grant:  "Subscription Allocation",
  caption:             "AI Caption",
  content:             "AI Content",
  image:               "AI Image",
  video_8s:            "AI Video (8s)",
  video_15s:           "AI Video (15s)",
  video_30s:           "AI Video (30s)",
  blog:                "Blog Post",
  campaign:            "Campaign Plan",
  publish:             "Platform Publish",
  admin_add:           "Bonus Credit",
  admin_remove:        "Credit Adjustment",
  admin_override:      "Balance Update",
};

export default function UsagePage() {
  const [balanceData, setBalanceData]   = useState<BalanceData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [successMsg, setSuccessMsg]     = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [balRes, txRes] = await Promise.all([
      apiFetch<BalanceData>("/v1/tokens/balance"),
      apiFetch<{ transactions: Transaction[] }>("/v1/tokens/transactions?limit=50"),
    ]);
    if (balRes.ok) setBalanceData(balRes.data);
    if (txRes.ok)  setTransactions(txRes.data.transactions ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      if (p.get("tokens") === "success") {
        const amount = p.get("amount");
        setSuccessMsg(`${Number(amount).toLocaleString()} tokens added to your account!`);
        window.history.replaceState({}, "", "/dashboard/usage");
        setTimeout(() => setSuccessMsg(null), 6000);
      }
    }
  }, [loadData]);

  const balance      = balanceData?.balance ?? 0;
  const monthlyUsed  = balanceData?.monthlyUsed ?? 0;
  const totalSeen    = balance + monthlyUsed;
  const progressPct  = totalSeen > 0 ? Math.round((balance / totalSeen) * 100) : 100;
  const isLow        = !loading && balance < 20;

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <svg className="w-7 h-7 animate-spin" style={{ color: "#C13A2A" }} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );

  return (
    <>
      {showModal && <TokenSliderModal onClose={() => { setShowModal(false); loadData(); }} />}

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black" style={{ color: "#111827" }}>Usage & Credits</h1>
            <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Token balance, history, and purchase options</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-2 hover:opacity-90 transition-opacity"
            style={{ background: "#C13A2A" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            Buy More Tokens
          </button>
        </div>

        {/* Purchase success banner */}
        {successMsg && (
          <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: "rgba(22,163,74,0.07)", border: "1px solid rgba(22,163,74,0.2)" }}>
            <svg className="w-5 h-5 flex-shrink-0" style={{ color: "#16A34A" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <p className="text-sm font-semibold" style={{ color: "#15803D" }}>Payment successful! {successMsg}</p>
          </div>
        )}

        {/* Low balance warning */}
        {isLow && !successMsg && (
          <div className="rounded-xl px-4 py-3 flex items-center justify-between gap-4" style={{ background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.2)" }}>
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" style={{ color: "#D97706" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              <p className="text-sm font-semibold" style={{ color: "#92400E" }}>
                Low balance — only {balance} tokens left. Add more to keep generating.
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold text-white"
              style={{ background: "#D97706" }}
            >
              Buy Now
            </button>
          </div>
        )}

        {/* Balance hero */}
        <div className="rounded-2xl p-6" style={{ background: "white", border: "1.5px solid rgba(0,0,0,0.07)", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
          <div className="flex items-start justify-between gap-6 mb-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#9CA3AF" }}>Current Balance</p>
              <p className="text-5xl font-black leading-none" style={{ color: isLow ? "#C13A2A" : "#111827" }}>
                {balance.toLocaleString()}
              </p>
              <p className="text-sm mt-1.5" style={{ color: "#6B7280" }}>tokens available</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#9CA3AF" }}>Used This Month</p>
              <p className="text-3xl font-black" style={{ color: "#374151" }}>{monthlyUsed.toLocaleString()}</p>
              <p className="text-sm mt-1.5" style={{ color: "#6B7280" }}>tokens spent</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]" style={{ color: "#9CA3AF" }}>
              <span>Balance remaining</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%`, background: isLow ? "#C13A2A" : balance < 50 ? "#D97706" : "#16A34A" }}
              />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
            <button
              onClick={() => setShowModal(true)}
              className="w-full py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90"
              style={{ background: "rgba(193,58,42,0.06)", color: "#C13A2A", border: "1px solid rgba(193,58,42,0.15)" }}
            >
              + Buy More Tokens
            </button>
          </div>
        </div>

        {/* Token costs reference */}
        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
          <p className="text-sm font-black mb-4" style={{ color: "#111827" }}>Token Costs per Action</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {TOKEN_COSTS.map(c => (
              <div key={c.action} className="rounded-xl p-3 flex items-center gap-2.5" style={{ background: "rgba(0,0,0,0.025)", border: "1px solid rgba(0,0,0,0.05)" }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(193,58,42,0.08)" }}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="#C13A2A" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={c.icon} />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-semibold leading-tight" style={{ color: "#374151" }}>{c.action}</p>
                  <p className="text-sm font-black" style={{ color: c.cost === 0 ? "#16A34A" : "#C13A2A" }}>
                    {c.cost === 0 ? "Free" : `${c.cost} token${c.cost !== 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction history */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
            <p className="text-sm font-black" style={{ color: "#111827" }}>Transaction History</p>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(0,0,0,0.05)", color: "#6B7280" }}>
              {transactions.length} records
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="px-5 py-12 text-center space-y-2">
              <svg className="w-10 h-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="#D1D5DB" strokeWidth={1.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-semibold" style={{ color: "#9CA3AF" }}>No transactions yet</p>
              <p className="text-xs" style={{ color: "#9CA3AF" }}>Start using AI tools to see your usage history here</p>
            </div>
          ) : (
            <div>
              {transactions.map((tx, i) => {
                const isDebit = tx.tokensChange < 0;
                const date    = new Date(tx.timestamp);
                return (
                  <div key={i} className="px-5 py-3.5 flex items-center justify-between gap-4 border-b last:border-0" style={{ borderColor: "rgba(0,0,0,0.04)" }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: isDebit ? "rgba(193,58,42,0.08)" : "rgba(22,163,74,0.08)" }}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke={isDebit ? "#C13A2A" : "#16A34A"} strokeWidth={2.5}>
                          {isDebit
                            ? <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4"/>
                            : <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                          }
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: "#111827" }}>
                          {ACTION_LABELS[tx.action] ?? tx.action.replace(/_/g, " ")}
                        </p>
                        {tx.note && tx.note !== tx.action && (
                          <p className="text-[11px] truncate" style={{ color: "#9CA3AF" }}>{tx.note}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-black" style={{ color: isDebit ? "#C13A2A" : "#16A34A" }}>
                        {isDebit ? "" : "+"}{tx.tokensChange.toLocaleString()}
                      </p>
                      <p className="text-[10px]" style={{ color: "#9CA3AF" }}>
                        {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · bal: {tx.balanceAfter.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info card */}
        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
          <p className="text-sm font-black mb-3" style={{ color: "#111827" }}>How Tokens Work</p>
          <ul className="space-y-2 text-xs" style={{ color: "#6B7280" }}>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#C13A2A", marginTop: 5 }} />
              <span>Every new account gets <strong>30 free tokens</strong> as a welcome bonus — no credit card needed (enough for 3 captions or 1 image)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#C13A2A", marginTop: 5 }} />
              <span>Tokens are deducted before generation starts — if you run out, a prompt to buy more will appear</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#C13A2A", marginTop: 5 }} />
              <span>Platform subscriptions include monthly token allocations that auto-renew with your plan</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#C13A2A", marginTop: 5 }} />
              <span>Purchased tokens never expire — they roll over indefinitely</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#C13A2A", marginTop: 5 }} />
              <span>Failed generations do not deduct tokens — you only pay for successful outputs</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#C13A2A", marginTop: 5 }} />
              <span>Publishing to platforms is always <strong>free</strong> — 0 tokens</span>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
