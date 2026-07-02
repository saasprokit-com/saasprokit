import "server-only";

import { database } from "@repo/database";
import { generateSlug, slugSchema } from "@repo/utils/slug";

const GENERATE_SLUG_MAX_RETRIES = 100;

async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    // Check if slug is reserved (conflicts with routes)
    if (!slugSchema.safeParse(slug).success) {
      slug = `${baseSlug}-${counter}`;
      counter++;
      continue;
    }

    // Check if slug already exists in database
    const existing = await database.organization.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing) {
      return slug;
    }

    // Append counter and try again
    slug = `${baseSlug}-${counter}`;
    counter++;

    // Safety limit to prevent infinite loops
    if (counter > GENERATE_SLUG_MAX_RETRIES) {
      // Fallback to timestamp-based slug
      return `${baseSlug}-${Date.now()}`;
    }
  }
}

export async function createDefaultWorkspace(
  userId: string,
  userName: string,
  email: string
) {
  // Generate slug from name, fallback to email prefix
  const nameForSlug = userName || email.split("@")[0];
  const baseSlug = generateSlug(nameForSlug);
  const uniqueSlug = await ensureUniqueSlug(baseSlug);

  // Generate group display name
  const displayName = userName ? `${userName}'s Workspace` : "My Workspace";

  // Create org + member in transaction
  return database.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: displayName,
        slug: uniqueSlug,
      },
    });

    await tx.member.create({
      data: {
        organizationId: org.id,
        userId,
        role: "owner",
      },
    });

    return org;
  });
}
