import { passwordSchema } from "@repo/utils/user";
import { z } from "zod";

const emailSchema = z.email("Please enter a valid email address");

export const TWO_FA_CODE_LENGTH = 6;

function withPasswordConfirmation<
  Schema extends z.ZodType<{ password: string; confirmPassword: string }>,
>(schema: Schema) {
  return schema.refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
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
    password: passwordSchema,
    confirmPassword: z.string(),
  })
);

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = withPasswordConfirmation(
  z.object({
    password: passwordSchema,
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
