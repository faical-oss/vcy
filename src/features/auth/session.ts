import "server-only";
import type { Session } from "@/interfaces";
import { AuthNotConfiguredError } from "@/lib/auth-errors";
import { getAuthService } from "@/services";

/** Current session, or null when signed out or when no auth is configured (header then shows the signed-out state). */
export async function getCurrentSession(): Promise<Session | null> {
  try {
    return await (await getAuthService()).getSession();
  } catch (error) {
    if (error instanceof AuthNotConfiguredError) return null;
    throw error;
  }
}
