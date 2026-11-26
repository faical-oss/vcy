import { afterEach, describe, expect, it, vi } from "vitest";
import { indexingConflict, isIndexingEnabled } from "./env";

describe("indexingConflict", () => {
  it("is fine when indexing is off, whatever else is set", () => {
    expect(indexingConflict({})).toBeNull();
    expect(indexingConflict({ INDEXING_ENABLED: "false", USE_MOCKS: "true", SITE_ENV: "development" })).toBeNull();
  });

  it("refuses indexing next to mock data", () => {
    expect(indexingConflict({ INDEXING_ENABLED: "true", USE_MOCKS: "true", SITE_ENV: "production" })).toMatch(/USE_MOCKS=true/);
  });

  it("refuses indexing outside the production environment", () => {
    expect(indexingConflict({ INDEXING_ENABLED: "true", USE_MOCKS: "false", SITE_ENV: "staging" })).toMatch(/SITE_ENV=production/);
    expect(indexingConflict({ INDEXING_ENABLED: "true" })).not.toBeNull();
  });

  it("allows production without mocks", () => {
    expect(indexingConflict({ INDEXING_ENABLED: "true", USE_MOCKS: "false", SITE_ENV: "production" })).toBeNull();
  });
});

describe("isIndexingEnabled", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("is off by default and for any value other than 'true'", () => {
    vi.stubEnv("INDEXING_ENABLED", "");
    expect(isIndexingEnabled()).toBe(false);
    vi.stubEnv("INDEXING_ENABLED", "1");
    expect(isIndexingEnabled()).toBe(false);
  });

  it("is on only for a safe production configuration, and throws for an unsafe one", () => {
    vi.stubEnv("INDEXING_ENABLED", "true");
    vi.stubEnv("SITE_ENV", "production");
    vi.stubEnv("USE_MOCKS", "false");
    expect(isIndexingEnabled()).toBe(true);
    vi.stubEnv("USE_MOCKS", "true");
    expect(() => isIndexingEnabled()).toThrow(/mock data must never be indexed/);
  });
});
