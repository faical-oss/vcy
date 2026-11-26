import { beforeEach, describe, expect, it, vi } from "vitest";

const { getNavigationService } = vi.hoisted(() => ({ getNavigationService: vi.fn() }));
vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock("@/services", () => ({ getNavigationService }));

import { CatalogNotConfiguredError } from "@/lib/catalog-errors";
import { getNavigation } from "./get-navigation";

describe("getNavigation failure handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an empty list when the navigation service is not configured", async () => {
    getNavigationService.mockRejectedValue(new CatalogNotConfiguredError());
    expect(await getNavigation()).toEqual([]);
  });

  it("rethrows any other error", async () => {
    getNavigationService.mockRejectedValue(new Error("upstream down"));
    await expect(getNavigation()).rejects.toThrow("upstream down");
  });
});
