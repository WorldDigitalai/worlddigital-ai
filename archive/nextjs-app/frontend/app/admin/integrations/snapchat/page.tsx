"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAdminAuth } from "../../layout";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SnapStatus {
  clientIdSet: boolean;
  clientSecretSet: boolean;
  accessTokenSet: boolean;
  refreshTokenSet: boolean;
  adAccountIdSet: boolean;
  accessTokenMasked: string | null;
  refreshTokenMasked: string | null;
  clientConfigured: boolean;
  marketingApiReady: boolean;
  tokenExpired: boolean;
  canRefresh: boolean;
  issues: string[];
}

interface OAuthResult {
  success: boolean;
  accessTokenMasked: string;
  refreshTokenMasked: string;
  expiresIn: number;
  SNAP_ACCESS_TOKEN: string;
  SNAP_REFRESH_TOKEN: string;
  note: string;
}

interface RefreshResult {
  success: boolean;
  accessTokenMasked?: string;
  refreshTokenMasked?: string;
  expiresIn?: number;
  SNAP_ACCESS_TOKEN?: string;
  SNAP_REFRESH_TOKEN?: string;
  note?: string;
  error?: string;
  action_required?: Record<string, string>;
}

interface AdAccount {
  id: string;
  name: string;
  organizationId: string;
  currency?: string;
  status?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function StatusDot({ ok, warn }: { ok: boolean; warn?: boolean }) {
  if (ok) return <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#16A34A" }} />;
  if (warn) return <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#D97706" }} />;
  return <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#DC2626" }} />;
}

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
      style={{ background: copied ? "rgba(22,163,74,0.1)" : "rgba(66,133,199,0.1)", color: copied ? "#16A34A" : "#4285C7" }}
    >
      {copied ? "✓ Copied" : (label ?? "Copy")}
    </button>
  );
}

function SecretRow({
  name, masked, isSet, isExpired,
}: { name: string; masked?: string | null; isSet: boolean; isExpired?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: "#F1F5F9" }}>
      <div className="flex items-center gap-2">
        <StatusDot ok={isSet && !isExpired} warn={isSet && isExpired} />
        <span className="text-xs font-mono font-semibold" style={{ color: "#374151" }}>{name}</span>
        {isSet && isExpired && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "rgba(217,119,6,0.1)", color: "#D97706" }}>EXPIRED</span>
        )}
        {isSet && !isExpired && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "rgba(22,163,74,0.1)", color: "#16A34A" }}>SET</span>
        )}
        {!isSet && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "rgba(239,68,68,0.1)", color: "#DC2626" }}>MISSING</span>
        )}
      </div>
      <span className="text-xs font-mono" style={{ color: "#94A3B8" }}>{masked ?? (isSet ? "••••••••" : "—")}</span>
    </div>
  );
}

