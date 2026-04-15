import { stripe } from "@better-auth/stripe";
import { database } from "@repo/database";
import {
  SECONDS_PER_DAY,
  SECONDS_PER_MINUTE,
} from "@repo/utils/date";
import {
  sendEmailVerificationEmail,
  sendMagicLinkEmail,
  sendOrgInvitationEmail,
  sendPasswordResetEmail,
  sendSignInOTPEmail,
  sendTwoFactorOTPEmail,
  sendVerificationOTPEmail,
} from "@repo/email";
import {
  ACTIVE_STATUSES,
  checkOrgCreationEligibility,
  getStripePriceMap,
  PLAN_NAMES,
  PLANS,
  STRIPE_API_VERSION,
} from "@repo/utils/payment";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins/admin";
import { emailOTP } from "better-auth/plugins/email-otp";
import { magicLink } from "better-auth/plugins/magic-link";
import { multiSession } from "better-auth/plugins/multi-session";
import { organization } from "better-auth/plugins/organization";
import { twoFactor } from "better-auth/plugins/two-factor";
import Stripe from "stripe";
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

// Validated environment variables — throws on startup if BETTER_AUTH_SECRET
// is missing or < 32 chars, or if any other env var fails its Zod schema.
const env = keys();

// =============================================================================
// Constants
// =============================================================================

// Invitation configuration
const INVITATION_EXPIRES_IN_DAYS = 7;

// Session configuration
const SESSION_EXPIRES_IN_DAYS = 7;
const SESSION_UPDATE_AGE_DAYS = 1;
const COOKIE_CACHE_MAX_AGE_MINUTES = 5;

// Magic link configuration
const MAGIC_LINK_EXPIRES_IN_MINUTES = 10;

// OTP configuration
const OTP_LENGTH = 6;
const OTP_EXPIRES_IN_MINUTES = 5;

// Two-factor authentication
const TWO_FACTOR_OTP_PERIOD_MINUTES = 5;
const TWO_FACTOR_DIGITS = 6;

// =============================================================================
// Billing Helpers
// =============================================================================

const MAX_ORGS_PER_USER = env.MAX_ORGS_PER_USER;

/**
 * Check if a user can manage billing for an organization.
 * Only org owners and admins are allowed.
 */
async function canManageBilling(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const member = await database.member.findFirst({
    where: { userId, organizationId },
  });
  if (!member) {
    return false;
  }
  return member.role === ORG_ROLES.OWNER || member.role === ORG_ROLES.ADMIN;
}

/**
 * Check if a user can create another organization.
 * NOTE: Simplified version for auth plugin callback (avoids circular dep with @repo/payment).
 * Canonical version with user-facing error messages: apps/web/lib/billing/subscription-queries.ts
 *
 * Subscription plans are per-organization, not per-user.
 *
 * Rules:
 * 1. Every user gets 1 free organization on signup (no payment required)
 * 2. To create additional organizations, all existing orgs must have
 *    paid subscriptions (only 1 free org allowed at a time)
 * 3. Hard cap of 10 organizations per user
 */
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

// =============================================================================
// Stripe Client
// =============================================================================

// CRITICAL: Fail explicitly if Stripe secret is not configured in production
if (!env.STRIPE_SECRET_KEY && process.env.NODE_ENV === "production") {
  throw new Error(
    "STRIPE_SECRET_KEY environment variable is not configured. This is required for production deployments."
  );
}

if (!env.STRIPE_SECRET_KEY) {
  // biome-ignore lint/suspicious/noConsole: startup warning
  console.warn(
    "[auth] STRIPE_SECRET_KEY not set — Stripe features disabled in development"
  );
}

const stripeClient = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: STRIPE_API_VERSION })
  : null;

export const auth = betterAuth({
  appName: env.NEXT_PUBLIC_APP_NAME,
  baseURL: env.BETTER_AUTH_URL || env.NEXT_PUBLIC_APP_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: env.BETTER_AUTH_TRUSTED_ORIGINS
    ? env.BETTER_AUTH_TRUSTED_ORIGINS.split(",")
    : [],

  // Database adapter
  database: prismaAdapter(database, {
    provider: "postgresql",
  }),

  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
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

  // Email and password authentication
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

  // Social providers
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

  // Session configuration
  session: {
    expiresIn: SESSION_EXPIRES_IN_DAYS * SECONDS_PER_DAY,
    updateAge: SESSION_UPDATE_AGE_DAYS * SECONDS_PER_DAY,
    cookieCache: {
      enabled: true,
      maxAge: COOKIE_CACHE_MAX_AGE_MINUTES * SECONDS_PER_MINUTE,
    },
  },

  // User configuration
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
  },

  // Account configuration for linking
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
    },
  },

  // Plugins
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

    // Magic link authentication
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail({
          email,
          magicLinkUrl: url,
        });
      },
      expiresIn: MAGIC_LINK_EXPIRES_IN_MINUTES * SECONDS_PER_MINUTE,
    }),

    // Email OTP authentication
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

    // Two-factor authentication
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
        const baseUrl = env.BETTER_AUTH_URL || "http://localhost:3000";
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
          // biome-ignore lint/suspicious/noConsole: auth package has no logger dependency
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

    // Next.js cookie handling
    nextCookies(),

    // Stripe subscription — only included when both keys are configured
    ...(stripeClient && env.STRIPE_WEBHOOK_SECRET
      ? [
          stripe({
            stripeClient,
            stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
            createCustomerOnSignUp: false,
            subscription: {
              enabled: true,
              plans: (() => {
                const priceMap = getStripePriceMap({
                  proMonthly: env.STRIPE_PRO_PRICE_ID_MONTHLY,
                  proAnnual: env.STRIPE_PRO_PRICE_ID_ANNUAL,
                  enterpriseMonthly: env.STRIPE_ENTERPRISE_PRICE_ID_MONTHLY,
                  enterpriseAnnual: env.STRIPE_ENTERPRISE_PRICE_ID_ANNUAL,
                });
                return [
                  {
                    name: PLAN_NAMES.FREE,
                    priceId: env.STRIPE_FREE_PRICE_ID ?? "",
                    limits: {
                      maxMembers: PLANS.free.limits.maxMembers,
                      maxStorageMB: PLANS.free.limits.maxStorageMB,
                    },
                  },
                  {
                    name: PLAN_NAMES.PRO,
                    priceId: priceMap.pro_monthly,
                    annualDiscountPriceId: priceMap.pro_yearly,
                    limits: {
                      maxMembers: PLANS.pro.limits.maxMembers,
                      maxStorageMB: PLANS.pro.limits.maxStorageMB,
                    },
                  },
                  {
                    name: PLAN_NAMES.ENTERPRISE,
                    priceId: priceMap.enterprise_monthly,
                    annualDiscountPriceId: priceMap.enterprise_yearly,
                    limits: {
                      maxMembers: PLANS.enterprise.limits.maxMembers,
                      maxStorageMB: PLANS.enterprise.limits.maxStorageMB,
                    },
                  },
                ];
              })(),
              authorizeReference: async ({ user, referenceId, action }) => {
                // Authorize organization subscription management
                // Only org owners and admins can manage billing
                if (
                  action === "upgrade-subscription" ||
                  action === "cancel-subscription" ||
                  action === "billing-portal"
                ) {
                  return await canManageBilling(user.id, referenceId);
                }
                return false;
              },
            },
          }),
        ]
      : []),
  ],
});

export type Auth = typeof auth;
