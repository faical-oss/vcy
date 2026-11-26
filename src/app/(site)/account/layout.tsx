import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { AccountIdentitySkeleton } from "@/components/account/account-identity";
import { AccountShell } from "@/components/account/account-shell";
import { AccountIdentityLoader } from "@/features/account/account-identity";
import { SessionGuard } from "@/features/account/session-guard";

export const metadata: Metadata = {
  title: { default: "My Account", template: "%s | My Account | Vacayou" },
  description: "Your Vacayou member account: trips, favorites, preferences and profile.",
  robots: { index: false, follow: false },
};

/**
 * The frame (band, nav) is static and stays mounted between tabs. Per-member data streams in behind their own
 * <Suspense> boundaries: the band's name and the (invisible) server-side session guard. Each page guards itself too.
 */
export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <AccountShell
      identity={
        <Suspense fallback={<AccountIdentitySkeleton />}>
          <AccountIdentityLoader />
        </Suspense>
      }
    >
      <Suspense fallback={null}>
        <SessionGuard />
      </Suspense>
      {children}
    </AccountShell>
  );
}
