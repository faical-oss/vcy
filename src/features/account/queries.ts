import "server-only";
import { cache } from "react";
import type { IAccountService } from "@/interfaces";
import { NotSignedInError } from "@/lib/account-errors";
import { AuthNotConfiguredError } from "@/lib/auth-errors";
import { getAccountService } from "@/services";
import { redirectToLogin } from "./require-session";

/** No session, or no auth configured at all: send the visitor Home with the login dialog (same as the layout guard). */
async function read<T>(query: (service: IAccountService) => Promise<T>): Promise<T> {
  try {
    return await query(await getAccountService());
  } catch (error) {
    if (error instanceof NotSignedInError || error instanceof AuthNotConfiguredError) await redirectToLogin();
    throw error;
  }
}

/** Per-user data: request-time (cookies), deduplicated within one request with cache(), never cached across users. */
export const getAccountProfile = cache(() => read((service) => service.getProfile()));
export const getAccountSummary = cache(() => read((service) => service.getSummary()));
export const getAccountBookings = cache(() => read((service) => service.listBookings()));
export const getAccountFavorites = cache(() => read((service) => service.listFavorites()));
export const getAccountPreferences = cache(() => read((service) => service.getPreferences()));
