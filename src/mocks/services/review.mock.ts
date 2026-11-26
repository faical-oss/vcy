import { fnv1a } from "@/helpers/seeded-pick";
import type { HotelReview, IReviewService } from "@/interfaces";

const DELAY_MS = 1000;

const AUTHORS = ["Hannah K.", "Luca M.", "Priya S.", "Tom B.", "Elena R.", "Daniel W.", "Marta L.", "Chris P.", "Ines F.", "Sam O.", "Yuki T.", "Olivia N."];
const LOCATIONS = ["London, UK", "Berlin, Germany", "Toronto, Canada", "Sydney, Australia", "Lisbon, Portugal", "Amsterdam, Netherlands", "Austin, USA", "Dublin, Ireland", "Zurich, Switzerland", "Oslo, Norway"];
const REVIEWS: readonly { title: string; text: string; rating: number }[] = [
  { title: "Exactly the reset we needed", text: "Calm, thoughtful and well run from the first morning. The team made every day easy and we left properly rested.", rating: 5 },
  { title: "Beautiful setting", text: "The surroundings are lovely and the food was fresh and generous. A few small things took a while, but the staff were always kind.", rating: 4 },
  { title: "Would happily come back", text: "Relaxed pace, clean and comfortable, and good guidance on how to spend the days. We came home feeling lighter.", rating: 5 },
  { title: "Good value for the quality", text: "Everything we booked matched the description. Sessions started on time and the group size felt just right.", rating: 4 },
  { title: "Peaceful and welcoming", text: "A quiet place with attentive people. I slept better than I have in months and enjoyed every meal.", rating: 5 },
  { title: "Lovely, with room to improve", text: "Great setting and friendly team. Arrival was a little disorganised, though everything after that was smooth.", rating: 3 },
];

/** Deterministic made-up review number `index` of `slug`, newest first (one per week back from October 2026). */
function madeUpReview(slug: string, index: number): HotelReview {
  const seed = fnv1a(`${slug}:${index}`);
  const base = REVIEWS[seed % REVIEWS.length];
  const date = new Date(Date.UTC(2026, 9, 28 - index * 7));
  return { id: `${slug}-r${index + 1}`, author: AUTHORS[(seed >>> 3) % AUTHORS.length], location: LOCATIONS[(seed >>> 6) % LOCATIONS.length], title: base.title, date: date.toISOString().slice(0, 10), rating: base.rating, text: base.text };
}

/**
 * Mock review service: waits one second, accepts valid input and stores nothing (there is no reviews API yet, and a
 * submitted review never appears in the list). `scenario: "error"` (dev `?mock=error` on the page) fails the call.
 * TODO(api): replace with the reviews endpoint (moderation queue).
 */
export const mockReviewService: IReviewService = {
  async submitReview(input) {
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    if (input.scenario === "error") return { ok: false, code: "unavailable" };
    if (!input.hotelSlug || input.rating < 1 || input.rating > 5 || input.text.trim().length === 0) return { ok: false, code: "invalid_input" };
    return { ok: true };
  },

  async listReviews({ slug, offset, limit }) {
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    return { ok: true, items: Array.from({ length: limit }, (_, index) => madeUpReview(slug, offset + index)) };
  },
};
