import "server-only";

import type { OrgRoleName } from "@repo/auth/permissions";
import { database } from "@repo/database";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { getServerSession } from "@/lib/auth/auth";

interface OrganizationContext {
  organizationId: string;
  organizationName: string;
  role: OrgRoleName;
  userId: string;
}

/**
 * Validate that a user is a member of an organization.
 * Returns true if the user is a member, false otherwise.
 */
export async function validateOrganizationMembership(
  organizationId: string,
  userId: string
): Promise<boolean> {
  const member = await database.member.findFirst({
    where: {
      userId,
      organizationId,
      suspendedAt: null,
    },
  });

  return !!member;
}

/**
 * Validate user membership for an organization by slug.
 * Enforces authentication and membership requirements.
 *
 * Behavior:
 * - Redirects to sign-in if not authenticated
 * - Redirects to home if user is not a member
 * - Returns 404 if organization doesn't exist
 * - Returns organization context on success
 *
 * Wrapped with React.cache() to deduplicate across layout + page in a single request.
 */
export const validateOrgMembershipBySlug = cache(
  async (
    slug: string,
    returnTo?: string
  ): Promise<OrganizationContext & { organizationSlug: string }> => {
    const session = await getServerSession();

    // Check if user is authenticated
    if (!session?.user?.id) {
      const returnUrl = returnTo
        ? encodeURIComponent(returnTo)
        : encodeURIComponent(`/${slug}`);
      redirect(`/auth/sign-in?returnTo=${returnUrl}`);
    }

    // Single query: find membership by org slug (happy path = 1 DB call)
    const member = await database.member.findFirst({
      where: {
        userId: session.user.id,
        organization: { slug },
        suspendedAt: null,
      },
      select: {
        role: true,
        organization: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!member) {
      // Distinguish 404 (org doesn't exist) from 403 (not a member)
      const orgExists = await database.organization.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!orgExists) {
        notFound();
      }
      redirect("/");
    }

    return {
      organizationId: member.organization.id,
      organizationName: member.organization.name,
      organizationSlug: member.organization.slug,
      userId: session.user.id,
      role: member.role as OrgRoleName,
    };
  }
);

/**
 * Get all organizations the current user is a member of.
 * Also returns the user's defaultOrganizationId for marking the default.
 *
 * Wrapped with React.cache() to deduplicate across layout + page in a single request.
 */
export const getUserOrganizations = cache(async () => {
  const session = await getServerSession();

  if (!session?.user?.id) {
    return { organizations: [], defaultOrganizationId: null };
  }

  const [user, memberships] = await Promise.all([
    database.user.findUnique({
      where: { id: session.user.id },
      select: { defaultOrganizationId: true },
    }),
    database.member.findMany({
      where: {
        userId: session.user.id,
        suspendedAt: null,
      },
      select: {
        role: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
      },
    }),
  ]);

  const organizations = memberships.map((m) => ({
    id: m.organization.id,
    name: m.organization.name,
    slug: m.organization.slug,
    logo: m.organization.logo,
    role: m.role as OrgRoleName,
  }));

  return {
    organizations,
    defaultOrganizationId: user?.defaultOrganizationId ?? null,
  };
});

/**
 * Get the user's default organization.
 * Falls back to the first organization if no default is set.
 *
 * Wrapped with React.cache() to deduplicate across layout + page in a single request.
 */
export const getDefaultOrganization = cache(async () => {
  const session = await getServerSession();

  if (!session?.user?.id) {
    return null;
  }

  const [user, memberships] = await Promise.all([
    database.user.findUnique({
      where: { id: session.user.id },
      select: { defaultOrganizationId: true },
    }),
    database.member.findMany({
      where: { userId: session.user.id, suspendedAt: null },
      select: {
        organization: {
          select: {
            id: true,
            slug: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (memberships.length === 0) {
    return null;
  }

  // If user has a default set and is still a member, use it.
  // Safety: user can be null only if DB row was deleted between session check and query,
  // which is prevented by FK constraints (session → user). Falls through to first org.
  if (user?.defaultOrganizationId) {
    const defaultMembership = memberships.find(
      (m) => m.organization.id === user.defaultOrganizationId
    );
    if (defaultMembership) {
      return defaultMembership.organization;
    }
  }

  // Fallback to first organization
  return memberships[0].organization;
});
