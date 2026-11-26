import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import type { FavoriteRef, ResolveFavoritesResult } from "@/interfaces";
import { AccountSection, INLINE_LINK } from "./account-section";
import { SavedFavorites } from "./saved-favorites";

export function FavoritesView({ resolveFavorites }: { resolveFavorites: (refs: FavoriteRef[]) => Promise<ResolveFavoritesResult> }) {
  return (
    <AccountSection
      id="favorites-title"
      eyebrow="Travel shortlist"
      title="All favorites"
      action={
        <Link href={ROUTES.browseExperiences} className={INLINE_LINK}>
          Browse more <ArrowRight aria-hidden className="size-4" />
        </Link>
      }
    >
      <SavedFavorites resolve={resolveFavorites} />
    </AccountSection>
  );
}
