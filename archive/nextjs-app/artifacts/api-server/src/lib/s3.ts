import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { randomUUID } from "crypto";
import { logger } from "./logger.js";

function createClient(): S3Client | null {
  const keyId = process.env["AWS_ACCESS_KEY_ID"];
  const secret = process.env["AWS_SECRET_ACCESS_KEY"];
  const region = process.env["AWS_REGION"] || "us-east-1";
  if (!keyId || !secret) return null;
  return new S3Client({ region, credentials: { accessKeyId: keyId, secretAccessKey: secret } });
}

function getBucket(): string {
  const b = process.env["S3_BUCKET_NAME"];
  if (!b) throw new Error("S3_BUCKET_NAME is not configured");
  return b;
}

export type S3Folder = "logos" | "resumes" | "cover-letters" | "generated-images";

export interface UploadResult {
  url: string;
  key: string;
}

const ALLOWED_MIME_TYPES: Record<S3Folder, string[]> = {
  logos: ["image/png", "image/jpeg", "image/webp", "image/svg+xml"],
  resumes: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  "cover-letters": ["application/pdf", "text/plain", "application/msword"],
  "generated-images": ["image/png", "image/jpeg", "image/webp"],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function validateFile(
  folder: S3Folder,
  mimeType: string,
  sizeBytes: number
): { valid: boolean; error?: string } {
  const allowed = ALLOWED_MIME_TYPES[folder];
  if (!allowed.includes(mimeType)) {
    return { valid: false, error: `File type "${mimeType}" is not allowed for ${folder}` };
  }
  if (sizeBytes > MAX_FILE_SIZE) {
    return { valid: false, error: `File size exceeds 10 MB limit` };
  }
  return { valid: true };
}

export async function uploadToS3(
  folder: S3Folder,
  buffer: Buffer,
  mimeType: string,
  originalName: string
): Promise<UploadResult> {
  const s3 = createClient();
  if (!s3) throw new Error("AWS S3 is not configured");

  const bucket = getBucket();
  const ext = originalName.split(".").pop() || "bin";
  const key = `${folder}/${randomUUID()}.${ext}`;

  const upload = new Upload({
    client: s3,
    params: {
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    },
  });

  await upload.done();
  const region = process.env["AWS_REGION"] || "us-east-1";
  const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  logger.info({ key, folder }, "File uploaded to S3");
  return { url, key };
}

export async function deleteFromS3(key: string): Promise<void> {
  const s3 = createClient();
  if (!s3) return;
  await s3.send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }));
}

export async function pingS3(): Promise<boolean> {
  try {
    const s3 = createClient();
    if (!s3) return false;
    await s3.send(new HeadBucketCommand({ Bucket: getBucket() }));
    return true;
  } catch {
    return false;
  }
}
