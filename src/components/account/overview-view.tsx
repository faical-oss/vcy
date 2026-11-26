import { ArrowRight, CalendarDays, CircleCheck, Heart } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { bookingsAwayText } from "@/helpers/tier";
import type { AccountSummary, Booking, Favorite } from "@/interfaces";
import { AccountSection, INLINE_LINK } from "./account-section";
import { FavoritesSection } from "./favorites-section";
import { StatCard } from "./stat-card";
import { TierProgress } from "./tier-progress";
import { TripsSection } from "./trips-section";

const PREVIEW_LIMIT = 3;
const BIG_NUMBER = "mt-3 truncate font-display text-stat font-medium leading-none lining-nums text-primary sm:mt-4 sm:text-stat-lg";

export function OverviewView({ summary, bookings, favorites }: { summary: AccountSummary; bookings: readonly Booking[]; favorites: readonly Favorite[] }) {
  const { tier } = summary;
  return (
    <div className="space-y-5 sm:space-y-6">
      <section aria-label="Account summary" className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-4">
        <StatCard icon={CalendarDays} label="Upcoming trips">
          <p className={BIG_NUMBER}>{summary.upcomingTrips}</p>
        </StatCard>
        <StatCard icon={Heart} label="Favorites">
          <p className={BIG_NUMBER}>{summary.favoritesCount}</p>
        </StatCard>
        <StatCard icon={CircleCheck} label="Member status">
          <p className="mt-3 text-xs font-medium leading-relaxed text-body sm:mt-4 sm:text-sm">{bookingsAwayText(tier.bookingsToNextLevel, tier.level + 1)}</p>
          <div className="mt-3 border-t border-border pt-3">
            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-nano font-semibold uppercase leading-tight tracking-nav text-primary sm:text-caption">Wellness level {tier.level}</p>
              <p className="text-nano font-medium text-accent sm:text-caption">{tier.discountPercent}% discount</p>
            </div>
            <TierProgress level={tier.level} totalLevels={tier.totalLevels} />
          </div>
        </StatCard>
      </section>

      <AccountSection
        id="overview-trips"
        eyebrow="Bookings"
        title="My trips"
        titleClassName="sm:text-heading-sm leading-8"
        action={
          bookings.length > PREVIEW_LIMIT ? (
            <Link href={ROUTES.accountTrips} className={INLINE_LINK}>
              View all <ArrowRight aria-hidden className="size-4" />
            </Link>
          ) : null
        }
      >
        <TripsSection bookings={bookings} variant="overview" limit={PREVIEW_LIMIT} />
      </AccountSection>

      <AccountSection
        id="overview-favorites"
        eyebrow="Travel shortlist"
        title="Your favorites"
        action={
          <div className="flex items-center gap-5">
            {favorites.length > PREVIEW_LIMIT ? (
              <Link href={ROUTES.favorites} className={INLINE_LINK}>
                View all <ArrowRight aria-hidden className="size-4" />
              </Link>
            ) : null}
            <Link href={ROUTES.browseExperiences} className={INLINE_LINK}>
              Browse more <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
        }
      >
        <FavoritesSection favorites={favorites} limit={PREVIEW_LIMIT} />
      </AccountSection>
    </div>
  );
}
