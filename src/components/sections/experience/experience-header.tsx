import { durationLabel } from "@/helpers/stay-duration";
import { Clock, MapPin, Users } from "lucide-react";
import type { ReactNode } from "react";
import { DetailHeader, MetaItem, RatingLine } from "@/components/sections/detail/detail-header";
import type { ExperienceDetail } from "@/interfaces";

/**
 * Experience header on the shared `DetailHeader`: the category (outlined) and the badge ("Best seller", filled), the H1, the
 * provider as subtitle, and the meta row: location, nights, group size (min to max), rating and review count.
 */
export function ExperienceHeader({ experience, breadcrumb, actions }: { experience: ExperienceDetail; breadcrumb: ReactNode; actions: ReactNode }) {
  const { min, max } = experience.groupSize;
  return (
    <DetailHeader
      breadcrumb={breadcrumb}
      title={experience.title}
      subtitle={experience.provider}
      actions={actions}
      badges={
        <>
          <span className="border border-border px-2 py-1 text-micro uppercase tracking-widest text-muted-blue">{experience.category.label}</span>
          {experience.badge ? <span className="border border-primary bg-primary px-2 py-1 text-micro font-semibold uppercase tracking-widest text-white">{experience.badge}</span> : null}
        </>
      }
      meta={
        <>
          <RatingLine overall={experience.reviews.overall} count={experience.reviews.count} />
          <MetaItem icon={<MapPin className="size-3.5" aria-hidden />}>{experience.location.label}</MetaItem>
          <MetaItem icon={<Clock className="size-3.5" aria-hidden />}>
            {durationLabel(experience.duration) ?? "Flexible stay"}
          </MetaItem>
          <MetaItem icon={<Users className="size-3.5" aria-hidden />}>
            {min}–{max} people
          </MetaItem>
        </>
      }
    />
  );
}
