"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { REVIEW_TEXT_MAX, REVIEW_TEXT_MIN, REVIEW_TITLE_MAX, REVIEWS_PAGE_SIZE } from "@/constants/reviews";
import type { ReviewFormState, ReviewListResult } from "@/interfaces";
import { getReviewService } from "@/services";
import { areMoreReviewsEnabled, isReviewFormEnabled } from "@/lib/flags";
import { createRateLimiter } from "@/lib/rate-limit";

/** At most 3 review submissions per visitor (client IP) per 10 minutes. In memory, per instance: see src/lib/rate-limit.ts. */
const limiter = createRateLimiter({ limit: 3, windowMs: 10 * 60 * 1000 });

async function visitorKey(): Promise<string> {
  const forwarded = (await headers()).get("x-forwarded-for");
  return forwarded?.split(",")[0].trim() || "unknown";
}

const reviewSchema = z.object({
  hotelSlug: z.string().min(1).max(100),
  rating: z.coerce.number().int().min(1).max(5),
  text: z.string().trim().min(REVIEW_TEXT_MIN).max(REVIEW_TEXT_MAX),
  title: z.string().trim().max(REVIEW_TITLE_MAX).optional(),
});

/** The dev-only `?mock=` value the form passes along; anything else is ignored. */
const scenarioSchema = z.enum(["success", "error"]).optional().catch(undefined);

/** Server action behind the review form. Off unless the feature flag allows it (never in production, no reviews API yet). */
export async function submitReviewAction(_previous: ReviewFormState, formData: FormData): Promise<ReviewFormState> {
  if (!isReviewFormEnabled()) return { status: "error", code: "disabled" };
  const parsed = reviewSchema.safeParse({ hotelSlug: formData.get("hotelSlug"), rating: formData.get("rating"), text: formData.get("text"), title: formData.get("title") ?? undefined });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    return {
      status: "error",
      code: "invalid_input",
      fieldErrors: {
        ...(flat.rating ? { rating: "Choose a rating from 1 to 5." } : {}),
        ...(flat.text ? { text: `Write between ${REVIEW_TEXT_MIN} and ${REVIEW_TEXT_MAX} characters.` } : {}),
        ...(flat.title ? { title: `Keep the title under ${REVIEW_TITLE_MAX} characters.` } : {}),
      },
    };
  }
  // Only submissions that passed validation count: they are the ones that reach the service.
  if (!limiter.allow(await visitorKey())) return { status: "error", code: "rate_limited" };
  try {
    const { title, ...rest } = parsed.data;
    const scenario = scenarioSchema.parse(formData.get("mock") ?? undefined);
    const result = await (await getReviewService()).submitReview({ ...rest, ...(title ? { title } : {}), ...(scenario ? { scenario } : {}) });
    return result.ok ? { status: "success" } : { status: "error", code: result.code };
  } catch {
    return { status: "error", code: "unavailable" };
  }
}

const listSchema = z.object({ slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120), offset: z.number().int().min(0).max(5000) });

/** Server action behind "Load more reviews": the next page after `offset`. Mock only for now (no reviews API). */
export async function loadMoreReviewsAction(slug: string, offset: number): Promise<ReviewListResult> {
  const parsed = listSchema.safeParse({ slug, offset });
  if (!parsed.success || !areMoreReviewsEnabled()) return { ok: false, code: "unavailable" };
  try {
    return await (await getReviewService()).listReviews({ ...parsed.data, limit: REVIEWS_PAGE_SIZE });
  } catch {
    return { ok: false, code: "unavailable" };
  }
}
