import { ROUTES } from "@/constants/routes";
import type { BreadcrumbItem, LifestylePageContent } from "@/interfaces";

/** Copy shared by the Lifestyle pages. */
export const LIFESTYLE_CONTENT = {
  breadcrumbLabel: "Breadcrumb",
  homeCrumb: "Home",
  lifestyleCrumb: "Lifestyle",
  subNavLabel: "On this page",
  magazineTitle: "From the Magazine",
} as const;

/**
 * Home > Lifestyle > this page. "Lifestyle" has no link (`/lifestyle` is not a page) and the last crumb is the current
 * page; the BreadcrumbList JSON-LD is built from the same list.
 */
export function lifestyleCrumbs(page: Pick<LifestylePageContent, "crumb">): BreadcrumbItem[] {
  return [
    { label: LIFESTYLE_CONTENT.homeCrumb, href: ROUTES.home },
    { label: LIFESTYLE_CONTENT.lifestyleCrumb },
    { label: page.crumb },
  ];
}
