"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { MIN_PASSWORD_LENGTH } from "@/constants/auth";
import { ROUTES } from "@/constants/routes";
import type { AuthResult, EmailAuthInput, ProviderAuthInput } from "@/interfaces";
import { AuthNotConfiguredError } from "@/lib/auth-errors";
import { getAuthService } from "@/services";

const modeSchema = z.enum(["login", "signup"]);
const emailInputSchema = z.object({
  email: z.string().trim().max(254),
  mode: modeSchema,
  firstName: z.string().trim().max(100).optional(),
  password: z.string().max(200).optional(),
  subscribeToNewsletter: z.boolean().optional(),
});
const providerInputSchema = z.object({ provider: z.enum(["google", "apple", "facebook"]), mode: modeSchema });

/** "Real auth not configured" is reported to the UI as `unavailable`; every other error (e.g. the production guard) propagates. */
async function run(operation: () => Promise<AuthResult>): Promise<AuthResult> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof AuthNotConfiguredError) return { ok: false, code: "unavailable" };
    throw error;
  }
}

export async function continueWithEmailAction(input: EmailAuthInput): Promise<AuthResult> {
  const parsed = emailInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  if (!z.email().safeParse(parsed.data.email).success) return { ok: false, code: "invalid_email" };
  if ((parsed.data.password ?? "").length < MIN_PASSWORD_LENGTH) return { ok: false, code: "invalid_password" };
  if (parsed.data.mode === "signup" && !parsed.data.firstName) return { ok: false, code: "invalid_name" };
  return run(async () => (await getAuthService()).continueWithEmail(parsed.data));
}

export async function continueWithProviderAction(input: ProviderAuthInput): Promise<AuthResult> {
  const parsed = providerInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  return run(async () => (await getAuthService()).continueWithProvider(parsed.data));
}

/** Clears the session cookie, then returns the member to Home (signed-out header). */
export async function signOutAction(): Promise<void> {
  try {
    await (await getAuthService()).signOut();
  } catch (error) {
    if (!(error instanceof AuthNotConfiguredError)) throw error;
  }
  redirect(ROUTES.home);
}
