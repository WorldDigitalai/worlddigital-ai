/**
 * Secret Resolver — multi-alias fallback for all integration env vars.
 *
 * Exports:
 *   resolveEnv(...candidates)     — fast presence check, returns first set value
 *   resolveSecret(opts)           — validated resolution with caching and logging
 *   scanAllSecrets()              — full alias scan (presence only, cached 10 min)
 *   scanIntegration(id)           — scan one integration by ID
 *   clearResolverCache()          — bust all caches
 *
 * Safety rules enforced here:
 *   - Raw values are NEVER logged or returned to callers.
 *   - Only masked values and key names are surfaced.
 */

import { logger } from "./logger.js";
import { SECRET_ALIASES, type AliasGroup, type IntegrationAliases } from "../config/secretAliases.js";

// ── Constants ─────────────────────────────────────────────────────────────────

const PRESENCE_CACHE_TTL_MS = 10 * 60 * 1000;   // 10 minutes for presence scan
const PURPOSE_CACHE_TTL_MS  = 10 * 60 * 1000;   // 10 minutes for validated resolution

// ── Types — presence scan ─────────────────────────────────────────────────────

export interface CandidateResult {
  key: string;
  present: boolean;
  masked: string | null;
  isActive: boolean;
}

export interface ResolvedGroup {
  label: string;
  required: boolean;
  hint?: string;
  activeKey: string | null;
  activeMasked: string | null;
  candidates: CandidateResult[];
  conflict: boolean;
  conflictingKeys: string[];
}

export interface ResolvedIntegration {
  id: string;
  name: string;
  groups: ResolvedGroup[];
  fullyResolved: boolean;
  missingRequired: string[];
  conflicts: string[];
  presentCount: number;
  requiredCount: number;
}

// ── Types — validated resolution ──────────────────────────────────────────────

export interface TestedCandidate {
  name: string;
  present: boolean;
  valid?: boolean;
  reason?: string;
}

export interface ResolveSecretOptions {
  integration: string;
  purpose: string;
  candidates: string[];
  validator?: (value: string) => Promise<{ valid: boolean; reason?: string }>;
  ttlMs?: number;
}

