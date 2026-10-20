import { type NextRequest, NextResponse } from "next/server";

/**
 * POST /auth/apple/callback
 *
 * Apple uses response_mode=form_post, so it submits a browser form to this URL.
 * This route handler forwards the raw form body to the Express API handler at
 * /api/v1/auth/apple/callback, which returns JSON { redirectUrl } (never a redirect
 * itself — that avoids the opaque-redirect issue with Node.js fetch).
 *
 * Port selection:
 *   - In production: Express runs on port 8080 directly (no shared proxy).
 *   - In development: same port 8080 (matching the dev workflow config).
 *   Override with API_SERVER_PORT env var if needed.
 */

const PRODUCTION_ORIGIN = "https://worlddigital.ai";
const API_PORT = process.env["API_SERVER_PORT"] ?? "8080";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();

    const apiRes = await fetch(
      `http://localhost:${API_PORT}/api/v1/auth/apple/callback`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      }
    );

    const data = await apiRes.json() as { redirectUrl?: string };
    const redirectUrl = data.redirectUrl;

    if (redirectUrl) {
      return NextResponse.redirect(redirectUrl, { status: 302 });
    }

    console.error("[apple/callback] Express returned no redirectUrl:", apiRes.status, data);
    return NextResponse.redirect(
      `${PRODUCTION_ORIGIN}/login?error=${encodeURIComponent("Apple sign-in failed. Please try again.")}`,
      { status: 302 }
    );
  } catch (err) {
    console.error("[apple/callback] Proxy error:", err);
    return NextResponse.redirect(
      `${PRODUCTION_ORIGIN}/login?error=${encodeURIComponent("Apple sign-in failed. Please try again.")}`,
      { status: 302 }
    );
  }
}
