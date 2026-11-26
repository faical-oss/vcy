"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "./auth-provider";

function Trigger() {
  const params = useSearchParams();
  const { openAuth } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const mode = params.get("auth");
  const next = params.get("next");

  useEffect(() => {
    if (mode !== "login" && mode !== "signup") return;
    // Sent here by the account guard (signed-out visitors only): open the dialog, then return to the account page they asked for.
    const safe = next && next.startsWith(ROUTES.account) && !next.startsWith("//") ? next : ROUTES.account;
    openAuth(mode, null, safe);
    router.replace(pathname, { scroll: false });
  }, [mode, next, openAuth, router, pathname]);

  return null;
}

/** Opens the auth dialog when the URL carries ?auth=login or ?auth=signup (used by the server-side account guard). */
export function AuthQueryTrigger() {
  return (
    <Suspense fallback={null}>
      <Trigger />
    </Suspense>
  );
}
