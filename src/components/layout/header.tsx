import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/ui/container";
import { ROUTES } from "@/constants/routes";
import type { NavMenu } from "@/interfaces";
import { HeaderAccount } from "./header-account";
import { MainNav } from "./main-nav";
import { MobileMenu } from "./mobile-menu";

/** Sticky header. `menus` is the cached public navigation; the session-dependent parts read the auth context. */
export function Header({ menus }: { menus: readonly NavMenu[] }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card shadow-header">
      <Container className="flex h-header items-center justify-between px-6">
        <Link href={ROUTES.home} aria-label="Vacayou home" className="text-primary transition-opacity hover:opacity-75">
          <Logo />
        </Link>

        <MainNav menus={menus} />

        <HeaderAccount />

        <MobileMenu menus={menus} supportHref={ROUTES.support} favoritesHref={ROUTES.favorites} accountHref={ROUTES.account} />
      </Container>
    </header>
  );
}
