/** One step of a breadcrumb trail. The current page has no `href`. */
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/** Copy of one section of the region page (packages, hotels). */
export interface RegionSectionCopy {
  /** Eyebrow, e.g. "Curated for you". */
  tag: string;
  heading: string;
  /** Accessible name of the section's card list. */
  label: string;
  /** "All hotels". Without both, the section has no "All ..." link (packages have no listing page yet). */
  linkLabel?: string;
  href?: string;
}

/** Resolved copy of a region page (`/destinations/asia`). */
export interface RegionPageCopy {
  popular: { heading: string; label: string };
  packages: RegionSectionCopy;
  hotels: RegionSectionCopy;
}
