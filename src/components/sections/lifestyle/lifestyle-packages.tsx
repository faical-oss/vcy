"use client";

import { LINK_CAPS } from "./link-caps";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { PackageCard } from "@/components/cards/package-card";
import { ButtonLink } from "@/components/ui/button";
import { CardCarousel } from "@/components/ui/card-carousel";
import { pillClassName } from "@/components/ui/pill";
import { ScrollRow } from "@/components/ui/scroll-row";
import { SectionHeading } from "@/components/ui/section-heading";
import type { PackageCardData } from "@/interfaces";

const ALL = "All";

interface LifestylePackagesProps {
  id: string;
  eyebrow: string;
  title: string;
  sub: string;
  filters: string[];
  items: { card: PackageCardData; filters: string[] }[];
  viewAllLabel: string;
  viewAllHref: string;
}

/**
 * Package cards in a carousel with single-select filter chips. Every card is in the server HTML (the "All" chip is
 * active on first render); a chip only narrows the list in the browser, so there is no filter URL. Cards are not links
 * until package pages exist (`PackageCard` without `href`). Anchor target of the sub-nav ("packages").
 */
export function LifestylePackages({ id, eyebrow, title, sub, filters, items, viewAllLabel, viewAllHref }: LifestylePackagesProps) {
  const [active, setActive] = useState(ALL);
  const shown = active === ALL ? items : items.filter((item) => item.filters.includes(active));

  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-[121px] md:scroll-mt-[185px] bg-surface-blue py-14 sm:py-20">
      <CardCarousel
        cols="[--cols:1.4] sm:[--cols:2] lg:[--cols:3.5]"
        label={`${title}: packages`}
        heading={<SectionHeading id={`${id}-title`} tag={eyebrow} title={title} titleClassName="text-3xl sm:text-title-lg" description={sub} descriptionClassName="max-w-md" />}
        toolbar={
          <ScrollRow className="mt-[calc(1.5rem-8px)]" role="group" aria-label={`Filter ${title.toLowerCase()}`}>
            {[ALL, ...filters].map((label) => (
              <button
                key={label}
                type="button"
                aria-pressed={active === label}
                onClick={() => setActive(label)}
                className={pillClassName(active === label)}
              >
                {label}
              </button>
            ))}
          </ScrollRow>
        }
        footer={
          <ButtonLink href={viewAllHref} variant="link" size="inline" className={LINK_CAPS}>
            {viewAllLabel} <ArrowRight className="size-3.5" aria-hidden />
          </ButtonLink>
        }
      >
        {shown.map(({ card }) => (
          <PackageCard key={card.id} {...card} />
        ))}
      </CardCarousel>
      <p role="status" className="sr-only">
        {active === ALL ? `Showing all ${items.length} packages` : `Showing ${shown.length} of ${items.length} packages for ${active}`}
      </p>
    </section>
  );
}
