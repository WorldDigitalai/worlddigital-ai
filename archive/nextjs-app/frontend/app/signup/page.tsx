"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ga } from "@/lib/gtag";

// Apple Sign In — enabled. Requires APPLE_CLIENT_ID, APPLE_TEAM_ID,
// APPLE_KEY_ID, and APPLE_PRIVATE_KEY secrets to be set.
const APPLE_ENABLED = true;

function WDLogo() {
  return (
    <img src="/icons/wdlogo.jpeg" alt="WorldDigital.ai" width={36} height={36} style={{ borderRadius: 8, objectFit: "contain", display: "block" }} />
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.54 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  );
}

interface EmailExistsInfo {
  hasGoogle: boolean;
  hasPassword: boolean;
}

export default function SignupPage() {
  const { signup } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailExists, setEmailExists] = useState<EmailExistsInfo | null>(null);
  const [signInHref, setSignInHref] = useState("/login");

  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get("next");
    if (next) setSignInHref(`/login?next=${encodeURIComponent(next)}`);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailExists(null);
    if (form.password !== form.confirm) { setError("Passwords do not match"); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    ga.signupStart();
    const result = await signup(form.name, form.email, form.password);
    if (result.ok) {
      ga.signupComplete();
      const sp = new URLSearchParams(window.location.search);
      const next = sp.get("next");
      window.location.href = next || "/subscribe";
    } else {
      if (result.code === "EMAIL_EXISTS") {
        setEmailExists({ hasGoogle: !!result.hasGoogle, hasPassword: !!result.hasPassword });
      } else {
        setError(result.error || "Signup failed. Please try again.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0F172A, #1a2a4a)" }}
      >
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/2 right-0 w-96 h-96 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #C13A2A, transparent 70%)", transform: "translate(30%, -50%)" }} />
        </div>
        <Link href="/" className="flex items-center gap-3 relative z-10">
          <WDLogo />
          <span className="font-bold text-white text-lg">worlddigital.ai</span>
        </Link>
        <div className="relative z-10 max-w-sm">
          <p className="text-4xl font-black text-white leading-tight mb-4">
            Start growing with AI-powered marketing today.
          </p>
          <p className="text-gray-400 leading-relaxed mb-10">
            Set up your first campaign in under 10 minutes. No marketing expertise required.
          </p>
          <div className="space-y-4">
            {[
              "AI-generated ad copy and creatives",
              "Live across Meta, Google & Snapchat",
              "Real-time performance dashboard",
              "Cancel anytime — no contracts",
            ].map(f => (
              <div key={f} className="flex items-center gap-3 text-sm text-gray-300">
                <svg className="w-4 h-4 text-green-400 shrink-0" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" fill="rgba(52,211,153,0.15)" />
                  <path d="M5 8l2 2 4-4" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {f}
              </div>
            ))}
          </div>
        </div>
        <p className="text-gray-600 text-xs relative z-10">© {new Date().getFullYear()} WorldDigital.ai. All rights reserved.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex items-center justify-center px-6 py-16" style={{ background: "#F8F9FB" }}>
        <div className="w-full max-w-sm">
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <WDLogo />
            <span className="font-bold text-gray-800">worlddigital.ai</span>
          </Link>

          <h1 className="text-3xl font-black text-gray-900 mb-1">Create your account</h1>
          <p className="text-gray-500 text-sm mb-8">Campaigns live in minutes.</p>

          {/* Social auth */}
          <div className="space-y-3 mb-6">
            {APPLE_ENABLED && (
              <button
                type="button"
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-medium transition-all hover:shadow-sm active:scale-[0.98]"
                style={{ background: "#111827", border: "1px solid #111827", color: "white" }}
                onClick={() => { window.location.href = "/api/v1/auth/apple"; }}
              >
                <AppleIcon />
                Sign up with Apple
              </button>
            )}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-medium transition-all hover:shadow-sm active:scale-[0.98]"
              style={{ background: "white", border: "1px solid #e5e7eb", color: "#374151" }}
              onClick={() => { ga.signupStart(); window.location.href = "/api/v1/auth/google"; }}
            >
              <GoogleIcon />
              Sign up with Google
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">or sign up with email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* ── Email already exists — recovery UI ─────────────────────────── */}
          {emailExists ? (
            <div className="rounded-2xl p-5 space-y-4" style={{ background: "rgba(193,58,42,0.05)", border: "1px solid rgba(193,58,42,0.2)" }}>
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(193,58,42,0.1)" }}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#C13A2A" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#111827" }}>Account already exists</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    An account with <strong>{form.email}</strong> already exists. Please log in or reset your password.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Link
                  href={`/login?email=${encodeURIComponent(form.email)}`}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(to right, #4285C7, #C13A2A)" }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Log In
                </Link>
                <Link
                  href={`/forgot-password?email=${encodeURIComponent(form.email)}`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-gray-100"
                  style={{ border: "1px solid #E5E7EB", color: "#374151" }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Reset Password
                </Link>
                {emailExists.hasGoogle && (
                  <button
                    type="button"
                    onClick={() => { window.location.href = "/api/v1/auth/google"; }}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium transition-all hover:shadow-sm"
                    style={{ background: "white", border: "1px solid #E5E7EB", color: "#374151" }}
                  >
                    <GoogleIcon />
                    Continue with Google instead
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => { setEmailExists(null); setForm(f => ({ ...f, email: "" })); }}
                className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
              >
                Use a different email address
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {error && (
                <div role="alert" className="text-sm px-4 py-3 rounded-xl" style={{ background: "rgba(193,58,42,0.08)", border: "1px solid rgba(193,58,42,0.25)", color: "#C13A2A" }}>
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input type="text" autoComplete="name" required className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" placeholder="Jane Smith" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <input type="email" autoComplete="email" required className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" placeholder="you@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} autoComplete="new-password" required className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-12 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" placeholder="Min. 8 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" aria-label="Toggle visibility">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                <input type="password" autoComplete="new-password" required className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" placeholder="Repeat your password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all duration-200 disabled:opacity-60 shadow-lg"
                style={{ background: loading ? "#9B2D1F" : "linear-gradient(to right, #4285C7, #C13A2A)" }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating account...
                  </span>
                ) : "Create Account"}
              </button>
            </form>
          )}

          <p className="text-xs text-gray-400 text-center mt-4">
            By creating an account you agree to our{" "}
            <Link href="/terms-and-conditions" className="underline hover:text-gray-600">Terms</Link>
            {" "}and{" "}
            <Link href="/privacy-policy" className="underline hover:text-gray-600">Privacy Policy</Link>.
          </p>
          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{" "}
            <Link href={signInHref} className="font-semibold" style={{ color: "#C13A2A" }}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
