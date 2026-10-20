"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";

interface AccountData {
  email: string;
  name: string;
  subscriptionStatus: string;
  stripeCustomerId: string | null;
  createdAt: string;
}

interface Invoice {
  id: string;
  amount: number;
  status: string;
  url?: string;
  pdf?: string;
  periodStart?: string;
  periodEnd?: string;
  reason?: string;
  date: string;
}

export default function BillingPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AccountData | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [loadingInvoices, setLoadingInvoices] = useState(true);

  useEffect(() => {
    apiFetch<AccountData>("/v1/dashboard/account").then(r => { if (r.ok) setData(r.data); });
    apiFetch<{ invoices: Invoice[] }>("/v1/dashboard/invoices")
      .then(r => { if (r.ok) setInvoices(r.data.invoices); })
      .finally(() => setLoadingInvoices(false));
  }, []);

  const openPortal = async () => {
    setPortalLoading(true);
    setPortalError(null);
    const res = await apiFetch<{ url: string }>("/v1/stripe/portal", { method: "POST" });
    if (res.ok && res.data.url) window.location.href = res.data.url;
    else { setPortalError(res.error || "Could not open billing portal"); setPortalLoading(false); }
  };

  const status = user?.subscriptionStatus;
  const isActive = status === "active";

  const STATUS_INFO: Record<string, { label: string; color: string; bg: string; desc: string }> = {
    active: { label: "Active", color: "#16A34A", bg: "rgba(22,163,74,0.1)", desc: "Your subscription is active and all features are available." },
    paused: { label: "Paused", color: "#D97706", bg: "rgba(217,119,6,0.1)", desc: "Your subscription is paused. Resume to restore access." },
    cancelled: { label: "Cancelled", color: "#C13A2A", bg: "rgba(193,58,42,0.08)", desc: "Your subscription has been cancelled." },
    none: { label: "No Subscription", color: "#9CA3AF", bg: "rgba(0,0,0,0.05)", desc: "No active subscription. Choose a plan to get started." },
  };

  const statusInfo = STATUS_INFO[status || "none"] || STATUS_INFO["none"];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black" style={{ color: "#111827" }}>Billing</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Manage your subscription, invoices, and payment details</p>
      </div>

      {/* Subscription status card */}
      <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-sm font-black" style={{ color: "#111827" }}>Subscription Status</p>
            <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{statusInfo.desc}</p>
          </div>
          <span className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: statusInfo.bg, color: statusInfo.color }}>
            {statusInfo.label}
          </span>
        </div>

        <div className="space-y-3 mb-5">
          <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
            <span className="text-sm" style={{ color: "#374151" }}>Account email</span>
            <span className="text-sm font-medium" style={{ color: "#111827" }}>{data?.email || "—"}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
            <span className="text-sm" style={{ color: "#374151" }}>Stripe billing</span>
            <span className="text-xs" style={{ color: data?.stripeCustomerId ? "#16A34A" : "#9CA3AF" }}>
              {data?.stripeCustomerId ? "● Connected" : "○ Not connected"}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm" style={{ color: "#374151" }}>Member since</span>
            <span className="text-sm" style={{ color: "#374151" }}>
              {data ? new Date(data.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"}
            </span>
          </div>
        </div>

        {portalError && <p className="text-xs text-red-600 mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-100">{portalError}</p>}

        <div className="flex flex-col sm:flex-row gap-3">
          {isActive ? (
            <button onClick={openPortal} disabled={portalLoading} className="flex-1 py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 disabled:opacity-60 transition-all" style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }}>
              {portalLoading ? "Opening Stripe Portal…" : "Manage Billing & Invoices"}
            </button>
          ) : (
            <Link href="/subscribe" className="flex-1 py-3 rounded-xl text-sm font-bold text-white text-center" style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }}>
              Choose a Plan
            </Link>
          )}
          {isActive && (
            <Link href="/subscribe" className="sm:w-auto py-3 px-5 rounded-xl text-sm font-semibold border text-center hover:bg-gray-50 transition-all" style={{ border: "1px solid rgba(0,0,0,0.12)", color: "#374151" }}>
              Upgrade / Change Plan
            </Link>
          )}
        </div>
      </div>

      {/* Invoice history */}
      <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
        <p className="text-sm font-black mb-4" style={{ color: "#111827" }}>Invoice History</p>
        {loadingInvoices ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: "#94A3B8" }}>No invoices yet</p>
            <p className="text-xs mt-1" style={{ color: "#CBD5E1" }}>Invoices appear here after successful payments</p>
          </div>
        ) : (
          <div className="space-y-2">
            {invoices.map(i => (
              <div key={i.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#F9FAFB" }}>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "#111827" }}>
                    {i.reason === "subscription_create" ? "Initial subscription" : "Monthly renewal"}
                  </p>
                  <p className="text-[11px]" style={{ color: "#6B7280" }}>
                    {i.date ? new Date(i.date).toLocaleDateString() : "—"}
                    {i.periodStart && i.periodEnd && ` · ${new Date(i.periodStart).toLocaleDateString()} – ${new Date(i.periodEnd).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span className="text-sm font-bold" style={{ color: "#111827" }}>
                    {i.amount ? `$${(i.amount / 100).toFixed(2)}` : "—"}
                  </span>
                  {i.url && (
                    <a href={i.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold px-2.5 py-1 rounded-lg hover:opacity-80 transition-all" style={{ background: "rgba(66,133,199,0.1)", color: "#4285C7" }}>
                      View
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
