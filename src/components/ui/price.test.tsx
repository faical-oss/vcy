// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Price } from "./price";

afterEach(cleanup);

describe("Price", () => {
  it("shows the lockup with a price", () => {
    const { container } = render(<Price price={{ amount: 1295, currency: "USD" }} unit="per person" />);
    expect(container.textContent).toBe("From$1,295per person");
  });

  it("has no text at all without a price (no placeholder), and a hidden line of the lockup's height so the card does not move", () => {
    const { container } = render(<Price unit="per person" />);
    expect(container.textContent?.trim()).toBe("");
    const blank = container.firstElementChild!;
    expect(blank.getAttribute("aria-hidden")).toBe("true");
    expect(blank.className).toContain("text-base");
  });

  it("says a sold out card is not available for the dates", () => {
    const { container } = render(<Price unavailable unit="per night" />);
    expect(container.textContent).toBe("Not available for these dates");
  });
});
