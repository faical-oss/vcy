// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NavMenu } from "@/interfaces";
import { MobileMenu } from "./mobile-menu";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("@/components/auth/auth-provider", () => ({ useAuth: () => ({ session: null, openAuth: vi.fn() }) }));

const menus: NavMenu[] = [
  {
    id: "experiences",
    label: "Experiences",
    href: "/experiences",
    groups: [
      { title: "Active & Adventure", links: [{ label: "Yoga Retreats", href: "/experiences/yoga-retreats" }] },
      { title: "Mind", links: [{ label: "Breathwork", href: "/experiences/breathwork" }] },
    ],
  },
  {
    id: "destinations",
    label: "Destinations",
    href: "/destinations",
    groups: [
      { title: "Asia", href: "/destinations/asia", links: [{ label: "Thailand", href: "/destinations/thailand" }] },
      { title: "Europe", links: [{ label: "Italy", href: "/destinations/italy" }] },
    ],
  },
  {
    id: "lifestyle",
    label: "Lifestyle",
    groups: [{ title: "Lifestyle", links: [{ label: "Magazine", href: "https://example.com/magazine/", external: true }] }],
  },
];

let desktopListener: ((event: MediaQueryListEvent) => void) | undefined;

beforeEach(() => {
  desktopListener = undefined;
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches: false,
    addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => (desktopListener = listener),
    removeEventListener: () => (desktopListener = undefined),
  }));
});
afterEach(cleanup);

function setup() {
  const user = userEvent.setup();
  render(<MobileMenu menus={menus} supportHref="/support" favoritesHref="/account/favorites" accountHref="/account" />);
  return { user, hamburger: screen.getByRole("button", { name: "Open menu" }) };
}

describe("mobile menu", () => {
  it("opens as a named modal dialog, toggles the hamburger state and closes on Escape with focus restored", async () => {
    const { user, hamburger } = setup();
    expect(hamburger.getAttribute("aria-expanded")).toBe("false");
    expect(hamburger.getAttribute("aria-controls")).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();

    await user.click(hamburger);
    const dialog = screen.getByRole("dialog", { name: "Main menu" });
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(hamburger.getAttribute("aria-label")).toBe("Close menu");
    expect(hamburger.getAttribute("aria-expanded")).toBe("true");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(hamburger.getAttribute("aria-label")).toBe("Open menu");
    expect(document.activeElement).toBe(hamburger);
  });

  it("closes with the close button and returns focus to the hamburger", async () => {
    const { user, hamburger } = setup();
    await user.click(hamburger);
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Close menu" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(hamburger);
  });

  it("gives every accordion panel a valid id that its aria-controls points to", async () => {
    const { user, hamburger } = setup();
    await user.click(hamburger);
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Experiences" }));
    await user.click(within(dialog).getByRole("button", { name: "Active & Adventure" }));

    const controlling = dialog.querySelectorAll("[aria-controls]");
    expect(controlling.length).toBe(2);
    for (const element of controlling) {
      const id = element.getAttribute("aria-controls")!;
      expect(id).not.toMatch(/\s/);
      expect(document.getElementById(id)).toBeTruthy();
    }
  });

  it("renders internal and external links with the right attributes", async () => {
    const { user, hamburger } = setup();
    await user.click(hamburger);
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("link", { name: "Support" }).getAttribute("href")).toBe("/support");
    // A menu item only opens its section (it never navigates): it is a button, not a link.
    expect(within(dialog).queryByRole("link", { name: "Experiences" })).toBeNull();
    expect(within(dialog).getByRole("button", { name: "Experiences" }).getAttribute("aria-expanded")).toBe("false");

    await user.click(within(dialog).getByRole("button", { name: "Lifestyle" }));
    const magazine = within(dialog).getByRole("link", { name: /Magazine/ });
    expect(magazine.getAttribute("href")).toBe("https://example.com/magazine/");
    expect(magazine.getAttribute("target")).toBe("_blank");
    expect(magazine.getAttribute("rel")).toBe("noopener");
    expect(within(magazine).getByText("(opens in a new tab)")).toBeTruthy();
  });

  it("closes when the viewport reaches the desktop breakpoint", async () => {
    const { user, hamburger } = setup();
    await user.click(hamburger);
    expect(screen.getByRole("dialog")).toBeTruthy();
    act(() => desktopListener?.({ matches: true } as MediaQueryListEvent));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.body.hasAttribute("data-scroll-locked")).toBe(false);
  });

  it("adds a View all link inside an expanded group that has an href, and closes the menu when it is used", async () => {
    const { user, hamburger } = setup();
    await user.click(hamburger);
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Destinations" }));

    const asia = within(dialog).getByRole("button", { name: "Asia" });
    expect(within(dialog).queryByRole("link", { name: /View all/ })).toBeNull();
    await user.click(asia);
    expect(asia.getAttribute("aria-expanded")).toBe("true");
    const viewAll = within(dialog).getByRole("link", { name: "View all Asia" });
    expect(viewAll.getAttribute("href")).toBe("/destinations/asia");

    await user.click(within(dialog).getByRole("button", { name: "Europe" }));
    expect(within(dialog).queryByRole("link", { name: "View all Europe" })).toBeNull();
    expect(within(dialog).queryByRole("link", { name: "View all Asia" })).toBeNull();

    await user.click(asia);
    const prevent = (event: Event) => event.preventDefault();
    document.addEventListener("click", prevent);
    await user.click(within(dialog).getByRole("link", { name: "View all Asia" }));
    document.removeEventListener("click", prevent);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows a View all link for an Experiences group with an href", async () => {
    const groupMenus: NavMenu[] = [
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
    const user = userEvent.setup();
    render(<MobileMenu menus={groupMenus} supportHref="/support" favoritesHref="/account/favorites" accountHref="/account" />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Hotels" }));
    await user.click(within(dialog).getByRole("button", { name: "Hotel Type" }));
    expect(within(dialog).getByRole("link", { name: "View all Hotel Type" }).getAttribute("href")).toBe("/hotels/groups/hotel-type");
  });
});
