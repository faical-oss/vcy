import { describe, expect, it } from "vitest";
import type { Destination, ExperienceCategory, HotelCategory, Region } from "@/interfaces";
import { countIndexDestinations, destinationIndexChips, orderRegions, regionCrumbs, regionMetadata, regionStats, regionSubtitle, DESTINATION_CONTENT, destinationCrumbs, destinationFilterChips, destinationMetadata, destinationStats, experienceCategoryCrumbs, experienceCategoryMetadata, experienceGroupMetadata, groupChips, groupCrumbs, GROUP_CONTENT, hotelGroupMetadata, hotelCategoryCrumbs, hotelCategoryMetadata, listingHeroImage } from "./listing-content";

const category: ExperienceCategory = { slug: "yoga-retreats", label: "Yoga Retreats", group: "Wellness", kind: "category" };
const collection: ExperienceCategory = { slug: "trending-now", label: "Trending Now", group: "Curated for You", kind: "collection" };

describe("experience category metadata", () => {
  it("builds a unique title and description from the label and the count", () => {
    const yoga = experienceCategoryMetadata({ category, total: 4 });
    expect(yoga.title).toBe("Yoga Retreats: 4 experiences to book");
    expect(yoga.description).toContain("4 experiences hand-picked in Yoga Retreats on Vacayou");

    const other = experienceCategoryMetadata({ category: { ...category, slug: "cycling-tours", label: "Cycling Tours" }, total: 5 });
    expect(other.title).not.toBe(yoga.title);
    expect(other.description).not.toBe(yoga.description);
  });

  it("words collections differently and uses the singular for one result", () => {
    const meta = experienceCategoryMetadata({ category: collection, total: 1 });
    expect(meta.title).toBe("Trending Now: 1 experience to book");
    expect(meta.description).toContain("1 experience from our Trending Now collection");
  });

  it("keeps descriptions within the usual search snippet length", () => {
    const { description } = experienceCategoryMetadata({ category: { ...category, label: "Art & Creative Retreats" }, total: 12 });
    expect(description.length).toBeLessThanOrEqual(160);
  });
});

describe("experience category crumbs", () => {
  it("links Home only: Experiences is plain text (no such page) and the current page has no link", () => {
    expect(experienceCategoryCrumbs("Yoga Retreats")).toEqual([
      { label: "Home", href: "/" },
      { label: "Experiences" },
      { label: "Yoga Retreats" },
    ]);
  });
});

const hotelType: HotelCategory = { slug: "eco-lodges", label: "Eco Lodges", group: "By Type", kind: "type" };

describe("hotel category metadata", () => {
  it("builds a unique title and description from the label and the count", () => {
    const eco = hotelCategoryMetadata({ category: hotelType, total: 6 });
    expect(eco.title).toBe("Eco Lodges: 6 hotels to book");
    expect(eco.description).toContain("6 hotels hand-picked in Eco Lodges on Vacayou");

    const other = hotelCategoryMetadata({ category: { ...hotelType, slug: "beach-resorts", label: "Beach Resorts" }, total: 5 });
    expect(other.title).not.toBe(eco.title);
    expect(other.description).not.toBe(eco.description);
  });

  it("uses the singular for one result", () => {
    expect(hotelCategoryMetadata({ category: hotelType, total: 1 }).title).toBe("Eco Lodges: 1 hotel to book");
  });

  it("words each category kind differently", () => {
    const meta = (kind: HotelCategory["kind"], label: string) => hotelCategoryMetadata({ category: { slug: "x", label, group: "g", kind }, total: 3 }).description;
    expect(meta("experience", "Yoga-Focused")).toContain("3 hotels hand-picked for Yoga-Focused");
    expect(meta("brand", "Six Senses Hotels")).toContain("3 hotels from Six Senses Hotels");
    expect(meta("property", "Lanserhof")).toContain("3 hotels for Lanserhof and similar stays");
    expect(meta("budget", "Under $150/night")).toContain("3 hotels by budget: Under $150/night");
    expect(meta("curated", "New Openings")).toContain("3 hotels from our New Openings selection");
  });

  it("keeps descriptions within the usual search snippet length", () => {
    const kinds: HotelCategory["kind"][] = ["type", "experience", "brand", "property", "budget", "curated"];
    for (const kind of kinds) {
      const { description } = hotelCategoryMetadata({ category: { slug: "x", label: "Treehouses & Unique Stays", group: "g", kind }, total: 12 });
      expect(description.length).toBeLessThanOrEqual(160);
    }
  });
});

