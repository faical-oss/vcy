// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// The favourite heart needs the auth provider; it is not under test here.
vi.mock("@/components/ui/favorite-button", () => ({ FavoriteButton: () => null }));
import { PackageCard } from "@/components/cards/package-card";
import { DestinationCard } from "@/components/cards/destination-card";
import { EditorialBanner } from "@/components/sections/home/editorial-banner";
import { MagazineSection } from "@/components/sections/home/magazine-section";
import { EXTERNAL_URLS } from "@/constants/routes";
import type { PackageCardData } from "@/interfaces";
import { LifestyleDestinations } from "./lifestyle-destinations";
import { LifestylePackages } from "./lifestyle-packages";
import { LifestyleSubNav } from "./lifestyle-sub-nav";

afterEach(cleanup);

// jsdom has no ResizeObserver; the carousel only uses it to update its arrows.
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };

const card = (id: string, extra: Partial<PackageCardData> = {}) => ({
  id,
  title: `Retreat ${id}`,
  badge: "New",
  category: "Yoga",
  provider: "Provider",
  location: "Bali",
  nights: 5,
  price: { amount: 1000, currency: "USD" },
  highlights: ["One", "Two", "Three"],
  images: ["https://images.unsplash.com/photo-1?w=800"],
  ...extra,
});

describe("PackageCard", () => {
  it("is a plain card without an href: no link, no hover border, no rating", () => {
    const { container } = render(<PackageCard {...card("a")} />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(container.querySelector(".hover\\:border-primary")).toBeNull();
    expect(screen.queryByRole("img", { name: /out of 5/ })).toBeNull();
    expect(screen.getByRole("heading", { name: "Retreat a" })).toBeTruthy();
  });

  it("becomes a link with an href and shows stars only with a rating", () => {
    const { container } = render(<PackageCard {...card("b", { href: "/packages/p/b", rating: 4.8, reviewCount: 12 })} />);
    expect(screen.getByRole("link", { name: "Retreat b" }).getAttribute("href")).toBe("/packages/p/b");
    expect(container.querySelector(".hover\\:border-primary")).not.toBeNull();
    expect(screen.getByRole("img", { name: "4.8 out of 5" })).toBeTruthy();
  });
});

describe("DestinationCard", () => {
  it("is a link only with an href, and shows a custom count label", () => {
    const { container, rerender } = render(<DestinationCard name="Utah" region="United States" countLabel="40+ adventures" />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("40+ adventures")).toBeTruthy();
    expect(container.querySelector(".hover\\:border-primary")).toBeNull();
    rerender(<DestinationCard name="Peru" region="South America" countLabel="65+ adventures" href="/destinations/peru" />);
    expect(screen.getByRole("link").getAttribute("href")).toBe("/destinations/peru");
  });
});

describe("LifestyleDestinations", () => {
  it("links the tiles that name a destination page and leaves the others plain", () => {
    render(
      <LifestyleDestinations
        id="d"
        eyebrow="Go beyond"
        title="Popular Destinations"
        viewAllLabel="All destinations"
        items={[
          { name: "Peru", region: "South America", count: "65+", image: "/a.jpg", destinationSlug: "peru" },
          { name: "Utah", region: "United States", count: "40+", image: "/b.jpg" },
        ]}
      />,
    );
    const links = screen.getAllByRole("link").map((link) => link.getAttribute("href"));
    expect(links).toContain("/destinations/peru");
    expect(links).toContain("/destinations");
    expect(links).toHaveLength(2);
    expect(screen.getByText("Utah")).toBeTruthy();
  });
});

describe("LifestylePackages", () => {
  const items = [
    { card: card("surf"), filters: ["Surf"] },
    { card: card("hike"), filters: ["Mountain"] },
    { card: card("both"), filters: ["Surf", "Mountain"] },
  ];
  const props = { id: "packages", eyebrow: "Made", title: "Adventure vacations", sub: "Sub", filters: ["Surf", "Mountain"], items, viewAllLabel: "View all", viewAllHref: "/experiences/x" };

  it("renders every card with All active, then narrows to the chip", () => {
    render(<LifestylePackages {...props} />);
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(3);
    expect(screen.getByRole("button", { name: "All" }).getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "Mountain" }));
    expect(screen.getByRole("button", { name: "Mountain" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "All" }).getAttribute("aria-pressed")).toBe("false");
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["Retreat hike", "Retreat both"]);
    expect(screen.getByRole("status").textContent).toBe("Showing 2 of 3 packages for Mountain");

    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(3);
    expect(screen.getByRole("status").textContent).toBe("Showing all 3 packages");
  });

  it("has a named section, scrollable region and the view-all link, and no card is a link", () => {
    render(<LifestylePackages {...props} />);
    expect(screen.getByRole("region", { name: "Adventure vacations: packages" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /View all/ }).getAttribute("href")).toBe("/experiences/x");
    expect(within(screen.getByRole("region", { name: "Adventure vacations: packages" })).queryAllByRole("link")).toHaveLength(0);
  });
});

describe("LifestyleSubNav", () => {
  it("renders in-page anchors in a labelled nav", () => {
    render(<LifestyleSubNav label="On this page" items={[{ label: "Why yoga", id: "why" }, { label: "Top packages", id: "packages" }]} />);
    const nav = screen.getByRole("navigation", { name: "On this page" });
    expect(within(nav).getByRole("link", { name: "Why yoga" }).getAttribute("href")).toBe("#why");
    expect(within(nav).getByRole("link", { name: "Top packages" }).getAttribute("href")).toBe("#packages");
  });
});

describe("EditorialBanner", () => {
  it("shows no link unless it has both a label and a target", () => {
    const base = { eyebrow: "Traveller story", quote: "A quote", attribution: "— A. B." };
    const { rerender } = render(<EditorialBanner {...base} />);
    expect(screen.queryByRole("link")).toBeNull();
    rerender(<EditorialBanner {...base} ctaLabel="Read" href="/x" />);
    expect(screen.getByRole("link", { name: /Read/ }).getAttribute("href")).toBe("/x");
  });
});

describe("MagazineSection with an external magazine", () => {
  const article = (id: string, external?: boolean) => ({ id, category: "Tag", title: `Title ${id}`, excerpt: "Excerpt", author: "A", readTimeMinutes: 5, href: "https://example.com/magazine/", external });

  it("opens external article and visit links in a new tab with rel noopener", () => {
    render(<MagazineSection articles={[article("1", true), article("2", true)]} heading={{ tag: "Journal", title: "From the Magazine", description: "Desc" }} visitLink={{ href: "https://example.com/magazine/", external: true }} />);
    for (const link of screen.getAllByRole("link")) {
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noopener");
    }
    expect(screen.getByRole("link", { name: /Visit the magazine/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Title 1/ }).textContent).toContain("opens in a new tab");
  });

  it("sends the Home magazine to the external magazine too (it has no page here)", () => {
    render(<MagazineSection articles={[{ ...article("1", true), href: EXTERNAL_URLS.magazine }, { ...article("2", true), href: EXTERNAL_URLS.magazine }]} />);
    const visit = screen.getByRole("link", { name: /Visit the magazine/ });
    expect(visit.getAttribute("href")).toBe(EXTERNAL_URLS.magazine);
    expect(visit.getAttribute("target")).toBe("_blank");
    expect(visit.getAttribute("rel")).toBe("noopener");
    expect(visit.textContent).toContain("opens in a new tab");
  });
});
