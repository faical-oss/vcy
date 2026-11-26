// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { readSearchReturn, rememberSearchReturn } from "./search-return";

describe("search return", () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState(null, "", "/search?type=hotel&page=2");
  });

  it("offers the results URL on the detail page that was opened from them", () => {
    rememberSearchReturn("/hotels/h/azure?checkIn=2099-10-14");
    window.history.replaceState(null, "", "/hotels/h/azure?checkIn=2099-10-14");
    expect(readSearchReturn()).toBe("/search?type=hotel&page=2");
  });

  it("offers nothing on any other page", () => {
    rememberSearchReturn("/hotels/h/azure");
    window.history.replaceState(null, "", "/hotels/h/other");
    expect(readSearchReturn()).toBeNull();
  });

  it("offers nothing when nothing was stored", () => {
    expect(readSearchReturn()).toBeNull();
  });
});
