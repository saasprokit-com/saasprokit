import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@repo/utils/user";
import { z } from "zod";

/**
 * Shared field primitives.
 *
 * Every auth form composes these so validation rules — and their user-facing
 * messages — stay identical across sign-in, sign-up, reset, and forgot-password.
 * Edit a rule here once and every form inherits it.
 */
const emailSchema = z.email("Please enter a valid email address");

const strongPasswordSchema = z
  .string()
  .min(
    MIN_PASSWORD_LENGTH,
    `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
  )
  .max(
    MAX_PASSWORD_LENGTH,
    `Password cannot exceed ${MAX_PASSWORD_LENGTH} characters`
  )
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

/** Length of the TOTP / email OTP code entered on the two-factor form. */
export const TWO_FA_CODE_LENGTH = 6;

/**
 * Adds a cross-field "passwords must match" check to any object schema that
 * carries `password` + `confirmPassword`. Shared by sign-up and reset-password
 * so the match rule (and its error placement) lives in exactly one spot.
 *
 * TODO(you): implement this helper — see the request in chat. The body is ~3
 * lines. The placeholder below keeps the file compiling but performs NO match
 * check yet, so both forms currently accept mismatched passwords.
 */
function withPasswordConfirmation<
  Schema extends z.ZodType<{ password: string; confirmPassword: string }>,
>(schema: Schema) {
  // Replace this passthrough with a `.refine(...)` that compares the two
  // fields and reports the error on `confirmPassword`.
  return schema;
}

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export const signUpSchema = withPasswordConfirmation(
  z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: emailSchema,
    password: strongPasswordSchema,
    confirmPassword: z.string(),
  })
);

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = withPasswordConfirmation(
  z.object({
    password: strongPasswordSchema,
    confirmPassword: z.string(),
  })
);

export const twoFactorSchema = z.object({
  code: z
    .string()
    .length(TWO_FA_CODE_LENGTH, "Code must be 6 digits")
    .regex(/^\d+$/, "Code must only contain numbers"),
});

export const magicLinkSchema = z.object({
  email: emailSchema,
});

export const sendOtpSchema = z.object({
  email: emailSchema,
});

export const verifyOtpSchema = z.object({
  code: z
    .string()
    .length(TWO_FA_CODE_LENGTH, "Code must be 6 digits")
    .regex(/^\d+$/, "Code must only contain numbers"),
});

export type SignInFormValues = z.infer<typeof signInSchema>;
export type SignUpFormValues = z.infer<typeof signUpSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
export type TwoFactorFormValues = z.infer<typeof twoFactorSchema>;
export type MagicLinkFormValues = z.infer<typeof magicLinkSchema>;
export type SendOtpFormValues = z.infer<typeof sendOtpSchema>;
export type VerifyOtpFormValues = z.infer<typeof verifyOtpSchema>;
