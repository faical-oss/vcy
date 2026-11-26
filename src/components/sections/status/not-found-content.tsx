import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import type { NavLink } from "@/interfaces";
import { StatusPage } from "./status-page";

/**
 * Body of the 404 page: heading, message, one primary button back to Home and a link to each main section (`links`).
 * TODO: a search box here once the search page exists (it is not built).
 */
export function NotFoundContent({ links }: { links: NavLink[] }) {
  return (
    <StatusPage
      label="Error 404"
      title="We can't find that page"
      message="The page may have moved or the address may be mistyped. Let's get you back to somewhere calm."
      actions={
        <ButtonLink href={ROUTES.home} size="lg" className="uppercase tracking-cta">
          Back to home
        </ButtonLink>
      }
    >
      {links.length > 0 ? (
        <nav aria-label="Explore Vacayou" className="mt-12 w-full max-w-2xl border-t border-border pt-8">
          <p className="text-eyebrow font-semibold uppercase text-muted-blue">Or explore</p>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {links.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="flex min-h-11 items-center justify-center rounded-full border border-border bg-card px-4 text-sm font-medium text-primary transition-colors hover:border-primary">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </StatusPage>
  );
}
