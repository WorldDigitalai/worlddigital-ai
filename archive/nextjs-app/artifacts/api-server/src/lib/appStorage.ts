import { Storage } from "@google-cloud/storage";
import { randomUUID } from "crypto";
import { Readable } from "stream";
import { logger } from "./logger.js";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

const storageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  } as Record<string, unknown>,
  projectId: "",
});

function getBucketId(): string {
  const id = process.env["DEFAULT_OBJECT_STORAGE_BUCKET_ID"];
  if (!id) throw new Error("DEFAULT_OBJECT_STORAGE_BUCKET_ID is not set");
  return id;
}

export function isObjectStorageConfigured(): boolean {
  return !!process.env["DEFAULT_OBJECT_STORAGE_BUCKET_ID"];
}

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
  };
  return map[mime] ?? "bin";
}

export async function uploadLogoBuffer(
  buffer: Buffer,
  mimetype: string,
  _originalName: string
): Promise<string> {
  const bucketId = getBucketId();
  const ext = extFromMime(mimetype);
  const objectId = `${randomUUID()}.${ext}`;
  const objectPath = `logos/${objectId}`;

  const bucket = storageClient.bucket(bucketId);
  const file = bucket.file(objectPath);

  await file.save(buffer, { contentType: mimetype, resumable: false });
  logger.info({ bucketId, objectPath }, "Logo uploaded to Object Storage");

  return objectId;
}

export async function streamLogo(
  objectId: string
): Promise<{ stream: Readable; contentType: string } | null> {
  const bucketId = getBucketId();
  const objectPath = `logos/${objectId}`;

  const bucket = storageClient.bucket(bucketId);
  const file = bucket.file(objectPath);

  const [exists] = await file.exists();
  if (!exists) return null;

  const [metadata] = await file.getMetadata();
  const contentType = (metadata.contentType as string) || "application/octet-stream";
  const stream = file.createReadStream();

  return { stream, contentType };
}
