import { describe, expect, it } from "vitest";
import type { NavMenu } from "@/interfaces";
import { sectionLinks } from "./section-links";

const menu = (partial: Partial<NavMenu> & Pick<NavMenu, "id" | "label">): NavMenu => ({ groups: [], ...partial });

describe("sectionLinks", () => {
  it("prefers the menu page, then the first group page, then the first internal link", () => {
    const links = sectionLinks([
      menu({ id: "destinations", label: "Destinations", href: "/destinations", groups: [{ title: "Asia", href: "/destinations/asia", links: [] }] }),
      menu({ id: "hotels", label: "Hotels", groups: [{ title: "By type", links: [] }, { title: "Europe", href: "/hotels/groups/europe", links: [] }] }),
      menu({ id: "lifestyle", label: "Lifestyle", groups: [{ title: "Lifestyle", links: [{ label: "Magazine", href: "https://example.com", external: true }] }, { title: "Vacations", links: [{ label: "Golf", href: "/lifestyle/golf" }] }] }),
    ]);
    expect(links).toEqual([
      { label: "Destinations", href: "/destinations" },
      { label: "Hotels", href: "/hotels/groups/europe" },
      { label: "Lifestyle", href: "/lifestyle/golf" },
    ]);
  });

  it("leaves out a menu with nothing internal, and handles no menus", () => {
    expect(sectionLinks([menu({ id: "lifestyle", label: "Lifestyle", groups: [{ title: "x", links: [{ label: "Magazine", href: "https://example.com", external: true }] }] })])).toEqual([]);
    expect(sectionLinks([])).toEqual([]);
  });
});
