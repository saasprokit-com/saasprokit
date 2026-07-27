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
import {
  DEFAULT_LOCALE,
  localeFromReferer,
} from "@repo/internationalization/shared";
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
import { canUserCreateOrg } from "./org-eligibility";
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
import { cleanUpUserBeforeDelete } from "./user-deletion";

const env = keys();

const MAX_ORGS_PER_USER = env.MAX_ORGS_PER_USER;
const baseUrl = env.BETTER_AUTH_URL || "http://localhost:3000";

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
      allowUserToCreateOrganization: (user) =>
        canUserCreateOrg(user.id, MAX_ORGS_PER_USER),
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

    i18n({
      translations: baErrorTranslations,
      defaultLocale: DEFAULT_LOCALE,
      detection: ["callback", "cookie", "header"],
      localeCookie: "Next-Locale",
      getLocale: (ctx) => localeFromReferer(ctx.headers?.get("referer")),
    }),

    nextCookies(),
  ],
});

export type Auth = typeof auth;
