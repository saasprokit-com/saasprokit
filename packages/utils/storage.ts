// Polymorphic attachment types (must match Prisma model names)
export const ATTACHABLE_TYPE = {
  USER: "User",
  ORGANIZATION: "Organization",
} as const;

export type AttachableType =
  (typeof ATTACHABLE_TYPE)[keyof typeof ATTACHABLE_TYPE];

