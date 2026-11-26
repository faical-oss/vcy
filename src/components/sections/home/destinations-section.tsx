import { ArrowRight } from "lucide-react";
import { DestinationCard } from "@/components/cards/destination-card";
import { ButtonLink } from "@/components/ui/button";
import { CardGrid } from "@/components/ui/card-grid";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ROUTES } from "@/constants/routes";
import type { DestinationSummary } from "@/interfaces";

export function DestinationsSection({ destinations }: { destinations: DestinationSummary[] }) {
  return (
    <section aria-labelledby="destinations-title" className="bg-surface py-[57px]">
      <Container className="px-6">
        <SectionHeading id="destinations-title" tag="Explore the world" title="Popular Destinations" />
        <CardGrid kind="tiles" as="ul" className="mt-8">
          {destinations.map((destination) => (
            <li key={destination.id}>
              <DestinationCard {...destination} />
            </li>
          ))}
        </CardGrid>
        <div className="mt-6 flex justify-end">
          <ButtonLink href={ROUTES.destinations} variant="link" size="inline">
            All destinations <ArrowRight className="size-3.5" aria-hidden />
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
