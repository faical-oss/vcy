import { Bike, Check, Compass, Flame, Heart, Leaf, MapPin, Mountain, Sparkles, Star, Sun, Utensils, Waves, X, type LucideIcon } from "lucide-react";
import { LocationMap } from "@/components/sections/detail/location-map";
import type { ExperienceDetail, HighlightIcon } from "@/interfaces";

const ICONS: Record<HighlightIcon, LucideIcon> = { compass: Compass, waves: Waves, utensils: Utensils, sparkles: Sparkles, pin: MapPin, star: Star, leaf: Leaf, mountain: Mountain, bike: Bike, sun: Sun, heart: Heart, flame: Flame };

/** Overview tab: About, Highlights (bordered tiles with an icon), What's included (ticks, an excluded item greyed) and Location. */
export function ExperienceOverview({ experience, noun = "experience" }: { experience: Pick<ExperienceDetail, "about" | "highlights" | "included" | "location"> & { hotel: { name: string } }; /** What the page is about, in the About heading ("experience", "package"). */ noun?: string }) {
  // TODO(api): coordinates of the venue; until then "Open in Maps" searches by name.
  const mapUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${experience.hotel.name}, ${experience.location.label}`)}`;
  return (
    <div className="space-y-10">
      <section aria-labelledby="about-heading">
        <h2 id="about-heading" className="font-display text-title-sm font-medium text-primary">
          About this {noun}
        </h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-body">
          {experience.about.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section aria-labelledby="highlights-heading">
        <h2 id="highlights-heading" className="font-display text-title-sm font-medium text-primary">
          Highlights
        </h2>
        <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {experience.highlights.map(({ icon, text }) => {
            const Icon = ICONS[icon];
            return (
              <li key={text} className="flex items-center gap-3 border border-border px-4 py-3 text-sm text-primary">
                <Icon className="size-4 shrink-0 text-body" aria-hidden /> {text}
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="included-heading">
        <h2 id="included-heading" className="font-display text-title-sm font-medium text-primary">
          What&apos;s included
        </h2>
        <ul className="mt-4 grid gap-x-10 sm:grid-cols-2">
          {experience.included.map(({ text, included }) => (
            <li key={text} className={included ? "flex items-center gap-2.5 border-b border-border py-2 text-sm text-primary" : "flex items-center gap-2.5 border-b border-border py-2 text-sm text-muted-blue"}>
              {included ? <Check className="size-3.5 shrink-0 text-primary" strokeWidth={3} aria-hidden /> : <X className="size-3.5 shrink-0" aria-hidden />}
              <span>
                {text}
                {included ? null : <span className="sr-only"> (not included)</span>}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="location-heading">
        <h2 id="location-heading" className="font-display text-title-sm font-medium text-primary">
          Location
        </h2>
        <LocationMap className="mt-4 h-[260px]" name={experience.hotel.name} label={experience.location.label} place={experience.location.label.toUpperCase()} mapUrl={mapUrl} />
      </section>
    </div>
  );
}
