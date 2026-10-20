"use client";

import { useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

function WDLogo() {
  return (
    <img src="/icons/wdlogo.jpeg" alt="WorldDigital.ai" width={36} height={36} style={{ borderRadius: 8, objectFit: "contain", display: "block" }} />
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await apiFetch<{ message: string }>("/v1/auth/forgot-password", {
      method: "POST",
      body: { email: email.trim().toLowerCase() },
    });
    setLoading(false);
    if (res.ok) {
      setSent(true);
    } else {
      setError(res.data?.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-16" style={{ background: "linear-gradient(135deg,#EFF6FF 0%,#FFF5F5 100%)" }}>
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-3xl shadow-xl overflow-hidden" style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)" }}>
          {/* Top gradient bar */}
          <div className="h-1.5 w-full" style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)" }} />

          <div className="px-8 py-10">
            {/* Logo + header */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-sm" style={{ background: "linear-gradient(135deg,#EFF6FF,#FFF5F5)" }}>
                <WDLogo />
              </div>
              <h1 className="text-2xl font-black" style={{ color: "#111827" }}>Reset your password</h1>
              <p className="text-sm mt-2" style={{ color: "#6B7280" }}>
                Enter your account email and we'll send you a reset link.
              </p>
            </div>

            {sent ? (
              /* Success state */
              <div className="text-center">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(22,163,74,0.08)" }}>
                  <svg className="w-8 h-8" style={{ color: "#16A34A" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-lg font-black mb-2" style={{ color: "#111827" }}>Check your inbox</h2>
                <p className="text-sm mb-1" style={{ color: "#6B7280" }}>
                  If <strong style={{ color: "#111827" }}>{email}</strong> is linked to an account, a reset link has been sent.
                </p>
                <p className="text-xs mb-8" style={{ color: "#9CA3AF" }}>
                  The link expires in 1 hour. Check your spam folder if you don't see it.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-2xl transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)", color: "white" }}
                >
                  Back to sign in
                </Link>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="rounded-2xl px-4 py-3 text-sm" style={{ background: "rgba(193,58,42,0.06)", border: "1px solid rgba(193,58,42,0.2)", color: "#C13A2A" }}>
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "#374151" }}>
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-4 py-3.5 rounded-2xl text-sm outline-none transition-all"
                    style={{
                      border: "1.5px solid #E5EAF2",
                      background: "#FAFAFA",
                      color: "#111827",
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = "#4285C7"; e.currentTarget.style.background = "white"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "#E5EAF2"; e.currentTarget.style.background = "#FAFAFA"; }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                  style={{ background: "linear-gradient(to right,#4285C7,#C13A2A)", boxShadow: "0 6px 20px rgba(193,58,42,0.25)" }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending reset link…
                    </span>
                  ) : "Send reset link"}
                </button>

                <div className="text-center pt-2">
                  <Link href="/login" className="text-sm font-medium transition-colors" style={{ color: "#6B7280" }}>
                    ← Back to sign in
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#9CA3AF" }}>
          Don't have an account?{" "}
          <Link href="/signup" className="font-semibold" style={{ color: "#4285C7" }}>
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
