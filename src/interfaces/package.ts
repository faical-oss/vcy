/** Package detail page content (`/packages/p/<slug>`). Placeholder shapes until the Trip Fusion docs arrive. TODO(api). */
import type { ExperienceDetail, ExperienceHotel, HotelRoom } from "./detail";

/** One property of a package. A package has one or several; the nights are the nights spent here. */
export interface PackageStay {
  id: string;
  hotel: ExperienceHotel;
  /** Nights at this property (for a fixed package they add up to the duration). */
  nights: number;
  /** First night spent here, 1-based ("Nights 4–6"). */
  fromNight: number;
  /** Slug of this property's own hotel page, when the catalog has one: the stay links to it only then. */
  hotelSlug?: string;
  /** Room types of the property, shown display-only; priced per person when the package has one stay. */
  rooms: HotelRoom[];
}

/**
 * A package: an experience-shaped page (about, highlights, included, itinerary, reviews, per-person price, `duration`) whose
 * accommodation is one or several stays instead of one hotel. `includedInAll` is the "Package includes" checklist.
 */
export interface PackageDetail extends Omit<ExperienceDetail, "hotel" | "rooms"> {
  stays: PackageStay[];
}
