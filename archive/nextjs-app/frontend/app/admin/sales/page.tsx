"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "../layout";

interface SalesData {
  summary: { totalSubscribers: number; active: number; paused: number; cancelled: number; none: number };
  subscribers: Array<{ _id: string; name: string; email: string; subscriptionStatus: string; stripeCustomerId: string; plan: string; createdAt: string }>;
}

function Card({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E2E8F0" }}>
      <p className="text-2xl font-black" style={{ color }}>{value.toLocaleString()}</p>
      <p className="text-sm mt-1" style={{ color: "#64748B" }}>{label}</p>
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

export default function AdminSales() {
  const { token } = useAdminAuth();
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch("/api/v1/admin/sales", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, [token]);

  const filtered = (data?.subscribers || []).filter(
    (s) => !search || s.email?.includes(search) || s.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="text-2xl font-black" style={{ color: "#0F172A" }}>Sales & Revenue</h2>
        <p className="text-sm mt-1" style={{ color: "#64748B" }}>Subscriber activity and billing status from MongoDB.</p>
      </div>

      {loading ? (
        <div className="flex justify-center h-40 items-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card label="Total Subscribers" value={data?.summary.totalSubscribers || 0} color="#0F172A" />
            <Card label="Active" value={data?.summary.active || 0} color="#16A34A" />
            <Card label="Paused" value={data?.summary.paused || 0} color="#CA8A04" />
            <Card label="Cancelled" value={data?.summary.cancelled || 0} color="#DC2626" />
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #E2E8F0" }}>
            <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: "#F1F5F9" }}>
              <h3 className="font-bold text-sm flex-1" style={{ color: "#0F172A" }}>Subscribers</h3>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search email or name…"
                className="px-3 py-2 rounded-xl text-sm outline-none w-56"
                style={{ border: "1px solid #E2E8F0", background: "#F8FAFC" }}
              />
            </div>
            {filtered.length === 0 ? (
              <p className="text-center py-10 text-sm" style={{ color: "#94A3B8" }}>No subscribers found</p>
            ) : (
              <div className="scroll-x">
              <table className="w-full">
                <thead>
                  <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                    {["Customer", "Email", "Status", "Stripe ID", "Joined"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: "#64748B" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50 transition-colors border-b last:border-0" style={{ borderColor: "#F8FAFC" }}>
                      <td className="px-5 py-3 text-sm font-medium" style={{ color: "#0F172A" }}>{s.name || "—"}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "#64748B" }}>{s.email}</td>
                      <td className="px-5 py-3"><Badge status={s.subscriptionStatus} /></td>
                      <td className="px-5 py-3 text-xs font-mono" style={{ color: "#94A3B8" }}>
                        {s.stripeCustomerId ? `cus_****${s.stripeCustomerId.slice(-4)}` : "—"}
                      </td>
                      <td className="px-5 py-3 text-sm" style={{ color: "#94A3B8" }}>
                        {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
