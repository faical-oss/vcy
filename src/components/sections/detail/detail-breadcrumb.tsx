import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";
import type { BreadcrumbItem } from "@/interfaces";

/** Breadcrumb trail for white page backgrounds (detail pages). Linked crumbs are links, an unlinked parent is plain text, the last crumb is the current page. */
export function DetailBreadcrumb({ crumbs, label }: { crumbs: BreadcrumbItem[]; label: string }) {
  return (
    <nav aria-label={label}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-body">
        {crumbs.map((crumb, index) => (
          <Fragment key={`${index}-${crumb.label}`}>
            {index > 0 ? (
              <li aria-hidden className="flex">
                <ChevronRight className="size-3 text-muted" />
              </li>
            ) : null}
            <li className="flex">
              {crumb.href ? (
                <Link href={crumb.href} className="-my-2 py-2 transition-colors hover:text-primary">
                  {crumb.label}
                </Link>
              ) : index === crumbs.length - 1 ? (
                <span aria-current="page" className="text-primary">
                  {crumb.label}
                </span>
              ) : (
                <span>{crumb.label}</span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
