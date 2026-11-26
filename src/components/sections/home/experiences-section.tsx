import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { ExperienceCard } from "@/components/cards/experience-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { CardCarousel } from "@/components/ui/card-carousel";
import type { ExperienceCardData } from "@/interfaces";
import { ExperienceFilters } from "./experience-filters";

export function ExperiencesSection({ filters, experiences }: { filters: string[]; experiences: ExperienceCardData[] }) {
  return (
    <section aria-labelledby="experiences-title" className="bg-card pb-14 pt-6">
      <CardCarousel
        label="Featured experiences"
        heading={<SectionHeading id="experiences-title" tag="Browse by type" title="Featured Experiences" />}
        toolbar={<ExperienceFilters filters={filters} />}
        footer={
          <ButtonLink href={ROUTES.browseExperiences} variant="link" size="inline">
            View all experiences <ArrowRight className="size-3.5" aria-hidden />
          </ButtonLink>
        }
      >
        {experiences.map((experience) => (
          <ExperienceCard key={experience.id} {...experience} />
        ))}
      </CardCarousel>
    </section>
  );
}
