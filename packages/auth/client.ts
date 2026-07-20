"use client";

import { i18nClient } from "@better-auth/i18n/client";
import { stripeClient } from "@better-auth/stripe/client";
import {
  adminClient,
  emailOTPClient,
  magicLinkClient,
  multiSessionClient,
  organizationClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
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

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [
    // Admin plugin with RBAC
    adminClient({
      ac,
      roles: {
        [ADMIN_ROLES.ADMIN]: adminRole,
        [ADMIN_ROLES.MODERATOR]: moderatorRole,
        [ADMIN_ROLES.USER]: userRole,
      },
    }),

    // Magic link client
    magicLinkClient(),

    // Email OTP client
    emailOTPClient(),

    // Two-factor authentication client
    twoFactorClient(),

    // Multi-session client (device tracking)
    multiSessionClient(),

    // Organization client with org-scoped access control
    organizationClient({
      ac: orgAc,
      roles: {
        [ORG_ROLES.OWNER]: orgOwnerRole,
        [ORG_ROLES.ADMIN]: orgAdminRole,
        [ORG_ROLES.MEMBER]: orgMemberRole,
      },
      teams: {
        enabled: true,
      },
    }),

    // Stripe subscription client
    stripeClient({
      subscription: true,
    }),

    // i18n type inference (server plugin translates error messages)
    i18nClient(),
  ],
});

// Export auth methods
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
  changePassword,
  // Two-factor
  twoFactor,
  // Organization
  organization,
  useActiveOrganization,
  // Subscription
  subscription,
  // Email OTP
  emailOtp,
  // Admin
  admin,
} = authClient;

// Re-export the client for direct access to all methods
// Note: Password reset methods can be accessed via:
// - authClient.forgotPassword() for requesting password reset
// - authClient.resetPassword() for setting new password
// Magic link can be accessed via:
// - authClient.signIn.magicLink() for requesting magic link
// Email OTP can be accessed via:
// - authClient.emailOtp.sendVerificationOtp() for sending OTP
// - authClient.signIn.emailOtp() for signing in with OTP

export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;
