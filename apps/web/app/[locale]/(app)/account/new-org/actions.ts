"use server";

import { auth } from "@repo/auth/server";
import { createRequestLogger } from "@repo/logger/server";
import { headers } from "next/headers";
import { verifySession } from "@/lib/auth/action-auth";
import { actionError, toActionError } from "@/lib/auth/action-error";
import type { ActionResult } from "@/lib/auth/auth";
import { canUserCreateOrg } from "@/lib/billing/subscription-queries";
import { type CreateOrgInput, createOrgSchema } from "./schemas";

/**
 * Create a new organization via Better Auth server API.
 *
 * Defense-in-depth: re-checks eligibility even though the page already gates access.
 * The server action must be independently secure since it's a public RPC endpoint.
 */
export async function createOrganizationAction(
  input: CreateOrgInput
): Promise<ActionResult<{ slug: string }>> {
  const logger = createRequestLogger({ action: "createOrganization" });

  try {
    const validated = createOrgSchema.parse(input);

    const { session, error } = await verifySession<{ slug: string }>();
    if (error) {
      return error;
    }

    const { allowed } = await canUserCreateOrg(session.user.id);
    if (!allowed) {
      return actionError("createOrganization");
    }

    const reqHeaders = await headers();

    const result = await auth.api.createOrganization({
      body: {
        name: validated.name,
        slug: validated.slug,
      },
      headers: reqHeaders,
    });

    if (!result) {
      return actionError("createOrganization");
    }

    logger.info(
      { slug: validated.slug, orgId: result.id },
      "Organization created"
    );

    return { success: true, data: { slug: validated.slug } };
  } catch (error) {
    return toActionError(error, {
      fallback: "createOrganization",
      baFallback: "unknownError",
      logger,
    });
  }
}
