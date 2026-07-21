import { access, mkdir, unlink, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import {
  DEFAULT_FOLDER,
  DEFAULT_VISIBILITY,
  MIME_TO_EXTENSION,
} from "@repo/utils/storage";
import { keys } from "../keys";
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
const RANDOM_RADIX = 36;
const RANDOM_SUBSTRING_START = 2;
const RANDOM_SUBSTRING_LENGTH = 6;

// Path normalization patterns
const PUBLIC_PREFIX_REGEX = /^\.?\/?public\/?/;
const TRAILING_SLASH_REGEX = /\/$/;

interface LocalConfig {
  basePath: string;
  baseUrl: string;
}

const env = keys();

/**
 * Get local storage configuration from environment variables
 */
function getLocalConfig(): LocalConfig {
  return {
    basePath: env.STORAGE_LOCAL_PATH,
    baseUrl: env.STORAGE_BASE_URL || "http://localhost:3000",
  };
}

/**
 * Generate a unique filename with timestamp and random suffix
 */
function generateUniqueFilename(
  originalFilename: string,
  mimeType: string
): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random()
    .toString(RANDOM_RADIX)
    .slice(
      RANDOM_SUBSTRING_START,
      RANDOM_SUBSTRING_START + RANDOM_SUBSTRING_LENGTH
    );
  const ext =
    extname(originalFilename) ||
    MIME_TO_EXTENSION[mimeType as keyof typeof MIME_TO_EXTENSION] ||
    "";
  const baseName = originalFilename
    .replace(EXTENSION_REGEX, "")
    .replace(INVALID_CHAR_REGEX, "_");

  return `${baseName}-${timestamp}-${randomSuffix}${ext}`;
}

/**
 * Local filesystem storage provider
 */
export class LocalStorageProvider implements StorageProvider {
  readonly type: StorageProviderType = "local";

  private readonly basePath: string;
  private readonly baseUrl: string;
  private readonly publicPrefix: string;

  constructor() {
    const config = getLocalConfig();
    this.basePath = config.basePath;
    this.baseUrl = config.baseUrl;
    // Extract the public URL prefix from basePath (e.g., "./public/uploads" -> "/uploads")
    this.publicPrefix = this.basePath
      .replace(PUBLIC_PREFIX_REGEX, "/")
      .replace(TRAILING_SLASH_REGEX, "");
  }

  async upload(options: UploadOptions): Promise<UploadResult> {
    const {
      filename: originalFilename,
      buffer,
      mimeType,
      folder = DEFAULT_FOLDER,
      visibility = DEFAULT_VISIBILITY,
    } = options;

    // Generate unique filename
    const filename = generateUniqueFilename(originalFilename, mimeType);

    // Create directory path
    const dirPath = join(this.basePath, folder);
    await mkdir(dirPath, { recursive: true });

    // Full file path
    const filePath = join(dirPath, filename);

    // Write file to disk
    await writeFile(filePath, buffer);

    // Calculate storage path (relative to public folder)
    const storagePath = `${this.publicPrefix}/${folder}/${filename}`;

    // For local storage, use relative URL (works better with Next.js Image)
    // The storagePath itself is the public URL path since files are in public/
    const publicUrl = storagePath;

    return {
      storagePath,
      publicUrl,
      filename,
      mimeType,
      size: buffer.length,
      provider: this.type,
      bucket: null,
      visibility,
    };
  }

  async delete(options: DeleteOptions): Promise<void> {
    const { path: storagePath } = options;

    // Convert storage path to full filesystem path
    // storagePath is like "/uploads/logos/file.jpg", remove prefix to get "/logos/file.jpg"
    const relativePath = storagePath.replace(this.publicPrefix, "");
    const fullPath = join(this.basePath, relativePath);

    try {
      await unlink(fullPath);
    } catch (error) {
      // Ignore if file doesn't exist
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  getUrl(options: GetUrlOptions): Promise<string> {
    const { path: storagePath } = options;
    // For local storage, return relative path (works with Next.js Image)
    return Promise.resolve(storagePath);
  }

  async exists(path: string): Promise<boolean> {
    const relativePath = path.replace(this.publicPrefix, "");
    const fullPath = join(this.basePath, relativePath);

    try {
      await access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}
