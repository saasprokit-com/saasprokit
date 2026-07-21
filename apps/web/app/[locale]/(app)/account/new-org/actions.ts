"use server";

import { auth } from "@repo/auth/server";
import { createRequestLogger } from "@repo/logger/server";
import { headers } from "next/headers";
import { actionError, toActionError } from "@/lib/auth/action-error";
import type { ActionResult } from "@/lib/auth/auth";
import { type CreateOrgInput, createOrgSchema } from "./schemas";

/**
 * Better Auth authenticates the caller from the forwarded headers and enforces
 * org-creation eligibility itself (the org plugin's `allowUserToCreateOrganization`
 * hook + `organizationLimit`), so no verifySession pre-check is needed. An
 * ineligible caller surfaces as a Better Auth error mapped through toActionError.
 */
export async function createOrganizationAction(
  input: CreateOrgInput
): Promise<ActionResult<{ slug: string }>> {
  const logger = createRequestLogger({ action: "createOrganization" });

  try {
    const validated = createOrgSchema.parse(input);

    const result = await auth.api.createOrganization({
      body: {
        name: validated.name,
        slug: validated.slug,
      },
      headers: await headers(),
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
      logger,
    });
  }
}
