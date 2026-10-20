"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useAdminAuth } from "../../layout";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface CustomerDetail {
  user: Record<string, unknown>;
  profile: Record<string, unknown> | null;
  usage: Record<string, unknown> | null;
  content: Array<Record<string, unknown>>;
  jobs: Array<Record<string, unknown>>;
  analytics: Array<Record<string, unknown>>;
}

type ModalType =
  | "cancel-period-end"
  | "cancel-immediately"
  | "pause"
  | "resume"
  | "refund"
  | "credits"
  | "delete"
  | null;

function Badge({ status }: { status: string }) {
  const m: Record<string, { bg: string; text: string }> = {
    active:     { bg: "rgba(22,163,74,0.12)",   text: "#16A34A" },
    paused:     { bg: "rgba(234,179,8,0.12)",   text: "#CA8A04" },
    cancelling: { bg: "rgba(249,115,22,0.12)",  text: "#EA580C" },
    cancelled:  { bg: "rgba(239,68,68,0.12)",   text: "#DC2626" },
    none:       { bg: "rgba(100,116,139,0.12)", text: "#64748B" },
  };
  const c = m[status] || m.none;
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: c.bg, color: c.text }}>
      {status || "free"}
    </span>
  );
}

function Spinner() {
  return <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />;
}

interface ConfirmModalProps {
  type: ModalType;
  userName: string;
  userEmail: string;
  onClose: () => void;
  onConfirm: (opts: Record<string, unknown>) => Promise<void>;
}

