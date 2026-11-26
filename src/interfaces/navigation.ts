/** Header navigation contracts (mega menus and the Lifestyle dropdown), served by `INavigationService`. */

export interface NavLink {
  label: string;
  href: string;
  /** Opens in a new tab (`rel="noopener noreferrer"`, no `next/link` prefetch). */
  external?: boolean;
}

export interface NavGroup {
  title: string;
  /** Page of the group itself (a region page for Destinations; the listing route for the other menus). */
  href?: string;
  links: NavLink[];
}

export interface NavFeatured {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  /** Pre-formatted, shown as "From <price> <priceUnit>". */
  price?: string;
  priceUnit?: string;
  image: string;
  href: string;
  /** Small heading above the card (default "Featured"). */
  heading?: string;
  /** Text of the link under the card (default "View offer"). */
  cta?: string;
}

export type NavMenuId = "experiences" | "destinations" | "hotels" | "lifestyle";

export interface NavMenu {
  id: NavMenuId;
  label: string;
  /** Landing page of the trigger. Absent when the menu has no page of its own (Lifestyle). */
  href?: string;
  groups: NavGroup[];
  /** `columns`: every group is a visible column of links (Lifestyle). Default: a list of groups, with the links of the active one. */
  layout?: "columns";
  featured?: NavFeatured;
  /** Optional link pinned under the groups (e.g. "All destinations"). */
  footerLink?: NavLink;
}

export interface INavigationService {
  getNavigation(): Promise<NavMenu[]>;
}
