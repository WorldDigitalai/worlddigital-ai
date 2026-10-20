"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "../layout";

interface RevenueData {
  totalCustomers: number;
  activeSubscribers: number;
  pausedSubscribers: number;
  cancelledSubscribers: number;
  freeUsers: number;
  mrr: number;
  totalRevenue: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  churnRate: number;
  topPlans: Array<{ plan: string; count: number }>;
  revenueTrend: Array<{ month: string; revenue: number }>;
  totalInvoices: number;
}

function Card({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E2E8F0" }}>
      <p className="text-2xl font-black" style={{ color: color || "#0F172A" }}>{value}</p>
      <p className="text-sm mt-1" style={{ color: "#64748B" }}>{label}</p>
      {sub && <p className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>{sub}</p>}
    </div>
  );
}

function Badge({ status }: { status: string }) {
  const m: Record<string, { bg: string; text: string }> = {
    active: { bg: "rgba(22,163,74,0.1)", text: "#16A34A" },
    paused: { bg: "rgba(234,179,8,0.1)", text: "#CA8A04" },
    cancelled: { bg: "rgba(239,68,68,0.1)", text: "#DC2626" },
    none: { bg: "rgba(100,116,139,0.1)", text: "#64748B" },
  };
  const c = m[status] || m.none;
  return <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: c.bg, color: c.text }}>{status || "none"}</span>;
}

export default function RevenuePage() {
  const { token } = useAdminAuth();
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch("/api/v1/admin/revenue", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="max-w-6xl space-y-6">
        <h2 className="text-2xl font-black" style={{ color: "#0F172A" }}>Revenue Dashboard</h2>
        <div className="flex justify-center h-40 items-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-6xl">
        <h2 className="text-2xl font-black" style={{ color: "#0F172A" }}>Revenue Dashboard</h2>
        <p className="text-sm mt-2" style={{ color: "#94A3B8" }}>Failed to load revenue data</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h2 className="text-2xl font-black" style={{ color: "#0F172A" }}>Revenue Dashboard</h2>
        <p className="text-sm mt-1" style={{ color: "#64748B" }}>Real-time subscription analytics and revenue metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card label="Total Customers" value={data.totalCustomers.toLocaleString()} />
        <Card label="Active Subscribers" value={data.activeSubscribers.toLocaleString()} color="#16A34A" />
        <Card label="MRR (estimated)" value={`$${data.mrr.toLocaleString()}`} sub="Based on active plans" color="#4285C7" />
        <Card label="Total Revenue" value={`$${data.totalRevenue.toLocaleString()}`} sub={`${data.totalInvoices} invoices`} color="#7C3AED" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card label="This Month" value={`$${data.thisMonthRevenue.toLocaleString()}`} color="#059669" />
        <Card label="Last Month" value={`$${data.lastMonthRevenue.toLocaleString()}`} color="#64748B" />
        <Card label="Churn Rate" value={`${data.churnRate}%`} sub={`${data.cancelledSubscribers} cancelled`} color={data.churnRate > 10 ? "#C13A2A" : "#D97706"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Customer breakdown */}
        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E2E8F0" }}>
          <h3 className="font-bold text-sm mb-4" style={{ color: "#0F172A" }}>Customer Breakdown</h3>
          <div className="space-y-3">
            {[
              { label: "Active", count: data.activeSubscribers, color: "#16A34A", bg: "rgba(22,163,74,0.15)" },
              { label: "Paused", count: data.pausedSubscribers, color: "#D97706", bg: "rgba(217,119,6,0.15)" },
              { label: "Cancelled", count: data.cancelledSubscribers, color: "#C13A2A", bg: "rgba(193,58,42,0.15)" },
              { label: "Free", count: data.freeUsers, color: "#64748B", bg: "rgba(100,116,139,0.15)" },
            ].map(s => {
              const pct = data.totalCustomers > 0 ? Math.round((s.count / data.totalCustomers) * 100) : 0;
              return (
                <div key={s.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: "#374151" }}>{s.label}</span>
                    <span className="font-bold" style={{ color: s.color }}>{s.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: "#F1F5F9" }}>
                    <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: s.bg }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top plans */}
        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E2E8F0" }}>
          <h3 className="font-bold text-sm mb-4" style={{ color: "#0F172A" }}>Top Plans</h3>
          {data.topPlans.length === 0 ? (
            <p className="text-sm" style={{ color: "#94A3B8" }}>No subscription data yet</p>
          ) : (
            <div className="space-y-3">
              {data.topPlans.map(p => (
                <div key={p.plan} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: "#4285C7" }} />
                    <span className="text-sm font-medium" style={{ color: "#0F172A" }}>{p.plan}</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: "#64748B" }}>{p.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Revenue trend */}
      <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E2E8F0" }}>
        <h3 className="font-bold text-sm mb-4" style={{ color: "#0F172A" }}>Revenue Trend</h3>
        {data.revenueTrend.length === 0 ? (
          <p className="text-sm" style={{ color: "#94A3B8" }}>No revenue data yet</p>
        ) : (
          <div className="flex items-end gap-2 h-32">
            {data.revenueTrend.map(t => {
              const max = Math.max(...data.revenueTrend.map(x => x.revenue), 1);
              const h = Math.max((t.revenue / max) * 100, 4);
              return (
                <div key={t.month} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <div className="w-full rounded-t-lg transition-all" style={{ height: `${h}%`, background: "linear-gradient(to top, #4285C7, #C13A2A)", minHeight: 4 }} />
                  <span className="text-[10px] font-medium truncate w-full text-center" style={{ color: "#64748B" }}>{t.month}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
