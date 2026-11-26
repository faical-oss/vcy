// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { HotelCardData, PackageCardData } from "@/interfaces";
import { DestinationGroup } from "./destination-group";
import { ListingBreadcrumb } from "./listing-breadcrumb";
import { RegionBody } from "./region-body";
import { FilterChips } from "./filter-chips";

vi.mock("@/components/auth/auth-provider", () => ({ useAuth: () => ({ session: null, openAuth: vi.fn() }) }));

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(cleanup);

const copy = {
  popular: { heading: "Popular destinations in Asia", label: "Popular destinations in Asia" },
  packages: { tag: "Curated for you", heading: "Packages in Asia", label: "Packages in Asia" },
  hotels: { tag: "Places to stay", heading: "Hotels in Asia", label: "Hotels in Asia", linkLabel: "All hotels", href: "/hotels" },
};
const destinations = [{ id: "bali", name: "Bali", region: "Asia", experienceCount: 240, href: "/destinations/bali-indonesia" }];
const base = { id: "p1", title: "Bali Soul", location: "Bali", rating: 4.9, reviewCount: 124, href: "/x", images: ["/a.jpg"], price: { amount: 1, currency: "USD" } };
const pkg: PackageCardData = { ...base, badge: "Best seller", category: "Surf", provider: "Prov", highlights: ["7 nights"], nights: 7 };
const hotel: HotelCardData = { ...base, id: "h1", title: "Amanpuri", badge: "Resort", stars: 5, amenities: ["Spa"] };

describe("RegionBody", () => {
  it("hides facts and intro that the region does not have", () => {
    const { container } = render(<RegionBody stats={[]} destinations={destinations} packages={[]} hotels={[]} copy={copy} />);
    expect(container.querySelector("dl")).toBeNull();
    expect(container.querySelector("p.leading-relaxed")).toBeNull();
    expect(screen.getByRole("heading", { name: "Popular destinations in Asia" })).toBeTruthy();
  });

  it("shows the facts and intro when present, with the price in the accent colour", () => {
    render(
      <RegionBody
        stats={[{ label: "Avg. stay", value: "10 nights" }, { label: "From", value: "$699", emphasis: true }]}
        intro="Ancient traditions."
        destinations={destinations}
        packages={[]}
        hotels={[]}
        copy={copy}
      />,
    );
    expect(screen.getByText("Ancient traditions.")).toBeTruthy();
    expect(screen.getByText("10 nights")).toBeTruthy();
    expect(screen.getByText("$699").className).toContain("text-accent");
  });

  it("omits the packages and hotels sections when their lists are empty", () => {
    render(<RegionBody stats={[]} destinations={destinations} packages={[]} hotels={[]} copy={copy} />);
    expect(screen.queryByRole("heading", { name: "Packages in Asia" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Hotels in Asia" })).toBeNull();
    expect(screen.queryByRole("link", { name: /All packages/ })).toBeNull();
  });

  it("renders each non-empty section with its heading, and the hotels link to the listing page", () => {
    render(<RegionBody stats={[]} destinations={destinations} packages={[pkg]} hotels={[hotel]} copy={copy} />);
    const packages = screen.getByRole("region", { name: "Packages in Asia" });
    expect(within(packages).queryByRole("link", { name: /All packages/ })).toBeNull(); // TODO(listing): no packages listing page yet
    const hotels = screen.getByRole("region", { name: "Hotels in Asia" });
    expect(within(hotels).getByRole("link", { name: /All hotels/ }).getAttribute("href")).toBe("/hotels");
  });
});

describe("DestinationGroup", () => {
  it("names the region in a heading and links each card to its destination", () => {
    render(<DestinationGroup id="region-asia" title="Asia" destinations={destinations} />);
    expect(screen.getByRole("heading", { level: 2, name: "Asia" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Bali/ }).getAttribute("href")).toBe("/destinations/bali-indonesia");
  });
});

describe("ListingBreadcrumb back variants", () => {
  it("renders a back link with the current region as plain text", () => {
    render(<ListingBreadcrumb crumbs={[{ label: "Destinations", href: "/destinations" }, { label: "Asia" }]} label="Breadcrumb" variant="back" />);
    expect(screen.getByRole("link", { name: "Destinations" }).getAttribute("href")).toBe("/destinations");
    expect(screen.getByText("Asia").getAttribute("aria-current")).toBe("page");
  });
});

describe("FilterChips soft tone", () => {
  it("uses the borderless fill for inactive chips", () => {
    render(<FilterChips tone="soft" label="Regions" chips={[{ label: "All", href: "/destinations", active: true }, { label: "Asia", href: "/destinations?region=asia", active: false }]} />);
    expect(screen.getByRole("link", { name: "Asia" }).className).toContain("bg-surface");
    expect(screen.getByRole("link", { name: "Asia" }).className).not.toContain("border-border");
  });
});
