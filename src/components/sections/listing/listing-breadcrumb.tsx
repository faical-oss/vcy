import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";
import { cn } from "@/helpers/cn";
import type { BreadcrumbItem } from "@/interfaces";

/**
 * "trail": every crumb but the last is a plain link.
 * "back": the first crumb is a semibold link with a back chevron (a "< Destinations > ASIA" trail).
 * "back-caps": same, with the first crumb in uppercase eyebrow type (a lone "< HOME" link).
 */
export type BreadcrumbVariant = "trail" | "back" | "back-caps";

const LINK_CLASS: Record<BreadcrumbVariant, string> = {
  trail: "text-xs text-white/90 hover:text-white",
  back: "gap-1.5 text-xs font-semibold text-white hover:text-white/80",
  "back-caps": "gap-1.5 text-eyebrow font-semibold uppercase text-white hover:text-white/80",
};

/** Breadcrumb trail for dark (photo) backgrounds. Every crumb but the last is a link; the last is the current page. */
export function ListingBreadcrumb({ crumbs, label, variant = "trail" }: { crumbs: BreadcrumbItem[]; label: string; variant?: BreadcrumbVariant }) {
  return (
    <nav aria-label={label} className={cn("mb-2", variant === "back-caps" && "mb-4")}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {crumbs.map((crumb, index) => (
          <Fragment key={`${index}-${crumb.label}`}>
            {index > 0 ? (
              <li aria-hidden className="flex">
                <ChevronRight className="size-3 text-white/60" />
              </li>
            ) : null}
            <li className="flex">
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className={cn("-my-2 flex items-center py-2 transition-colors", index === 0 ? LINK_CLASS[variant] : LINK_CLASS.trail)}
                >
                  {index === 0 && variant !== "trail" ? <ChevronLeft className="size-3 shrink-0" aria-hidden /> : null}
                  {crumb.label}
                </Link>
              ) : index < crumbs.length - 1 ? (
                // A parent whose page does not exist yet: plain text, never a dead link.
                <span className={LINK_CLASS.trail}>{crumb.label}</span>
              ) : (
                <span
                  aria-current="page"
                  className={cn("text-micro uppercase tracking-widest", variant === "trail" ? "font-semibold text-white/90" : "text-white/70")}
                >
                  {crumb.label}
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
