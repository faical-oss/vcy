// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CardGrid } from "@/components/ui/card-grid";
import { DestinationSkeleton } from "./destination-skeleton";
import { DestinationStats } from "./destination-stats";
import { FilterChips } from "./filter-chips";
import { ListingBreadcrumb } from "./listing-breadcrumb";
import { ListingEmptyState } from "./listing-empty-state";
import { ListingHero } from "./listing-hero";
import { ListingSkeleton } from "./listing-skeleton";
import { ResultsLine } from "./results-line";

afterEach(cleanup);

const crumbs = [{ label: "Home", href: "/" }, { label: "Experiences", href: "/experiences" }, { label: "Yoga Retreats" }];

describe("ListingBreadcrumb", () => {
  it("renders an ordered list in a labelled nav with links and a non-link current page", () => {
    render(<ListingBreadcrumb crumbs={crumbs} label="Breadcrumb" />);
    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(nav).getByRole("list").tagName).toBe("OL");
    expect(within(nav).getByRole("link", { name: "Home" }).getAttribute("href")).toBe("/");
    expect(within(nav).getByRole("link", { name: "Experiences" }).getAttribute("href")).toBe("/experiences");
    expect(within(nav).queryByRole("link", { name: "Yoga Retreats" })).toBeNull();
    expect(within(nav).getByText("Yoga Retreats").getAttribute("aria-current")).toBe("page");
  });
});

describe("ListingHero", () => {
  it("renders exactly one h1 with the title, the optional subtitle and a decorative image", () => {
    const { container } = render(
      <ListingHero title="Yoga Retreats" crumbs={crumbs} breadcrumbLabel="Breadcrumb" subtitle="Four trips" image="/images/home/exp-yoga-bali.png" />,
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Yoga Retreats");
    expect(screen.getByText("Four trips")).toBeTruthy();
    expect(container.querySelector("img")?.getAttribute("alt")).toBe("");
  });

  it("falls back to a flat hero without an image", () => {
    const { container } = render(<ListingHero title="Trending Now" crumbs={crumbs} breadcrumbLabel="Breadcrumb" />);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.queryByText("Four trips")).toBeNull();
  });
});

describe("ResultsLine", () => {
  it("pluralises the count", () => {
    const { rerender } = render(<ResultsLine count={4} />);
    expect(screen.getByText("4 results")).toBeTruthy();
    rerender(<ResultsLine count={1} />);
    expect(screen.getByText("1 result")).toBeTruthy();
  });
});

describe("CardGrid", () => {
  it("renders its children in the listing grid (1 / 2 / 3 columns) and the tiles in 1 / 2 / 3 / 4", () => {
    const { container } = render(
      <CardGrid>
        <article>One</article>
        <article>Two</article>
      </CardGrid>,
    );
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(container.firstElementChild?.className).toContain("grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3");
    expect(container.firstElementChild?.getAttribute("data-grid")).toBe("listing");
  });

  it("lays tiles out in 1 / 2 / 3 / 4 columns and can be a list", () => {
    const { container } = render(
      <CardGrid kind="tiles" as="ul">
        <li>One</li>
      </CardGrid>,
    );
    const grid = container.firstElementChild;
    expect(grid?.tagName).toBe("UL");
    expect(grid?.getAttribute("data-grid")).toBe("tiles");
    expect(grid?.className).toContain("grid-cols-1 gap-6 min-[560px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4");
  });
});

describe("ListingEmptyState", () => {
  it("explains the state and offers one way forward", () => {
    render(<ListingEmptyState title="No results yet" description="Try the rest of the site." action={{ label: "Back to home", href: "/" }} />);
    expect(screen.getByRole("heading", { name: "No results yet" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Back to home" }).getAttribute("href")).toBe("/");
  });
});

describe("ListingSkeleton", () => {
  it("is a busy status region with the requested number of card placeholders", () => {
    render(<ListingSkeleton label="Loading results" cards={3} />);
    const region = screen.getByRole("status", { name: "Loading results" });
    expect(region.getAttribute("aria-busy")).toBe("true");
    expect(region.querySelectorAll(".aspect-\\[4\\/3\\]")).toHaveLength(3);
  });
});

describe("ListingHero tall size", () => {
  it("is 340px tall with the destination title and subtitle styles, and leaves compact at 260px", () => {
    const { container, rerender } = render(<ListingHero size="tall" title="Bali" crumbs={crumbs} breadcrumbLabel="Breadcrumb" subtitle="Indonesia · 240+ experiences" />);
    expect(container.firstElementChild?.className).toContain("h-[340px]");
    expect(screen.getByRole("heading", { level: 1 }).className).toContain("text-destination-title");
    expect(screen.getByText("Indonesia · 240+ experiences").className).toContain("text-white/75");
    rerender(<ListingHero title="Yoga Retreats" crumbs={crumbs} breadcrumbLabel="Breadcrumb" />);
    expect(container.firstElementChild?.className).toContain("h-[260px]");
    expect(screen.getByRole("heading", { level: 1 }).className).toContain("text-listing-title");
  });
});

describe("DestinationStats", () => {
  it("renders every fact as a term and description, with the emphasised value in the accent colour", () => {
    const { container } = render(
      <DestinationStats
        stats={[
          { label: "Best time to visit", value: "Apr – Oct" },
          { label: "Avg. stay", value: "10 nights" },
          { label: "Experiences", value: "240+ experiences" },
          { label: "From", value: "$899", emphasis: true },
        ]}
      />,
    );
    expect(container.querySelector("dl")).not.toBeNull();
    expect(container.querySelectorAll("dt")).toHaveLength(4);
    expect([...container.querySelectorAll("dd")].map((node) => node.textContent)).toEqual(["Apr – Oct", "10 nights", "240+ experiences", "$899"]);
    expect(screen.getByText("$899").className).toContain("text-accent");
    expect(screen.getByText("10 nights").className).not.toContain("text-accent");
  });
});

describe("FilterChips", () => {
  const chips = [
    { label: "All", href: "/destinations/bali-indonesia", active: false },
    { label: "Yoga Retreats", href: "/destinations/bali-indonesia?category=yoga-retreats", active: true },
  ];

  it("renders labelled nav with one real link per chip and marks only the active one", () => {
    render(<FilterChips chips={chips} label="Filter experiences by category" />);
    const nav = screen.getByRole("navigation", { name: "Filter experiences by category" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual(chips.map((chip) => chip.href));
    expect(links.map((link) => link.getAttribute("aria-current"))).toEqual([null, "true"]);
    expect(links[1].className).toContain("bg-primary");
    expect(links[0].className).not.toContain("bg-primary");
  });

  it("links ALL to the plain URL when it is active", () => {
    render(<FilterChips chips={[{ ...chips[0], active: true }, { ...chips[1], active: false }]} label="Filter" />);
    const all = screen.getByRole("link", { name: "All" });
    expect(all.getAttribute("href")).toBe("/destinations/bali-indonesia");
    expect(all.getAttribute("aria-current")).toBe("true");
  });
});

describe("DestinationSkeleton", () => {
  it("is a busy status region with the requested number of card placeholders", () => {
    render(<DestinationSkeleton label="Loading results" cards={2} />);
    const region = screen.getByRole("status", { name: "Loading results" });
    expect(region.getAttribute("aria-busy")).toBe("true");
    expect(region.querySelectorAll(".aspect-\\[4\\/3\\]")).toHaveLength(2);
  });
});
