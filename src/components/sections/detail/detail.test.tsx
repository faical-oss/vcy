// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { DetailBreadcrumb } from "./detail-breadcrumb";
import { DetailGallery } from "./detail-gallery";
import { DetailShell } from "./detail-shell";
import { DetailTabs } from "./detail-tabs";

const { back } = vi.hoisted(() => ({ back: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ back, push: vi.fn() }), usePathname: () => "/hotels/h/azure" }));
vi.mock("@/components/auth/auth-provider", () => ({ useAuth: () => ({ session: null, openAuth: vi.fn() }) }));

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});

const images = Array.from({ length: 9 }, (_, index) => ({ src: `/images/p${index}.jpg`, alt: `Photo ${index + 1} of Hotel` }));

describe("DetailTabs", () => {
  const tabs = [
    { id: "overview", label: "Overview", content: <p>about</p> },
    { id: "rooms", label: "Rooms", content: <p>rooms list</p> },
    { id: "reviews", label: "Reviews", content: <p>reviews list</p> },
  ];

  it("renders every panel in the document but shows only the active one", () => {
    render(<DetailTabs tabs={tabs} label="Hotel information" />);
    expect(screen.getAllByRole("tab")).toHaveLength(3);
    expect(screen.getByText("rooms list").closest("[role=tabpanel]")?.hasAttribute("hidden")).toBe(true);
    expect(screen.getByText("about").closest("[role=tabpanel]")?.hasAttribute("hidden")).toBe(false);
  });

  it("switches on click and with the arrow keys, and follows the URL hash", () => {
    window.history.replaceState(null, "", "#reviews");
    render(<DetailTabs tabs={tabs} label="Hotel information" />);
    expect(screen.getByRole("tab", { name: "Reviews" }).getAttribute("aria-selected")).toBe("true");
    fireEvent.click(screen.getByRole("tab", { name: "Rooms" }));
    expect(screen.getByRole("tab", { name: "Rooms" }).getAttribute("aria-selected")).toBe("true");
    expect(window.location.hash).toBe("#rooms");
    fireEvent.keyDown(screen.getByRole("tab", { name: "Rooms" }), { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Reviews" }).getAttribute("aria-selected")).toBe("true");
  });
});

describe("DetailGallery", () => {
  it("makes only the first photo priority, shows '+N more' and no video button without a video", () => {
    render(<DetailGallery images={images} title="Hotel" />);
    expect(screen.getByText(/\+5 more/)).toBeTruthy();
    expect(screen.queryByText(/Watch video/)).toBeNull();
    const shown = screen.getAllByRole("img");
    expect(shown.map((image) => image.getAttribute("alt"))).toEqual(["Photo 1 of Hotel", "Photo 2 of Hotel", "Photo 3 of Hotel", "Photo 4 of Hotel"]);
    const priority = shown.filter((image) => image.getAttribute("fetchpriority") === "high" || image.getAttribute("loading") === "eager");
    expect(priority).toHaveLength(1);
    expect(priority[0].getAttribute("alt")).toBe("Photo 1 of Hotel");
  });

  it("offers 'Watch video' only when a video URL exists, and opens it in a modal that Escape closes", async () => {
    const { container } = render(<DetailGallery images={images} videoUrl="https://video.example/tour.mp4" title="Hotel" />);
    fireEvent.click(screen.getAllByRole("button", { name: /Watch video/ })[0]);
    const dialog = screen.getByRole("dialog", { name: "Video: Hotel" });
    expect(dialog.querySelector("video")?.getAttribute("src")).toBe("https://video.example/tour.mp4");
    expect(dialog.querySelector("video")?.hasAttribute("controls")).toBe(true);
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(container).toBeTruthy();
  });

  it("shows a hero and three thumbnails below md with \"View all N photos\" on the last one, which opens the photo gallery", () => {
    const { container } = render(<DetailGallery images={images} videoUrl="https://video.example/tour.mp4" title="Hotel" />);
    expect(container.querySelectorAll("img")).toHaveLength(4);
    expect(container.firstElementChild!.className).toContain("grid-cols-3");
    expect(container.querySelector("div.col-span-full.aspect-\\[16\\/10\\]")).toBeTruthy();
    expect(container.querySelectorAll("div.aspect-\\[4\\/3\\]")).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: /View all 9 photos/ }));
    expect(screen.getByRole("dialog", { name: /Photos of Hotel/ })).toBeTruthy();
  });

  it.each([
    [1, 0, "grid-cols-1"],
    [2, 1, "grid-cols-1"],
    [3, 2, "grid-cols-2"],
  ])("with %i photo(s) shows the hero and %i thumbnail(s), no empty tile, and no View all overlay", (count, thumbs, columns) => {
    const { container } = render(<DetailGallery images={images.slice(0, count)} title="Hotel" />);
    expect(container.querySelectorAll("img")).toHaveLength(count);
    expect(container.querySelectorAll("div.aspect-\\[4\\/3\\]")).toHaveLength(thumbs);
    expect(container.firstElementChild!.className).toContain(columns);
    expect(screen.queryByRole("button", { name: /View all/ })).toBeNull();
  });
});