describe("hotel category crumbs", () => {
  it("links Home only: Hotels is plain text (no such page) and the current page has no link", () => {
    expect(hotelCategoryCrumbs("Eco Lodges")).toEqual([
      { label: "Home", href: "/" },
      { label: "Hotels" },
      { label: "Eco Lodges" },
    ]);
  });
});

describe("listing hero image", () => {
  it("uses the first photo of the first card, or nothing for an empty list", () => {
    expect(listingHeroImage([{ images: ["/a.jpg", "/b.jpg"] }, { images: ["/c.jpg"] }])).toBe("/a.jpg");
    expect(listingHeroImage([])).toBeUndefined();
    expect(listingHeroImage([{ images: [] }])).toBeUndefined();
  });
});

const bali: Destination = {
  slug: "bali-indonesia",
  name: "Bali",
  region: "Asia",
  subtitle: "Indonesia · 240+ experiences",
  bestTimeToVisit: "Apr – Oct",
  averageStay: "10 nights",
  experienceCount: 240,
  fromPrice: { amount: 899, currency: "USD" },
  intro: "Intro.",
  heroImage: "/a.jpg",
};

describe("destination metadata, crumbs and stats", () => {
  it("builds a unique title and a description within the snippet length", () => {
    const meta = destinationMetadata(bali);
    expect(meta.title).toBe("Bali: wellness and active travel experiences");
    expect(meta.description).toBe("Explore 240+ wellness and active experiences in Bali. Best time: Apr – Oct. Average stay 10 nights, from $899 per person. Book on Vacayou.");
    expect(meta.description.length).toBeLessThanOrEqual(160);
    expect(destinationMetadata({ ...bali, name: "Italy" }).title).not.toBe(meta.title);
  });

  it("links Home and Destinations and leaves the current destination without a link", () => {
    expect(destinationCrumbs("Bali")).toEqual([
      { label: "Home", href: "/" },
      { label: "Destinations", href: "/destinations" },
      { label: "Bali" },
    ]);
  });

  it("lists the four facts with the price emphasised", () => {
    expect(destinationStats(bali)).toEqual([
      { label: "Best time to visit", value: "Apr – Oct" },
      { label: "Avg. stay", value: "10 nights" },
      { label: "Experiences", value: "240+ experiences" },
      { label: "From", value: "$899", emphasis: true },
    ]);
    expect(DESTINATION_CONTENT.sectionHeading("Bali")).toBe("Experiences in Bali");
  });
});

describe("destination filter chips", () => {
  const categories = [
    { slug: "yoga-retreats", label: "Yoga Retreats" },
    { slug: "cycling-tours", label: "Cycling Tours" },
  ];
  const yoga: ExperienceCategory = { slug: "yoga-retreats", label: "Yoga Retreats", group: "Wellness", kind: "category" };

  it("makes ALL active and links it to the plain destination URL when nothing is applied", () => {
    expect(destinationFilterChips("bali-indonesia", categories, null)).toEqual([
      { label: "All", href: "/destinations/bali-indonesia", active: true },
      { label: "Yoga Retreats", href: "/destinations/bali-indonesia?category=yoga-retreats", active: false },
      { label: "Cycling Tours", href: "/destinations/bali-indonesia?category=cycling-tours", active: false },
    ]);
  });

  it("activates the applied category and deactivates ALL", () => {
    const chips = destinationFilterChips("bali-indonesia", categories, yoga);
    expect(chips.filter((chip) => chip.active).map((chip) => chip.label)).toEqual(["Yoga Retreats"]);
  });

  it("appends an applied category that has no chip so the filter stays visible", () => {
    const winter: ExperienceCategory = { slug: "winter-sports", label: "Winter Sports", group: "Active & Adventure", kind: "category" };
    const chips = destinationFilterChips("italy", categories, winter);
    expect(chips.at(-1)).toEqual({ label: "Winter Sports", href: "/destinations/italy?category=winter-sports", active: true });
    expect(chips.filter((chip) => chip.active)).toHaveLength(1);
  });
});

const region: Region = { slug: "asia", name: "Asia", experienceCount: 1435, heroImage: "/a.jpg", destinations: [], intro: undefined };

