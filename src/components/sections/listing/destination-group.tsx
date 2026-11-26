import { DestinationCard } from "@/components/cards/destination-card";
import { CardGrid } from "@/components/ui/card-grid";
import { SectionTag } from "@/components/ui/section-tag";
import type { DestinationSummary } from "@/interfaces";

interface DestinationGroupProps {
  /** Unique within the page; names the section. */
  id: string;
  /** Region name, shown as the eyebrow heading. */
  title: string;
  destinations: DestinationSummary[];
}

/** One region of the All Destinations page: an eyebrow heading and the tile grid of destination cards. */
export function DestinationGroup({ id, title, destinations }: DestinationGroupProps) {
  return (
    <section aria-labelledby={id}>
      <SectionTag as="h2" id={id} className="mb-5">
        {title}
      </SectionTag>
      <CardGrid kind="tiles" as="ul">
        {destinations.map((destination) => (
          <li key={destination.id}>
            <DestinationCard {...destination} variant="listing" />
          </li>
        ))}
      </CardGrid>
    </section>
  );
}
