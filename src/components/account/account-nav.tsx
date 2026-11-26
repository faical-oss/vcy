"use client";

import { ScrollRow } from "@/components/ui/scroll-row";
import { CalendarDays, Heart, LogOut, Settings, SlidersHorizontal, User, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useFavorites } from "@/hooks/use-favorites";
import { ACCOUNT_PAGE_TITLES } from "@/constants/account";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/helpers/cn";

const ITEMS: readonly { label: string; href: string; icon: LucideIcon }[] = [
  { label: ACCOUNT_PAGE_TITLES.overview, href: ROUTES.account, icon: User },
  { label: ACCOUNT_PAGE_TITLES.trips, href: ROUTES.accountTrips, icon: CalendarDays },
  { label: ACCOUNT_PAGE_TITLES.favorites, href: ROUTES.favorites, icon: Heart },
  { label: ACCOUNT_PAGE_TITLES.preferences, href: ROUTES.accountPreferences, icon: SlidersHorizontal },
  { label: ACCOUNT_PAGE_TITLES.profile, href: ROUTES.accountProfile, icon: Settings },
];

const ITEM_BASE =
  "flex h-11 w-full shrink-0 items-center justify-start whitespace-nowrap md:w-auto lg:w-full gap-2 rounded-input px-2 text-xs min-[360px]:px-3 font-semibold uppercase tracking-nav transition-colors motion-reduce:transition-none sm:px-4 sm:tracking-label";

/**
 * Account navigation: real links (each view is its own route), a divider, then Sign out (an action, not a page).
 * Below md a card with a 2-column grid (Overview, My trips, Favorites with its count, Preferences, Profile), then a divider and Sign out on its own
 * row; from md one scrolling row (`ScrollRow`, the current page scrolled into view) below lg, a vertical sidebar from lg. Each item is 44px high.
 */
export function AccountNav() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [pending, setPending] = useState(false);
  const { ready, refs } = useFavorites();
  const saved = ready ? refs.length : 0;

  return (
    <nav aria-label="Account" className="rounded-card bg-card p-3 shadow-sm md:p-2">
      <ScrollRow as="ul" className="max-md:grid max-md:grid-cols-2 max-md:gap-x-2 max-md:overflow-visible max-md:[mask-image:none] lg:flex-col lg:flex-nowrap">
        {ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(ITEM_BASE, active ? "bg-surface-blue text-primary" : "text-body hover:bg-surface hover:text-primary")}
              >
                <span className="relative mr-1 flex shrink-0 min-[360px]:mr-1.5">
                  <Icon aria-hidden className={cn("size-4", href === ROUTES.favorites && "max-md:fill-accent max-md:text-accent")} />
                  {href === ROUTES.favorites && saved > 0 ? (
                    <span aria-hidden className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-card text-[0.625rem] font-bold leading-none text-primary shadow-sm md:hidden">
                      {saved}
                    </span>
                  ) : null}
                </span>
                {label}
                {href === ROUTES.favorites && saved > 0 ? <span className="sr-only">, {saved} saved</span> : null}
              </Link>
            </li>
          );
        })}
        <li className="max-md:col-span-2 max-md:mt-2 max-md:border-t max-md:border-border max-md:pt-2 lg:mt-4 lg:border-t lg:border-border">
          <button
            type="button"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              await signOut();
            }}
            className={cn(ITEM_BASE, "text-body hover:bg-surface hover:text-primary disabled:opacity-60")}
          >
            <LogOut aria-hidden className="mr-1.5 size-4 shrink-0" />
            Sign out
          </button>
        </li>
      </ScrollRow>
    </nav>
  );
}
