import "server-only";

import type { OrgRoleName } from "@repo/auth/permissions";
import type { Prisma } from "@repo/database";
import { database } from "@repo/database";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getServerSession, requireAuth } from "@/lib/auth/auth";

export interface OrganizationContext {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: OrgRoleName;
  userId: string;
}

const memberWithOrgSelect = {
  role: true,
  organization: {
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
    },
  },
} satisfies Prisma.MemberSelect;

type MemberWithOrg = Prisma.MemberGetPayload<{
  select: typeof memberWithOrgSelect;
}>;

export interface UserOrganization {
  id: string;
  logo: string | null;
  name: string;
  role: OrgRoleName;
  slug: string;
}

function toUserOrganization(member: MemberWithOrg): UserOrganization {
  return {
    ...member.organization,
    role: member.role as OrgRoleName,
  };
}

export async function validateOrganizationMembership(
  organizationId: string,
  userId: string
): Promise<boolean> {
  const member = await database.member.findFirst({
    where: {
      userId,
      organizationId,
    },
  });

  return !!member;
}

export const getUserOrganizations = cache(
  async (): Promise<{
    defaultOrganizationId: string | null;
    organizations: UserOrganization[];
  }> => {
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
        },
        select: memberWithOrgSelect,
        orderBy: { createdAt: "asc" },
      }),
    ]);

    return {
      organizations: memberships.map(toUserOrganization),
      defaultOrganizationId: user?.defaultOrganizationId ?? null,
    };
  }
);

export const getActiveOrganization = cache(
  async (slug: string): Promise<OrganizationContext> => {
    const session = await requireAuth(`/${slug}`);
    const { organizations } = await getUserOrganizations();

    const active = organizations.find((org) => org.slug === slug);
    if (!active) {
      notFound();
    }

    return {
      organizationId: active.id,
      organizationName: active.name,
      organizationSlug: active.slug,
      role: active.role,
      userId: session.user.id,
    };
  }
);

export const getDefaultOrganization = cache(
  async (): Promise<UserOrganization | null> => {
    const { organizations, defaultOrganizationId } =
      await getUserOrganizations();

    if (organizations.length === 0) {
      return null;
    }

    // Use the stored default only while the user is still a member of it.
    if (defaultOrganizationId) {
      const defaultOrg = organizations.find(
        (org) => org.id === defaultOrganizationId
      );
      if (defaultOrg) {
        return defaultOrg;
      }
    }

    return organizations[0];
  }
);
