"use server";

import { auth } from "@repo/auth/server";
import { createRequestLogger } from "@repo/logger/server";
import { headers } from "next/headers";
import { actionError, toActionError } from "@/lib/auth/action-error";
import { type FormState, fieldErrorsFrom } from "@/lib/forms";
import { type CreateOrgInput, createOrgSchema } from "./schemas";

export type CreateOrgFormState = FormState<CreateOrgInput, { slug: string }>;

/**
 * Better Auth's createOrganization throws ORGANIZATION_ALREADY_EXISTS when the
 * slug is taken (crud-org: findOrganizationBySlug guard), so the message
 * belongs on the slug field rather than a root toast.
 */
function isSlugConflict(error: unknown): boolean {
  return (
    error != null &&
    typeof error === "object" &&
    "body" in error &&
    error.body != null &&
    typeof error.body === "object" &&
    "code" in error.body &&
    error.body.code === "ORGANIZATION_ALREADY_EXISTS"
  );
}

export async function createOrganizationAction(
  _prevState: CreateOrgFormState,
  input: CreateOrgInput
): Promise<CreateOrgFormState> {
  const logger = createRequestLogger({ action: "createOrganization" });

  const parsed = createOrgSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    const result = await auth.api.createOrganization({
      body: {
        name: parsed.data.name,
        slug: parsed.data.slug,
      },
      headers: await headers(),
    });

    if (!result) {
      return actionError("createOrganization");
    }

    logger.info(
      { slug: parsed.data.slug, orgId: result.id },
      "Organization created"
    );

    return { status: "success", data: { slug: parsed.data.slug } };
  } catch (error) {
    if (isSlugConflict(error)) {
      const { error: message } = await toActionError(error, {
        fallback: "createOrganization",
      });
      return {
        status: "error",
        fieldErrors: { slug: message },
      };
    }
    return toActionError(error, {
      fallback: "createOrganization",
      logger,
    });
  }
}
