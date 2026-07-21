import { i18n } from "@better-auth/i18n";
import { stripe } from "@better-auth/stripe";
import { database } from "@repo/database";
import {
  sendEmailVerificationEmail,
  sendMagicLinkEmail,
  sendOrgInvitationEmail,
  sendPasswordResetEmail,
  sendSignInOTPEmail,
  sendTwoFactorOTPEmail,
  sendVerificationOTPEmail,
} from "@repo/email";
import { baErrorTranslations } from "@repo/internationalization/ba-errors";
import { localeFromReferer } from "@repo/internationalization/shared";
import {
  COOKIE_CACHE_MAX_AGE_MINUTES,
  INVITATION_EXPIRES_IN_DAYS,
  MAGIC_LINK_EXPIRES_IN_MINUTES,
  OTP_EXPIRES_IN_MINUTES,
  OTP_LENGTH,
  SESSION_EXPIRES_IN_DAYS,
  SESSION_UPDATE_AGE_DAYS,
  TWO_FACTOR_DIGITS,
  TWO_FACTOR_OTP_PERIOD_MINUTES,
} from "@repo/utils/auth";
import { SECONDS_PER_DAY, SECONDS_PER_MINUTE } from "@repo/utils/date";
import {
  ACTIVE_STATUSES,
  checkOrgCreationEligibility,
  PLAN_NAMES,
} from "@repo/utils/payment";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import {
  APIError,
  createAuthMiddleware,
  getSessionFromCtx,
} from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins/admin";
import { emailOTP } from "better-auth/plugins/email-otp";
import { magicLink } from "better-auth/plugins/magic-link";
import { multiSession } from "better-auth/plugins/multi-session";
import { organization } from "better-auth/plugins/organization";
import { twoFactor } from "better-auth/plugins/two-factor";
import { authorizeBillingAction } from "./billing-authorize";
import { keys } from "./keys";
import {
  ADMIN_ROLES,
  ac,
  adminRole,
  moderatorRole,
  ORG_ROLES,
  orgAc,
  orgAdminRole,
  orgMemberRole,
  orgOwnerRole,
  userRole,
} from "./permissions";
import { buildStripePlans } from "./plans";
import { stripeClient } from "./stripe-client";
import {
  handleSubscriptionComplete,
  handleSubscriptionDeleted,
  handleSubscriptionUpdate,
} from "./stripe-hooks";

// Validated environment variables — throws on startup if BETTER_AUTH_SECRET
// is missing or < 32 chars, or if any other env var fails its Zod schema.
const env = keys();

const MAX_ORGS_PER_USER = env.MAX_ORGS_PER_USER;
const baseUrl = env.BETTER_AUTH_URL || "http://localhost:3000";

async function canUserCreateOrg(userId: string): Promise<boolean> {
  const memberships = await database.member.findMany({
    where: { userId, role: ORG_ROLES.OWNER },
    select: { organizationId: true },
  });

  const orgIds = memberships.map((m) => m.organizationId);
  const orgSubs = await database.subscription.findMany({
    where: {
      referenceId: { in: orgIds },
      status: { in: [...ACTIVE_STATUSES] },
    },
  });

  let freePlanCount = 0;
  for (const sub of orgSubs) {
    if (sub.plan === PLAN_NAMES.FREE) {
      freePlanCount++;
    }
  }

  return checkOrgCreationEligibility(
    memberships.length,
    freePlanCount,
    MAX_ORGS_PER_USER
  ).allowed;
}

// Stripe subscription statuses that are already inactive and need no cancelling.
const INACTIVE_STRIPE_STATUSES = new Set([
  "canceled",
  "incomplete",
  "incomplete_expired",
]);

/**
 * No-op when Stripe isn't configured or the customer id is missing.
 */
