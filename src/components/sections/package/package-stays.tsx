import { MapPin, Star } from "lucide-react";
import Link from "next/link";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { hotelDetail } from "@/constants/routes";
import type { PackageStay } from "@/interfaces";

/** "Nights 4–6 · 3 nights" for a stay of a multi-property package. */
export function stayNights(stay: Pick<PackageStay, "fromNight" | "nights">): string {
  const last = stay.fromNight + stay.nights - 1;
  return `${stay.nights === 1 ? `Night ${stay.fromNight}` : `Nights ${stay.fromNight}–${last}`} · ${stay.nights} ${stay.nights === 1 ? "night" : "nights"}`;
}

/**
 * "Your accommodation" for a package of several properties: one card per stay, in the order of the trip, each with its nights, photos,
 * place, description and amenities. A stay links to its hotel page only when `linkable` says the page exists (`hotelSlugs`). A
 * package with one property uses the experience page's `ExperienceAccommodation` instead.
 */
export function PackageStays({ stays, heading, hotelSlugs }: { stays: PackageStay[]; heading: string; /** Slugs of the stays whose hotel page exists. */ hotelSlugs: ReadonlySet<string> }) {
  return (
    <section aria-labelledby="accommodation-heading">
      <h2 id="accommodation-heading" className="font-display text-title-sm font-medium text-primary">
        {heading}
      </h2>
      <ol className="mt-4 space-y-8">
        {stays.map((stay) => {
          const { hotel } = stay;
          const href = stay.hotelSlug && hotelSlugs.has(stay.hotelSlug) ? hotelDetail(stay.hotelSlug) : null;
          return (
            <li key={stay.id} className="grid gap-5 sm:grid-cols-[165px_1fr]">
              <div className="sm:w-[165px]">
                <ImageCarousel images={hotel.images.map((image) => image.src)} alt={hotel.images[0]?.alt ?? hotel.name} aspect="aspect-[4/3] sm:aspect-[165/173]" sizes="165px" touchArrows />
              </div>
              <div>
                <p className="text-micro uppercase tracking-widest text-muted-blue">{stayNights(stay)}</p>
                <h3 className="mt-1 flex flex-wrap items-center gap-2 font-display text-title-sm font-medium text-primary">
                  {href ? (
                    <Link href={href} className="underline decoration-border underline-offset-4 transition-colors hover:decoration-primary">
                      {hotel.name}
                    </Link>
                  ) : (
                    hotel.name
                  )}
                  <span className="flex gap-px" role="img" aria-label={`${hotel.stars}-star stay`}>
                    {Array.from({ length: hotel.stars }, (_, index) => (
                      <Star key={index} aria-hidden className="size-3.5 fill-star text-star" />
                    ))}
                  </span>
                </h3>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-body">
                  <MapPin className="size-3.5" aria-hidden /> {hotel.location}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-body">{hotel.description}</p>
                <ul className="mt-3 flex flex-wrap gap-2" aria-label="Amenities">
                  {hotel.amenities.map((amenity) => (
                    <li key={amenity} className="border border-border px-2.5 py-1 text-xs text-primary">
                      {amenity}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
