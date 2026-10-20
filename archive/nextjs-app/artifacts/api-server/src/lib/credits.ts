import { getCollection } from "./mongo.js";

export type ContentType = "caption" | "imagePost" | "reel" | "videoAd" | "socialPost";

export interface UsageCreditsDoc {
  userId: string;
  packageId: string;
  captionsLimit: number;
  captionsUsed: number;
  imagePostsLimit: number;
  imagePostsUsed: number;
  reelsLimit: number;
  reelsUsed: number;
  videoAdsLimit: number;
  videoAdsUsed: number;
  socialPostsLimit: number;
  socialPostsUsed: number;
  resetDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

function defaultLimits(packageId: string): Partial<UsageCreditsDoc> {
  if (packageId === "all-monthly" || packageId === "all-yearly") {
    return { captionsLimit: 50, imagePostsLimit: 25, reelsLimit: 15, videoAdsLimit: 5, socialPostsLimit: 15 };
  }
  if (packageId.includes("monthly") || packageId.includes("yearly")) {
    return { captionsLimit: 20, imagePostsLimit: 10, reelsLimit: 5, videoAdsLimit: 2, socialPostsLimit: 5 };
  }
  if (packageId === "custom") {
    return { captionsLimit: 30, imagePostsLimit: 15, reelsLimit: 8, videoAdsLimit: 3, socialPostsLimit: 10 };
  }
  return { captionsLimit: 3, imagePostsLimit: 2, reelsLimit: 1, videoAdsLimit: 0, socialPostsLimit: 1 };
}

const ZERO = { captionsUsed: 0, imagePostsUsed: 0, reelsUsed: 0, videoAdsUsed: 0, socialPostsUsed: 0 };

const CREDIT_MAP: Record<ContentType, { limit: keyof UsageCreditsDoc; used: keyof UsageCreditsDoc }> = {
  caption:    { limit: "captionsLimit",    used: "captionsUsed" },
  imagePost:  { limit: "imagePostsLimit",  used: "imagePostsUsed" },
  reel:       { limit: "reelsLimit",       used: "reelsUsed" },
  videoAd:    { limit: "videoAdsLimit",    used: "videoAdsUsed" },
  socialPost: { limit: "socialPostsLimit", used: "socialPostsUsed" },
};

export async function ensureUserCredits(userId: string, packageId: string): Promise<UsageCreditsDoc> {
  const col = getCollection<UsageCreditsDoc>("usageCredits");
  const now = new Date();
  const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const limits = defaultLimits(packageId);

  let doc = await col.findOne({ userId });

  if (!doc) {
    const newDoc: UsageCreditsDoc = {
      userId, packageId,
      captionsLimit: 3, imagePostsLimit: 2, reelsLimit: 1, videoAdsLimit: 0, socialPostsLimit: 1,
      ...limits, ...ZERO,
      resetDate: nextReset, createdAt: now, updatedAt: now,
    };
    await col.insertOne(newDoc);
    return (await col.findOne({ userId }))!;
  }

  if (now >= doc.resetDate || doc.packageId !== packageId) {
    await col.updateOne({ userId }, {
      $set: {
        packageId, ...limits, ...ZERO,
        resetDate: nextReset, updatedAt: now,
      },
    });
    return (await col.findOne({ userId }))!;
  }

  return doc;
}

export async function getUserCredits(userId: string): Promise<UsageCreditsDoc | null> {
  return getCollection<UsageCreditsDoc>("usageCredits").findOne({ userId });
}

export async function canGenerate(userId: string, contentType: ContentType): Promise<boolean> {
  const doc = await getUserCredits(userId);
  if (!doc) return false;
  const { limit, used } = CREDIT_MAP[contentType];
  return (doc[used] as number) < (doc[limit] as number);
}

export async function consumeCredit(userId: string, contentType: ContentType): Promise<boolean> {
  const doc = await getUserCredits(userId);
  if (!doc) return false;
  const { limit, used } = CREDIT_MAP[contentType];
  if ((doc[used] as number) >= (doc[limit] as number)) return false;
  await getCollection<UsageCreditsDoc>("usageCredits").updateOne(
    { userId },
    { $inc: { [used]: 1 }, $set: { updatedAt: new Date() } }
  );
  return true;
}

export async function releaseCredit(userId: string, contentType: ContentType): Promise<void> {
  const { used } = CREDIT_MAP[contentType];
  await getCollection<UsageCreditsDoc>("usageCredits").updateOne(
    { userId },
    { $inc: { [used]: -1 }, $set: { updatedAt: new Date() } }
  );
}
