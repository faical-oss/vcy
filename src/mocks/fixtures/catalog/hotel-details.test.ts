import { describe, expect, it } from "vitest";
import { detailSlug } from "@/helpers/slugify";
import { destinationBySlug } from "./destinations";
import { buildHotelDetail } from "./hotel-detail-builder";
import { hotelDetailSeeds } from "./hotel-details";
import { hotelRecords } from "./hotels";

const detailOf = (record: (typeof hotelRecords)[number]) => buildHotelDetail(record, "Type");

describe("hotel detail mock data", () => {
  it("has exactly one seed per catalog hotel", () => {
    expect(Object.keys(hotelDetailSeeds).sort()).toEqual(hotelRecords.map((record) => record.card.id).sort());
  });

  it("builds every slug with detailSlug(name, place) and keeps slugs unique", () => {
    const slugs = hotelRecords.map((record) => record.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const record of hotelRecords) expect(record.slug, record.card.title).toBe(detailSlug(record.card.title, record.place));
  });

  describe.each(hotelRecords.map((record) => [record.slug, record] as const))("%s", (_slug, record) => {
    const hotel = detailOf(record);

    it("describes this hotel's own place, in this hotel's country", () => {
      const destination = destinationBySlug.get(record.destination);
      const text = hotel.description.join(" ");
      expect(text.includes(record.place) || text.includes(destination?.name ?? "?"), "description names the place").toBe(true);
      expect(hotel.location.label.startsWith(`${record.place}, `)).toBe(true);
      expect(hotel.location.country).toBe(destination?.country ?? destination?.name);
      expect(JSON.stringify(hotel)).not.toMatch(/sailing|yacht|regatta/i);
    });

    it("has at least eight photos with distinct, descriptive alt text", () => {
      expect(hotel.images.length).toBeGreaterThanOrEqual(8);
      expect(new Set(hotel.images.map((image) => image.src)).size).toBe(hotel.images.length);
      expect(new Set(hotel.images.map((image) => image.alt)).size).toBe(hotel.images.length);
      for (const image of hotel.images) expect(image.alt).toContain(record.card.title);
    });

    it("has nine amenities, ten room types with four features, and an entry room at the card's price", () => {
      expect(hotel.amenities).toHaveLength(9);
      expect(hotel.rooms).toHaveLength(10);
      for (const room of hotel.rooms) {
        expect(room.features).toHaveLength(4);
        expect(room.images.length).toBeGreaterThanOrEqual(3);
        expect(room.images.length).toBeLessThanOrEqual(4);
        expect(room.maxOccupancy).toBeGreaterThanOrEqual(room.maxAdults);
      }
      expect(new Set(hotel.rooms.map((room) => room.id)).size).toBe(10);
      expect(hotel.rooms[0].priceFrom).toEqual(record.card.price);
      const prices = hotel.rooms.map((room) => room.priceFrom?.amount ?? 0);
      expect(Math.min(...prices)).toBe(prices[0]);
      expect(new Set(hotel.rooms.map((room) => room.board)).size).toBe(3);
      expect(hotel.priceFrom).toEqual(record.card.price);
    });

    it("has four location facts, six attractions with distances, six review categories and reviews about this place", () => {
      expect(hotel.transport).toHaveLength(4);
      expect(hotel.transport[0].label).toBe("Nearest airport");
      expect(hotel.transport[3]).toEqual({ label: "Transfer time", value: expect.stringMatching(/^~\d+ min from airport$/) });
      expect(hotel.attractions).toHaveLength(6);
      expect(new Set(hotel.attractions.map((attraction) => attraction.label)).size).toBe(6);
      expect(hotel.reviews.categories.map((category) => category.label)).toEqual(["Location", "Room quality", "Service", "Food & dining", "Spa & wellness", "Value for money"]);
      for (const category of hotel.reviews.categories) expect(category.score).toBeLessThanOrEqual(5);
      expect(hotel.reviews.overall).toBe(record.card.rating);
      expect(hotel.reviews.items.some((review) => review.text.includes(record.place))).toBe(true);
      for (const review of hotel.reviews.items) {
        expect(review.title).toBeTruthy();
        expect(review.location).toMatch(/\w/);
      }
    });

    it("has five 'All rooms include' lines, the cancellation copy and a Top rated badge only from 4.9", () => {
      expect(hotel.roomsInclude).toHaveLength(5);
      expect(new Set(hotel.roomsInclude).size).toBe(5);
      expect(hotel.cancellationNote).toBe("Free cancellation on most rooms · No prepayment needed");
      expect(hotel.highlights).toEqual(record.card.rating >= 4.9 ? ["Top rated"] : []);
    });

    it("has plausible coordinates and no video", () => {
      const { lat, lng } = hotel.location.coordinates;
      expect(Math.abs(lat)).toBeLessThanOrEqual(90);
      expect(Math.abs(lng)).toBeLessThanOrEqual(180);
      expect(hotel.videoUrl).toBeUndefined();
    });
  });

  it("is deterministic", () => {
    expect(detailOf(hotelRecords[0])).toEqual(detailOf(hotelRecords[0]));
  });

  it("does not repeat one rating and review count across hotels", () => {
    const pairs = hotelRecords.map((record) => `${record.card.rating}:${record.card.reviewCount}`);
    expect(new Set(pairs).size).toBeGreaterThan(12);
  });
});
