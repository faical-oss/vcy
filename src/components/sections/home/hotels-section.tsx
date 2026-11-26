import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { HotelCard } from "@/components/cards/hotel-card";
import { CardCarousel } from "@/components/ui/card-carousel";
import { SectionHeading } from "@/components/ui/section-heading";
import type { HotelCardData } from "@/interfaces";

export function HotelsSection({ hotels }: { hotels: HotelCardData[] }) {
  return (
    <section aria-labelledby="hotels-title" className="bg-card py-14">
      <CardCarousel
        label="Featured hotels and resorts"
        footer={
          <ButtonLink href={ROUTES.browseHotels} variant="link" size="inline">
            All hotels <ArrowRight className="size-3.5" aria-hidden />
          </ButtonLink>
        }
        heading={
          <SectionHeading
            id="hotels-title"
            tag="Places to stay"
            title="Featured Hotels & Resorts"
            description="Handpicked luxury properties around the world."
          />
        }
      >
        {hotels.map((hotel) => (
          <HotelCard key={hotel.id} {...hotel} />
        ))}
      </CardCarousel>
    </section>
  );
}
