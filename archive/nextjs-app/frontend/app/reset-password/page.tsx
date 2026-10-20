"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

function WDLogo() {
  return (
    <img src="/icons/wdlogo.jpeg" alt="WorldDigital.ai" width={36} height={36} style={{ borderRadius: 8, objectFit: "contain", display: "block" }} />
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [form, setForm] = useState({ password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) setError("Invalid or missing reset link. Please request a new one.");
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const res = await apiFetch<{ message: string }>("/v1/auth/reset-password", {
      method: "POST",
      body: { token, password: form.password },
    });
    setLoading(false);
    if (res.ok) {
      setDone(true);
    } else {
      setError(res.data?.message || "Reset failed. The link may have expired. Please request a new one.");
    }
  };

  const strength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };
  const pwStrength = strength(form.password);
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Very strong"][pwStrength] || "";
  const strengthColor = ["", "#C13A2A", "#D97706", "#4285C7", "#16A34A", "#16A34A"][pwStrength] || "#E5EAF2";

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-16" style={{ background: "linear-gradient(135deg,#EFF6FF 0%,#FFF5F5 100%)" }}>
      <div className="w-full max-w-md">
        <div className="rounded-3xl shadow-xl overflow-hidden" style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="h-1.5 w-full" style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }} />

          <div className="px-8 py-10">
            {/* Logo + header */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-sm" style={{ background: "linear-gradient(135deg,#EFF6FF,#FFF5F5)" }}>
                <WDLogo />
              </div>
              <h1 className="text-2xl font-black" style={{ color: "#111827" }}>Set new password</h1>
              <p className="text-sm mt-2" style={{ color: "#6B7280" }}>
                Choose a strong password for your account.
              </p>
            </div>

            {done ? (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(22,163,74,0.08)" }}>
                  <svg className="w-8 h-8" style={{ color: "#16A34A" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-lg font-black mb-2" style={{ color: "#111827" }}>Password updated!</h2>
                <p className="text-sm mb-8" style={{ color: "#6B7280" }}>
                  Your password has been reset successfully. Sign in with your new password.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-2xl transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)", color: "white" }}
                >
                  Sign in now →
                </Link>
              </div>
            ) : !token ? (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(193,58,42,0.08)" }}>
                  <svg className="w-8 h-8" style={{ color: "#C13A2A" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-lg font-black mb-2" style={{ color: "#111827" }}>Invalid reset link</h2>
                <p className="text-sm mb-8" style={{ color: "#6B7280" }}>
                  This link is invalid or has expired. Request a new one below.
                </p>
                <Link
                  href="/forgot-password"
                  className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-2xl transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)", color: "white" }}
                >
                  Request new link
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="rounded-2xl px-4 py-3 text-sm" style={{ background: "rgba(193,58,42,0.06)", border: "1px solid rgba(193,58,42,0.2)", color: "#C13A2A" }}>
                    {error}
                  </div>
                )}

                {/* New password */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "#374151" }}>
                    New password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      autoFocus
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="At least 8 characters"
                      className="w-full px-4 py-3.5 pr-12 rounded-2xl text-sm outline-none transition-all"
                      style={{ border: "1.5px solid #E5EAF2", background: "#FAFAFA", color: "#111827" }}
                      onFocus={e => { e.currentTarget.style.borderColor = "#4285C7"; e.currentTarget.style.background = "white"; }}
                      onBlur={e => { e.currentTarget.style.borderColor = "#E5EAF2"; e.currentTarget.style.background = "#FAFAFA"; }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        {showPassword
                          ? <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          : <><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                        }
                      </svg>
                    </button>
                  </div>
                  {form.password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className="h-1 flex-1 rounded-full transition-all" style={{ background: i <= pwStrength ? strengthColor : "#E5EAF2" }} />
                        ))}
                      </div>
                      <p className="text-[10px] font-medium" style={{ color: strengthColor }}>{strengthLabel}</p>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "#374151" }}>
                    Confirm new password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={form.confirm}
                    onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                    placeholder="Repeat your new password"
                    className="w-full px-4 py-3.5 rounded-2xl text-sm outline-none transition-all"
                    style={{
                      border: `1.5px solid ${form.confirm && form.confirm !== form.password ? "#C13A2A" : "#E5EAF2"}`,
                      background: "#FAFAFA",
                      color: "#111827",
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = form.confirm && form.confirm !== form.password ? "#C13A2A" : "#4285C7"; e.currentTarget.style.background = "white"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = form.confirm && form.confirm !== form.password ? "#C13A2A" : "#E5EAF2"; e.currentTarget.style.background = "#FAFAFA"; }}
                  />
                  {form.confirm && form.password !== form.confirm && (
                    <p className="text-xs mt-1.5" style={{ color: "#C13A2A" }}>Passwords do not match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !form.password || !form.confirm}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                  style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)", boxShadow: "0 6px 20px rgba(193,58,42,0.25)" }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Updating password…
                    </span>
                  ) : "Update password"}
                </button>

                <div className="text-center pt-1">
                  <Link href="/forgot-password" className="text-xs font-medium" style={{ color: "#6B7280" }}>
                    Need a new reset link?
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#9CA3AF" }}>
          Remember your password?{" "}
          <Link href="/login" className="font-semibold" style={{ color: "#4285C7" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg,#EFF6FF 0%,#FFF5F5 100%)" }}>
        <svg className="w-7 h-7 animate-spin" style={{ color: "#C13A2A" }} fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
