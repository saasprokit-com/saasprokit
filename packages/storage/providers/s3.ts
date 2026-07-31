import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  DEFAULT_FOLDER,
  DEFAULT_VISIBILITY,
  MIME_TO_EXTENSION,
} from "@repo/utils/storage";
import { keys } from "../keys";

const env = keys();

import type {
  DeleteOptions,
  GetUrlOptions,
  StorageProvider,
  StorageProviderType,
  UploadOptions,
  UploadResult,
} from "../types";

// Filename generation patterns
const EXTENSION_REGEX = /\.[^/.]+$/;
const INVALID_CHAR_REGEX = /[^a-zA-Z0-9-_]/g;

// Random suffix generation constants
const RANDOM_RADIX = 36; // Base-36 encoding for alphanumeric characters
const RANDOM_SUBSTRING_START = 2; // Skip "0." prefix from toString(36)
const RANDOM_SUBSTRING_LENGTH = 8; // Length of random suffix (8 chars)

interface S3Config {
  accessKeyId: string;
  bucket: string;
  endpoint?: string;
  publicUrl?: string;
  region: string;
  secretAccessKey: string;
  signedUrlExpires: number;
}

/**
 * Get and validate S3 configuration from environment variables
 * Called lazily when S3StorageProvider is instantiated
 */
function getS3Config(): S3Config {
  const accessKeyId = env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = env.AWS_SECRET_ACCESS_KEY;
  const bucket = env.AWS_S3_BUCKET;

  if (!(accessKeyId && secretAccessKey && bucket)) {
    throw new Error(
      "S3 storage requires AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET environment variables"
    );
  }

  return {
    accessKeyId,
    secretAccessKey,
    region: env.AWS_REGION,
    bucket,
    endpoint: env.AWS_S3_ENDPOINT,
    publicUrl: env.AWS_S3_PUBLIC_URL,
    signedUrlExpires: env.AWS_S3_SIGNED_URL_EXPIRES,
  };
}

/**
 * Generate a unique S3 key with folder structure
 */
function generateS3Key(
  originalFilename: string,
  mimeType: string,
  folder: string
): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random()
    .toString(RANDOM_RADIX)
    .slice(
      RANDOM_SUBSTRING_START,
      RANDOM_SUBSTRING_START + RANDOM_SUBSTRING_LENGTH
    );
  const ext = originalFilename.includes(".")
    ? `.${originalFilename.split(".").pop()}`
    : MIME_TO_EXTENSION[mimeType as keyof typeof MIME_TO_EXTENSION] || "";
  const baseName = originalFilename
    .replace(EXTENSION_REGEX, "")
    .replace(INVALID_CHAR_REGEX, "_");

  return `${folder}/${baseName}-${timestamp}-${randomSuffix}${ext}`;
}

/**
 * AWS S3 storage provider
 */
export class S3StorageProvider implements StorageProvider {
  readonly type: StorageProviderType = "s3";

  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly endpoint: string | undefined;
  private readonly publicUrl: string | undefined;
  private readonly signedUrlExpires: number;
  private readonly region: string;

  constructor() {
    // Lazy validation - only runs when S3 provider is actually used
    const config = getS3Config();

    this.region = config.region;
    this.bucket = config.bucket;
    this.endpoint = config.endpoint;
    this.publicUrl = config.publicUrl;
    this.signedUrlExpires = config.signedUrlExpires;

    this.client = new S3Client({
      region: this.region,
      // S3-compatible stores (R2, MinIO) need an explicit endpoint; path-style
      // addressing is the reliable choice on account-scoped endpoints
      ...(this.endpoint && { endpoint: this.endpoint, forcePathStyle: true }),
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async upload(options: UploadOptions): Promise<UploadResult> {
    const {
      filename: originalFilename,
      buffer,
      mimeType,
      folder = DEFAULT_FOLDER,
      visibility = DEFAULT_VISIBILITY,
    } = options;

    // S3-compatible stores can't serve public objects from the API endpoint
    // (R2 public access is bucket-level, via a domain) — without a public URL
    // the fallback below would fabricate a dead amazonaws.com link, so refuse
    // before putting the object.
    if (visibility === "public" && this.endpoint && !this.publicUrl) {
      throw new Error(
        "Public uploads to an S3-compatible endpoint (AWS_S3_ENDPOINT) require AWS_S3_PUBLIC_URL — the bucket's public domain, e.g. your R2 custom domain"
      );
    }

    // Generate unique S3 key
    const key = generateS3Key(originalFilename, mimeType, folder);
    const filename = key.split("/").pop() || originalFilename;

    // Prepare upload command
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      // R2 and other S3-compatible stores reject per-object ACLs — public
      // access is bucket-level (custom domain), so only send ACLs to real AWS
      ...(visibility === "public" && !this.endpoint && { ACL: "public-read" }),
    });

    // Upload to S3
    await this.client.send(command);

    // Generate public URL
    let publicUrlResult: string | null = null;
    if (visibility === "public") {
      if (this.publicUrl) {
        // Use CloudFront or custom domain
        publicUrlResult = `${this.publicUrl}/${key}`;
      } else {
        // Real AWS only (the guard above excludes custom endpoints) — with the
        // public-read ACL set this is the object's genuine public URL
        publicUrlResult = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
      }
    }

    return {
      storagePath: key,
      publicUrl: publicUrlResult,
      filename,
      mimeType,
      size: buffer.length,
      provider: this.type,
      bucket: this.bucket,
      visibility,
    };
  }

  async delete(options: DeleteOptions): Promise<void> {
    const { path: key, bucket = this.bucket } = options;

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await this.client.send(command);
  }

  /**
   * Get URL for accessing a file (supports signed URLs for private files)
   */
  async getUrl(options: GetUrlOptions): Promise<string> {
    const {
      path: key,
      bucket = this.bucket,
      expiresIn = this.signedUrlExpires,
    } = options;

    // For public files with custom domain, return direct URL
    if (this.publicUrl) {
      return `${this.publicUrl}/${key}`;
    }

    // Generate signed URL for private access
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const signedUrl = await getSignedUrl(this.client, command, {
      expiresIn,
    });

    return signedUrl;
  }

  async exists(path: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: path,
      });

      await this.client.send(command);
      return true;
    } catch {
      return false;
    }
  }
}
