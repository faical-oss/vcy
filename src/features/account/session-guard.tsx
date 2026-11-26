import { requireSession } from "./require-session";

/** Renders nothing. Redirects signed-out visitors on the server; kept in its own <Suspense> so the shell never waits for it. */
export async function SessionGuard() {
  await requireSession();
  return null;
}
