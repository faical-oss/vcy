import type { Viewport } from "next";
import { Suspense, type ReactNode } from "react";
import { AuthProvider } from "@/components/auth/auth-provider";
import { AuthQueryTrigger } from "@/components/auth/auth-query-trigger";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { DockedSearch, SearchUrlPrefill } from "@/components/sections/search/docked-search";
import { SearchProvider } from "@/components/sections/search/search-provider";
import { authActions } from "@/features/auth/auth-actions";
import { SessionHeader } from "@/features/auth/session-header";
import { getNavigation } from "@/features/navigation/get-navigation";
import { getSearchBoxContent } from "@/features/search/get-search-box-content";
import { isMockAuthActive } from "@/services";

/** Marketing pages share the header + footer. Checkout/account flows get their own groups later. */
export default async function SiteLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Cached public data (no cookies or headers), so it does not make routes dynamic.
  const [menus, searchContent] = await Promise.all([getNavigation(), getSearchBoxContent()]);
  return (
    <AuthProvider actions={authActions} devNotice={isMockAuthActive()}>
      <SearchProvider>
        {/* Outside the session <Suspense>: the account guard sends signed-out visitors here with ?auth=login. */}
        <AuthQueryTrigger />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
        >
          Skip to content
        </a>
        {/* The session cookie is request-time data: show the signed-out header until it resolves. The fallback is the same header (fixed height, fixed-width account pill), so the swap does not shift the layout. */}
        <Suspense fallback={<Header menus={menus} />}>
          <SessionHeader menus={menus} />
        </Suspense>
        {/* Both read the URL (the pathname, the query), so they wait for the request instead of making the page dynamic. */}
        <Suspense fallback={null}>
          <DockedSearch content={searchContent} />
        </Suspense>
        <Suspense fallback={null}>
          <SearchUrlPrefill content={searchContent} />
        </Suspense>
        <main id="main" className="flex-1 scroll-mt-[calc(var(--spacing-header)+var(--docked-search-h))]">
          {children}
        </main>
        <Footer />
      </SearchProvider>
    </AuthProvider>
  );
}

/*
 * viewport-fit=cover lets the page use the whole screen; fixed bars and overlays add the safe-area insets themselves (src/constants/safe-area.ts).
 * It is exported here, not from the root layout: from the root layout the responses lose `x-nextjs-prerender: 1` (e2e/filtered-variants.test.ts).
 */
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };
