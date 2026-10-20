"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "../layout";
import Link from "next/link";

interface Customer {
  _id: string;
  name: string;
  email: string;
  subscriptionStatus: string;
  plan: string;
  createdAt: string;
  businessProfile?: { businessName?: string };
  usage?: { credits?: number; creditsUsed?: number };
}

function Badge({ status }: { status: string }) {
  const m: Record<string, { bg: string; text: string }> = {
    active: { bg: "rgba(22,163,74,0.1)", text: "#16A34A" },
    paused: { bg: "rgba(234,179,8,0.1)", text: "#CA8A04" },
    cancelled: { bg: "rgba(239,68,68,0.1)", text: "#DC2626" },
    none: { bg: "rgba(100,116,139,0.1)", text: "#64748B" },
  };
  const c = m[status] || m.none;
  return <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: c.bg, color: c.text }}>{status || "free"}</span>;
}

export default function AdminCustomers() {
  const { token } = useAdminAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch("/api/v1/admin/customers", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then(setCustomers).finally(() => setLoading(false));
  }, [token]);

  const filtered = customers.filter(
    (c) => !search || c.email?.includes(search) || c.name?.toLowerCase().includes(search.toLowerCase()) || c.businessProfile?.businessName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black" style={{ color: "#0F172A" }}>Customers</h2>
          <p className="text-sm mt-1" style={{ color: "#64748B" }}>{customers.length} total accounts</p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, or business…"
          className="px-3 py-2 rounded-xl text-sm outline-none w-full sm:w-64"
          style={{ border: "1px solid #E2E8F0", background: "white" }}
        />
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #E2E8F0" }}>
        {loading ? (
          <div className="flex justify-center h-40 items-center">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center py-10 text-sm" style={{ color: "#94A3B8" }}>No customers found</p>
        ) : (
          <div className="scroll-x">
          <table className="w-full">
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                {["Customer", "Business", "Plan", "Credits", "Joined", ""].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: "#64748B" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50 transition-colors border-b last:border-0" style={{ borderColor: "#F8FAFC" }}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: "linear-gradient(135deg,#4285C7,#C13A2A)" }}>
                        {(c.name || c.email)?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#0F172A" }}>{c.name || "—"}</p>
                        <p className="text-xs" style={{ color: "#94A3B8" }}>{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm" style={{ color: "#64748B" }}>{c.businessProfile?.businessName || "—"}</td>
                  <td className="px-5 py-3"><Badge status={c.subscriptionStatus} /></td>
                  <td className="px-5 py-3 text-sm" style={{ color: "#64748B" }}>
                    {c.usage ? `${c.usage.creditsUsed || 0} / ${c.usage.credits || 0}` : "—"}
                  </td>
                  <td className="px-5 py-3 text-sm" style={{ color: "#94A3B8" }}>
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/admin/customers/${c._id}`} className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-80" style={{ background: "rgba(66,133,199,0.1)", color: "#4285C7" }}>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
