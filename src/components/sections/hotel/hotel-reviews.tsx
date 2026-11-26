import type { ReactNode } from "react";
import type { HotelReviews } from "@/interfaces";
import { reviewStars } from "./review-stars";
import { ReviewsList, type LoadMoreReviews } from "./reviews-list";


/** Reviews tab: a box with the overall score and six category bars, the review list, then the review form (`form`, absent while its flag is off). */
export function HotelReviewsPanel({ reviews, form, slug, loadMore, avatar = "round" }: { reviews: HotelReviews; form?: ReactNode; /** Slug of the hotel or experience (for "Load more reviews"). */ slug: string; /** Absent: no "Load more reviews" button. */ loadMore?: LoadMoreReviews; /** "round": two initials in a circle (hotels). "square": one initial in a square (experiences, as in the design). */ avatar?: "round" | "square" }) {
  return (
    <section aria-labelledby="reviews-heading" className="space-y-8">
      <h2 id="reviews-heading" className="sr-only">
        Guest reviews
      </h2>
      <div className="grid gap-8 border border-border p-6 md:grid-cols-[170px_1fr] md:items-center">
        <div>
          <p className="text-display-sm font-bold text-primary">{reviews.overall.toFixed(1)}</p>
          <div className="mt-1 flex" role="img" aria-label={`${reviews.overall.toFixed(1)} out of 5`}>
            {reviewStars(Math.round(reviews.overall), "size-3.5")}
          </div>
          <p className="mt-1 text-xs text-body">{reviews.count} reviews</p>
        </div>
        <ul className="space-y-1.5">
          {reviews.categories.map(({ label, score }) => (
            <li key={label} className="grid grid-cols-[140px_1fr_32px] items-center gap-3 text-xs text-primary">
              <span>{label}</span>
              <span className="h-1.5 bg-surface-blue" role="img" aria-label={`${label}: ${score.toFixed(1)} out of 5`}>
                <span className="block h-full bg-primary" style={{ width: `${(score / 5) * 100}%` }} />
              </span>
              <span className="text-right font-medium">{Number.isInteger(score) ? score : score.toFixed(1)}</span>
            </li>
          ))}
        </ul>
      </div>
      <ReviewsList initial={reviews.items} total={reviews.count} slug={slug} loadMore={loadMore} avatar={avatar} />
      {form}
    </section>
  );
}
