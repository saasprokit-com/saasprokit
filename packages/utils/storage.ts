// Polymorphic attachment types (must match Prisma model names)
export const ATTACHABLE_TYPE = {
  USER: "User",
  ORGANIZATION: "Organization",
} as const;

export type AttachableType =
  (typeof ATTACHABLE_TYPE)[keyof typeof ATTACHABLE_TYPE];

// Allowed image MIME types for uploads
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

// Byte-size conversions
export const BYTES_PER_KB = 1024;
export const BYTES_PER_MB = BYTES_PER_KB * BYTES_PER_KB;

// Maximum upload size for images
export const MAX_FILE_SIZE_MB = 4;
export const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * BYTES_PER_MB;

// Default upload settings
export const DEFAULT_VISIBILITY = "public" as const;
export const DEFAULT_FOLDER = "uploads";

// MIME type → file extension mapping
export const MIME_TO_EXTENSION: Record<AllowedImageType, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};
