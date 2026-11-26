import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { submitReview, listReviews, forwardedFor } = vi.hoisted(() => ({ submitReview: vi.fn(), listReviews: vi.fn(), forwardedFor: { value: "203.0.113.1" } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": forwardedFor.value }) }));
vi.mock("@/services", () => ({ getReviewService: async () => ({ submitReview, listReviews }) }));

import { loadMoreReviewsAction, submitReviewAction } from "./actions";

const IDLE = { status: "idle" } as const;
const form = (values: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
};
const valid = { hotelSlug: "hotel-a", rating: "5", text: "A calm, well run place with excellent food." };

describe("submitReviewAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("FEATURE_REVIEW_FORM", "true");
    vi.stubEnv("USE_MOCKS", "true");
    vi.stubEnv("SITE_ENV", "development");
    submitReview.mockResolvedValue({ ok: true });
    forwardedFor.value = `198.51.100.${Math.floor(Math.random() * 250)}.${Date.now()}`; // a fresh visitor per test
  });
  afterEach(() => vi.unstubAllEnvs());

  it("posts a valid review to the review service and reports success", async () => {
    expect(await submitReviewAction(IDLE, form(valid))).toEqual({ status: "success" });
    expect(submitReview).toHaveBeenCalledWith({ hotelSlug: "hotel-a", rating: 5, text: valid.text });
  });

  it("passes an optional title and the dev ?mock= scenario to the service, and ignores a bad scenario", async () => {
    await submitReviewAction(IDLE, form({ ...valid, title: "  Lovely  ", mock: "error" }));
    expect(submitReview).toHaveBeenLastCalledWith({ hotelSlug: "hotel-a", rating: 5, text: valid.text, title: "Lovely", scenario: "error" });
    await submitReviewAction(IDLE, form({ ...valid, mock: "weird" }));
    expect(submitReview).toHaveBeenLastCalledWith({ hotelSlug: "hotel-a", rating: 5, text: valid.text });
    const tooLong = await submitReviewAction(IDLE, form({ ...valid, title: "x".repeat(101) }));
    expect(tooLong).toMatchObject({ status: "error", fieldErrors: { title: "Keep the title under 100 characters." } });
  });

  it("validates the rating and the text and never calls the service", async () => {
    const result = await submitReviewAction(IDLE, form({ ...valid, rating: "9", text: "short" }));
    expect(result).toEqual({ status: "error", code: "invalid_input", fieldErrors: { rating: "Choose a rating from 1 to 5.", text: "Write between 20 and 2000 characters." } });
    expect((await submitReviewAction(IDLE, form({ hotelSlug: "hotel-a", text: valid.text }))).status).toBe("error");
    expect(submitReview).not.toHaveBeenCalled();
  });

  it("reports a service rejection and a service failure as errors", async () => {
    submitReview.mockResolvedValue({ ok: false, code: "unavailable" });
    expect(await submitReviewAction(IDLE, form(valid))).toEqual({ status: "error", code: "unavailable" });
    submitReview.mockRejectedValue(new Error("down"));
    expect(await submitReviewAction(IDLE, form(valid))).toEqual({ status: "error", code: "unavailable" });
  });

  it("is disabled without the flag, without mocks, and in production, and never calls the service then", async () => {
    for (const [key, value] of [["FEATURE_REVIEW_FORM", "false"], ["USE_MOCKS", "false"], ["SITE_ENV", "production"]] as const) {
      vi.stubEnv(key, value);
      expect(await submitReviewAction(IDLE, form(valid)), `${key}=${value}`).toEqual({ status: "error", code: "disabled" });
      vi.stubEnv("FEATURE_REVIEW_FORM", "true");
      vi.stubEnv("USE_MOCKS", "true");
      vi.stubEnv("SITE_ENV", "development");
    }
    expect(submitReview).not.toHaveBeenCalled();
  });

  it("rate-limits a visitor after three valid submissions, per visitor, and does not count invalid input", async () => {
    forwardedFor.value = "203.0.113.50";
    for (let index = 0; index < 5; index += 1) await submitReviewAction(IDLE, form({ ...valid, text: "short" }));
    for (let index = 0; index < 3; index += 1) expect((await submitReviewAction(IDLE, form(valid))).status).toBe("success");
    expect(await submitReviewAction(IDLE, form(valid))).toEqual({ status: "error", code: "rate_limited" });
    expect(submitReview).toHaveBeenCalledTimes(3);
    forwardedFor.value = "203.0.113.51";
    expect((await submitReviewAction(IDLE, form(valid))).status).toBe("success");
  });
});

describe("loadMoreReviewsAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("USE_MOCKS", "true");
    vi.stubEnv("SITE_ENV", "development");
    listReviews.mockResolvedValue({ ok: true, items: [] });
  });
  afterEach(() => vi.unstubAllEnvs());

  it("asks the service for the next ten reviews after the offset", async () => {
    expect(await loadMoreReviewsAction("hotel-a", 3)).toEqual({ ok: true, items: [] });
    expect(listReviews).toHaveBeenCalledWith({ slug: "hotel-a", offset: 3, limit: 10 });
  });

  it("rejects a bad slug or offset and is off in production and without mocks, without calling the service", async () => {
    expect(await loadMoreReviewsAction("Bad Slug", 3)).toEqual({ ok: false, code: "unavailable" });
    expect(await loadMoreReviewsAction("hotel-a", -1)).toEqual({ ok: false, code: "unavailable" });
    vi.stubEnv("SITE_ENV", "production");
    expect(await loadMoreReviewsAction("hotel-a", 3)).toEqual({ ok: false, code: "unavailable" });
    vi.stubEnv("SITE_ENV", "development");
    vi.stubEnv("USE_MOCKS", "false");
    expect(await loadMoreReviewsAction("hotel-a", 3)).toEqual({ ok: false, code: "unavailable" });
    expect(listReviews).not.toHaveBeenCalled();
  });

  it("reports a service failure as unavailable", async () => {
    listReviews.mockRejectedValue(new Error("down"));
    expect(await loadMoreReviewsAction("hotel-a", 3)).toEqual({ ok: false, code: "unavailable" });
  });
});