function TokenRevealBox({ label, value, note }: { label: string; value: string; note?: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(22,163,74,0.3)", background: "rgba(22,163,74,0.04)" }}>
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-xs font-mono font-bold" style={{ color: "#374151" }}>{label}</p>
          {note && <p className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>{note}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVisible((v) => !v)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
            style={{ background: "rgba(0,0,0,0.05)", color: "#374151" }}
          >
            {visible ? "Hide" : "Reveal"}
          </button>
          <CopyButton value={value} />
        </div>
      </div>
      {visible && (
        <div className="px-4 py-3 border-t font-mono text-xs break-all" style={{ borderColor: "rgba(22,163,74,0.2)", color: "#374151", background: "#F8FFF8" }}>
          {value}
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

function SnapchatSetupContent() {
  const { token } = useAdminAuth();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<SnapStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const [oauthResult, setOauthResult] = useState<OAuthResult | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);

  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<RefreshResult | null>(null);

  const [accounts, setAccounts] = useState<AdAccount[] | null>(null);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState<string | null>(null);

  // This must match EXACTLY what is registered in the Snapchat Developer Portal
  // AND what the code sends as redirect_uri in the OAuth request.
  // The /auth/snapchat/callback path is handled by Next.js (not the API server).
  const callbackUrl = "https://worlddigital.ai/auth/snapchat/callback";

  // ── Fetch status ─────────────────────────────────────────────────────────────

  const fetchStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const r = await fetch("/api/social/snapchat/status");
      if (r.ok) setStatus(await r.json() as SnapStatus);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // ── Handle OAuth callback result (nonce in URL) ───────────────────────────────

  useEffect(() => {
    const nonce = searchParams.get("snap_nonce");
    const err   = searchParams.get("snap_error");

    if (err) {
      setOauthError(decodeURIComponent(err));
      return;
    }

    if (nonce && token) {
      fetch(`/api/social/snapchat/result?nonce=${nonce}&adminToken=${token}`)
        .then((r) => r.json())
        .then((data) => {
          if ((data as OAuthResult).success) setOauthResult(data as OAuthResult);
          else setOauthError((data as { error?: string }).error ?? "Failed to retrieve tokens");
        })
        .catch(() => setOauthError("Network error retrieving OAuth result"));
    }
  }, [searchParams, token]);

  // ── Token refresh ─────────────────────────────────────────────────────────────

  async function handleRefresh() {
    if (!token) return;
    setRefreshing(true);
    setRefreshResult(null);
    try {
      const r = await fetch("/api/social/snapchat/refresh", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json() as RefreshResult;
      setRefreshResult(data);
      if (data.success) {
        await fetchStatus();
      }
    } finally {
      setRefreshing(false);
    }
  }

  // ── Ad account discovery ──────────────────────────────────────────────────────

  async function handleDiscoverAccounts() {
    if (!token) return;
    setAccountsLoading(true);
    setAccountsError(null);
    try {
      const r = await fetch("/api/social/snapchat/accounts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json() as { success: boolean; accounts: AdAccount[]; error?: string };
      if (data.success) setAccounts(data.accounts);
      else setAccountsError(data.error ?? "Failed to discover ad accounts");
    } finally {
      setAccountsLoading(false);
    }
  }

  // ── OAuth connect (window redirect) ──────────────────────────────────────────

  function handleConnect() {
    if (!token) return;
    window.location.href = `/api/social/snapchat/connect?adminToken=${token}`;
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const allSet = status
    ? status.clientIdSet && status.clientSecretSet && status.accessTokenSet &&
      status.refreshTokenSet && status.adAccountIdSet && !status.tokenExpired
    : false;

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/integrations" className="text-sm hover:opacity-70" style={{ color: "#94A3B8" }}>
              ← Integrations
            </Link>
          </div>
          <h2 className="text-2xl font-black flex items-center gap-2" style={{ color: "#0F172A" }}>
            <span>👻</span> Snapchat Marketing Setup
          </h2>
          <p className="text-sm mt-1" style={{ color: "#64748B" }}>
            Connect Snapchat OAuth to enable Marketing API access for paid ads.
          </p>
        </div>
        <button
          onClick={fetchStatus}
          disabled={statusLoading}
          className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #FFFC00, #FF6600)", color: "#000" }}
        >
          {statusLoading ? "Checking…" : "Refresh Status"}
        </button>
      </div>

      {/* Overall status banner */}
      {status && (
        <div
          className="rounded-2xl px-5 py-4 flex items-center gap-3"
          style={{
            background: allSet ? "rgba(22,163,74,0.06)" : status.tokenExpired ? "rgba(217,119,6,0.06)" : "rgba(239,68,68,0.06)",
            border: `1px solid ${allSet ? "rgba(22,163,74,0.2)" : status.tokenExpired ? "rgba(217,119,6,0.2)" : "rgba(239,68,68,0.2)"}`,
          }}
        >
          <div className="text-2xl">{allSet ? "✅" : status.tokenExpired ? "⚠️" : "🔴"}</div>
          <div>
            <p className="font-bold text-sm" style={{ color: allSet ? "#16A34A" : status.tokenExpired ? "#D97706" : "#DC2626" }}>
              {allSet
                ? "Snapchat Marketing API is fully configured and ready"
                : status.tokenExpired
                ? "Access token is expired — refresh it below or re-run OAuth"
                : "Snapchat is not fully configured — complete setup below"}
            </p>
            {!allSet && status.issues.length > 0 && (
              <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{status.issues[0]}</p>
            )}
          </div>
        </div>
      )}

      {/* Credentials checklist */}
      <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E2E8F0" }}>
        <h3 className="text-sm font-black mb-3" style={{ color: "#0F172A" }}>Secrets Checklist</h3>
        {status ? (
          <div>
            <SecretRow name="SNAPCHAT_CLIENT_ID"   isSet={status.clientIdSet} />
            <SecretRow name="SNAP_CLIENT_SECRET"   isSet={status.clientSecretSet} />
            <SecretRow name="SNAP_ACCESS_TOKEN"    isSet={status.accessTokenSet} masked={status.accessTokenMasked} isExpired={status.tokenExpired} />
            <SecretRow name="SNAP_REFRESH_TOKEN"   isSet={status.refreshTokenSet} masked={status.refreshTokenMasked} />
            <SecretRow name="SNAP_AD_ACCOUNT_ID"   isSet={status.adAccountIdSet} />
          </div>
        ) : (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {status && !status.clientSecretSet && (
          <div className="mt-3 rounded-xl px-4 py-3 text-xs font-medium" style={{ background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" }}>
            Add <strong>SNAP_CLIENT_SECRET</strong> from the Snapchat Developer Portal → your app → Credentials before OAuth can complete.
          </div>
        )}
      </div>

      {/* Callback URL */}
      <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E2E8F0" }}>
        <h3 className="text-sm font-black mb-1" style={{ color: "#0F172A" }}>Callback URL</h3>
        <p className="text-xs mb-3" style={{ color: "#64748B" }}>
          Add this exact URL to your Snapchat Developer Portal → App → OAuth Redirect URIs:
        </p>
        <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
          <code className="flex-1 text-xs font-mono break-all" style={{ color: "#374151" }}>
            {callbackUrl}
          </code>
          <CopyButton value={callbackUrl} label="Copy URL" />
        </div>
        <p className="text-[10px] mt-2" style={{ color: "#9CA3AF" }}>
          Register this exact URL in Snapchat Developer Portal → your app → OAuth Redirect URIs. No trailing slash.
        </p>
      </div>

      {/* OAuth flow error */}
      {oauthError && (
        <div className="rounded-2xl px-5 py-4" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <p className="font-bold text-sm" style={{ color: "#DC2626" }}>OAuth Error</p>
          <p className="text-xs mt-1" style={{ color: "#6B7280" }}>{oauthError}</p>
        </div>
      )}

      {/* New tokens from OAuth callback */}
      {oauthResult && (
        <div className="rounded-2xl p-5" style={{ background: "rgba(22,163,74,0.04)", border: "1px solid rgba(22,163,74,0.25)" }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🎉</span>
            <h3 className="text-sm font-black" style={{ color: "#16A34A" }}>OAuth Complete — Tokens Received</h3>
          </div>
          <p className="text-xs mb-4" style={{ color: "#6B7280" }}>
            {oauthResult.note ?? "These values are shown ONCE. Copy them into Replit Secrets now."}
          </p>
          <div className="space-y-3">
            <TokenRevealBox
              label="SNAP_ACCESS_TOKEN"
              value={oauthResult.SNAP_ACCESS_TOKEN}
              note={`Expires in ${Math.round((oauthResult.expiresIn ?? 1800) / 60)} minutes — store in Replit Secrets immediately`}
            />
            <TokenRevealBox
              label="SNAP_REFRESH_TOKEN"
              value={oauthResult.SNAP_REFRESH_TOKEN}
              note="Long-lived — store in Replit Secrets and keep safe"
            />
          </div>
          <div className="mt-4 rounded-xl p-4 text-xs space-y-1.5" style={{ background: "#F0FFF4", border: "1px solid #BBF7D0" }}>
            <p className="font-bold" style={{ color: "#166534" }}>Next steps:</p>
            <p style={{ color: "#166534" }}>1. Click "Reveal" and copy <strong>SNAP_ACCESS_TOKEN</strong> → paste into Replit Secrets</p>
            <p style={{ color: "#166534" }}>2. Click "Reveal" and copy <strong>SNAP_REFRESH_TOKEN</strong> → paste into Replit Secrets</p>
            <p style={{ color: "#166534" }}>3. Click "Discover Ad Accounts" below to find your SNAP_AD_ACCOUNT_ID</p>
            <p style={{ color: "#166534" }}>4. Click "Refresh Status" to verify Marketing API is ready</p>
          </div>
        </div>
      )}

      {/* Token refresh result */}
      {refreshResult && (
        <div
          className="rounded-2xl p-5"
          style={{
            background: refreshResult.success ? "rgba(22,163,74,0.04)" : "rgba(239,68,68,0.04)",
            border: `1px solid ${refreshResult.success ? "rgba(22,163,74,0.25)" : "rgba(239,68,68,0.2)"}`,
          }}
        >
          <h3 className="text-sm font-black mb-3" style={{ color: refreshResult.success ? "#16A34A" : "#DC2626" }}>
            {refreshResult.success ? "✓ Token Refreshed" : "✗ Refresh Failed"}
          </h3>
          {refreshResult.success ? (
            <>
              <div className="space-y-3">
                {refreshResult.SNAP_ACCESS_TOKEN && (
                  <TokenRevealBox
                    label="SNAP_ACCESS_TOKEN (new)"
                    value={refreshResult.SNAP_ACCESS_TOKEN}
                    note={refreshResult.expiresIn ? `Expires in ${Math.round(refreshResult.expiresIn / 60)} minutes` : undefined}
                  />
                )}
                {refreshResult.SNAP_REFRESH_TOKEN && (
                  <TokenRevealBox
                    label="SNAP_REFRESH_TOKEN (new)"
                    value={refreshResult.SNAP_REFRESH_TOKEN}
                    note="Update in Replit Secrets if changed"
                  />
                )}
              </div>
              {refreshResult.action_required && (
                <div className="mt-4 rounded-xl p-4 text-xs space-y-1" style={{ background: "#F0FFF4", border: "1px solid #BBF7D0" }}>
                  <p className="font-bold" style={{ color: "#166534" }}>Action required:</p>
                  {Object.values(refreshResult.action_required).map((step, i) => (
                    <p key={i} style={{ color: "#166534" }}>{step}</p>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm" style={{ color: "#DC2626" }}>{refreshResult.error}</p>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Connect / Re-connect */}
        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E2E8F0" }}>
          <h3 className="text-sm font-black mb-1" style={{ color: "#0F172A" }}>
            {status?.accessTokenSet ? "Re-connect Snapchat" : "Connect Snapchat"}
          </h3>
          <p className="text-xs mb-4" style={{ color: "#64748B" }}>
            {!status?.clientSecretSet
              ? "Add SNAP_CLIENT_SECRET from the Snapchat Developer Portal first."
              : status?.accessTokenSet
              ? "Re-run OAuth to get a fresh access token and refresh token."
              : "Start the Snapchat OAuth flow to generate your access and refresh tokens."}
          </p>
          <button
            onClick={handleConnect}
            disabled={!status?.clientConfigured}
            className="w-full py-3 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: status?.clientConfigured ? "linear-gradient(135deg, #FFFC00 0%, #FF6600 100%)" : "#E2E8F0", color: status?.clientConfigured ? "#000" : "#94A3B8" }}
          >
            {status?.accessTokenSet ? "Re-connect Snapchat →" : "Connect Snapchat →"}
          </button>
          {!status?.clientConfigured && (
            <p className="text-[10px] mt-2 text-center" style={{ color: "#DC2626" }}>
              SNAPCHAT_CLIENT_ID and SNAP_CLIENT_SECRET must both be set first
            </p>
          )}
        </div>

        {/* Refresh token */}
        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E2E8F0" }}>
          <h3 className="text-sm font-black mb-1" style={{ color: "#0F172A" }}>Refresh Token</h3>
          <p className="text-xs mb-4" style={{ color: "#64748B" }}>
            {status?.canRefresh
              ? "A refresh token is available. Attempt automatic token renewal without re-running the full OAuth flow."
              : "Requires SNAP_CLIENT_ID, SNAP_CLIENT_SECRET, and SNAP_REFRESH_TOKEN to be set."}
          </p>
          <button
            onClick={handleRefresh}
            disabled={refreshing || !status?.canRefresh}
            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: status?.canRefresh ? "#4285C7" : "#E2E8F0", color: status?.canRefresh ? "white" : "#94A3B8" }}
          >
            {refreshing ? "Refreshing…" : "Refresh Access Token"}
          </button>
          {!status?.refreshTokenSet && (
            <p className="text-[10px] mt-2 text-center" style={{ color: "#D97706" }}>
              Complete OAuth first to get SNAP_REFRESH_TOKEN
            </p>
          )}
        </div>
      </div>

      {/* Ad account discovery */}
      <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E2E8F0" }}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-black" style={{ color: "#0F172A" }}>Discover Ad Accounts</h3>
          <button
            onClick={handleDiscoverAccounts}
            disabled={accountsLoading || !status?.accessTokenSet || status?.tokenExpired}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: (status?.accessTokenSet && !status?.tokenExpired) ? "linear-gradient(135deg, #4285C7, #C13A2A)" : "#E2E8F0",
                     color: (status?.accessTokenSet && !status?.tokenExpired) ? "white" : "#94A3B8" }}
          >
            {accountsLoading ? "Discovering…" : "Discover →"}
          </button>
        </div>
        <p className="text-xs mb-4" style={{ color: "#64748B" }}>
          Lists all Snapchat organizations and ad accounts linked to the connected token.
          {!status?.accessTokenSet && " Requires a valid access token — complete OAuth first."}
          {status?.tokenExpired && " Token is expired — refresh it first."}
        </p>

        {accountsError && (
          <div className="rounded-xl px-4 py-3 text-xs font-medium" style={{ background: "rgba(239,68,68,0.06)", color: "#DC2626", border: "1px solid rgba(239,68,68,0.2)" }}>
            {accountsError}
          </div>
        )}

        {accounts && accounts.length === 0 && (
          <div className="rounded-xl px-4 py-3 text-xs font-medium" style={{ background: "#FEF3C7", color: "#92400E" }}>
            No ad accounts found for this Snapchat account. Ensure the connected user has Business Manager access.
          </div>
        )}

        {accounts && accounts.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold mb-2" style={{ color: "#374151" }}>
              Found {accounts.length} ad account{accounts.length !== 1 ? "s" : ""}:
            </p>
            {accounts.map((acct) => (
              <div
                key={acct.id}
                className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
              >
                <div>
                  <p className="text-xs font-bold" style={{ color: "#374151" }}>{acct.name}</p>
                  <p className="text-[10px] font-mono mt-0.5" style={{ color: "#9CA3AF" }}>ID: {acct.id}</p>
                  <p className="text-[10px]" style={{ color: "#9CA3AF" }}>
                    {acct.currency && `${acct.currency} · `}{acct.status && `${acct.status}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <CopyButton value={acct.id} label="Copy ID" />
                  {process.env["SNAP_AD_ACCOUNT_ID"] === acct.id && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "rgba(22,163,74,0.1)", color: "#16A34A" }}>Active</span>
                  )}
                </div>
              </div>
            ))}
            <div className="rounded-xl px-4 py-3 text-xs mt-2" style={{ background: "#F0F9FF", border: "1px solid #BAE6FD", color: "#0369A1" }}>
              <p className="font-bold mb-1">To set your ad account:</p>
              <p>1. Copy the ID of the account you want to use</p>
              <p>2. Open Replit Secrets and set <code className="font-mono font-bold">SNAP_AD_ACCOUNT_ID</code> = the copied ID</p>
              <p>3. Click "Refresh Status" to confirm</p>
            </div>
          </div>
        )}
      </div>

      {/* How to complete OAuth — step-by-step guide */}
      <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E2E8F0" }}>
        <h3 className="text-sm font-black mb-3" style={{ color: "#0F172A" }}>How to Complete Snapchat OAuth</h3>
        <ol className="space-y-3">
          {[
            { n: 1, done: status?.clientIdSet, text: "SNAPCHAT_CLIENT_ID is set in Replit Secrets", sub: "Get from Snapchat Developer Portal → your app → App Credentials" },
            { n: 2, done: status?.clientSecretSet, text: "SNAP_CLIENT_SECRET is set in Replit Secrets", sub: "Get from Snapchat Developer Portal → your app → App Credentials → OAuth 2.0" },
            { n: 3, done: false, text: `Add callback URL to Snapchat Developer Portal`, sub: `Redirect URI: ${callbackUrl}` },
            { n: 4, done: status?.accessTokenSet && !status?.tokenExpired, text: "Click 'Connect Snapchat' above to run the OAuth flow", sub: "You'll be redirected to Snapchat to authorize the app" },
            { n: 5, done: status?.accessTokenSet && !status?.tokenExpired, text: "Copy SNAP_ACCESS_TOKEN and SNAP_REFRESH_TOKEN into Replit Secrets", sub: "Tokens are shown once in admin UI after OAuth completes" },
            { n: 6, done: status?.adAccountIdSet, text: "Click 'Discover Ad Accounts' and set SNAP_AD_ACCOUNT_ID", sub: "Required for Snapchat Marketing API calls" },
          ].map(({ n, done, text, sub }) => (
            <li key={n} className="flex items-start gap-3">
              <div
                className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black"
                style={{ background: done ? "rgba(22,163,74,0.1)" : "rgba(0,0,0,0.06)", color: done ? "#16A34A" : "#94A3B8" }}
              >
                {done ? "✓" : n}
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: done ? "#16A34A" : "#374151" }}>{text}</p>
                <p className="text-[10px] mt-0.5 font-mono" style={{ color: "#9CA3AF" }}>{sub}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Snapchat Developer Portal link */}
      <div className="rounded-2xl px-5 py-4 flex items-center justify-between" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
        <div>
          <p className="text-sm font-bold" style={{ color: "#0F172A" }}>Snapchat Developer Portal</p>
          <p className="text-xs" style={{ color: "#64748B" }}>Manage your app credentials and OAuth settings</p>
        </div>
        <a
          href="https://developers.snapchat.com/ads/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-80"
          style={{ background: "linear-gradient(135deg, #FFFC00, #FF6600)", color: "#000" }}
        >
          Open Portal →
        </a>
      </div>
    </div>
  );
}

export default function SnapchatSetupPage() {
  return (
    <Suspense fallback={null}>
      <SnapchatSetupContent />
    </Suspense>
  );
}