describe("region content", () => {
  it("leaves out every fact the region does not have", () => {
    expect(regionStats(region)).toEqual([{ label: "Experiences", value: "1,435+ experiences" }]);
    const full = regionStats({ ...region, bestTimeToVisit: "Oct – Apr", averageStay: "10 nights", fromPrice: { amount: 699, currency: "USD" } });
    expect(full.map((stat) => stat.label)).toEqual(["Best time to visit", "Avg. stay", "Experiences", "From"]);
    expect(full[3]).toMatchObject({ value: "$699", emphasis: true });
  });

  it("computes the subtitle and builds the Home > Destinations trail", () => {
    expect(regionSubtitle(region)).toBe("Asia · 1,435+ experiences");
    expect(regionCrumbs("Asia")).toEqual([{ label: "Home", href: "/" }, { label: "Destinations", href: "/destinations" }, { label: "Asia" }]);
  });

  it("describes only the facts it has", () => {
    expect(regionMetadata(region).description).not.toContain("undefined");
    expect(regionMetadata({ ...region, fromPrice: { amount: 699, currency: "USD" } }).description).toContain("From $699 per person.");
  });
});

describe("destination index chips", () => {
  const regions = [
    { slug: "asia", name: "Asia" },
    { slug: "oceania-and-pacific", name: "Oceania & Pacific" },
    { slug: "europe", name: "Europe" },
    { slug: "americas", name: "Americas" },
  ];

  it("orders regions like the reference and appends unknown ones last", () => {
    expect(orderRegions([...regions, { slug: "polar", name: "Polar" }]).map((entry) => entry.slug)).toEqual(["asia", "europe", "americas", "oceania-and-pacific", "polar"]);
  });

  it("links ALL to the plain URL and each region to ?region=, marking the active one", () => {
    const chips = destinationIndexChips(regions, regions[2]);
    expect(chips[0]).toEqual({ label: "All", href: "/destinations", active: false });
    expect(chips.find((chip) => chip.label === "Europe")).toEqual({ label: "Europe", href: "/destinations?region=europe", active: true });
    expect(destinationIndexChips(regions, null)[0].active).toBe(true);
  });

  it("counts distinct destinations", () => {
    const d = (id: string) => ({ id, name: id, region: "", experienceCount: 1, href: "" });
    expect(countIndexDestinations([{ region: regions[0], destinations: [d("a"), d("b")] }, { region: regions[1], destinations: [d("b"), d("c")] }])).toBe(3);
  });
});

describe("group content", () => {
  const chips = [
    { slug: "yoga-retreats", label: "Yoga Retreats" },
    { slug: "ayurveda-retreats", label: "Ayurveda Retreats" },
  ];

  it("has crumbs Home > group without a link to the (unbuilt) index pages", () => {
    expect(groupCrumbs("experiences", "Wellness")).toEqual([{ label: "Home", href: "/" }, { label: "Experiences" }, { label: "Wellness" }]);
    expect(groupCrumbs("hotels", "Europe")[1]).toEqual({ label: "Hotels" });
  });

  it("builds unique metadata per group", () => {
    const wellness = experienceGroupMetadata({ group: { slug: "wellness", title: "Wellness" }, chips, total: 12 });
    const active = experienceGroupMetadata({ group: { slug: "active", title: "Active & Adventure" }, chips, total: 1 });
    expect(wellness.title).toBe("Wellness: 12 experiences to book");
    expect(wellness.description).toContain("12 experiences across 2 categories in Wellness");
    expect(active.title).toBe("Active & Adventure: 1 experience to book");
    expect(wellness.description).not.toBe(active.description);
    const hotels = hotelGroupMetadata({ group: { slug: "europe", title: "Europe" }, chips: chips.slice(0, 1), total: 1 });
    expect(hotels.title).toBe("Europe: 1 hotel to book");
    expect(hotels.description).toContain("1 hotel across 1 category in Europe");
  });

  it("builds ALL (bare group route) plus one ?category= chip per category, with the active one marked", () => {
    expect(groupChips({ groupRoute: "/experiences/groups/wellness", chips, active: null })).toEqual([
      { label: GROUP_CONTENT.allChip, href: "/experiences/groups/wellness", active: true },
      { label: "Yoga Retreats", href: "/experiences/groups/wellness?category=yoga-retreats", active: false },
      { label: "Ayurveda Retreats", href: "/experiences/groups/wellness?category=ayurveda-retreats", active: false },
    ]);
    const filtered = groupChips({ groupRoute: "/hotels/groups/by-type", chips, active: chips[1] });
    expect(filtered.filter((chip) => chip.active).map((chip) => chip.label)).toEqual(["Ayurveda Retreats"]);
  });
});