describe("photo gallery modal", () => {
  const scrolls: { id: string; options: unknown }[] = [];
  beforeEach(() => {
    scrolls.length = 0;
    Element.prototype.scrollIntoView = function (this: Element, options?: boolean | ScrollIntoViewOptions) {
      scrolls.push({ id: this.id, options });
    };
    window.history.replaceState(null, "", "/#overview");
  });
  const photo = (index: number, label = "photo") => ({ src: `/images/${label}-${index}.jpg`, alt: `${label} ${index}` });
  const groups = [
    { id: "overview", title: "Overview", thumbnail: photo(0, "ov"), images: [0, 1, 2, 3, 4, 5].map((index) => photo(index, "ov")) },
    { id: "room-suite", title: "Ocean View Suite", thumbnail: photo(0, "suite"), images: [0, 1, 2].map((index) => photo(index, "suite")) },
    { id: "area-pool", title: "Pool", thumbnail: photo(0, "pool"), images: [0, 1, 2, 3].map((index) => photo(index, "pool")) },
  ];
  const pageImages = groups[0].images;
  const open = () => fireEvent.click(screen.getByText(/\+9 more/)); // 13 photos, four shown: +9

  it("opens from '+N more' with the photo count of all groups, puts #photos in the URL, and has role dialog and aria-modal", () => {
    render(<DetailGallery images={pageImages} groups={groups} title="Hotel" />);
    open();
    const dialog = screen.getByRole("dialog", { name: "Photos of Hotel" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(window.location.hash).toBe("#photos");
    expect([...dialog.querySelectorAll("section h2")].map((heading) => heading.textContent)).toEqual(["Overview", "Ocean View Suite", "Pool"]);
    expect(document.body.getAttribute("data-scroll-locked")).toBeTruthy(); // the page behind does not scroll
  });

  it("shows the strip with one thumbnail and label per group, and scrolls smoothly to a section when one is clicked", () => {
    render(<DetailGallery images={pageImages} groups={groups} title="Hotel" />);
    open();
    const strip = screen.getByRole("navigation", { name: "Photo groups" });
    expect(within(strip).getAllByRole("button").map((button) => button.textContent)).toEqual(["Overview", "Ocean View Suite", "Pool"]);
    scrolls.length = 0;
    fireEvent.click(within(strip).getByRole("button", { name: "Pool" }));
    expect(scrolls).toEqual([{ id: "area-pool", options: { behavior: "smooth", block: "start" } }]); // one smooth scroll, nothing else to cancel it: one click is enough
    expect(within(strip).getByRole("button", { name: "Pool" }).getAttribute("aria-current")).toBe("true");
  });

  it("keeps the strip fixed at the top while the sections scroll, and stops scrolled-to sections below it", () => {
    render(<DetailGallery images={pageImages} groups={groups} title="Hotel" />);
    open();
    const strip = screen.getByRole("navigation", { name: "Photo groups" });
    expect(strip.className).toContain("sticky");
    expect(strip.className).toContain("top-0");
    const scroller = strip.parentElement as HTMLElement;
    expect(scroller.style.getPropertyValue("--strip-h")).toMatch(/^\d+px$/);
    expect((document.getElementById("area-pool") as HTMLElement).className).toContain("scroll-mt-[calc(var(--strip-h");
  });

  it("marks the group under the strip as current while scrolling, so the thumbnails always show where you are", async () => {
    render(<DetailGallery images={pageImages} groups={groups} title="Hotel" />);
    open();
    const strip = screen.getByRole("navigation", { name: "Photo groups" });
    const scroller = strip.parentElement as HTMLElement;
    expect(within(strip).getByRole("button", { name: "Overview" }).getAttribute("aria-current")).toBe("true");
    // Section tops relative to the scroller: the pool section has reached the strip, the others are above or below it.
    const tops: Record<string, number> = { overview: -900, "room-suite": -400, "area-pool": 20 };
    vi.spyOn(scroller, "getBoundingClientRect").mockReturnValue({ top: 0 } as DOMRect);
    for (const [id, top] of Object.entries(tops)) vi.spyOn(document.getElementById(id) as HTMLElement, "getBoundingClientRect").mockReturnValue({ top } as DOMRect);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    fireEvent.scroll(scroller);
    await waitFor(() => expect(within(strip).getByRole("button", { name: "Pool" }).getAttribute("aria-current")).toBe("true"));
    expect(within(strip).getByRole("button", { name: "Overview" }).getAttribute("aria-current")).toBe("false");
    vi.unstubAllGlobals();
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  });

  it("opened from a page photo, scrolls the modal to the section of that photo", () => {
    const withSuiteOnPage = [pageImages[0], groups[1].images[0], pageImages[2], pageImages[3]];
    render(<DetailGallery images={withSuiteOnPage} groups={groups} title="Hotel" />);
    fireEvent.click(screen.getByRole("button", { name: /starting with: suite 0/ }));
    expect(scrolls.at(-1)?.id).toBe("room-suite");
    cleanup();
    scrolls.length = 0;
    window.history.replaceState(null, "", "/#overview");
    render(<DetailGallery images={withSuiteOnPage} groups={groups} title="Hotel" />);
    fireEvent.click(screen.getByRole("button", { name: /starting with: ov 0/ }));
    expect(scrolls).toEqual([]); // the first group is already at the top, under the strip
  });

  it("lays out each section's photos as one full-width photo, then two side by side, with real alt text", () => {
    render(<DetailGallery images={pageImages} groups={groups} title="Hotel" />);
    open();
    const section = document.getElementById("overview") as HTMLElement;
    const items = [...section.querySelectorAll("li")];
    expect(items.map((item) => item.className.includes("col-span-2"))).toEqual([true, false, false, true, false, false]);
    for (const item of items) expect(item.querySelector("img")?.getAttribute("alt")).toBeTruthy();
    expect(items[1].querySelector("img")?.getAttribute("loading")).toBe("lazy");
  });

  it("shows a video tile first in its section, which opens the player; Escape closes only the player and the gallery stays", async () => {
    const withVideo = [{ ...groups[0], videos: [{ url: "https://video.example/tour.mp4", title: "Hotel: video tour", poster: photo(1, "ov") }] }, ...groups.slice(1)];
    render(<DetailGallery images={pageImages} groups={withVideo} title="Hotel" />);
    open();
    const overview = document.getElementById("overview") as HTMLElement;
    const tile = within(overview).getByRole("button", { name: "Play video: Hotel: video tour" });
    expect(overview.querySelector("li")?.contains(tile)).toBe(true); // first in the grid
    expect(within(document.getElementById("room-suite") as HTMLElement).queryByRole("button", { name: /Play video/ })).toBeNull();
    fireEvent.click(tile);
    const player = screen.getByRole("dialog", { name: "Video: Hotel: video tour" });
    expect(player.querySelector("video")?.getAttribute("src")).toBe("https://video.example/tour.mp4");
    fireEvent.keyDown(player, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Video: Hotel: video tour" })).toBeNull());
    expect(screen.getByRole("dialog", { name: "Photos of Hotel" })).toBeTruthy();
    expect(window.location.hash).toBe("#photos");
  });

  it("renders one 'All photos' section and no strip without groups", () => {
    render(<DetailGallery images={images} title="Hotel" />);
    fireEvent.click(screen.getByText(/\+5 more/));
    const dialog = screen.getByRole("dialog", { name: "Photos of Hotel" });
    expect([...dialog.querySelectorAll("section h2")].map((heading) => heading.textContent)).toEqual(["All photos"]);
    expect(screen.queryByRole("navigation", { name: "Photo groups" })).toBeNull();
    expect(within(dialog).getAllByRole("button", { name: /Open photo/ })).toHaveLength(9);
  });

  it("closes with Escape and with the close button, removes #photos, and gives focus back to what opened it", async () => {
    render(<DetailGallery images={pageImages} groups={groups} title="Hotel" />);
    const trigger = screen.getByText(/\+9 more/).closest("button") as HTMLElement;
    trigger.focus();
    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(window.location.hash).not.toBe("#photos");
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "Close photos" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("goes back in history exactly once when it is closed, however many times the close is reported", async () => {
    const back = vi.spyOn(window.history, "back");
    render(<DetailGallery images={pageImages} groups={groups} title="Hotel" />);
    open();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "Close photos" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(back).toHaveBeenCalledTimes(1); // a second back would leave the page
    back.mockRestore();
  });

  it("closes with the browser back button and comes back to the page's tab hash", async () => {
    render(<DetailGallery images={pageImages} groups={groups} title="Hotel" />);
    open();
    expect(window.location.hash).toBe("#photos");
    act(() => {
      window.history.back();
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(window.location.hash).toBe("#overview");
  });

  it("opens by itself when the page loads on a #photos link", async () => {
    window.history.replaceState(null, "", "/#photos");
    render(<DetailGallery images={pageImages} groups={groups} title="Hotel" />);
    await waitFor(() => expect(screen.getByRole("dialog", { name: "Photos of Hotel" })).toBeTruthy());
  });

  it("opens the lightbox for the clicked photo (counter over all photos, arrow keys), and closing it keeps the modal and its scroll position", async () => {
    render(<DetailGallery images={pageImages} groups={groups} title="Hotel" />);
    open();
    const modal = screen.getByRole("dialog", { name: "Photos of Hotel" });
    const scroller = modal.querySelector(".overflow-y-auto") as HTMLElement;
    scroller.scrollTop = 420;
    fireEvent.click(within(document.getElementById("room-suite") as HTMLElement).getByRole("button", { name: /Open photo 2 of 3/ }));
    const lightbox = screen.getByRole("dialog", { name: /All photos/ });
    expect(within(lightbox).getByText("8 / 13")).toBeTruthy(); // six overview photos, then the suite's second photo
    fireEvent.keyDown(lightbox, { key: "ArrowRight" });
    expect(within(lightbox).getByText("9 / 13")).toBeTruthy();
    fireEvent.keyDown(lightbox, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: /All photos/ })).toBeNull());
    expect(screen.getByRole("dialog", { name: "Photos of Hotel" })).toBeTruthy(); // the gallery is still there
    expect(scroller.scrollTop).toBe(420); // and still scrolled where it was
    expect(window.location.hash).toBe("#photos");
  });
});

describe("DetailBreadcrumb and DetailShell", () => {
  it("links linked crumbs, leaves an unlinked parent as text and marks the current page", () => {
    render(<DetailBreadcrumb label="Breadcrumb" crumbs={[{ label: "Home", href: "/" }, { label: "Hotels" }, { label: "Wellness Resorts", href: "/hotels/wellness-resorts" }, { label: "Azure" }]} />);
    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(["Home", "Wellness Resorts"]);
    expect(screen.getByText("Hotels").tagName).toBe("SPAN");
    expect(screen.getByText("Azure").getAttribute("aria-current")).toBe("page");
  });

  it("lays out header, gallery, tabs, aside and the optional similar row", () => {
    render(<DetailShell header={<p>header</p>} gallery={<p>gallery</p>} tabs={<p>tabs</p>} aside={<p>aside</p>} similar={<p>similar</p>} />);
    for (const text of ["header", "gallery", "tabs", "aside", "similar"]) expect(screen.getByText(text)).toBeTruthy();
  });
});

describe("DetailActions back button", () => {
  it("goes back in history when the visitor came from this site, otherwise follows the fallback link", async () => {
    const { DetailActions } = await import("./detail-actions");
    render(<DetailActions fallbackHref="/hotels" backLabel="Back" favorite={{ kind: "hotel", id: "a" }} name="A" />);
    const link = screen.getByRole("link", { name: /Back/ });
    expect(link.getAttribute("href")).toBe("/hotels");

    Object.defineProperty(document, "referrer", { value: "", configurable: true });
    expect(fireEvent.click(link)).toBe(true); // not prevented: the browser follows the fallback
    expect(back).not.toHaveBeenCalled();

    Object.defineProperty(document, "referrer", { value: `${window.location.origin}/hotels/wellness-resorts`, configurable: true });
    window.history.pushState(null, "", "/a");
    window.history.pushState(null, "", "/b");
    expect(fireEvent.click(link)).toBe(false); // prevented: history.back() through the router
    expect(back).toHaveBeenCalledTimes(1);
  });

  it("says \"Back to search results\" when the page was opened from a result card, and goes back to them", async () => {
    const { rememberSearchReturn } = await import("@/helpers/search-return");
    window.history.replaceState(null, "", "/search?type=hotel&page=2");
    rememberSearchReturn("/hotels/h/azure");
    window.history.replaceState(null, "", "/hotels/h/azure");
    back.mockClear();
    const { DetailActions } = await import("./detail-actions");
    render(<DetailActions fallbackHref="/hotels" backLabel="Back" favorite={{ kind: "hotel", id: "a" }} name="A" />);
    const link = await screen.findByRole("link", { name: /Back to search results/ });
    expect(link.getAttribute("href")).toBe("/search?type=hotel&page=2");
    window.history.pushState(null, "", "/hotels/h/azure");
    fireEvent.click(link);
    expect(back).toHaveBeenCalledTimes(1);
    sessionStorage.clear();
  });
});

describe("MobileBookingBar", () => {
  it("with no dates is one full-width 'Select dates' button with no price, and opens the booking box in a sheet", async () => {
    const { MobileBookingBar } = await import("./mobile-booking-bar");
    render(
      <MobileBookingBar hash="booking" label="Book this hotel" booking={{ checkout: { kind: "hotel", id: "azure", enabled: true } }}>
        <p>the booking box</p>
      </MobileBookingBar>,
    );
    expect(document.querySelector("[data-booking-bar]")!.textContent).not.toContain("$");
    expect(document.querySelector("[data-booking-summary]")).toBeNull();
    expect(screen.queryByText("the booking box")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Select dates" }));
    expect(screen.getByText("the booking box")).toBeTruthy();
    expect(screen.getByText("Book this hotel")).toBeTruthy();
  });
});
