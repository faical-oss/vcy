import { SessionProvider } from "@/components/auth/auth-provider";
import { FavoritesSessionSync } from "@/components/auth/favorites-session-sync";
import { Header } from "@/components/layout/header";
import type { NavMenu } from "@/interfaces";
import { getCurrentSession } from "./session";

/** Header with the real session. Reads the cookie, so render it inside <Suspense> (see the (site) layout). */
export async function SessionHeader({ menus }: { menus: readonly NavMenu[] }) {
  const session = await getCurrentSession();
  return (
    <SessionProvider session={session}>
      <FavoritesSessionSync userId={session?.userId ?? null} />
      <Header menus={menus} />
    </SessionProvider>
  );
}
