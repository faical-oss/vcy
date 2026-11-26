import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("allows `limit` calls per key per window, then refuses until the window ends", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000 });
    expect([limiter.allow("a", 0), limiter.allow("a", 10), limiter.allow("a", 20)]).toEqual([true, true, false]);
    expect(limiter.allow("b", 30)).toBe(true);
    expect(limiter.allow("a", 999)).toBe(false);
    expect(limiter.allow("a", 1000)).toBe(true);
  });

  it("stays bounded: with every slot used by a live window it refuses new keys, and reuses expired slots", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, maxKeys: 2 });
    expect(limiter.allow("a", 0)).toBe(true);
    expect(limiter.allow("b", 0)).toBe(true);
    expect(limiter.allow("c", 10)).toBe(false);
    expect(limiter.allow("c", 1500)).toBe(true);
  });
});
