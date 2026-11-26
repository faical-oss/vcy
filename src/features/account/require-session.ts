import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ACCOUNT_PATH_HEADER } from "@/constants/auth";
import { ROUTES } from "@/constants/routes";
import type { Session } from "@/interfaces";
import { getCurrentSession } from "@/features/auth/session";

/** Home with the login dialog open (?auth=login), remembering the account page that was asked for (?next=). */
export async function redirectToLogin(): Promise<never> {
  const path = (await headers()).get(ACCOUNT_PATH_HEADER);
  const next = path && path.startsWith(ROUTES.account) ? `&next=${encodeURIComponent(path)}` : "";
  redirect(`${ROUTES.home}?auth=login${next}`);
}

/** Server-side guard: no session means back to Home with the login dialog. No client redirect. */
export async function requireSession(): Promise<Session> {
  const session = await getCurrentSession();
  if (!session) return redirectToLogin();
  return session;
}
