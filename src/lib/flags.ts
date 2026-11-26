import "server-only";

/** Browse freely, login required to book. Flip off to allow guest checkout. */
export function isForcedLoginEnabled(): boolean {
  return process.env.FEATURE_FORCED_LOGIN !== "false";
}

/**
 * "Load more reviews" on the hotel and experience pages. There is no reviews API yet, so it only exists with the mock review
 * service (USE_MOCKS=true), outside production, which makes reviews up. TODO(api): drop with the real endpoint.
 */
export function areMoreReviewsEnabled(): boolean {
  return process.env.USE_MOCKS === "true" && process.env.SITE_ENV !== "production";
}

/**
 * "Travelled on this trip?" review form. Needs a reviews API, which does not exist yet: the form is only available with the
 * mock review service (USE_MOCKS=true), outside production, and when FEATURE_REVIEW_FORM=true. Never on in production.
 */
export function isReviewFormEnabled(): boolean {
  return process.env.FEATURE_REVIEW_FORM === "true" && process.env.USE_MOCKS === "true" && process.env.SITE_ENV !== "production";
}

/**
 * RESERVE NOW on the hotel detail page leads to a noindex checkout STUB (`/checkout`), because real checkout does not exist.
 * Only with FEATURE_CHECKOUT_STUB=true, the mock services and outside production. Off otherwise: the button stays disabled
 * and `/checkout` is a 404.
 */
/** The `?mock=` scenarios of the room availability mock: only with mocks, and never in production. */
export function isMockScenarioEnabled(): boolean {
  return process.env.USE_MOCKS === "true" && process.env.SITE_ENV !== "production";
}

export function isCheckoutStubEnabled(): boolean {
  return process.env.FEATURE_CHECKOUT_STUB === "true" && process.env.USE_MOCKS === "true" && process.env.SITE_ENV !== "production";
}
