import { Heart } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import type { Favorite } from "@/interfaces";
import { EmptyState } from "./empty-state";
import { FavoritesGrid } from "./favorites-grid";

/** Favorites content shared by the Overview preview and the Favorites page. */
export function FavoritesSection({ favorites, limit }: { favorites: readonly Favorite[]; limit?: number }) {
  if (favorites.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="Your shortlist is empty"
        description="Tap the heart on any experience, package or hotel to keep it here."
        action={{ label: "Explore experiences", href: ROUTES.browseExperiences }}
      />
    );
  }
  return (
    <div className="mt-5 sm:mt-6">
      <FavoritesGrid favorites={limit ? favorites.slice(0, limit) : favorites} />
    </div>
  );
}
