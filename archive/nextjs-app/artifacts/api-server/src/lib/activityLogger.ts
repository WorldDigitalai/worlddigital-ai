/**
 * Activity + Admin Audit Logger
 * Writes to MongoDB collections: activityLogs, adminAuditLogs, webhookLogs
 * Never throws — log failures are silent so they don't break request handlers.
 */

import { getCollection } from "./mongo.js";
import { logger } from "./logger.js";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ActivityLogDoc {
  userId: string;
  action: string;
  category: "content" | "publishing" | "billing" | "auth" | "profile" | "credits" | "ads" | "system";
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface AdminAuditLogDoc {
  adminId: string;
  action: string;
  targetType: "user" | "publishing_job" | "content" | "subscription" | "feature_flag" | "integration" | "system";
  targetId?: string;
  targetEmail?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  createdAt: Date;
}

export interface WebhookLogDoc {
  source: "stripe" | "meta" | "snapchat" | "tiktok" | "other";
  eventType: string;
  eventId?: string;
  status: "received" | "processed" | "failed" | "ignored";
  metadata?: Record<string, unknown>;
  error?: string;
  createdAt: Date;
}

// ── Activity Logs ──────────────────────────────────────────────────────────────

export async function logActivity(
  userId: string,
  action: string,
  category: ActivityLogDoc["category"],
  metadata?: Record<string, unknown>,
  req?: { ip?: string; headers?: Record<string, string | string[] | undefined> }
): Promise<void> {
  try {
    const doc: ActivityLogDoc = {
      userId,
      action,
      category,
      metadata,
      ip: req?.ip,
      userAgent: req?.headers?.["user-agent"] as string | undefined,
      createdAt: new Date(),
    };
    await getCollection<ActivityLogDoc>("activityLogs").insertOne(doc);
  } catch (err) {
    logger.warn({ err, userId, action }, "Failed to write activity log");
  }
}

// ── Admin Audit Logs ───────────────────────────────────────────────────────────

export async function logAdminAudit(
  adminId: string,
  action: string,
  targetType: AdminAuditLogDoc["targetType"],
  options?: {
    targetId?: string;
    targetEmail?: string;
    metadata?: Record<string, unknown>;
    ip?: string;
  }
): Promise<void> {
  try {
    const doc: AdminAuditLogDoc = {
      adminId,
      action,
      targetType,
      targetId: options?.targetId,
      targetEmail: options?.targetEmail,
      metadata: options?.metadata,
      ip: options?.ip,
      createdAt: new Date(),
    };
    await getCollection<AdminAuditLogDoc>("adminAuditLogs").insertOne(doc);
  } catch (err) {
    logger.warn({ err, adminId, action }, "Failed to write admin audit log");
  }
}

// ── Webhook Logs ───────────────────────────────────────────────────────────────

export async function logWebhookEvent(
  source: WebhookLogDoc["source"],
  eventType: string,
  status: WebhookLogDoc["status"],
  options?: { eventId?: string; metadata?: Record<string, unknown>; error?: string }
): Promise<void> {
  try {
    const doc: WebhookLogDoc = {
      source,
      eventType,
      eventId: options?.eventId,
      status,
      metadata: options?.metadata,
      error: options?.error,
      createdAt: new Date(),
    };
    await getCollection<WebhookLogDoc>("webhookLogs").insertOne(doc);
  } catch (err) {
    logger.warn({ err, source, eventType }, "Failed to write webhook log");
  }
}
