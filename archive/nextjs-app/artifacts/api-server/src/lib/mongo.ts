import { MongoClient, type Db, type Collection } from "mongodb";
import { logger } from "./logger.js";

let client: MongoClient | null = null;
let _db: Db | null = null;

export async function connectMongo(): Promise<Db> {
  if (_db) return _db;

  const uri = process.env["MONGODB_URI"];
  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }

  client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  });

  await client.connect();
  _db = client.db();
  logger.info("MongoDB connected");
  return _db;
}

export function getDb(): Db {
  if (!_db) throw new Error("MongoDB not connected — call connectMongo() first");
  return _db;
}

export function getCollection<T extends object>(name: string): Collection<T> {
  return getDb().collection<T>(name);
}

export async function closeMongo(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    _db = null;
  }
}

export async function pingMongo(): Promise<boolean> {
  try {
    if (_db) {
      await _db.admin().ping();
      return true;
    }
    const uri = process.env["MONGODB_URI"];
    if (!uri) return false;
    const testClient = new MongoClient(uri, { serverSelectionTimeoutMS: 4000 });
    await testClient.connect();
    await testClient.db().admin().ping();
    await testClient.close();
    return true;
  } catch {
    return false;
  }
}

export async function createIndexes(): Promise<void> {
  if (!_db) return;
  try {
    const db = _db;

    await Promise.all([
      db.collection("users").createIndex({ email: 1 }, { unique: true, background: true }),

      db.collection("generatedContent").createIndex({ userId: 1 }, { background: true }),
      db.collection("generatedContent").createIndex({ userId: 1, status: 1 }, { background: true }),
      db.collection("generatedContent").createIndex({ userId: 1, createdAt: -1 }, { background: true }),

      db.collection("publishingJobs").createIndex({ userId: 1 }, { background: true }),
      db.collection("publishingJobs").createIndex({ userId: 1, status: 1 }, { background: true }),
      db.collection("publishingJobs").createIndex({ userId: 1, scheduledFor: 1 }, { background: true }),

      db.collection("postAnalytics").createIndex({ userId: 1 }, { background: true }),
      db.collection("postAnalytics").createIndex({ userId: 1, platform: 1 }, { background: true }),
      db.collection("postAnalytics").createIndex({ userId: 1, publishedAt: -1 }, { background: true }),

      db.collection("usageCredits").createIndex({ userId: 1 }, { unique: true, background: true }),

      db.collection("businessProfiles").createIndex({ userId: 1 }, { unique: true, background: true }),

      db.collection("adGenerations").createIndex({ userId: 1, createdAt: -1 }, { background: true }),

      db.collection("tokens").createIndex({ userId: 1 }, { unique: true, background: true }),
      db.collection("tokenTransactions").createIndex({ userId: 1, timestamp: -1 }, { background: true }),
      db.collection("tokenCosts").createIndex({ action: 1 }, { unique: true, background: true }),

      db.collection("subscriptionInvoices").createIndex({ customerId: 1, createdAt: -1 }, { background: true }),
      db.collection("subscriptionInvoices").createIndex({ subscriptionId: 1 }, { background: true }),
      db.collection("subscriptionInvoices").createIndex({ userId: 1 }, { background: true }),

      db.collection("userSubscriptions").createIndex({ userId: 1, status: 1 }, { background: true }),
      db.collection("userSubscriptions").createIndex({ stripeSubscriptionId: 1 }, { unique: true, background: true }),
      db.collection("userSubscriptions").createIndex({ stripeCustomerId: 1 }, { background: true }),

      db.collection("userPlatformTokens").createIndex({ userId: 1, platform: 1 }, { unique: true, background: true }),
      db.collection("adCampaigns").createIndex({ userId: 1, createdAt: -1 }, { background: true }),
    ]);

    logger.info("MongoDB indexes ensured");
  } catch (err) {
    logger.warn({ err }, "MongoDB index creation warning (non-fatal)");
  }
}
