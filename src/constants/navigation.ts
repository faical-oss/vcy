import type { NavLink } from "@/interfaces";
import { EXTERNAL_URLS, ROUTES } from "./routes";

export type { NavLink };

/** Copy of the header menus that is not part of the navigation data. */
export const NAV_CONTENT = {
  /** Mobile menu link to the page of an expanded group. */
  viewAll: (title: string) => `View all ${title}`,
} as const;

export const FOOTER_COLUMNS: readonly { title: string; links: readonly NavLink[] }[] = [
  {
    title: "Explore",
    links: [
      { label: "Experiences", href: ROUTES.browseExperiences },
      { label: "Destinations", href: ROUTES.destinations },
      { label: "Hotels", href: ROUTES.browseHotels },
      { label: "Magazine", href: EXTERNAL_URLS.magazine, external: true },
      { label: "Glossary", href: EXTERNAL_URLS.glossary, external: true },
    ],
  },
  {
    title: "Information",
    links: [
      { label: "About us", href: ROUTES.about },
      { label: "Why book with Vacayou", href: ROUTES.whyBook },
      { label: "Travel Insurance", href: ROUTES.insurance },
      { label: "Contact us", href: ROUTES.contact },
    ],
  },
  {
    title: "Become a Partner",
    links: [
      { label: "Resorts & Retreats", href: ROUTES.partnerResorts },
      { label: "Tour Providers", href: ROUTES.partnerTourProviders },
      { label: "Hotels & Spas", href: ROUTES.partnerHotels },
      { label: "List your experience", href: ROUTES.partnerList },
    ],
  },
];

export const LEGAL_LINKS: readonly NavLink[] = [
  { label: "Terms of Use", href: ROUTES.terms },
  { label: "Privacy Policy", href: ROUTES.privacy },
];
