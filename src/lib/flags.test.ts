import { afterEach, describe, expect, it, vi } from "vitest";
import { areMoreReviewsEnabled, isCheckoutStubEnabled, isReviewFormEnabled } from "./flags";

describe("isReviewFormEnabled", () => {
  afterEach(() => vi.unstubAllEnvs());
  const on = () => {
    vi.stubEnv("FEATURE_REVIEW_FORM", "true");
    vi.stubEnv("USE_MOCKS", "true");
    vi.stubEnv("SITE_ENV", "development");
  };

  it("is on only with the flag, the mock review service and a non-production environment", () => {
    on();
    expect(isReviewFormEnabled()).toBe(true);
  });

  it("is off by default, without mocks (no reviews API) and in production", () => {
    vi.stubEnv("FEATURE_REVIEW_FORM", "");
    expect(isReviewFormEnabled()).toBe(false);
    on();
    vi.stubEnv("USE_MOCKS", "false");
    expect(isReviewFormEnabled()).toBe(false);
    on();
    vi.stubEnv("SITE_ENV", "production");
    expect(isReviewFormEnabled()).toBe(false);
    on();
    vi.stubEnv("FEATURE_REVIEW_FORM", "1");
    expect(isReviewFormEnabled()).toBe(false);
  });
});

describe("isCheckoutStubEnabled", () => {
  afterEach(() => vi.unstubAllEnvs());
  const on = () => {
    vi.stubEnv("FEATURE_CHECKOUT_STUB", "true");
    vi.stubEnv("USE_MOCKS", "true");
    vi.stubEnv("SITE_ENV", "development");
  };

  it("is on only with the flag, the mock services and a non-production environment", () => {
    on();
    expect(isCheckoutStubEnabled()).toBe(true);
    for (const [key, value] of [["FEATURE_CHECKOUT_STUB", ""], ["FEATURE_CHECKOUT_STUB", "1"], ["USE_MOCKS", "false"], ["SITE_ENV", "production"]] as const) {
      on();
      vi.stubEnv(key, value);
      expect(isCheckoutStubEnabled(), `${key}=${value}`).toBe(false);
    }
  });
});

describe("areMoreReviewsEnabled", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("is on only with the mock review service outside production", () => {
    vi.stubEnv("USE_MOCKS", "true");
    vi.stubEnv("SITE_ENV", "development");
    expect(areMoreReviewsEnabled()).toBe(true);
    vi.stubEnv("SITE_ENV", "production");
    expect(areMoreReviewsEnabled()).toBe(false);
    vi.stubEnv("SITE_ENV", "development");
    vi.stubEnv("USE_MOCKS", "false");
    expect(areMoreReviewsEnabled()).toBe(false);
  });
});
