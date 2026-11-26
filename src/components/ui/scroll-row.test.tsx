// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScrollRow } from "./scroll-row";

describe("ScrollRow", () => {
  it("is one nowrap line below lg and wraps from lg, passing its role and name on", () => {
    render(
      <ScrollRow role="group" aria-label="Types">
        <button type="button" aria-pressed="true">All</button>
      </ScrollRow>,
    );
    const row = screen.getByRole("group", { name: "Types" });
    expect(row.getAttribute("data-scroll-row")).toBe("wrap");
    expect(row.className).toContain("overflow-x-auto");
    expect(row.className).toContain("lg:flex-wrap");
    expect(row.className).toContain("lg:overflow-visible");
  });

  it("a row that never wraps (tabs) has no wrap classes", () => {
    render(<ScrollRow role="tablist" aria-label="Tabs" wrap={false}><button role="tab" type="button">One</button></ScrollRow>);
    const row = screen.getByRole("tablist");
    expect(row.getAttribute("data-scroll-row")).toBe("scroll");
    expect(row.className).not.toContain("lg:flex-wrap");
  });

  it("renders a list when asked", () => {
    const { container } = render(<ScrollRow as="ul"><li>One</li></ScrollRow>);
    expect(container.firstElementChild?.tagName).toBe("UL");
  });
});
