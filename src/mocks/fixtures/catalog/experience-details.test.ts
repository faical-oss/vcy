import { describe, expect, it } from "vitest";
import { EXPERIENCE_GROUP_SIZE } from "@/constants/experience";
import { experienceDetailMetadata } from "@/features/catalog/listing-content";
import { mockCatalogService } from "@/mocks/services/catalog.mock";
import { catalogFixture } from ".";
import { buildExperienceDetail } from "./experience-detail-builder";

const records = catalogFixture.experiences;

describe("experience detail mock content", () => {
  const details = records.map((record) => buildExperienceDetail(record, record.card.category));

  it("has a detail for every experience card, with the card's own facts", () => {
    expect(details).toHaveLength(records.length);
    details.forEach((detail, index) => {
      const { card } = records[index];
      expect(detail.slug).toBe(card.id);
      expect(detail.title).toBe(card.title);
      expect(detail.nights).toBe(card.nights);
      expect(detail.priceFrom).toEqual(card.price);
      expect(detail.reviews.overall).toBe(card.rating);
      expect(detail.reviews.count).toBe(card.reviewCount);
    });
  });

  it("has unique slugs, a coherent text, and the group size from the one config constant", () => {
    expect(new Set(details.map((detail) => detail.slug)).size).toBe(details.length);
    for (const detail of details) {
      expect(detail.groupSize).toEqual(EXPERIENCE_GROUP_SIZE);
      expect(detail.about.join(" ")).toContain(detail.location.city);
      expect(detail.about.join(" ")).not.toMatch(/sailing|Greek|Santorini/i);
      expect(detail.highlights).toHaveLength(6);
      expect(detail.included.filter((item) => !item.included)).toHaveLength(1);
      expect(detail.includedInAll).toHaveLength(4);
    }
  });

  it("has one itinerary day per night, in order, each with text and a photo", () => {
    for (const detail of details) {
      expect(detail.itinerary.map((day) => day.day)).toEqual(Array.from({ length: detail.nights }, (_, index) => index + 1));
      for (const day of detail.itinerary) {
        expect(day.title.length).toBeGreaterThan(0);
        expect(day.description.length).toBeGreaterThan(0);
        expect(day.image.src).toBeTruthy();
      }
    }
  });

  it("has rooms priced per person, the entry room at the card's price, and at least eight photos", () => {
    for (const detail of details) {
      expect(detail.rooms.length).toBeGreaterThanOrEqual(3);
      expect(detail.rooms[0].priceFrom).toEqual(detail.priceFrom);
      expect(Math.min(...detail.rooms.map((room) => (room.priceFrom?.amount ?? 0)))).toBe(detail.rooms[0].priceFrom?.amount);
      expect(new Set(detail.rooms.map((room) => room.id)).size).toBe(detail.rooms.length);
      expect(detail.images.length).toBeGreaterThanOrEqual(5);
    }
  });

  it("gives every experience its own title and a description of at most 160 characters", () => {
    const meta = details.map((detail) => experienceDetailMetadata(detail));
    expect(new Set(meta.map((entry) => entry.title)).size).toBe(meta.length);
    expect(new Set(meta.map((entry) => entry.description)).size).toBe(meta.length);
    for (const entry of meta) expect(entry.description.length).toBeLessThanOrEqual(160);
  });
});

describe("mock catalog service: experiences", () => {
  it("returns a detail, null for an unknown slug, similar cards without the experience itself, and slugs best first", async () => {
    const slug = records[0].card.id;
    expect((await mockCatalogService.getExperience(slug))?.slug).toBe(slug);
    expect(await mockCatalogService.getExperience("no-such-experience")).toBeNull();
    const similar = await mockCatalogService.getSimilarExperiences(slug, 3);
    expect(similar).toHaveLength(3);
    expect(similar.map((card) => card.id)).not.toContain(slug);
    expect(await mockCatalogService.getSimilarExperiences("no-such-experience", 3)).toEqual([]);
    const slugs = await mockCatalogService.listExperienceSlugs(Infinity);
    expect(slugs).toHaveLength(records.length);
    expect((await mockCatalogService.listExperienceSlugs(2)).length).toBe(2);
  });
});

describe("experience durations", () => {
  const details = catalogFixture.experiences.map((record) => buildExperienceDetail(record, record.card.category));

  it("makes every experience fixed at its nights, except the one flexible example", () => {
    const flexible = details.filter((detail) => detail.duration.type === "flexible");
    expect(flexible.map((detail) => detail.slug)).toEqual(["tuscan-hills-yoga-weekend"]);
    expect(flexible[0].duration).toEqual({ type: "flexible", minNights: 3, maxNights: 7 });
    for (const detail of details.filter((entry) => entry.duration.type === "fixed")) expect(detail.duration).toEqual({ type: "fixed", nights: detail.nights });
  });

  it("labels the title with the nights only when the duration is fixed", () => {
    const fixed = details.find((detail) => detail.duration.type === "fixed")!;
    const flexible = details.find((detail) => detail.duration.type === "flexible")!;
    expect(experienceDetailMetadata(fixed).title).toContain(`${fixed.nights}-night`);
    expect(experienceDetailMetadata(flexible).title).not.toMatch(/\d-night/);
  });
});
