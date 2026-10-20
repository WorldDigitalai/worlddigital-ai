"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { setToken } from "@/lib/api";

/**
 * /auth/callback
 *
 * Google (and future Apple) OAuth redirect destination.
 * The backend redirects here with:
 *   ?token=JWT&redirect=/subscribe   (success)
 *   ?error=message                   (failure)
 *
 * This page stores the JWT, then forwards the user to their destination.
 */
function AuthCallbackContent() {
  const params = useSearchParams();
  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    const token    = params.get("token");
    const redirect = params.get("redirect") || "/dashboard";
    const error    = params.get("error");

    if (error) {
      setMessage(`Sign-in failed: ${error}`);
      // Give the user a moment to read the error, then go back to login.
      setTimeout(() => { window.location.href = `/login?error=${encodeURIComponent(error)}`; }, 2500);
      return;
    }

    if (!token) {
      setMessage("No token received — redirecting to login…");
      setTimeout(() => { window.location.href = "/login"; }, 2000);
      return;
    }

    setToken(token);
    setMessage("Signed in! Redirecting…");
    window.location.href = redirect;
  }, [params]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-white shadow-sm border border-gray-100 max-w-sm w-full mx-4">
        <div className="h-10 w-10 rounded-full border-4 border-gray-200 border-t-[#1D7FE8] animate-spin" />
        <p className="text-sm text-gray-600 text-center">{message}</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="h-10 w-10 rounded-full border-4 border-gray-200 border-t-[#1D7FE8] animate-spin" />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
