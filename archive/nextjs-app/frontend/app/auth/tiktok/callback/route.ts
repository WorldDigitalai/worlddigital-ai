import { type NextRequest, NextResponse } from "next/server";

/**
 * GET /auth/tiktok/callback
 *
 * TikTok redirects here after the user authorizes (or denies) the app.
 * This handler forwards the authorization code to the Express API at
 * /api/v1/social/tiktok/exchange, which exchanges it for an access token
 * and returns a { redirectUrl } pointing back to the admin integrations page.
 */

const API_PORT = process.env["API_SERVER_PORT"] ?? "8080";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code             = searchParams.get("code");
  const error            = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  try {
    const apiRes = await fetch(
      `http://localhost:${API_PORT}/api/v1/social/tiktok/exchange`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ code, error, error_description: errorDescription }),
      }
    );

    const data = (await apiRes.json()) as { success: boolean; redirectUrl: string };

    return NextResponse.redirect(
      new URL(data.redirectUrl, "https://worlddigital.ai"),
      { status: 302 }
    );
  } catch (err) {
    console.error("[tiktok/callback] Proxy error:", err);
    return NextResponse.redirect(
      new URL(
        "/admin/integrations?tiktok_error=callback_failed",
        "https://worlddigital.ai"
      ),
      { status: 302 }
    );
  }
}
