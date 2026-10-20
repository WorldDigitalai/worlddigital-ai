"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdminAuth } from "../layout";

interface FeatureFlag {
  key: string;
  enabled: boolean;
  label: string;
  description: string;
  updatedAt: string;
  updatedBy?: string;
}

const FLAG_ICONS: Record<string, string> = {
  ai_generation:   "M13 10V3L4 14h7v7l9-11h-7z",
  publishing:      "M12 19l9 2-9-18-9 18 9-2zm0 0v-8",
  ads:             "M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z",
  analytics:       "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  demo_mode:       "M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
  blog:            "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  assistant:       "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  custom_packages: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  social_dry_run:  "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  ads_dry_run:     "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
};

const FLAG_COLORS: Record<string, string> = {
  ai_generation: "#4285C7", publishing: "#7C3AED", ads: "#C13A2A",
  analytics: "#16A34A", demo_mode: "#D97706", blog: "#0EA5E9",
  assistant: "#F59E0B", custom_packages: "#64748B",
  social_dry_run: "#94A3B8", ads_dry_run: "#94A3B8",
};

function Toggle({ enabled, onChange, disabled }: { enabled: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out"
      style={{ background: enabled ? "#16A34A" : "#CBD5E1", opacity: disabled ? 0.5 : 1 }}
      role="switch"
      aria-checked={enabled}
    >
      <span className="inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out mt-0.5"
        style={{ transform: `translateX(${enabled ? "22px" : "2px"})` }} />
    </button>
  );
}

export default function AdminFeatureFlagsPage() {
  const { token } = useAdminAuth();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean; key: string } | null>(null);

  const flash = (key: string, text: string, ok: boolean) => {
    setMsg({ key, text, ok });
    setTimeout(() => setMsg(null), 4000);
  };

  const adminFetch = useCallback(async (path: string, opts: RequestInit = {}) => {
    const res = await fetch(`/api${path}`, {
      ...opts,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts.headers ?? {}) },
    });
    return { ok: res.ok, data: await res.json() };
  }, [token]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const { ok, data } = await adminFetch("/v1/admin/feature-flags");
    if (ok) setFlags(data);
    setLoading(false);
  }, [adminFetch, token]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (key: string, enabled: boolean) => {
    setSaving(key);
    const { ok, data } = await adminFetch(`/v1/admin/feature-flags/${key}`, {
      method: "PUT",
      body: JSON.stringify({ enabled }),
    });
    if (ok) {
      setFlags((prev) => prev.map((f) => f.key === key ? { ...f, enabled } : f));
      flash(key, `${key.replace(/_/g, " ")} ${enabled ? "enabled" : "disabled"}`, true);
    } else {
      flash(key, data.message ?? "Failed to update flag", false);
    }
    setSaving(null);
  };

  const ENV_CONTROLLED = ["social_dry_run", "ads_dry_run"];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-black" style={{ color: "#0F172A" }}>Feature Flags</h2>
        <p className="text-sm mt-1" style={{ color: "#64748B" }}>
          Toggle platform features on or off in real time. Changes take effect immediately.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {flags.map((flag) => {
            const color = FLAG_COLORS[flag.key] ?? "#64748B";
            const icon = FLAG_ICONS[flag.key] ?? "M12 6v6m0 0v6m0-6h6m-6 0H6";
            const isEnvControlled = ENV_CONTROLLED.includes(flag.key);
            const isSaving = saving === flag.key;
            const currentMsg = msg?.key === flag.key ? msg : null;

            return (
              <div key={flag.key}
                className="rounded-2xl p-5 transition-all"
                style={{ background: "white", border: `1.5px solid ${flag.enabled ? color + "30" : "#E2E8F0"}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: flag.enabled ? `${color}15` : "rgba(100,116,139,0.08)" }}>
                      <svg width={18} height={18} fill="none" viewBox="0 0 24 24" stroke={flag.enabled ? color : "#94A3B8"} strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold" style={{ color: "#0F172A" }}>{flag.label}</p>
                        {flag.enabled ? (
                          <span className="px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: `${color}15`, color }}>ON</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: "rgba(100,116,139,0.1)", color: "#94A3B8" }}>OFF</span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{flag.description}</p>
                      {isEnvControlled && (
                        <p className="text-xs mt-1 font-medium" style={{ color: "#D97706" }}>
                          Controlled by environment variable
                        </p>
                      )}
                      {flag.updatedBy && (
                        <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>
                          Updated {new Date(flag.updatedAt).toLocaleDateString()} by {flag.updatedBy}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {isSaving ? (
                      <div className="w-11 flex justify-center">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <Toggle
                        enabled={flag.enabled}
                        onChange={(v) => toggle(flag.key, v)}
                        disabled={isEnvControlled}
                      />
                    )}
                  </div>
                </div>
                {currentMsg && (
                  <div className="mt-3 px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ background: currentMsg.ok ? "rgba(22,163,74,0.08)" : "rgba(193,58,42,0.08)", color: currentMsg.ok ? "#16A34A" : "#C13A2A" }}>
                    {currentMsg.text}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-xl px-4 py-3 text-xs" style={{ background: "rgba(66,133,199,0.06)", border: "1px solid rgba(66,133,199,0.2)", color: "#1E40AF" }}>
        <strong>Note:</strong> Dry-run flags (Social Dry Run, Ads Dry Run) are controlled by the{" "}
        <code>SOCIAL_DRY_RUN</code> and <code>ADS_DRY_RUN</code> environment variables in Replit Secrets.
        They cannot be toggled here.
      </div>
    </div>
  );
}
