import { HotelCard } from "@/components/cards/hotel-card";
import { PackageCard } from "@/components/cards/package-card";
import type { HotelCardData, PackageCardData, RegionPageCopy } from "@/interfaces";
import { CardGrid } from "@/components/ui/card-grid";
import { RegionSection } from "./region-section";

interface RegionOffersProps {
  packages: PackageCardData[];
  hotels: HotelCardData[];
  copy: Pick<RegionPageCopy, "packages" | "hotels">;
}

/** "Curated for you" packages and "Places to stay" hotels, shared by region and country pages. A section without cards is omitted. */
export function RegionOffers({ packages, hotels, copy }: RegionOffersProps) {
  return (
    <>
      {packages.length > 0 ? (
        <RegionSection id="region-packages-title" tag={copy.packages.tag} title={copy.packages.heading} link={copy.packages.linkLabel && copy.packages.href ? { label: copy.packages.linkLabel, href: copy.packages.href } : undefined}>
          <CardGrid>
            {packages.map((item) => (
              <PackageCard key={item.id} {...item} />
            ))}
          </CardGrid>
        </RegionSection>
      ) : null}

      {hotels.length > 0 ? (
        <RegionSection id="region-hotels-title" tag={copy.hotels.tag} title={copy.hotels.heading} link={copy.hotels.linkLabel && copy.hotels.href ? { label: copy.hotels.linkLabel, href: copy.hotels.href } : undefined}>
          <CardGrid>
            {hotels.map((item) => (
              <HotelCard key={item.id} {...item} />
            ))}
          </CardGrid>
        </RegionSection>
      ) : null}
    </>
  );
}
