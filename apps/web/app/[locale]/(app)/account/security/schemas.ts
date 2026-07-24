import { passwordSchema } from "@repo/utils/user";
import { z } from "zod";

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export const TWO_FACTOR_CODE_LENGTH = 6;

export const twoFactorPasswordSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export type TwoFactorPasswordValues = z.infer<typeof twoFactorPasswordSchema>;

const twoFactorCodeMessage = `Please enter a valid ${TWO_FACTOR_CODE_LENGTH}-digit code`;

export const twoFactorCodeSchema = z.object({
  code: z
    .string()
    .length(TWO_FACTOR_CODE_LENGTH, twoFactorCodeMessage)
    .regex(/^\d+$/, twoFactorCodeMessage),
});

export type TwoFactorCodeValues = z.infer<typeof twoFactorCodeSchema>;
