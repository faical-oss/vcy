// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import type { NavMenu } from "@/interfaces";
import { MainNav } from "./main-nav";

afterEach(cleanup);

/** jsdom cannot navigate: swallow the default action of link clicks so the test log stays clean. */
function blockNavigation() {
  const prevent = (event: Event) => event.preventDefault();
  document.addEventListener("click", prevent);
  return () => document.removeEventListener("click", prevent);
}

const menus: NavMenu[] = [
  {
    id: "experiences",
    label: "Experiences",
    href: "/experiences",
    groups: [
      { title: "Wellness", links: [{ label: "Yoga Retreats", href: "/experiences/yoga-retreats" }] },
      { title: "Mind", links: [{ label: "Breathwork", href: "/experiences/breathwork" }] },
    ],
    featured: { title: "Retreat", eyebrow: "Pick", price: "$1", priceUnit: "per person", image: "/x.jpg", href: "/experiences/x/y" },
  },
  {
    id: "destinations",
    label: "Destinations",
    href: "/destinations",
    groups: [
      { title: "Asia", href: "/destinations/asia", links: [{ label: "Thailand", href: "/destinations/thailand" }] },
      { title: "Europe", href: "/destinations/europe", links: [{ label: "Italy", href: "/destinations/italy" }] },
    ],
    footerLink: { label: "All destinations", href: "/destinations" },
  },
  {
    id: "lifestyle",
    label: "Lifestyle",
    groups: [{ title: "Lifestyle", links: [{ label: "Magazine", href: "https://example.com/magazine/", external: true }] }],
  },
];

