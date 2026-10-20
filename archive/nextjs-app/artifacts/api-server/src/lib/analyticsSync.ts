import { getCollection } from "./mongo.js";
import { logger } from "./logger.js";
import { ObjectId } from "mongodb";

interface PostAnalyticsDoc {
  _id?: ObjectId;
  userId: string;
  generatedContentId: string;
  publishingJobId: string;
  platform: string;
  postId?: string;
  postUrl?: string;
  businessName: string;
  destinationUrl: string;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  ctr: number;
  engagementRate: number;
  analyticsStatus: "live" | "pending" | "stub";
  publishedAt: Date;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface MetaInsightValue { name: string; period: string; values: Array<{ value: number }> }

async function syncMetaPostAnalytics(postId: string, accessToken: string): Promise<Partial<PostAnalyticsDoc> | null> {
  try {
    const metrics = ["post_impressions", "post_reach", "post_reactions_by_type_total", "post_clicks", "post_shares"];
    const url = `https://graph.facebook.com/v19.0/${postId}/insights?metric=${metrics.join(",")}&access_token=${accessToken}`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const body = await resp.json() as { data?: MetaInsightValue[] };
    if (!body.data) return null;

    const get = (name: string) => body.data!.find(d => d.name === name)?.values?.[0]?.value ?? 0;

    const impressions = get("post_impressions");
    const reach = get("post_reach");
    const clicks = get("post_clicks");
    const shares = get("post_shares");
    const reactions = get("post_reactions_by_type_total");
    const likes = typeof reactions === "object" && reactions !== null ? Object.values(reactions as Record<string, number>).reduce((a, b) => a + b, 0) : 0;

    return {
      impressions,
      reach,
      likes,
      clicks,
      shares,
      ctr: impressions > 0 ? parseFloat((clicks / impressions * 100).toFixed(2)) : 0,
      engagementRate: reach > 0 ? parseFloat(((likes + shares) / reach * 100).toFixed(2)) : 0,
      analyticsStatus: "live",
    };
  } catch (err) {
    logger.warn({ err, postId }, "Meta analytics sync failed");
    return null;
  }
}

async function syncInstagramPostAnalytics(mediaId: string, accessToken: string): Promise<Partial<PostAnalyticsDoc> | null> {
  try {
    const metrics = ["impressions", "reach", "likes", "comments", "saved", "shares"];
    const url = `https://graph.facebook.com/v19.0/${mediaId}/insights?metric=${metrics.join(",")}&access_token=${accessToken}`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const body = await resp.json() as { data?: MetaInsightValue[] };
    if (!body.data) return null;

    const get = (name: string) => body.data!.find(d => d.name === name)?.values?.[0]?.value ?? 0;

    const impressions = get("impressions");
    const reach = get("reach");
    const likes = get("likes");
    const comments = get("comments");
    const saves = get("saved");
    const shares = get("shares");
    const engagement = likes + comments + saves + shares;

    return {
      impressions,
      reach,
      likes,
      comments,
      saves,
      shares,
      engagementRate: reach > 0 ? parseFloat((engagement / reach * 100).toFixed(2)) : 0,
      analyticsStatus: "live",
    };
  } catch (err) {
    logger.warn({ err, mediaId }, "Instagram analytics sync failed");
    return null;
  }
}

export async function syncAnalyticsForPost(doc: PostAnalyticsDoc): Promise<Partial<PostAnalyticsDoc>> {
  const col = getCollection<PostAnalyticsDoc>("postAnalytics");
  let updates: Partial<PostAnalyticsDoc> = {};

  try {
    if (doc.platform === "meta" || doc.platform === "facebook") {
      const token = process.env["META_PAGE_ACCESS_TOKEN"];
      if (token && doc.postId) {
        const result = await syncMetaPostAnalytics(doc.postId, token);
        if (result) updates = result;
      }
    } else if (doc.platform === "instagram") {
      const token = process.env["META_PAGE_ACCESS_TOKEN"];
      if (token && doc.postId) {
        const result = await syncInstagramPostAnalytics(doc.postId, token);
        if (result) updates = result;
      }
    } else {
      updates = { analyticsStatus: "pending" };
    }

    if (Object.keys(updates).length > 0) {
      updates.lastSyncedAt = new Date();
      updates.updatedAt = new Date();
      await col.updateOne(
        { _id: doc._id } as Parameters<typeof col.updateOne>[0],
        { $set: updates }
      );
    }
  } catch (err) {
    logger.error({ err, postId: doc.postId, platform: doc.platform }, "Analytics sync error");
  }

  return updates;
}

export async function syncAllAnalyticsForUser(userId: string): Promise<{ synced: number; errors: number }> {
  const col = getCollection<PostAnalyticsDoc>("postAnalytics");
  const docs = await col.find({ userId } as Parameters<typeof col.find>[0]).toArray();

  let synced = 0;
  let errors = 0;

  for (const doc of docs) {
    try {
      await syncAnalyticsForPost(doc);
      synced++;
    } catch {
      errors++;
    }
  }

  return { synced, errors };
}

export type { PostAnalyticsDoc };
