"use server";

import type {
  AccountActionResult,
  AuthProvider,
  FavoriteRef,
  PasswordChangeInput,
  PasswordChangeResult,
  ResolveFavoritesResult,
  TravelPreferences,
} from "@/interfaces";
import { validatePasswordChange } from "@/helpers/password-schema";
import { NotSignedInError } from "@/lib/account-errors";
import { AuthNotConfiguredError } from "@/lib/auth-errors";
import { getAccountService } from "@/services";
import { resolveFavorites } from "./resolve-favorites";
import { connectedAccountInputSchema, favoriteRefsSchema, newsletterInputSchema, travelPreferencesSchema } from "./schemas";

/** Maps expected failures to typed results. Anything else (e.g. the production guard) propagates. */
async function run(operation: () => Promise<void>): Promise<AccountActionResult> {
  try {
    await operation();
    return { ok: true };
  } catch (error) {
    if (error instanceof NotSignedInError) return { ok: false, code: "unauthenticated" };
    if (error instanceof AuthNotConfiguredError) return { ok: false, code: "unavailable" };
    throw error;
  }
}

export async function savePreferencesAction(input: TravelPreferences): Promise<AccountActionResult> {
  const parsed = travelPreferencesSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  return run(async () => (await getAccountService()).savePreferences(parsed.data as TravelPreferences));
}

export async function setNewsletterAction(subscribed: boolean): Promise<AccountActionResult> {
  const parsed = newsletterInputSchema.safeParse(subscribed);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  return run(async () => (await getAccountService()).setNewsletter(parsed.data));
}

/** DEV ONLY while the mock is active: toggles a flag, links nothing. */
export async function setConnectedAccountAction(input: { provider: AuthProvider; connected: boolean }): Promise<AccountActionResult> {
  const parsed = connectedAccountInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  return run(async () => (await getAccountService()).setConnectedAccount(parsed.data.provider, parsed.data.connected));
}

/** Validates with zod first; passwords are never logged or echoed back. */
export async function changePasswordAction(input: PasswordChangeInput): Promise<PasswordChangeResult> {
  const checked = validatePasswordChange(input);
  if (!checked.ok) return checked;
  try {
    return await (await getAccountService()).changePassword(input);
  } catch (error) {
    if (error instanceof NotSignedInError) return { ok: false, errors: {}, code: "unauthenticated" };
    if (error instanceof AuthNotConfiguredError) return { ok: false, errors: {}, code: "unavailable" };
    throw error;
  }
}

/** Resolves ids saved in the browser to card data for /account/favorites. */
export async function resolveFavoritesAction(refs: FavoriteRef[]): Promise<ResolveFavoritesResult> {
  const parsed = favoriteRefsSchema.safeParse(refs);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  try {
    return { ok: true, favorites: await resolveFavorites(parsed.data) };
  } catch (error) {
    if (error instanceof NotSignedInError) return { ok: false, code: "unauthenticated" };
    if (error instanceof AuthNotConfiguredError) return { ok: false, code: "unavailable" };
    throw error;
  }
}
