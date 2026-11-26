import "server-only";
import type { IAccountService, IAuthService, IAvailabilityService, ICatalogService, INavigationService, IReviewService, ISearchService } from "@/interfaces";
import { AuthNotConfiguredError } from "@/lib/auth-errors";
import { CatalogNotConfiguredError } from "@/lib/catalog-errors";
import { createApiClient } from "@/lib/api/client";
import { shouldUseMocks } from "@/lib/env";
import { mockSearchService } from "@/mocks/services/search.mock";
import { SearchService } from "./search.service";


/** Single place that decides real vs mock, so pages never know which one they got. */
export function getSearchService(): ISearchService {
  return shouldUseMocks() ? mockSearchService : new SearchService(createApiClient());
}

/**
 * Mock (dev login) only when USE_MOCKS=true. The check reads a build-time constant (see next.config.ts) and the mock is a
 * dynamic import, so a build with mocks off does not bundle it. No real provider is chosen yet, so anything else fails loudly.
 */
export async function getAuthService(): Promise<IAuthService> {
  if (process.env.USE_MOCKS === "true") {
    const { mockAuthService } = await import("@/mocks/services/auth.mock");
    return mockAuthService;
  }
  throw new AuthNotConfiguredError();
}

/** Same rule for per-user account data (trips, favorites, preferences, profile). */
export async function getAccountService(): Promise<IAccountService> {
  if (process.env.USE_MOCKS === "true") {
    const { mockAccountService } = await import("@/mocks/services/account.mock");
    return mockAccountService;
  }
  throw new AuthNotConfiguredError();
}

/**
 * Header menus (public content). Mock only for now: the Trip Fusion contract for navigation is unknown, so no real
 * client exists and nothing is invented. Same build-time constant and dynamic import as the auth mock.
 */
export async function getNavigationService(): Promise<INavigationService> {
  if (process.env.USE_MOCKS === "true") {
    const { mockNavigationService } = await import("@/mocks/services/navigation.mock");
    return mockNavigationService;
  }
  throw new CatalogNotConfiguredError();
}

/** Public catalog reads for category and destination pages (see getNavigationService). */
export async function getCatalogService(): Promise<ICatalogService> {
  if (process.env.USE_MOCKS === "true") {
    const { mockCatalogService } = await import("@/mocks/services/catalog.mock");
    return mockCatalogService;
  }
  throw new CatalogNotConfiguredError();
}

/** Live hotel price and availability. Mock only until the Trip Fusion contract is known. */
export async function getAvailabilityService(): Promise<IAvailabilityService> {
  if (process.env.USE_MOCKS === "true") {
    const { mockAvailabilityService } = await import("@/mocks/services/availability.mock");
    return mockAvailabilityService;
  }
  throw new CatalogNotConfiguredError();
}

/** Review submission. Mock only; there is no reviews API (the form is behind `isReviewFormEnabled()`). */
export async function getReviewService(): Promise<IReviewService> {
  if (process.env.USE_MOCKS === "true") {
    const { mockReviewService } = await import("@/mocks/services/review.mock");
    return mockReviewService;
  }
  throw new CatalogNotConfiguredError();
}

/** True when sign-in is the dev-only mock (never in production), so the UI can say so. */
export function isMockAuthActive(): boolean {
  return process.env.USE_MOCKS === "true" && process.env.SITE_ENV !== "production";
}
