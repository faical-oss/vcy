import { describe, expect, it } from "vitest";
import { firstParam, parseOptionalSlug } from "./schemas";

describe("firstParam", () => {
  it("returns a single value, the first of a repeated one, or undefined", () => {
    expect(firstParam("yoga-retreats")).toBe("yoga-retreats");
    expect(firstParam(["a", "b"])).toBe("a");
    expect(firstParam([])).toBeUndefined();
    expect(firstParam(undefined)).toBeUndefined();
  });

  it("combines with slug validation so a malformed first value means no filter", () => {
    expect(parseOptionalSlug(firstParam(["Bad Value", "yoga-retreats"]))).toBeUndefined();
  });
});