export interface ResolveSecretResult {
  ok: boolean;
  integration: string;
  purpose: string;
  activeName: string | null;
  maskedValue: string | null;
  tested: TestedCandidate[];
  checkedAt: string;
  issues: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function mask(v?: string): string | null {
  if (!v) return null;
  if (v.length <= 8) return "****";
  return `${v.slice(0, 4)}****${v.slice(-4)}`;
}

// ── Caches ────────────────────────────────────────────────────────────────────

let _presenceCache: ResolvedIntegration[] | null = null;
let _presenceCacheTs = 0;

const _purposeCache = new Map<string, { result: ResolveSecretResult; ts: number }>();

export function clearResolverCache(): void {
  _presenceCache = null;
  _presenceCacheTs = 0;
  _purposeCache.clear();
  logger.info("Secret resolver: all caches cleared");
}

// ── Core: resolveEnv ──────────────────────────────────────────────────────────

/**
 * Returns the trimmed value of the first env var in `candidates` that is set
 * and non-empty. Logs the winning key name (never the value) when fallback used.
 */
export function resolveEnv(...candidates: string[]): string | undefined {
  for (const key of candidates) {
    const val = process.env[key];
    if (val && val.trim()) {
      if (candidates.length > 1 && key !== candidates[0]) {
        logger.debug({ resolvedKey: key, primaryKey: candidates[0] }, "Secret resolved via alias");
      }
      return val.trim();
    }
  }
  return undefined;
}

// ── Core: resolveSecret ───────────────────────────────────────────────────────

/**
 * Resolves a secret with optional live validation.
 * Results are cached per (integration, purpose) for `ttlMs` (default 10 min).
 * If a validator is provided, each present candidate is tested in order and the
 * first that passes is used. Invalid candidates are logged and skipped.
 */
export async function resolveSecret(
  opts: ResolveSecretOptions
): Promise<ResolveSecretResult> {
  const cacheKey = `${opts.integration}::${opts.purpose}`;
  const ttl = opts.ttlMs ?? PURPOSE_CACHE_TTL_MS;
  const now = Date.now();

  const cached = _purposeCache.get(cacheKey);
  if (cached && now - cached.ts < ttl) {
    return cached.result;
  }

  const tested: TestedCandidate[] = [];
  const issues: string[] = [];
  let activeName: string | null = null;
  let activeMasked: string | null = null;

  for (const name of opts.candidates) {
    const raw = process.env[name];
    if (!raw || !raw.trim()) {
      tested.push({ name, present: false });
      continue;
    }

    const val = raw.trim();

    if (!opts.validator) {
      tested.push({ name, present: true, valid: true });
      if (!activeName) {
        activeName = name;
        activeMasked = mask(val);
      }
      continue;
    }

    // Run the validator — never pass raw value outside this function
    try {
      const { valid, reason } = await opts.validator(val);
      tested.push({ name, present: true, valid, reason });
      if (valid && !activeName) {
        activeName = name;
        activeMasked = mask(val);
        logger.info(
          { integration: opts.integration, purpose: opts.purpose, activeName },
          "Secret selected by resolver"
        );
      } else if (!valid) {
        logger.warn(
          { integration: opts.integration, purpose: opts.purpose, candidateName: name, reason },
          "Secret candidate failed validation"
        );
        issues.push(`${name}: ${reason ?? "validation failed"}`);
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "validator threw";
      tested.push({ name, present: true, valid: false, reason: errMsg });
      issues.push(`${name}: validator error — ${errMsg}`);
    }
  }

  const ok = activeName !== null;
  if (!ok) {
    const tried = opts.candidates.join(", ");
    const msg = `No valid ${opts.purpose} found for ${opts.integration} — tried: ${tried}`;
    issues.push(msg);
    logger.error(
      { integration: opts.integration, purpose: opts.purpose, candidates: opts.candidates },
      "Secret resolver: no valid candidate found"
    );
  } else {
    // Log fallback selection when a non-primary alias was selected
    if (activeName !== opts.candidates[0]) {
      logger.warn(
        { integration: opts.integration, purpose: opts.purpose, activeName, primary: opts.candidates[0] },
        "Secret resolver: using alias instead of primary key"
      );
    }
  }

  const result: ResolveSecretResult = {
    ok,
    integration: opts.integration,
    purpose: opts.purpose,
    activeName,
    maskedValue: activeMasked,
    tested,
    checkedAt: new Date().toISOString(),
    issues,
  };

  _purposeCache.set(cacheKey, { result, ts: now });
  return result;
}

// ── Presence scan ─────────────────────────────────────────────────────────────

/**
 * Scans all integrations in SECRET_ALIASES and returns a structured presence
 * report. Results are cached for PRESENCE_CACHE_TTL_MS (10 min).
 * Call clearResolverCache() to force refresh.
 */
export function scanAllSecrets(): ResolvedIntegration[] {
  const now = Date.now();
  if (_presenceCache && now - _presenceCacheTs < PRESENCE_CACHE_TTL_MS) {
    return _presenceCache;
  }

  const result: ResolvedIntegration[] = SECRET_ALIASES.map(
    (integration: IntegrationAliases) => _resolveIntegration(integration)
  );

  _presenceCache = result;
  _presenceCacheTs = now;

  const issues = result.filter((r) => r.missingRequired.length > 0 || r.conflicts.length > 0);
  if (issues.length > 0) {
    logger.warn(
      {
        integrations: issues.map((i) => ({
          id: i.id,
          missingRequired: i.missingRequired,
          conflicts: i.conflicts,
        })),
      },
      "Secret resolver scan: integrations with issues"
    );
  }

  return result;
}

/**
 * Scan a single integration by ID.
 */
export function scanIntegration(id: string): ResolvedIntegration | null {
  const def = SECRET_ALIASES.find((a) => a.id === id);
  if (!def) return null;
  return _resolveIntegration(def);
}

// ── Private helpers ───────────────────────────────────────────────────────────

function _resolveIntegration(integration: IntegrationAliases): ResolvedIntegration {
  const missingRequired: string[] = [];
  const conflicts: string[] = [];

  const groups: ResolvedGroup[] = integration.groups.map((group: AliasGroup) => {
    const candidates: CandidateResult[] = group.candidates.map((key) => {
      const val = process.env[key];
      const present = !!(val && val.trim());
      return { key, present, masked: present ? mask(val) : null, isActive: false };
    });

    const presentCandidates = candidates.filter((c) => c.present);
    const conflict = presentCandidates.length > 1;

    let activeKey: string | null = null;
    let activeMasked: string | null = null;

    if (presentCandidates.length > 0) {
      presentCandidates[0].isActive = true;
      activeKey = presentCandidates[0].key;
      activeMasked = presentCandidates[0].masked;
    }

    if (conflict) {
      conflicts.push(
        `${group.label}: multiple keys set (${presentCandidates.map((c) => c.key).join(", ")}) — "${activeKey}" wins`
      );
    }

    if (group.required && !activeKey) {
      missingRequired.push(group.label);
    }

    return {
      label: group.label,
      required: group.required,
      hint: group.hint,
      activeKey,
      activeMasked,
      candidates,
      conflict,
      conflictingKeys: conflict ? presentCandidates.map((c) => c.key) : [],
    };
  });

  const requiredCount = integration.groups.filter((g) => g.required).length;
  const presentCount = groups.filter((g) => g.activeKey !== null).length;

  return {
    id: integration.id,
    name: integration.name,
    groups,
    fullyResolved: missingRequired.length === 0,
    missingRequired,
    conflicts,
    presentCount,
    requiredCount,
  };
}
