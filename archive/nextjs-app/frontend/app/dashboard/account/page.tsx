"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";

interface AccountData {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  subscriptionStatus: string;
  stripeCustomerId: string | null;
  createdAt: string;
}

export default function AccountPage() {
  const { user, refresh } = useAuth();
  const [data, setData] = useState<AccountData | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    apiFetch<AccountData>("/v1/dashboard/account").then((res) => {
      if (res.ok) {
        setData(res.data);
        setName(res.data.name);
        setPhone(res.data.phone || "");
      }
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await apiFetch("/v1/dashboard/account", {
      method: "PUT",
      body: { name: name.trim(), phone: phone.trim() },
    });
    if (res.ok) {
      setSaved(true);
      await refresh();
      setTimeout(() => setSaved(false), 3000);
    } else {
      setError(res.error || "Failed to update account");
    }
    setSaving(false);
  };

  const openBilling = async () => {
    setPortalLoading(true);
    const res = await apiFetch<{ url: string }>("/v1/stripe/portal", { method: "POST" });
    if (res.ok && res.data.url) window.location.href = res.data.url;
    else setPortalLoading(false);
  };

  const input = "w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all";
  const inputStyle = { background: "white", border: "1px solid rgba(0,0,0,0.12)", color: "#1A1A1A" };

  const statusColor = (s: string) => s === "active" ? "#16A34A" : s === "paused" ? "#D97706" : "#C13A2A";
  const statusBg = (s: string) => s === "active" ? "rgba(22,163,74,0.1)" : s === "paused" ? "rgba(217,119,6,0.1)" : "rgba(193,58,42,0.08)";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black" style={{ color: "#111827" }}>Account Settings</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Manage your profile and account details</p>
      </div>

      {saved && <div className="px-4 py-3 rounded-xl text-sm font-medium text-green-800 bg-green-50 border border-green-200">✓ Account updated successfully</div>}
      {error && <div className="px-4 py-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-200">{error}</div>}

      {/* Profile card */}
      <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black" style={{ background: "linear-gradient(135deg,#4285C7,#C13A2A)" }}>
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-black text-lg" style={{ color: "#111827" }}>{user?.name}</p>
            <p className="text-sm" style={{ color: "#6B7280" }}>{user?.email}</p>
            {data && (
              <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                Member since {new Date(data.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: "#374151" }}>Full Name</label>
            <input className={input} style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" required />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: "#374151" }}>Email Address</label>
            <input className={input} style={{ ...inputStyle, background: "#F9FAFB", color: "#9CA3AF" }} value={data?.email || ""} disabled />
            <p className="text-[11px] mt-1" style={{ color: "#9CA3AF" }}>Contact support to change your email</p>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: "#374151" }}>Phone Number (Optional)</label>
            <input className={input} style={inputStyle} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
          </div>

          <button type="submit" disabled={saving} className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60 hover:opacity-90 transition-all" style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Subscription status */}
      {data && (
        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
          <p className="text-sm font-black mb-4" style={{ color: "#111827" }}>Subscription & Billing</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "#374151" }}>Subscription status</span>
              <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: statusBg(data.subscriptionStatus), color: statusColor(data.subscriptionStatus) }}>
                {data.subscriptionStatus === "active" ? "Active" : data.subscriptionStatus === "paused" ? "Paused" : data.subscriptionStatus === "cancelled" ? "Cancelled" : "No subscription"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "#374151" }}>Billing</span>
              <span className="text-xs" style={{ color: data.stripeCustomerId ? "#16A34A" : "#9CA3AF" }}>
                {data.stripeCustomerId ? "● Stripe connected" : "○ Not connected"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "#374151" }}>Account role</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: "rgba(66,133,199,0.1)", color: "#1D4ED8" }}>
                {data.role}
              </span>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            {data.subscriptionStatus === "active" ? (
              <button onClick={openBilling} disabled={portalLoading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border hover:bg-gray-50 disabled:opacity-60 transition-all" style={{ border: "1px solid rgba(0,0,0,0.12)", color: "#374151" }}>
                {portalLoading ? "Opening…" : "Manage Billing"}
              </button>
            ) : (
              <a href="/subscribe" className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white text-center" style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }}>
                Choose a Plan
              </a>
            )}
          </div>
        </div>
      )}

      {/* Security */}
      <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
        <p className="text-sm font-black mb-3" style={{ color: "#111827" }}>Security</p>
        <p className="text-xs mb-3" style={{ color: "#6B7280" }}>Password changes and security settings are handled securely through our support team.</p>
        <a href="mailto:support@worlddigital.ai" className="text-xs font-semibold" style={{ color: "#4285C7" }}>
          Contact support to change password →
        </a>
      </div>
    </div>
  );
}