async function cancelActiveStripeSubscriptions(
  customerId: string | null
): Promise<void> {
  if (!(stripeClient && customerId)) {
    return;
  }

  for await (const sub of stripeClient.subscriptions.list({
    customer: customerId,
    status: "all",
  })) {
    if (!INACTIVE_STRIPE_STATUSES.has(sub.status)) {
      await stripeClient.subscriptions.cancel(sub.id);
    }
  }
}

/**
 * Cleanup run by Better Auth's `deleteUser.beforeDelete` hook, BEFORE the user
 * row (and its Prisma-cascaded members/invitations/etc.) is removed. Throwing an
 * APIError here aborts the deletion.
 *
 * - Validation runs first and is side-effect-free: blocks deletion (throws
 *   TRANSFER_ORGANIZATION_OWNERSHIP) when the user is the sole owner of an org
 *   that still has other members.
 * - DB cleanup (personal + solo-owned-org subscription rows, which have no FK
 *   cascade, and the solo-owned orgs themselves) runs in a single transaction,
 *   so a failure mid-way rolls everything back together.
 * - Stripe cancellations run LAST, after the DB is consistent, so a failed DB
 *   delete can never leave a cancelled subscription behind; cancelling an
 *   already-inactive subscription is a no-op.
 *
 * Note: Better Auth deletes the user row itself AFTER this hook returns, outside
 * this transaction — a failure in that later step is outside our control.
 */
async function cleanUpUserBeforeDelete(user: {
  id: string;
  stripeCustomerId?: string | null;
}): Promise<void> {
  const userId = user.id;

  const ownedOrgs = await database.member.findMany({
    where: { userId, role: ORG_ROLES.OWNER },
    select: { organizationId: true },
  });

  // Validate first (no irreversible work yet), capturing each solo-owned org's
  // Stripe customer id before the org row is deleted.
  const soloOrgs: { id: string; stripeCustomerId: string | null }[] = [];
  for (const { organizationId } of ownedOrgs) {
    const otherOwners = await database.member.count({
      where: { organizationId, role: ORG_ROLES.OWNER, userId: { not: userId } },
    });
    if (otherOwners > 0) {
      continue; // Org keeps an owner after this user leaves.
    }

    const otherMembers = await database.member.count({
      where: { organizationId, userId: { not: userId } },
    });
    if (otherMembers > 0) {
      throw new APIError("BAD_REQUEST", {
        code: "TRANSFER_ORGANIZATION_OWNERSHIP",
        message:
          "Transfer ownership of your organizations before deleting your account.",
      });
    }

    const org = await database.organization.findUnique({
      where: { id: organizationId },
      select: { stripeCustomerId: true },
    });
    soloOrgs.push({
      id: organizationId,
      stripeCustomerId: org?.stripeCustomerId ?? null,
    });
  }

  // Atomic DB cleanup — all deletes roll back together on any failure.
  // Subscription rows have no FK to user/org, so remove them explicitly.
  await database.$transaction([
    database.subscription.deleteMany({ where: { referenceId: userId } }),
    ...soloOrgs.flatMap((org) => [
      database.organization.delete({ where: { id: org.id } }),
      database.subscription.deleteMany({ where: { referenceId: org.id } }),
    ]),
  ]);

  // Irreversible Stripe cancellations run AFTER the DB is consistent.
  await cancelActiveStripeSubscriptions(user.stripeCustomerId ?? null);
  for (const org of soloOrgs) {
    await cancelActiveStripeSubscriptions(org.stripeCustomerId);
  }
}