function ConfirmModal({ type, userName, userEmail, onClose, onConfirm }: ConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notifyUser, setNotifyUser] = useState(true);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("requested_by_customer");
  const [creditDelta, setCreditDelta] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  if (!type) return null;

  const configs: Record<
    NonNullable<ModalType>,
    { title: string; icon: string; iconBg: string; body: React.ReactNode; confirmLabel: string; confirmColor: string; disabled?: boolean }
  > = {
    "cancel-period-end": {
      title: "Cancel at Period End",
      icon: "🕐",
      iconBg: "rgba(249,115,22,0.1)",
      body: (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: "#374151" }}>
            The subscription will remain active until the end of the current billing period, then cancel automatically.
            The customer will <strong>not</strong> be billed again.
          </p>
          <p className="text-sm" style={{ color: "#6B7280" }}>
            Customer: <strong>{userName || userEmail}</strong>
          </p>
          <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "#374151" }}>
            <input type="checkbox" checked={notifyUser} onChange={(e) => setNotifyUser(e.target.checked)} className="rounded" />
            Send cancellation email to customer
          </label>
        </div>
      ),
      confirmLabel: "Cancel at Period End",
      confirmColor: "#EA580C",
    },
    "cancel-immediately": {
      title: "Cancel Immediately",
      icon: "⚡",
      iconBg: "rgba(220,38,38,0.1)",
      body: (
        <div className="space-y-4">
          <div className="p-3 rounded-xl text-sm font-medium" style={{ background: "rgba(220,38,38,0.08)", color: "#DC2626" }}>
            This will cancel access immediately. The customer will lose access right now.
          </div>
          <p className="text-sm" style={{ color: "#374151" }}>
            Customer: <strong>{userName || userEmail}</strong>
          </p>
          <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "#374151" }}>
            <input type="checkbox" checked={notifyUser} onChange={(e) => setNotifyUser(e.target.checked)} className="rounded" />
            Send cancellation email to customer
          </label>
        </div>
      ),
      confirmLabel: "Cancel Immediately",
      confirmColor: "#DC2626",
    },
    pause: {
      title: "Pause Subscription",
      icon: "⏸",
      iconBg: "rgba(234,179,8,0.1)",
      body: (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: "#374151" }}>
            Pausing will suspend billing and access. The customer can be resumed at any time.
          </p>
          <p className="text-sm" style={{ color: "#6B7280" }}>
            Customer: <strong>{userName || userEmail}</strong>
          </p>
          <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "#374151" }}>
            <input type="checkbox" checked={notifyUser} onChange={(e) => setNotifyUser(e.target.checked)} className="rounded" />
            Send pause notification to customer
          </label>
        </div>
      ),
      confirmLabel: "Pause Subscription",
      confirmColor: "#CA8A04",
    },
    resume: {
      title: "Resume Subscription",
      icon: "▶",
      iconBg: "rgba(22,163,74,0.1)",
      body: (
        <p className="text-sm" style={{ color: "#374151" }}>
          Resuming will restore billing and access for <strong>{userName || userEmail}</strong>. Their next billing cycle will begin immediately.
        </p>
      ),
      confirmLabel: "Resume Subscription",
      confirmColor: "#16A34A",
    },
    refund: {
      title: "Issue Refund",
      icon: "💳",
      iconBg: "rgba(66,133,199,0.1)",
      body: (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: "#374151" }}>
            A refund will be issued against the customer's most recent successful charge. Leave amount blank for a full refund.
          </p>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Amount (USD, blank = full refund)</label>
            <div className="flex items-center border rounded-xl px-3" style={{ borderColor: "#E2E8F0" }}>
              <span className="text-sm mr-1" style={{ color: "#64748B" }}>$</span>
              <input
                type="number"
                placeholder="e.g. 49.99"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="flex-1 py-2 text-sm outline-none bg-transparent"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Reason</label>
            <select
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
              style={{ borderColor: "#E2E8F0" }}
            >
              <option value="requested_by_customer">Requested by customer</option>
              <option value="duplicate">Duplicate charge</option>
              <option value="fraudulent">Fraudulent charge</option>
            </select>
          </div>
        </div>
      ),
      confirmLabel: "Issue Refund",
      confirmColor: "#4285C7",
    },
    credits: {
      title: "Adjust Credits",
      icon: "⭐",
      iconBg: "rgba(66,133,199,0.1)",
      body: (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: "#374151" }}>
            Manually add or subtract AI credits for <strong>{userName || userEmail}</strong>.
          </p>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Delta (positive to add, negative to subtract)</label>
            <input
              type="number"
              placeholder="e.g. 50 or -10"
              value={creditDelta}
              onChange={(e) => setCreditDelta(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
              style={{ borderColor: "#E2E8F0" }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Reason (internal note)</label>
            <input
              type="text"
              placeholder="e.g. Goodwill adjustment"
              value={creditReason}
              onChange={(e) => setCreditReason(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
              style={{ borderColor: "#E2E8F0" }}
            />
          </div>
        </div>
      ),
      confirmLabel: "Apply Credit Change",
      confirmColor: "#4285C7",
      disabled: !creditDelta || isNaN(Number(creditDelta)) || Number(creditDelta) === 0,
    },
    delete: {
      title: "Permanently Delete Account",
      icon: "🗑️",
      iconBg: "rgba(220,38,38,0.08)",
      body: (
        <div className="space-y-4">
          <div className="p-3 rounded-xl text-sm font-medium" style={{ background: "rgba(220,38,38,0.08)", color: "#DC2626" }}>
            This is <strong>irreversible</strong>. All data will be permanently deleted: account, content, jobs, analytics, and any leads.
            The Stripe subscription will be cancelled immediately.
          </div>
          <p className="text-sm" style={{ color: "#374151" }}>
            Account: <strong>{userName || userEmail}</strong> ({userEmail})
          </p>
          <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "#374151" }}>
            <input type="checkbox" checked={notifyUser} onChange={(e) => setNotifyUser(e.target.checked)} className="rounded" />
            Send account deletion email to customer
          </label>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "#DC2626" }}>Type DELETE to confirm</label>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              className="w-full border-2 rounded-xl px-3 py-2 text-sm font-mono outline-none"
              style={{ borderColor: deleteConfirm === "DELETE" ? "#DC2626" : "#E2E8F0" }}
            />
          </div>
        </div>
      ),
      confirmLabel: "Delete Account Forever",
      confirmColor: "#DC2626",
      disabled: deleteConfirm !== "DELETE",
    },
  };

  const cfg = configs[type];

  const handleConfirm = async () => {
    setLoading(true);
    setError("");
    try {
      const opts: Record<string, unknown> = { notify: notifyUser };
      if (type === "cancel-period-end") opts.immediately = false;
      if (type === "cancel-immediately") opts.immediately = true;
      if (type === "refund") {
        if (refundAmount) opts.amount = Math.round(parseFloat(refundAmount) * 100);
        opts.reason = refundReason;
      }
      if (type === "credits") {
        opts.delta = Number(creditDelta);
        opts.reason = creditReason;
      }
      if (type === "delete") opts.confirm = "DELETE";
      await onConfirm(opts);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-5" style={{ background: "white", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: cfg.iconBg }}>
            {cfg.icon}
          </div>
          <h3 className="text-lg font-black" style={{ color: "#0F172A" }}>{cfg.title}</h3>
        </div>

        <div>{cfg.body}</div>

        {error && (
          <div className="p-3 rounded-xl text-sm" style={{ background: "rgba(220,38,38,0.08)", color: "#DC2626" }}>
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "#F1F5F9", color: "#64748B" }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || cfg.disabled}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity"
            style={{ background: cfg.confirmColor, opacity: loading || cfg.disabled ? 0.6 : 1 }}
          >
            {loading ? <Spinner /> : cfg.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ActionResult {
  label: string;
  ok: boolean;
  detail?: string;
}

export default function CustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { token } = useAdminAuth();
  const router = useRouter();
  const [data, setData] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [modal, setModal] = useState<ModalType>(null);
  const [actionResult, setActionResult] = useState<ActionResult | null>(null);

  const fetchData = useCallback(() => {
    if (!token || !id) return;
    fetch(`/api/v1/admin/customers/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [token, id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const adminFetch = useCallback(
    async (path: string, method: string, body?: Record<string, unknown>) => {
      const r = await fetch(`/api/v1/admin/customers/${id}/${path}`, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await r.json() as Record<string, unknown>;
      if (!r.ok) throw new Error(String(json.message || "Request failed"));
      return json;
    },
    [token, id]
  );

  const handleAction = useCallback(
    async (type: NonNullable<ModalType>, opts: Record<string, unknown>) => {
      let result: Record<string, unknown>;

      if (type === "cancel-period-end" || type === "cancel-immediately") {
        result = await adminFetch("cancel", "POST", opts);
        setActionResult({ label: "Subscription cancelled", ok: true, detail: String(result.periodEnd || result.status || "") });
      } else if (type === "pause") {
        result = await adminFetch("pause", "POST", opts);
        setActionResult({ label: "Subscription paused", ok: true });
      } else if (type === "resume") {
        result = await adminFetch("resume", "POST", opts);
        setActionResult({ label: "Subscription resumed", ok: true });
      } else if (type === "refund") {
        result = await adminFetch("refund", "POST", opts);
        const amount = result.amount ? `$${(Number(result.amount) / 100).toFixed(2)}` : "";
        setActionResult({ label: "Refund issued", ok: true, detail: amount ? `${amount} refund — ID: ${result.refundId}` : String(result.refundId || "") });
      } else if (type === "credits") {
        result = await adminFetch("credits", "PATCH", opts);
        setActionResult({ label: "Tokens adjusted", ok: true, detail: `New token balance: ${Number(result.balance).toLocaleString()}` });
      } else if (type === "delete") {
        await adminFetch("delete", "POST", opts);
        setActionResult({ label: "Account deleted", ok: true });
        setTimeout(() => router.push("/admin/customers"), 2000);
        return;
      }

      // Refresh the customer data after action
      fetchData();
    },
    [adminFetch, fetchData, router]
  );

  if (loading) return (
    <div className="flex justify-center h-64 items-center">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!data) return <div className="text-red-500 text-sm p-4">Customer not found</div>;

  const u = data.user as Record<string, string>;
  const status = u.subscriptionStatus || "none";
  const tabs = ["overview", "content", "publishing", "analytics"];

  const canCancel = status === "active" || status === "cancelling";
  const canPause = status === "active";
  const canResume = status === "paused";

  return (
    <>
      {modal && (
        <ConfirmModal
          type={modal}
          userName={u.name || ""}
          userEmail={u.email || ""}
          onClose={() => setModal(null)}
          onConfirm={(opts) => handleAction(modal, opts)}
        />
      )}

      <div className="max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/customers" className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "#64748B" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white" style={{ background: "linear-gradient(135deg,#4285C7,#C13A2A)" }}>
              {(u.name || u.email)?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black" style={{ color: "#0F172A" }}>{u.name || "—"}</h2>
                <Badge status={status} />
              </div>
              <p className="text-sm" style={{ color: "#64748B" }}>{u.email}</p>
            </div>
          </div>
        </div>

        {/* Action result banner */}
        {actionResult && (
          <div
            className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold"
            style={{ background: actionResult.ok ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)", color: actionResult.ok ? "#16A34A" : "#DC2626" }}
          >
            <span>✓ {actionResult.label}{actionResult.detail ? ` — ${actionResult.detail}` : ""}</span>
            <button onClick={() => setActionResult(null)} className="ml-4 opacity-60 hover:opacity-100 text-lg leading-none">×</button>
          </div>
        )}

        {/* Account Actions Panel */}
        <div className="rounded-2xl p-5 space-y-4" style={{ background: "white", border: "1px solid #E2E8F0" }}>
          <h3 className="font-bold text-sm" style={{ color: "#0F172A" }}>Account Actions</h3>

          {/* Subscription actions */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#94A3B8" }}>Subscription</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setModal("cancel-period-end")}
                disabled={!canCancel}
                className="px-3 py-2 rounded-xl text-xs font-bold border transition-all hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ borderColor: "#EA580C", color: "#EA580C", background: "rgba(249,115,22,0.06)" }}
              >
                Cancel at Period End
              </button>
              <button
                onClick={() => setModal("cancel-immediately")}
                disabled={!canCancel}
                className="px-3 py-2 rounded-xl text-xs font-bold border transition-all hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ borderColor: "#DC2626", color: "#DC2626", background: "rgba(220,38,38,0.06)" }}
              >
                Cancel Immediately
              </button>
              <button
                onClick={() => setModal("pause")}
                disabled={!canPause}
                className="px-3 py-2 rounded-xl text-xs font-bold border transition-all hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ borderColor: "#CA8A04", color: "#CA8A04", background: "rgba(234,179,8,0.06)" }}
              >
                ⏸ Pause
              </button>
              <button
                onClick={() => setModal("resume")}
                disabled={!canResume}
                className="px-3 py-2 rounded-xl text-xs font-bold border transition-all hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ borderColor: "#16A34A", color: "#16A34A", background: "rgba(22,163,74,0.06)" }}
              >
                ▶ Resume
              </button>
            </div>
          </div>

          {/* Billing actions */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#94A3B8" }}>Billing & Credits</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setModal("refund")}
                disabled={!u.stripeCustomerId}
                className="px-3 py-2 rounded-xl text-xs font-bold border transition-all hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ borderColor: "#4285C7", color: "#4285C7", background: "rgba(66,133,199,0.06)" }}
              >
                💳 Issue Refund
              </button>
              <button
                onClick={() => setModal("credits")}
                className="px-3 py-2 rounded-xl text-xs font-bold border transition-all hover:opacity-80"
                style={{ borderColor: "#4285C7", color: "#4285C7", background: "rgba(66,133,199,0.06)" }}
              >
                ⭐ Adjust Credits
              </button>
              {u.stripeCustomerId && (
                <a
                  href={`https://dashboard.stripe.com/customers/${u.stripeCustomerId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl text-xs font-bold border transition-all hover:opacity-80 inline-block"
                  style={{ borderColor: "#7C3AED", color: "#7C3AED", background: "rgba(124,58,237,0.06)" }}
                >
                  Open in Stripe ↗
                </a>
              )}
            </div>
          </div>

          {/* Danger zone */}
          <div className="pt-3" style={{ borderTop: "1px solid #FEE2E2" }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#FCA5A5" }}>Danger Zone</p>
            <button
              onClick={() => setModal("delete")}
              className="px-3 py-2 rounded-xl text-xs font-bold border transition-all hover:opacity-80"
              style={{ borderColor: "#DC2626", color: "#DC2626", background: "rgba(220,38,38,0.06)" }}
            >
              🗑 Permanently Delete Account
            </button>
            <p className="text-xs mt-1.5" style={{ color: "#94A3B8" }}>Cancels subscription, wipes all data from every collection. Cannot be undone.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "#F1F5F9" }}>
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all"
              style={tab === t
                ? { background: "white", color: "#0F172A", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
                : { color: "#64748B" }
              }
            >
              {t}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Account Info */}
            <div className="rounded-2xl p-5 space-y-3" style={{ background: "white", border: "1px solid #E2E8F0" }}>
              <h3 className="font-bold text-sm" style={{ color: "#0F172A" }}>Account Info</h3>
              {([
                ["Name", u.name],
                ["Email", u.email],
                ["Status", u.subscriptionStatus || "free"],
                ["Plan", u.plan || "—"],
                ["Stripe ID", u.stripeCustomerId ? `cus_****${String(u.stripeCustomerId).slice(-4)}` : "—"],
                ["Sub ID", u.stripeSubscriptionId ? `sub_****${String(u.stripeSubscriptionId).slice(-4)}` : "—"],
                ["Joined", u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"],
                ...(u.cancelledAt ? [["Cancelled At", new Date(u.cancelledAt as string).toLocaleDateString()]] : []),
                ...(u.pausedAt ? [["Paused At", new Date(u.pausedAt as string).toLocaleDateString()]] : []),
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm border-b pb-2 last:border-0 last:pb-0" style={{ borderColor: "#F8FAFC" }}>
                  <span style={{ color: "#64748B" }}>{k}</span>
                  <span className="font-medium" style={{ color: "#0F172A" }}>{v || "—"}</span>
                </div>
              ))}
            </div>

            {/* Business Profile */}
            <div className="rounded-2xl p-5 space-y-3" style={{ background: "white", border: "1px solid #E2E8F0" }}>
              <h3 className="font-bold text-sm" style={{ color: "#0F172A" }}>Business Profile</h3>
              {data.profile ? ([
                ["Business", String((data.profile as Record<string, unknown>).businessName || "—")],
                ["Category", String((data.profile as Record<string, unknown>).category || "—")],
                ["Website", String((data.profile as Record<string, unknown>).website || "—")],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm border-b pb-2 last:border-0 last:pb-0" style={{ borderColor: "#F8FAFC" }}>
                  <span style={{ color: "#64748B" }}>{k}</span>
                  <span className="font-medium" style={{ color: "#0F172A" }}>{v}</span>
                </div>
              )) : <p className="text-sm" style={{ color: "#94A3B8" }}>No business profile yet</p>}
            </div>

            {/* Token Balance */}
            <div className="rounded-2xl p-5 space-y-3" style={{ background: "white", border: "1px solid #E2E8F0" }}>
              <h3 className="font-bold text-sm" style={{ color: "#0F172A" }}>Tokens & Usage</h3>
              {([
                ["Token Balance", Number((data.usage as Record<string, unknown> | null)?.tokenBalance ?? 0).toLocaleString()],
                ["Used This Month", Number((data.usage as Record<string, unknown> | null)?.monthlyUsed ?? 0).toLocaleString()],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm border-b pb-2 last:border-0 last:pb-0" style={{ borderColor: "#F8FAFC" }}>
                  <span style={{ color: "#64748B" }}>{k}</span>
                  <span className="font-semibold" style={{ color: "#0F172A" }}>{v}</span>
                </div>
              ))}
              <button
                onClick={() => setModal("credits")}
                className="w-full mt-1 py-1.5 rounded-lg text-xs font-bold border transition-all hover:opacity-80"
                style={{ borderColor: "#4285C7", color: "#4285C7", background: "rgba(66,133,199,0.06)" }}
              >
                ⭐ Adjust Tokens
              </button>
            </div>

            {/* Activity */}
            <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E2E8F0" }}>
              <h3 className="font-bold text-sm mb-3" style={{ color: "#0F172A" }}>Activity Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {([["Content", data.content.length], ["Jobs", data.jobs.length], ["Analytics", data.analytics.length]] as [string, number][]).map(([k, v]) => (
                  <div key={k} className="text-center p-3 rounded-xl" style={{ background: "#F8FAFC" }}>
                    <p className="text-xl font-black" style={{ color: "#0F172A" }}>{v}</p>
                    <p className="text-xs" style={{ color: "#64748B" }}>{k}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {tab === "content" && (
          <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #E2E8F0" }}>
            {data.content.length === 0 ? (
              <p className="text-center py-10 text-sm" style={{ color: "#94A3B8" }}>No content generated yet</p>
            ) : (
              <div className="scroll-x">
              <table className="w-full">
                <thead><tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  {["Type", "Platform", "Status", "Created"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: "#64748B" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{data.content.map((c, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-slate-50" style={{ borderColor: "#F8FAFC" }}>
                    <td className="px-5 py-3 text-sm" style={{ color: "#0F172A" }}>{String(c.type || "—")}</td>
                    <td className="px-5 py-3 text-sm capitalize" style={{ color: "#64748B" }}>{String(c.platform || "—")}</td>
                    <td className="px-5 py-3 text-sm" style={{ color: "#64748B" }}>{String(c.status || "—")}</td>
                    <td className="px-5 py-3 text-sm" style={{ color: "#94A3B8" }}>{c.createdAt ? new Date(String(c.createdAt)).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}</tbody>
              </table>
              </div>
            )}
          </div>
        )}

        {/* Publishing */}
        {tab === "publishing" && (
          <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #E2E8F0" }}>
            {data.jobs.length === 0 ? (
              <p className="text-center py-10 text-sm" style={{ color: "#94A3B8" }}>No publishing jobs yet</p>
            ) : (
              <div className="scroll-x">
              <table className="w-full">
                <thead><tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  {["Platform", "Status", "Scheduled", "Created"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: "#64748B" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{data.jobs.map((j, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-slate-50" style={{ borderColor: "#F8FAFC" }}>
                    <td className="px-5 py-3 text-sm capitalize" style={{ color: "#0F172A" }}>{String(j.platform || "—")}</td>
                    <td className="px-5 py-3 text-sm" style={{ color: "#64748B" }}>{String(j.status || "—")}</td>
                    <td className="px-5 py-3 text-sm" style={{ color: "#64748B" }}>{j.scheduledAt ? new Date(String(j.scheduledAt)).toLocaleDateString() : "—"}</td>
                    <td className="px-5 py-3 text-sm" style={{ color: "#94A3B8" }}>{j.createdAt ? new Date(String(j.createdAt)).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}</tbody>
              </table>
              </div>
            )}
          </div>
        )}

        {/* Analytics */}
        {tab === "analytics" && (
          <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #E2E8F0" }}>
            {data.analytics.length === 0 ? (
              <p className="text-center py-10 text-sm" style={{ color: "#94A3B8" }}>No analytics data yet</p>
            ) : (
              <div className="scroll-x">
              <table className="w-full">
                <thead><tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  {["Platform", "Impressions", "Clicks", "Likes", "Date"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: "#64748B" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{data.analytics.map((a, i) => (
                  <tr key={i} className="border-b last:border-0" style={{ borderColor: "#F8FAFC" }}>
                    <td className="px-5 py-3 text-sm capitalize" style={{ color: "#0F172A" }}>{String(a.platform || "—")}</td>
                    <td className="px-5 py-3 text-sm font-bold" style={{ color: "#0F172A" }}>{Number(a.impressions || 0).toLocaleString()}</td>
                    <td className="px-5 py-3 text-sm" style={{ color: "#64748B" }}>{Number(a.clicks || 0).toLocaleString()}</td>
                    <td className="px-5 py-3 text-sm" style={{ color: "#64748B" }}>{Number(a.likes || 0).toLocaleString()}</td>
                    <td className="px-5 py-3 text-sm" style={{ color: "#94A3B8" }}>{a.publishedAt ? new Date(String(a.publishedAt)).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}</tbody>
              </table>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
