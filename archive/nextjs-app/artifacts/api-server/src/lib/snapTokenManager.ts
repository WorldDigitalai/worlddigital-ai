/**
 * Snapchat token manager.
 *
 * Provides:
 *   snapFetch()                    — drop-in fetch wrapper; auto-refreshes on 401, retries once
 *   startSnapchatTokenRefreshJob() — background timer that proactively refreshes every 30 min
 */

import { logger } from "./logger.js";
import { resolveEnv } from "./secretResolver.js";

const SNAP_TOKEN_URL = "https://accounts.snapchat.com/login/oauth2/access_token";

// ── Refresh lock (prevents concurrent refresh races) ──────────────────────────

let refreshInProgress: Promise<boolean> | null = null;

/**
 * Attempt to refresh the Snapchat access token using the stored refresh token.
 * Updates process.env["SNAP_ACCESS_TOKEN"] (and optionally SNAP_REFRESH_TOKEN) on success.
 * Returns true on success, false on failure.
 */
export async function refreshSnapchatAccessToken(): Promise<boolean> {
  if (refreshInProgress) {
    return refreshInProgress;
  }

  refreshInProgress = _doRefresh().finally(() => {
    refreshInProgress = null;
  });

  return refreshInProgress;
}

async function _doRefresh(): Promise<boolean> {
  const clientId     = resolveEnv("SNAPCHAT_CLIENT_ID", "SNAP_CLIENT_ID");
  const clientSecret = resolveEnv("SNAP_CLIENT_SECRET", "SNAPCHAT_CLIENT_SECRET");
  const refreshToken = resolveEnv("SNAP_REFRESH_TOKEN", "SNAPCHAT_REFRESH_TOKEN");

  if (!clientId || !clientSecret || !refreshToken) {
    logger.warn(
      { clientId: !!clientId, clientSecret: !!clientSecret, refreshToken: !!refreshToken },
      "snapTokenManager: cannot refresh — credentials incomplete"
    );
    return false;
  }

  try {
    const body = new URLSearchParams({
      grant_type:    "refresh_token",
      refresh_token: refreshToken,
      client_id:     clientId,
      client_secret: clientSecret,
    });

    const resp = await fetch(SNAP_TOKEN_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    body.toString(),
      signal:  AbortSignal.timeout(15000),
    });

    const data = (await resp.json()) as {
      access_token?:  string;
      refresh_token?: string;
      expires_in?:    number;
      error?:         string;
      error_description?: string;
    };

    if (!resp.ok || !data.access_token) {
      logger.warn(
        { status: resp.status, error: data.error, desc: data.error_description },
        "snapTokenManager: token refresh failed"
      );
      return false;
    }

    process.env["SNAP_ACCESS_TOKEN"] = data.access_token;
    if (data.refresh_token) {
      process.env["SNAP_REFRESH_TOKEN"] = data.refresh_token;
    }

    logger.info(
      { expiresIn: data.expires_in },
      "snapTokenManager: Snapchat access token refreshed"
    );
    return true;
  } catch (err) {
    logger.error({ err }, "snapTokenManager: network error during token refresh");
    return false;
  }
}

// ── snapFetch ─────────────────────────────────────────────────────────────────

/**
 * Drop-in replacement for fetch() for Snapchat API calls.
 * On a 401 response it:
 *   1. Refreshes the access token via refreshSnapchatAccessToken()
 *   2. Updates the Authorization header with the new token
 *   3. Retries the request once
 *
 * Usage:
 *   const resp = await snapFetch(`${SNAP_ADS}/adaccounts/${accountId}`, {
 *     headers: { Authorization: `Bearer ${token}` },
 *   });
 */
export async function snapFetch(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const resp = await fetch(url, init);

  if (resp.status !== 401) {
    return resp;
  }

  logger.info("snapTokenManager: received 401 — attempting automatic token refresh");

  const refreshed = await refreshSnapchatAccessToken();
  if (!refreshed) {
    // Return the original 401 so callers can handle it normally
    return resp;
  }

  const newToken = process.env["SNAP_ACCESS_TOKEN"];
  if (!newToken) {
    return resp;
  }

  // Rebuild headers with the new token
  const newHeaders: Record<string, string> = {};
  if (init?.headers) {
    const existing = init.headers as Record<string, string>;
    for (const [k, v] of Object.entries(existing)) {
      newHeaders[k] = v;
    }
  }
  newHeaders["Authorization"] = `Bearer ${newToken}`;

  logger.info("snapTokenManager: retrying request with refreshed token");
  return fetch(url, { ...init, headers: newHeaders });
}

// ── Background proactive refresh job ─────────────────────────────────────────

const REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

let refreshTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Start a background job that proactively refreshes the Snapchat access token
 * every 30 minutes. Safe to call multiple times — only one timer runs at a time.
 */
export function startSnapchatTokenRefreshJob(): void {
  if (refreshTimer) {
    return; // already running
  }

  const hasRefreshToken = !!resolveEnv("SNAP_REFRESH_TOKEN", "SNAPCHAT_REFRESH_TOKEN");
  if (!hasRefreshToken) {
    logger.info("snapTokenManager: no SNAP_REFRESH_TOKEN — background refresh job not started");
    return;
  }

  logger.info(
    { intervalMs: REFRESH_INTERVAL_MS },
    "snapTokenManager: starting Snapchat token background refresh job"
  );

  refreshTimer = setInterval(async () => {
    logger.info("snapTokenManager: running scheduled Snapchat token refresh");
    await refreshSnapchatAccessToken();
  }, REFRESH_INTERVAL_MS);

  // Allow Node.js to exit even if this timer is still active
  if (refreshTimer.unref) {
    refreshTimer.unref();
  }
}

/** Stop the background refresh job (useful for tests / graceful shutdown). */
export function stopSnapchatTokenRefreshJob(): void {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
    logger.info("snapTokenManager: background refresh job stopped");
  }
}
