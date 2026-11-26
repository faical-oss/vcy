import { DestinationCard } from "@/components/cards/destination-card";
import { CardCarousel } from "@/components/ui/card-carousel";
import { Container } from "@/components/ui/container";
import { TILE_CAROUSEL_COLS } from "@/constants/grids";
import type { DestinationSummary, HotelCardData, PackageCardData, RegionPageCopy } from "@/interfaces";
import { DestinationStats, type DestinationStat } from "./destination-stats";
import { RegionOffers } from "./region-offers";

interface RegionBodyProps {
  /** Facts the region has. Empty hides the row. */
  stats: DestinationStat[];
  /** Hidden when absent. */
  intro?: string;
  destinations: DestinationSummary[];
  packages: PackageCardData[];
  hotels: HotelCardData[];
  copy: RegionPageCopy;
}

/**
 * Everything under a region page hero. Nothing is invented for missing data: absent facts and intro are not shown, and
 * a section without cards is omitted (an island region can have no packages or hotels).
 */
export function RegionBody({ stats, intro, destinations, packages, hotels, copy }: RegionBodyProps) {
  return (
    <>
      <Container className="px-6">
        <DestinationStats stats={stats} />
        {intro ? <p className="max-w-[720px] pt-8 text-sm leading-relaxed text-body">{intro}</p> : null}
      </Container>

      {destinations.length > 0 ? (
        <section aria-labelledby="region-popular-title" className="pb-14 pt-12">
          <CardCarousel
            label={copy.popular.label}
            cols={TILE_CAROUSEL_COLS}
            heading={
              <h2 id="region-popular-title" className="font-display text-title-md font-medium text-primary">
                {copy.popular.heading}
              </h2>
            }
          >
            {destinations.map((destination) => (
              <DestinationCard key={destination.id} {...destination} variant="listing" className="aspect-square snap-start" />
            ))}
          </CardCarousel>
        </section>
      ) : null}

      <RegionOffers packages={packages} hotels={hotels} copy={copy} />
    </>
  );
}
