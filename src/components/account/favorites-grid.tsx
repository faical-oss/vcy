import { ExperienceCard } from "@/components/cards/experience-card";
import { HotelCard } from "@/components/cards/hotel-card";
import { PackageCard } from "@/components/cards/package-card";
import { CardGrid } from "@/components/ui/card-grid";
import type { Favorite } from "@/interfaces";

/** Saved items reuse the public cards in a responsive grid. */
export function FavoritesGrid({ favorites }: { favorites: readonly Favorite[] }) {
  return (
    <CardGrid as="ul">
      {favorites.map((favorite) => (
        <li key={`${favorite.kind}:${favorite.id}`} className="flex [&>article]:w-full">
          {favorite.kind === "experience" ? <ExperienceCard {...favorite.item} /> : null}
          {favorite.kind === "package" ? <PackageCard {...favorite.item} /> : null}
          {favorite.kind === "hotel" ? <HotelCard {...favorite.item} /> : null}
        </li>
      ))}
    </CardGrid>
  );
}
