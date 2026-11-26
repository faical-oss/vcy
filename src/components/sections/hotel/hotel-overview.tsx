import { Compass, Dumbbell, HeartPulse, Leaf, Plane, ConciergeBell, Sparkles, TreePine, Umbrella, Users, Utensils, Waves } from "lucide-react";
import type { ComponentType } from "react";
import type { AmenityIcon, HotelDetail } from "@/interfaces";

const ICONS: Record<AmenityIcon, ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  pool: Waves,
  spa: Sparkles,
  yoga: Leaf,
  dining: Utensils,
  fitness: Dumbbell,
  kids: Users,
  activity: Compass,
  service: ConciergeBell,
  transfer: Plane,
  beach: Umbrella,
  nature: TreePine,
  wellness: HeartPulse,
};

/** Overview tab: About, Amenities and Good to know. */
export function HotelOverview({ hotel }: { hotel: HotelDetail }) {
  return (
    <div className="space-y-10">
      <section aria-labelledby="about-heading">
        <h2 id="about-heading" className="font-display text-title-sm font-medium text-primary">
          About the hotel
        </h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-body">
          {hotel.description.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section aria-labelledby="amenities-heading">
        <h2 id="amenities-heading" className="font-display text-title-sm font-medium text-primary">
          Amenities
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {hotel.amenities.map(({ icon, label }) => {
            const Icon = ICONS[icon];
            return (
              <li key={label} className="flex items-center gap-3 border border-border px-4 py-3 text-sm text-primary">
                <Icon className="size-4 shrink-0 text-body" aria-hidden />
                {label}
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="good-to-know-heading">
        <h2 id="good-to-know-heading" className="font-display text-title-sm font-medium text-primary">
          Good to know
        </h2>
        <dl className="mt-4 grid gap-x-10 sm:grid-cols-2">
          {hotel.goodToKnow.map(({ label, value }) => (
            <div key={label} className="flex gap-6 border-b border-border py-3 text-sm">
              <dt className="w-24 shrink-0 text-muted">{label}</dt>
              <dd className="text-primary">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
