import { LINK_CAPS } from "./link-caps";
import { ArrowRight } from "lucide-react";
import { DestinationCard } from "@/components/cards/destination-card";
import { ButtonLink } from "@/components/ui/button";
import { CardGrid } from "@/components/ui/card-grid";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ROUTES, destination } from "@/constants/routes";
import type { LifestyleDestinationTile } from "@/interfaces";

/** Eight photo tiles (the shared `DestinationCard`). A tile is a link only when `destinationSlug` names an existing destination page. */
export function LifestyleDestinations({ id, eyebrow, title, items, viewAllLabel }: { id: string; eyebrow: string; title: string; items: LifestyleDestinationTile[]; viewAllLabel: string }) {
  return (
    <section aria-labelledby={`${id}-title`} className="bg-card py-14">
      <Container>
        <SectionHeading id={`${id}-title`} tag={eyebrow} title={title} titleClassName="text-3xl sm:text-title-lg" />
        <CardGrid kind="tiles" as="ul" className="mt-8">
          {items.map((tile) => (
            <li key={tile.name}>
              <DestinationCard name={tile.name} region={tile.region} countLabel={tile.count} imageSrc={tile.image} href={tile.destinationSlug ? destination(tile.destinationSlug) : undefined} />
            </li>
          ))}
        </CardGrid>
        <div className="mt-6 flex justify-end">
          <ButtonLink href={ROUTES.destinations} variant="link" size="inline" className={LINK_CAPS}>
            {viewAllLabel} <ArrowRight className="size-3.5" aria-hidden />
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
