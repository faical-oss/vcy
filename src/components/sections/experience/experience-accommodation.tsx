import { MapPin, Star } from "lucide-react";
import { ImageCarousel } from "@/components/ui/image-carousel";
import type { ExperienceHotel } from "@/interfaces";

/** "Your accommodation": a photo carousel (165 x 173) and the stay's name, stars, place, description and amenity chips. */
export function ExperienceAccommodation({ hotel }: { hotel: ExperienceHotel }) {
  return (
    <section aria-labelledby="accommodation-heading">
      <h2 id="accommodation-heading" className="font-display text-title-sm font-medium text-primary">
        Your accommodation
      </h2>
      <div className="mt-4 grid gap-5 sm:grid-cols-[165px_1fr]">
        <div className="sm:w-[165px]">
          <ImageCarousel images={hotel.images.map((image) => image.src)} alt={hotel.images[0]?.alt ?? hotel.name} aspect="aspect-[4/3] sm:aspect-[165/173]" sizes="165px" touchArrows />
        </div>
        <div>
          <h3 className="flex items-center gap-2 font-display text-title-sm font-medium text-primary">
            {hotel.name}
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
      </div>
    </section>
  );
}
