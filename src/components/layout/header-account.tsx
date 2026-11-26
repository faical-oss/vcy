"use client";

import Link from "next/link";
import { CircleHelp, Heart, User } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { ROUTES } from "@/constants/routes";
import { useFavorites } from "@/hooks/use-favorites";

const TEXT_LINK =
  "flex items-center gap-1.5 rounded-full px-2.5 py-2 xl:px-3 text-sm font-medium text-primary transition-colors hover:bg-surface";
const ACCOUNT_PILL =
  "flex h-9 min-w-40 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-accent px-4 text-eyebrow font-semibold uppercase text-accent-foreground transition-colors hover:bg-accent-hover";

/** Desktop right-hand cluster. The pill has a fixed minimum width so "My Account" (the Suspense fallback) and a first name take the same space: no layout shift when the session resolves. Signed out: Favorites and My Account open the auth dialog. Signed in: Favorites links to the favorites page and the pill shows the member's first name and links to the account (sign out lives there). */
export function HeaderAccount() {
  const { session, openAuth } = useAuth();
  const { refs, ready } = useFavorites();
  const count = ready ? refs.length : 0;

  return (
    <div className="hidden items-center gap-1 lg:flex">
      <Link href={ROUTES.support} className={TEXT_LINK}>
        <CircleHelp className="size-4 text-muted-blue" aria-hidden /> Support
      </Link>
      {session ? (
        <>
          <Link href={ROUTES.favorites} className={TEXT_LINK}>
            <span className="relative mr-1.5">
              <Heart className="size-4 text-muted-blue" aria-hidden />
              {count > 0 ? (
                <span className="absolute -right-2.5 -top-2.5 flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[0.625rem] font-semibold leading-4 text-accent-foreground">
                  {count > 99 ? "99+" : count}
                </span>
              ) : null}
            </span>
            Favorites
            {count > 0 ? <span className="sr-only"> ({count} saved)</span> : null}
          </Link>
          <Link href={ROUTES.account} className={ACCOUNT_PILL}>
            <User className="size-4" aria-hidden />
            <span className="max-w-[10rem] truncate">{session.displayName.split(" ")[0]}</span>
          </Link>
        </>
      ) : (
        <>
          <button type="button" onClick={(event) => openAuth("login", event.currentTarget)} className={TEXT_LINK}>
            <Heart className="mr-1.5 size-4 text-muted-blue" aria-hidden /> Favorites
          </button>
          <button type="button" onClick={(event) => openAuth("login", event.currentTarget)} className={ACCOUNT_PILL}>
            <User className="size-4" aria-hidden /> My Account
          </button>
        </>
      )}
    </div>
  );
}
