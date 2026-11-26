/** Content shapes for the Home page. Placeholder until the real CMS/API shapes are known. */
import type { Money } from "./search";

export interface DestinationSummary {
  id: string;
  name: string;
  region: string;
  experienceCount: number;
  href: string;
  imageSrc?: string;
}

export interface MagazineArticle {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  author: string;
  readTimeMinutes: number;
  href: string;
  /** The article lives on another site: opens in a new tab with `rel="noopener noreferrer"`. */
  external?: boolean;
  imageSrc?: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  trip: string;
}

export interface EditorialQuote {
  eyebrow: string;
  quote: string;
  attribution: string;
  /** The link under the quote; both `ctaLabel` and `href` are needed, otherwise no link is shown. */
  ctaLabel?: string;
  href?: string;
  /** The link goes to another site: new tab, `rel="noopener"`. */
  external?: boolean;
  imageSrc?: string;
  /** Alt text of the photo (default: "Wellness traveller story"). */
  imageAlt?: string;
}

interface CardBase {
  id: string;
  title: string;
  location: string;
  rating: number;
  reviewCount: number;
  href: string;
  /** Photo gallery shown as a fading carousel on the card. */
  images: string[];
  /** Indicative "from" price of the cached card, formatted at render time (`formatMoney`). Optional: the related cards on a detail page leave it out, so they show "Select your dates to see prices" (prices appear once dates are chosen). */
  price?: Money;
}

export interface ExperienceCardData extends CardBase {
  category: string;
  provider: string;
  nights: number;
}

/**
 * `href` and the rating are optional on packages: with no `href` the card is not a link (there is no package page yet),
 * and with no `rating` it shows no stars. TODO(api): both come from the package record once packages exist.
 */
export interface PackageCardData extends Omit<CardBase, "href" | "rating" | "reviewCount"> {
  href?: string;
  rating?: number;
  reviewCount?: number;
  badge: string;
  category: string;
  provider: string;
  highlights: string[];
  nights: number;
}

export interface HotelCardData extends CardBase {
  badge: string;
  /** Hotel class, 1-5 stars. */
  stars: number;
  amenities: string[];
}

export interface Moment {
  id: string;
  imageSrc: string;
  alt: string;
}

export interface PopularSearch {
  id: string;
  label: string;
  href: string;
}

export interface HomeContent {
  popularSearches: PopularSearch[];
  moments: Moment[];
  experiences: ExperienceCardData[];
  packages: PackageCardData[];
  hotels: HotelCardData[];
  destinations: DestinationSummary[];
  articles: MagazineArticle[];
  testimonials: Testimonial[];
  editorial: EditorialQuote;
  experienceFilters: string[];
}
