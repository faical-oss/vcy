import { ROUTES } from "@/constants/routes";
import { SITE_NAME } from "@/constants/site";
import { durationLabel } from "@/helpers/stay-duration";
import type { BreadcrumbItem, PackageDetail } from "@/interfaces";

/** Copy of the package detail page (the experience page's copy, with the package wording). */
export const PACKAGE_DETAIL_CONTENT = {
  breadcrumbLabel: "Breadcrumb",
  homeCrumb: "Home",
  packagesCrumb: "Packages",
  tabsLabel: "Package information",
  back: "Back",
  similar: "You might also like",
  bookLabel: "Book this package",
  includesTitle: "Package includes",
  accommodationTab: "Accommodation",
  accommodationHeading: "Your accommodation",
  roomsHeading: "Room options",
  noun: "package",
} as const;

/** Home > Packages (no link: `/packages` is not a page) > the package. */
export function packageDetailCrumbs(pkg: Pick<PackageDetail, "title">): BreadcrumbItem[] {
  return [{ label: PACKAGE_DETAIL_CONTENT.homeCrumb, href: ROUTES.home }, { label: PACKAGE_DETAIL_CONTENT.packagesCrumb }, { label: pkg.title }];
}

const DESCRIPTION_MAX = 160;

/** Unique title and description per package: its title, place and duration (from the data), and the first sentence of its text. No price: it is not shown until dates are chosen. */
export function packageDetailMetadata(pkg: Pick<PackageDetail, "title" | "location" | "duration" | "about">): { title: string; description: string } {
  const label = durationLabel(pkg.duration);
  const firstSentence = pkg.about[0]?.split(/(?<=\.)\s/)[0] ?? "";
  const full = `${firstSentence} See the itinerary, stays and dates on ${SITE_NAME}.`;
  return {
    title: `${pkg.title} in ${pkg.location.city}${label ? `: ${label}` : ""} package`,
    description: full.length <= DESCRIPTION_MAX ? full : `${firstSentence.slice(0, DESCRIPTION_MAX - 1).trimEnd()}…`,
  };
}
