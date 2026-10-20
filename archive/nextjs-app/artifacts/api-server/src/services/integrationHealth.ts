/**
 * Central integration health engine.
 * Normalized IntegrationHealth type + action link registry for all integrations.
 */

export type IntegrationStatus =
  | "ready"
  | "partial"
  | "missing"
  | "expired"
  | "permission_error"
  | "quota_error"
  | "broken";

export interface IntegrationAction {
  label: string;
  type: "external" | "internal" | "oauth";
  url?: string;
  endpoint?: string;
  method?: string;
}

export interface IntegrationHealth {
  id: string;
  name: string;
  status: IntegrationStatus;
  credentialsPresent: boolean;
  credentialsValid: boolean | null;
  permissionsValid: boolean | null;
  actionReady: boolean;
  quotaOk: boolean | null;
  lastChecked: string;
  activeSecretName: string | null;
  maskedSecret: string | null;
  issues: string[];
  nextSteps: string[];
  actions: IntegrationAction[];
}

/** External management links per integration — shown as action buttons in the admin UI */
export const MANAGE_LINKS: Record<string, IntegrationAction[]> = {
  resend: [
    { label: "Resend Dashboard", type: "external", url: "https://resend.com" },
    { label: "API Keys", type: "external", url: "https://resend.com/api-keys" },
    { label: "Domains", type: "external", url: "https://resend.com/domains" },
  ],
  stripe: [
    { label: "Stripe Dashboard", type: "external", url: "https://dashboard.stripe.com" },
    { label: "API Keys", type: "external", url: "https://dashboard.stripe.com/apikeys" },
  ],
  meta: [
    { label: "Meta Business Manager", type: "external", url: "https://business.facebook.com/settings" },
    { label: "Meta Developers", type: "external", url: "https://developers.facebook.com/apps" },
  ],
  instagram: [
    { label: "Meta Business Manager", type: "external", url: "https://business.facebook.com/settings" },
  ],
  snapchat: [
    { label: "Snapchat Ads Manager", type: "external", url: "https://ads.snapchat.com" },
    { label: "Snap Developers", type: "external", url: "https://developers.snap.com" },
  ],
  google: [
    { label: "Google Cloud Console", type: "external", url: "https://console.cloud.google.com/apis/credentials" },
    { label: "Google Ads Manager", type: "external", url: "https://ads.google.com" },
  ],
  youtube: [
    { label: "YouTube Studio", type: "external", url: "https://studio.youtube.com" },
    { label: "Google Cloud Console", type: "external", url: "https://console.cloud.google.com/apis/credentials" },
  ],
  linkedin: [
    { label: "LinkedIn Developers", type: "external", url: "https://www.linkedin.com/developers/apps" },
  ],
  x: [
    { label: "X Developer Portal", type: "external", url: "https://developer.x.com/en/portal/dashboard" },
  ],
  tiktok: [
    { label: "TikTok Developers", type: "external", url: "https://developers.tiktok.com" },
    { label: "TikTok Ads Manager", type: "external", url: "https://ads.tiktok.com" },
  ],
  ai: [
    { label: "OpenAI Platform", type: "external", url: "https://platform.openai.com/api-keys" },
  ],
  aws: [
    { label: "AWS Console", type: "external", url: "https://console.aws.amazon.com/s3" },
  ],
  mongodb: [],
};

export function mask(v?: string): string {
  if (!v) return "NOT SET";
  if (v.length <= 8) return "****";
  return `${v.slice(0, 4)}****${v.slice(-4)}`;
}

/**
 * Compute overall status from component checks.
 */
export function deriveStatus(opts: {
  credentialsPresent: boolean;
  credentialsValid: boolean | null;
  permissionsValid: boolean | null;
  actionReady: boolean;
  quotaOk: boolean | null;
}): IntegrationStatus {
  if (!opts.credentialsPresent) return "missing";
  if (opts.credentialsValid === false) return "broken";
  if (opts.permissionsValid === false) return "permission_error";
  if (opts.quotaOk === false) return "quota_error";
  if (opts.actionReady) return "ready";
  return "partial";
}

export function buildHealth(
  id: string,
  name: string,
  opts: {
    credentialsPresent: boolean;
    credentialsValid: boolean | null;
    permissionsValid: boolean | null;
    actionReady: boolean;
    quotaOk?: boolean | null;
    activeSecretName?: string | null;
    maskedSecret?: string | null;
    issues?: string[];
    nextSteps?: string[];
    extraActions?: IntegrationAction[];
  }
): IntegrationHealth {
  const status = deriveStatus({
    credentialsPresent: opts.credentialsPresent,
    credentialsValid: opts.credentialsValid,
    permissionsValid: opts.permissionsValid,
    actionReady: opts.actionReady,
    quotaOk: opts.quotaOk ?? null,
  });

  const manageLinks = MANAGE_LINKS[id] ?? [];
  const extraActions = opts.extraActions ?? [];

  return {
    id,
    name,
    status,
    credentialsPresent: opts.credentialsPresent,
    credentialsValid: opts.credentialsValid,
    permissionsValid: opts.permissionsValid,
    actionReady: opts.actionReady,
    quotaOk: opts.quotaOk ?? null,
    lastChecked: new Date().toISOString(),
    activeSecretName: opts.activeSecretName ?? null,
    maskedSecret: opts.maskedSecret ?? null,
    issues: opts.issues ?? [],
    nextSteps: opts.nextSteps ?? [],
    actions: [...manageLinks, ...extraActions],
  };
}