describe("main navigation", () => {
  it("every trigger is a button that controls its panel; the panels are in the DOM (hidden) while closed", async () => {
    const user = userEvent.setup();
    const { container } = render(<MainNav menus={menus} />);
    const experiences = screen.getByRole("button", { name: "Experiences" });
    expect(screen.queryByRole("link", { name: "Experiences" })).toBeNull();
    expect(experiences.getAttribute("aria-expanded")).toBe("false");
    const panelId = experiences.getAttribute("aria-controls")!;
    // The server HTML has every panel and every link (a closed panel is `hidden`): crawlers and a page without JavaScript have them.
    expect(container.querySelector(`[id="${panelId}"]`)!.hasAttribute("hidden")).toBe(true);
    expect(container.querySelectorAll("a[href]").length).toBeGreaterThanOrEqual(9);
    expect(container.querySelector('a[href="/experiences/breathwork"]')).toBeTruthy();

    await user.tab();
    expect(experiences.getAttribute("aria-expanded")).toBe("true");
    expect(container.querySelector(`[id="${panelId}"]`)!.hasAttribute("hidden")).toBe(false);
  });

  it("an item only opens its dropdown: a click never navigates, and a mouse click keeps the panel the hover opened", async () => {
    const user = userEvent.setup();
    const navigate = (event: Event) => {
      if ((event.target as Element).closest("a[href]")) throw new Error("navigated");
    };
    document.addEventListener("click", navigate);
    render(<MainNav menus={menus} />);
    const destinations = screen.getByRole("button", { name: "Destinations" });
    await user.hover(destinations);
    expect(destinations.getAttribute("aria-expanded")).toBe("true");
    await user.click(destinations);
    expect(destinations.getAttribute("aria-expanded")).toBe("true");
    expect(destinations.hasAttribute("href")).toBe(false);
    document.removeEventListener("click", navigate);
  });

  it("on touch a tap opens the panel and the next tap closes it", () => {
    render(<MainNav menus={menus} />);
    const destinations = screen.getByRole("button", { name: "Destinations" });
    fireEvent.pointerDown(destinations, { pointerType: "touch" });
    fireEvent.click(destinations, { detail: 1 });
    expect(destinations.getAttribute("aria-expanded")).toBe("true");
    fireEvent.pointerDown(destinations, { pointerType: "touch" });
    fireEvent.click(destinations, { detail: 1 });
    expect(destinations.getAttribute("aria-expanded")).toBe("false");
  });

  it("Enter and Space open the panel and move focus into it", async () => {
    const user = userEvent.setup();
    render(<MainNav menus={menus} />);
    const destinations = screen.getByRole("button", { name: "Destinations" });
    destinations.focus();
    await user.keyboard("{Enter}");
    expect(document.activeElement).toBe(screen.getByRole("link", { name: "Asia" }));
    await user.keyboard("{Escape}");
    expect(document.activeElement).toBe(destinations);
    await user.keyboard(" ");
    expect(document.activeElement).toBe(screen.getByRole("link", { name: "Asia" }));
  });

  it("every dropdown ends with a 'View all' link to its section, and each group's list with 'View all <group>' when the group has a page", async () => {
    const user = userEvent.setup();
    const { container } = render(<MainNav menus={menus} />);
    // In the DOM while closed...
    expect(container.querySelector('a[href="/destinations"]')!.textContent).toContain("All destinations");
    expect(container.querySelector('a[href="/destinations/asia"][data-nav-link]')!.textContent).toContain("View all Asia");
    expect(container.querySelector('a[href="/destinations/europe"][data-nav-link]')!.textContent).toContain("View all Europe");
    // ...and reachable when open.
    await user.hover(screen.getByRole("button", { name: "Destinations" }));
    const panel = screen.getByRole("group", { name: "Destinations" });
    expect(within(panel).getByRole("link", { name: /View all Asia/ }).getAttribute("href")).toBe("/destinations/asia");
    expect(within(panel).getByRole("link", { name: /All destinations/ }).getAttribute("href")).toBe("/destinations");
  });

  it("lists links of the active group and marks it current; arrows move between groups", async () => {
    const user = userEvent.setup();
    render(<MainNav menus={menus} />);
    await user.tab();
    const panel = screen.getByRole("group", { name: "Experiences" });
    expect(within(panel).getByRole("button", { name: "Wellness" }).getAttribute("aria-current")).toBe("true");
    expect(within(panel).getByRole("link", { name: "Yoga Retreats" }).getAttribute("href")).toBe("/experiences/yoga-retreats");

    await user.tab();
    expect(document.activeElement).toBe(within(panel).getByRole("button", { name: "Wellness" }));
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(within(panel).getByRole("button", { name: "Mind" }));
    expect(within(panel).getByRole("link", { name: "Breathwork" })).toBeTruthy();
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(within(panel).getByRole("link", { name: "Breathwork" }));
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<MainNav menus={menus} />);
    const trigger = screen.getByRole("button", { name: "Experiences" });
    await user.tab();
    await user.tab();
    await user.keyboard("{Escape}");
    expect(document.activeElement).toBe(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("group", { name: "Experiences" })).toBeNull(); // hidden again
  });

  it("opens the panel with ArrowDown and focuses its first item", async () => {
    const user = userEvent.setup();
    render(<MainNav menus={menus} />);
    const trigger = screen.getByRole("button", { name: "Experiences" });
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Wellness" }));
  });

  it("opens external items in a new tab with a screen-reader hint", async () => {
    const user = userEvent.setup();
    render(<MainNav menus={menus} />);
    await user.hover(screen.getByRole("button", { name: "Lifestyle" }));
    const magazine = screen.getByRole("link", { name: "Magazine (opens in a new tab)" });
    expect(magazine.getAttribute("href")).toBe("https://example.com/magazine/");
    expect(magazine.getAttribute("target")).toBe("_blank");
    expect(magazine.getAttribute("rel")).toBe("noopener");
  });

  describe("groups with an href", () => {
    it("groups with a page are links and groups without one are buttons", async () => {
      const user = userEvent.setup();
      render(<MainNav menus={menus} />);
      await user.hover(screen.getByRole("button", { name: "Experiences" }));
      const experiences = screen.getByRole("group", { name: "Experiences" });
      expect(within(experiences).getByRole("button", { name: "Wellness" })).toBeTruthy();
      expect(within(experiences).queryByRole("link", { name: "Wellness" })).toBeNull();

      await user.hover(screen.getByRole("button", { name: "Destinations" }));
      const destinations = screen.getByRole("group", { name: "Destinations" });
      expect(within(destinations).getByRole("link", { name: "Asia" }).getAttribute("href")).toBe("/destinations/asia");
      expect(within(destinations).queryByRole("button", { name: "Asia" })).toBeNull();
      expect(within(destinations).getByRole("link", { name: /All destinations/ }).getAttribute("href")).toBe("/destinations");
    });

    it("renders Experiences and Hotels group rows as links to their group page, and closes the panel on click", async () => {
      const user = userEvent.setup();
      const groupMenus: NavMenu[] = [
        {
          id: "experiences",
          label: "Experiences",
          href: "/experiences",
          groups: [
            { title: "Wellness", href: "/experiences/groups/wellness", links: [{ label: "Yoga Retreats", href: "/experiences/yoga-retreats" }] },
            { title: "Mind", href: "/experiences/groups/mind", links: [{ label: "Breathwork", href: "/experiences/breathwork" }] },
          ],
        },
        {
          id: "hotels",
          label: "Hotels",
          href: "/hotels",
          groups: [
            { title: "Hotel Type", href: "/hotels/groups/hotel-type", links: [{ label: "Resorts", href: "/hotels/resorts" }] },
            { title: "Brands", href: "/hotels/groups/brands", links: [{ label: "Aman", href: "/hotels/aman" }] },
          ],
        },
      ];
      const cleanupBlock = blockNavigation();
      render(<MainNav menus={groupMenus} />);

      await user.hover(screen.getByRole("button", { name: "Experiences" }));
      const experiences = screen.getByRole("group", { name: "Experiences" });
      expect(within(experiences).getByRole("link", { name: "Wellness" }).getAttribute("href")).toBe("/experiences/groups/wellness");
      expect(within(experiences).queryByRole("button", { name: "Wellness" })).toBeNull();
      await user.hover(within(experiences).getByRole("link", { name: "Mind" }));
      expect(within(experiences).getByRole("link", { name: "Breathwork" })).toBeTruthy();
      expect(experiences.isConnected).toBe(true);

      await user.hover(screen.getByRole("button", { name: "Hotels" }));
      const hotels = screen.getByRole("group", { name: "Hotels" });
      expect(within(hotels).getByRole("link", { name: "Hotel Type" }).getAttribute("href")).toBe("/hotels/groups/hotel-type");
      expect(within(hotels).getByRole("link", { name: "Brands" }).getAttribute("href")).toBe("/hotels/groups/brands");
      await user.click(within(hotels).getByRole("link", { name: "Brands" }));
      cleanupBlock();
      expect(screen.queryByRole("group", { name: "Hotels" })).toBeNull();
    });

    it("previews the links of a group on hover without closing the panel", async () => {
      const user = userEvent.setup();
      render(<MainNav menus={menus} />);
      await user.hover(screen.getByRole("button", { name: "Destinations" }));
      const panel = screen.getByRole("group", { name: "Destinations" });
      expect(within(panel).getByRole("link", { name: "Thailand" })).toBeTruthy();

      await user.hover(within(panel).getByRole("link", { name: "Europe" }));
      expect(within(panel).getByRole("link", { name: "Italy" })).toBeTruthy();
      expect(within(panel).queryByRole("link", { name: "Thailand" })).toBeNull();
      expect(within(panel).getByRole("link", { name: "Europe" }).getAttribute("aria-current")).toBe("true");
      expect(screen.getByRole("group", { name: "Destinations" })).toBeTruthy();
    });

    it("closes the panel when a group link is clicked", async () => {
      const stop = blockNavigation();
      const user = userEvent.setup();
      render(<MainNav menus={menus} />);
      await user.hover(screen.getByRole("button", { name: "Destinations" }));
      await user.click(within(screen.getByRole("group", { name: "Destinations" })).getByRole("link", { name: "Asia" }));
      expect(screen.queryByRole("group", { name: "Destinations" })).toBeNull();
      stop();
    });

    it("on touch, the first tap previews an inactive group and the second tap follows the link", () => {
      render(<MainNav menus={menus} />);
      fireEvent.pointerEnter(screen.getByRole("button", { name: "Destinations" }), { pointerType: "mouse" });
      const panel = screen.getByRole("group", { name: "Destinations" });
      const europe = within(panel).getByRole("link", { name: "Europe" });

      fireEvent.pointerDown(europe, { pointerType: "touch" });
      expect(fireEvent.click(europe)).toBe(false);
      expect(within(panel).getByRole("link", { name: "Italy" })).toBeTruthy();
      expect(screen.getByRole("group", { name: "Destinations" })).toBeTruthy();

      const stop = blockNavigation();
      fireEvent.pointerDown(europe, { pointerType: "touch" });
      fireEvent.click(europe);
      expect(screen.queryByRole("group", { name: "Destinations" })).toBeNull();
      stop();
    });

    it("keeps the roving tabindex: Tab reaches the active group link, arrows move between links", async () => {
      const user = userEvent.setup();
      render(<MainNav menus={menus} />);
      const trigger = screen.getByRole("button", { name: "Destinations" });
      trigger.focus();
      await user.keyboard("{ArrowDown}");
      const panel = screen.getByRole("group", { name: "Destinations" });
      const asia = within(panel).getByRole("link", { name: "Asia" });
      const europe = within(panel).getByRole("link", { name: "Europe" });
      expect(document.activeElement).toBe(asia);
      expect(asia.getAttribute("tabindex")).toBe("0");
      expect(europe.getAttribute("tabindex")).toBe("-1");

      await user.keyboard("{ArrowDown}");
      expect(document.activeElement).toBe(europe);
      await user.keyboard("{ArrowRight}");
      expect(document.activeElement).toBe(within(panel).getByRole("link", { name: "Italy" }));
      await user.keyboard("{ArrowLeft}");
      expect(document.activeElement).toBe(europe);
    });
  });

  it("ArrowDown and ArrowUp move between the links of a group's list", async () => {
    const user = userEvent.setup();
    render(
      <MainNav
        menus={[
          {
            id: "experiences",
            label: "Experiences",
            groups: [{ title: "Wellness", links: [{ label: "Yoga", href: "/y" }, { label: "Spa", href: "/s" }, { label: "Detox", href: "/d" }] }],
            featured: { title: "Retreat", image: "/x.jpg", href: "/r" },
          },
          { id: "hotels", label: "Hotels", groups: [{ title: "Hotels", links: [{ label: "Resorts", href: "/r" }] }], featured: { title: "H", image: "/h.jpg", href: "/h" } },
        ]}
      />,
    );
    screen.getByRole("button", { name: "Experiences" }).focus();
    await user.keyboard("{ArrowDown}{ArrowRight}");
    expect(document.activeElement).toBe(screen.getByRole("link", { name: "Yoga" }));
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(screen.getByRole("link", { name: "Spa" }));
    await user.keyboard("{ArrowUp}{ArrowUp}");
    expect(document.activeElement).toBe(screen.getByRole("link", { name: "Detox" })); // wraps to the last
  });

  it("lays a columns menu out as visible lists with the featured package", async () => {
    const user = userEvent.setup();
    render(
      <MainNav
        menus={[
          {
            id: "lifestyle",
            label: "Lifestyle",
            layout: "columns",
            groups: [
              { title: "Lifestyle", links: [{ label: "Magazine", href: "/m" }] },
              { title: "Lifestyle Vacations", links: [{ label: "Yoga", href: "/y" }] },
            ],
            featured: { heading: "Featured Package", title: "Bali Escape", image: "/x.jpg", href: "/p", cta: "View package" },
          },
        ]}
      />,
    );
    await user.hover(screen.getByRole("button", { name: "Lifestyle" }));
    expect(screen.getByRole("list", { name: "Lifestyle Vacations" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Yoga" }).getAttribute("href")).toBe("/y");
    expect(screen.getByText("Featured Package")).toBeTruthy();
    expect(screen.getByRole("link", { name: /View package/ }).getAttribute("href")).toBe("/p");
  });
});
