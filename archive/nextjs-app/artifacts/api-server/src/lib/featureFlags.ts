/**
 * Feature Flags — DB-backed with env override.
 * Stored in MongoDB collection: featureFlags
 * Falls back to sensible defaults if DB is unavailable.
 */

import { getCollection } from "./mongo.js";
import { logger } from "./logger.js";

export type FlagKey =
  | "ai_generation"
  | "publishing"
  | "ads"
  | "analytics"
  | "demo_mode"
  | "blog"
  | "assistant"
  | "custom_packages"
  | "social_dry_run"
  | "ads_dry_run";

export interface FeatureFlagDoc {
  key: FlagKey;
  enabled: boolean;
  label: string;
  description: string;
  updatedAt: Date;
  updatedBy?: string;
}

const DEFAULTS: Record<FlagKey, { enabled: boolean; label: string; description: string }> = {
  ai_generation:   { enabled: true,  label: "AI Content Generation", description: "Allow users to generate AI content via Content Studio" },
  publishing:      { enabled: true,  label: "Social Publishing",     description: "Allow content to be published to social platforms" },
  ads:             { enabled: true,  label: "Paid Ads Launch",       description: "Allow users to launch paid ad campaigns" },
  analytics:       { enabled: true,  label: "Analytics Dashboard",   description: "Show performance analytics to users and admins" },
  demo_mode:       { enabled: false, label: "Demo Mode",             description: "Show demo data to unauthenticated visitors" },
  blog:            { enabled: true,  label: "Blog",                  description: "Enable public blog and admin blog management" },
  assistant:       { enabled: true,  label: "AI Assistant",          description: "Enable the floating AI Growth Operator chat widget" },
  custom_packages: { enabled: true,  label: "Custom Packages",       description: "Allow users to build custom service packages" },
  social_dry_run:  { enabled: false, label: "Social Dry Run",        description: "Simulate social posts without actually publishing (SOCIAL_DRY_RUN)" },
  ads_dry_run:     { enabled: false, label: "Ads Dry Run",           description: "Simulate ad launches without real spend (ADS_DRY_RUN)" },
};

export async function getAllFlags(): Promise<FeatureFlagDoc[]> {
  try {
    const col = getCollection<FeatureFlagDoc>("featureFlags");
    const docs = await col.find({}).toArray();
    const docMap = new Map(docs.map((d) => [d.key, d]));

    // Merge DB values with defaults — ensure all keys exist
    const flags: FeatureFlagDoc[] = (Object.keys(DEFAULTS) as FlagKey[]).map((key) => {
      const def = DEFAULTS[key];
      const dbDoc = docMap.get(key);

      // Env overrides for dry-run flags
      let enabled = dbDoc?.enabled ?? def.enabled;
      if (key === "social_dry_run") enabled = process.env["SOCIAL_DRY_RUN"] === "true";
      if (key === "ads_dry_run")    enabled = process.env["ADS_DRY_RUN"] === "true";

      return {
        key,
        enabled,
        label: def.label,
        description: def.description,
        updatedAt: dbDoc?.updatedAt ?? new Date(),
        updatedBy: dbDoc?.updatedBy,
      };
    });

    return flags;
  } catch (err) {
    logger.warn({ err }, "Failed to load feature flags — using defaults");
    return (Object.keys(DEFAULTS) as FlagKey[]).map((key) => ({
      key,
      enabled: DEFAULTS[key].enabled,
      label: DEFAULTS[key].label,
      description: DEFAULTS[key].description,
      updatedAt: new Date(),
    }));
  }
}

export async function getFlag(key: FlagKey): Promise<boolean> {
  // Env overrides always win for dry-run flags
  if (key === "social_dry_run") return process.env["SOCIAL_DRY_RUN"] === "true";
  if (key === "ads_dry_run")    return process.env["ADS_DRY_RUN"] === "true";

  try {
    const doc = await getCollection<FeatureFlagDoc>("featureFlags").findOne({ key });
    return doc?.enabled ?? DEFAULTS[key]?.enabled ?? true;
  } catch {
    return DEFAULTS[key]?.enabled ?? true;
  }
}

export async function setFlag(key: FlagKey, enabled: boolean, updatedBy?: string): Promise<void> {
  const col = getCollection<FeatureFlagDoc>("featureFlags");
  await col.updateOne(
    { key },
    {
      $set: {
        key,
        enabled,
        label: DEFAULTS[key]?.label ?? key,
        description: DEFAULTS[key]?.description ?? "",
        updatedAt: new Date(),
        updatedBy,
      },
    },
    { upsert: true }
  );
}
