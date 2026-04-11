export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

const MAX_SIZE_MB = 5;
const BYTES_PER_KB = 1024;
const BYTES_PER_MB = BYTES_PER_KB * BYTES_PER_KB;

export const MAX_FILE_SIZE = MAX_SIZE_MB * BYTES_PER_MB;

export const DEFAULT_VISIBILITY = "public" as const;

export const DEFAULT_FOLDER = "uploads";

export const MIME_TO_EXTENSION: Record<AllowedImageType, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};