export const auth = betterAuth({
  appName: env.NEXT_PUBLIC_APP_NAME,
  baseURL: env.BETTER_AUTH_URL || env.NEXT_PUBLIC_APP_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: env.BETTER_AUTH_TRUSTED_ORIGINS
    ? env.BETTER_AUTH_TRUSTED_ORIGINS.split(",")
    : [],

  database: prismaAdapter(database, {
    provider: "postgresql",
  }),

  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },

  hooks: {
    // Better Auth's admin `setRole` endpoint has NO self-guard, so on its own an
    // admin could strip their own role and lock themselves out. Enforce the
    // invariant here — at the auth layer — so it holds for every caller (the
    // /admin server action's guardUserMutation is only the friendly first-line
    // message; this is the authoritative backstop, matching how Better Auth
    // already self-blocks ban / delete / admin-impersonation).
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/admin/set-role") {
        return;
      }
      const targetUserId = (ctx.body as { userId?: string } | null)?.userId;
      const session = await getSessionFromCtx(ctx);
      if (
        session?.user?.id &&
        targetUserId &&
        session.user.id === targetUserId
      ) {
        throw new APIError("BAD_REQUEST", {
          code: "CANNOT_CHANGE_OWN_ROLE",
          message: "You cannot change your own role.",
        });
      }
    }),
  },

  // Rate limiting — persistent storage for serverless (Vercel)
  rateLimit: {
    storage: "database",
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
      "/forgot-password": { window: 60, max: 3 },
      "/reset-password": { window: 60, max: 3 },
      "/change-password": { window: 60, max: 3 },
      "/two-factor/*": { window: 60, max: 5 },
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({
        email: user.email,
        resetUrl: url,
      });
    },
  },

  // Email verification (used by sign-up when requireEmailVerification is true)
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmailVerificationEmail({
        email: user.email,
        userName: user.name,
        verificationUrl: url,
      });
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },

  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID || "",
      clientSecret: env.GOOGLE_CLIENT_SECRET || "",
    },
    github: {
      clientId: env.GITHUB_CLIENT_ID || "",
      clientSecret: env.GITHUB_CLIENT_SECRET || "",
    },
  },

  session: {
    expiresIn: SESSION_EXPIRES_IN_DAYS * SECONDS_PER_DAY,
    updateAge: SESSION_UPDATE_AGE_DAYS * SECONDS_PER_DAY,
    cookieCache: {
      enabled: true,
      maxAge: COOKIE_CACHE_MAX_AGE_MINUTES * SECONDS_PER_MINUTE,
    },
  },

  user: {
    additionalFields: {
      firstName: {
        type: "string",
        required: false,
      },
      lastName: {
        type: "string",
        required: false,
      },
    },
    // Account deletion goes through auth.api.deleteUser. Immediate (no email
    // verification) — Better Auth still requires a fresh session (freshAge,
    // default 1 day) since no password is supplied. Cleanup that Better Auth
    // and the Prisma cascade don't cover (Stripe, orphaned orgs) runs in the
    // beforeDelete hook.
    deleteUser: {
      enabled: true,
      beforeDelete: (user) => cleanUpUserBeforeDelete(user),
    },
  },

  // Account configuration for linking
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
    },
  },

  plugins: [
    // Admin plugin with three-tier roles (admin/moderator/user)
    admin({
      ac,
      roles: {
        [ADMIN_ROLES.ADMIN]: adminRole,
        [ADMIN_ROLES.MODERATOR]: moderatorRole,
        [ADMIN_ROLES.USER]: userRole,
      },
      defaultRole: ADMIN_ROLES.USER,
    }),

    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail({
          email,
          magicLinkUrl: url,
        });
      },
      expiresIn: MAGIC_LINK_EXPIRES_IN_MINUTES * SECONDS_PER_MINUTE,
    }),

    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        if (type === "sign-in") {
          await sendSignInOTPEmail({
            email,
            otp,
            expiresInMinutes: OTP_EXPIRES_IN_MINUTES,
          });
        } else if (type === "email-verification") {
          await sendVerificationOTPEmail({
            email,
            otp,
            expiresInMinutes: OTP_EXPIRES_IN_MINUTES,
          });
        } else {
          // forget-password type — send OTP directly (no URL needed)
          await sendSignInOTPEmail({
            email,
            otp,
            expiresInMinutes: OTP_EXPIRES_IN_MINUTES,
          });
        }
      },
      otpLength: OTP_LENGTH,
      expiresIn: OTP_EXPIRES_IN_MINUTES * SECONDS_PER_MINUTE,
    }),

    twoFactor({
      issuer: env.NEXT_PUBLIC_APP_NAME,
      otpOptions: {
        async sendOTP({ user, otp }) {
          await sendTwoFactorOTPEmail({
            email: user.email,
            otp,
            expiresInMinutes: OTP_EXPIRES_IN_MINUTES,
          });
        },
        period: TWO_FACTOR_OTP_PERIOD_MINUTES,
        digits: TWO_FACTOR_DIGITS,
      },
    }),

    // Multi-session support (device tracking)
    multiSession(),

    // Organization/Groups plugin with org-scoped access control
    organization({
      ac: orgAc,
      roles: {
        [ORG_ROLES.OWNER]: orgOwnerRole,
        [ORG_ROLES.ADMIN]: orgAdminRole,
        [ORG_ROLES.MEMBER]: orgMemberRole,
      },
      creatorRole: ORG_ROLES.OWNER,
      memberRole: ORG_ROLES.MEMBER,
      organizationLimit: MAX_ORGS_PER_USER,
      allowUserToCreateOrganization: (user) => canUserCreateOrg(user.id),
      invitationExpiresIn: INVITATION_EXPIRES_IN_DAYS * SECONDS_PER_DAY,
      cancelPendingInvitationsOnReInvite: false,
      async sendInvitationEmail(data) {
        // this url should be fixed
        const inviteUrl = `${baseUrl}/invite/accept?token=${data.id}`;
        const expiresAt = data.invitation.expiresAt;

        try {
          await sendOrgInvitationEmail({
            email: data.email,
            inviterName: data.inviter.user.name || "A team member",
            organizationName: data.organization.name,
            role: data.role,
            inviteUrl,
            expiresAt: expiresAt
              ? new Date(expiresAt).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : undefined,
          });
        } catch (error) {
          console.error(
            `[auth] Failed to send invitation email to ${data.email}`,
            error
          );
        }
      },
      teams: {
        enabled: true,
      },
    }),

    // Stripe subscription — only included when both keys are configured
    ...(stripeClient && env.STRIPE_WEBHOOK_SECRET
      ? [
          stripe({
            stripeClient,
            stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
            createCustomerOnSignUp: false,
            organization: { enabled: true },
            subscription: {
              enabled: true,
              onSubscriptionComplete: handleSubscriptionComplete,
              onSubscriptionUpdate: handleSubscriptionUpdate,
              onSubscriptionDeleted: handleSubscriptionDeleted,
              plans: buildStripePlans({
                proMonthly: env.STRIPE_PRO_PRICE_ID_MONTHLY,
                proAnnual: env.STRIPE_PRO_PRICE_ID_ANNUAL,
                enterpriseMonthly: env.STRIPE_ENTERPRISE_PRICE_ID_MONTHLY,
                enterpriseAnnual: env.STRIPE_ENTERPRISE_PRICE_ID_ANNUAL,
              }),
              authorizeReference: ({ user, referenceId, action }) =>
                authorizeBillingAction({
                  userId: user.id,
                  referenceId,
                  action,
                }),
            },
          }),
        ]
      : []),

    // Translates APIError bodies into the request locale. Runs as an `after`
    // hook on every endpoint (server-side auth.api.* AND HTTP /api/auth/*),
    // rewriting error.body to { code, message: <translated>, originalMessage }.
    // Detection order:
    //   1. callback — referer path locale, same signal as getLocaleFromRequest
    //   2. cookie   — "Next-Locale", set by next-international's middleware
    //                 (SameSite=Strict, so absent on cross-site email links)
    //   3. header   — Accept-Language, the only signal left on email links
    i18n({
      translations: baErrorTranslations,
      defaultLocale: "en",
      detection: ["callback", "cookie", "header"],
      localeCookie: "Next-Locale",
      getLocale: (ctx) => localeFromReferer(ctx.headers?.get("referer")),
    }),

    nextCookies(),
  ],
});

export type Auth = typeof auth;
