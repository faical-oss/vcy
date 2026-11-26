import { z } from "zod";
import { MIN_PASSWORD_LENGTH } from "@/constants/auth";
import type { PasswordChangeInput, PasswordChangeResult } from "@/interfaces";

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password so we can confirm it's you."),
    newPassword: z.string().min(MIN_PASSWORD_LENGTH, `Your new password needs at least ${MIN_PASSWORD_LENGTH} characters.`),
    confirmPassword: z.string().min(1, "Re-enter your new password to confirm it."),
  })
  .superRefine((value, ctx) => {
    if (value.newPassword && value.newPassword === value.currentPassword) {
      ctx.addIssue({ code: "custom", path: ["newPassword"], message: "Your new password must be different from your current one." });
    }
    if (value.confirmPassword && value.newPassword !== value.confirmPassword) {
      ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "These passwords don't match yet. Re-enter your new password to confirm." });
    }
  });

/** Shared by the client form and the server action. First message per field wins. */
export function validatePasswordChange(input: PasswordChangeInput): PasswordChangeResult {
  const parsed = passwordChangeSchema.safeParse(input);
  if (parsed.success) return { ok: true };
  const errors: Partial<Record<keyof PasswordChangeInput, string>> = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0] as keyof PasswordChangeInput;
    errors[field] ??= issue.message;
  }
  return { ok: false, errors };
}
