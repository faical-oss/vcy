import Link from "next/link";
import type { ComponentProps } from "react";

type NavItemLinkProps = Omit<ComponentProps<"a">, "href" | "target" | "rel"> & {
  href: string;
  /** Opens in a new tab: plain `<a>` (no `next/link` prefetch) with a screen-reader hint. */
  external?: boolean;
};

/** Every header and mobile menu item: `next/link` for internal pages, `<a target="_blank">` for external ones. */
export function NavItemLink({ href, external, children, ...props }: NavItemLinkProps) {
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener" {...props}>
        {children} <span className="sr-only">(opens in a new tab)</span>
      </a>
    );
  }
  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  );
}
