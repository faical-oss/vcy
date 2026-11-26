/** Content shapes of the Lifestyle Vacations pages (`/lifestyle/<slug>`). TODO(cms): the real shapes come with the CMS. */
import type { LifestyleSlug } from "@/constants/routes";
import type { EditorialQuote, MagazineArticle, PackageCardData } from "./home";

export interface LifestyleImage {
  src: string;
  alt: string;
}

/** A package of the shared package table, as the cards show it (the page adds its own badge, label and highlights). */
export type LifestylePackageRecord = Omit<PackageCardData, "badge" | "category" | "highlights">;

/** How one page uses a package: the same package can be on several pages with its own badge, label, filters and photos. */
export interface LifestylePackageRef {
  id: string;
  badge: string;
  category: string;
  /** Filter chips (labels from `packages.filters`) this card belongs to. */
  filters: string[];
  highlights: [string, string, string];
  /** Replaces the record's photos on this page. */
  images?: string[];
}

export interface LifestyleRow {
  eyebrow: string;
  title: string;
  body: string;
  image: LifestyleImage;
}

export interface LifestyleDestinationTile {
  name: string;
  region: string;
  /** Shown as "90+ adventures". TODO(api): comes from the catalog. */
  count: string;
  /** Decorative photo (the label next to it names the place). */
  image: string;
  /** Slug of an existing destination page: the destination itself, or the nearest country or region when the place has none of its own. Without it the tile is not a link. */
  destinationSlug?: string;
}

interface LifestylePageBase {
  slug: LifestyleSlug;
  /** Unique `<title>` (the site name is added by the root template) and meta description. */
  seo: { title: string; description: string };
  /** Label of the breadcrumb's last crumb. */
  crumb: string;
  hero: { eyebrow: string; h1: string; sub: string; image: LifestyleImage; primaryCta: string; secondaryCta: string };
  /** Labels of the three sticky sub-nav anchors: why, find, top packages. */
  subNav: [string, string, string];
  intro: { eyebrow: string; title: string; body: string; linkLabel: string; linkHref: string };
  rows: { eyebrow: string; title: string; items: LifestyleRow[] };
  packages: { eyebrow: string; title: string; sub: string; filters: string[]; viewAllLabel: string; viewAllHref: string };
  quote: EditorialQuote;
  magazine: { eyebrow: string; sub: string; featured: MagazineArticle; items: MagazineArticle[] };
  destinations: { eyebrow: string; title: string; items: LifestyleDestinationTile[]; viewAllLabel: string };
}

/** What a content file holds: the packages as references into the shared table. */
export interface LifestylePageFixture extends LifestylePageBase {
  packageRefs: LifestylePackageRef[];
}

/** What the page renders: the references resolved to cards. */
export interface LifestylePageContent extends LifestylePageBase {
  packages: LifestylePageBase["packages"] & { items: { card: PackageCardData; filters: string[] }[] };
}
