import { PackageCard } from "@/components/cards/package-card";
import { CardCarousel } from "@/components/ui/card-carousel";
import { SectionHeading } from "@/components/ui/section-heading";
import type { PackageCardData } from "@/interfaces";

export function PackagesSection({ packages }: { packages: PackageCardData[] }) {
  return (
    <section aria-labelledby="packages-title" className="bg-surface-blue py-14">
      <CardCarousel
        cols="[--cols:1.4] sm:[--cols:2] lg:[--cols:3]"
        label="Handpicked packages"
        // TODO(listing): the "All packages" link comes back with the packages listing page (there is none yet).
        heading={
          <SectionHeading
            id="packages-title"
            tag="Curated for you"
            title="Handpicked Packages"
            descriptionClassName="max-w-md"
            description="Fully tailored itineraries combining the best experiences, accommodation and transfers."
          />
        }
      >
        {packages.map((pkg) => (
          <PackageCard key={pkg.id} {...pkg} />
        ))}
      </CardCarousel>
    </section>
  );
}
