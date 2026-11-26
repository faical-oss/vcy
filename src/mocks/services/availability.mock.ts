import { fnv1a } from "@/helpers/seeded-pick";
import type { AvailabilityQuery, AvailabilityResult, ExperienceAvailabilityQuery, ExperienceAvailabilityResult, IAvailabilityService, RoomAvailabilityRequest, RoomAvailabilityResponse } from "@/interfaces";
import { catalogFixture } from "../fixtures/catalog";
import { buildExperienceDetail } from "../fixtures/catalog/experience-detail-builder";
import { buildHotelDetail } from "../fixtures/catalog/hotel-detail-builder";
import { buildPackageDetail } from "../fixtures/catalog/package-detail-builder";
import { packageSourceById } from "../fixtures/catalog/package-sources";

const MS_PER_DAY = 86_400_000;

function nightsBetween(checkIn: string, checkOut: string): { nights: number; weekendNights: number } {
  const start = Date.parse(`${checkIn}T00:00:00Z`);
  const end = Date.parse(`${checkOut}T00:00:00Z`);
  const nights = Math.round((end - start) / MS_PER_DAY);
  let weekendNights = 0;
  for (let index = 0; index < nights; index += 1) {
    const day = new Date(start + index * MS_PER_DAY).getUTCDay();
    if (day === 5 || day === 6) weekendNights += 1;
  }
  return { nights, weekendNights };
}

/**
 * Mock live prices: each room's nightly rate is its indicative "from" price with a 10% weekend uplift, times the nights of the
 * whole stay, for ONE room (the page multiplies by the rooms chosen). About one stay in seven is "sold out" (deterministic per hotel and check-in date). Prices are always
 * USD; a real service would price in the requested currency. Dates are not checked here (the feature validates them).
 */
/** A small stable hash of a string (FNV-1a), for the mock's repeatable "random" choices. */
function hash(value: string): number {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) result = Math.imul(result ^ value.charCodeAt(index), 16777619);
  return result >>> 0;
}

/** `count` distinct room positions (never all of them) chosen from `seed`: the rooms the default scenario sells out. */
function pickSoldOut(seed: string, total: number, count: number): Set<number> {
  const picked = new Set<number>();
  const limit = Math.min(count, Math.max(total - 1, 0));
  for (let attempt = 0; picked.size < limit; attempt += 1) picked.add(hash(`${seed}#${attempt}`) % total);
  return picked;
}

export const mockAvailabilityService: IAvailabilityService = {
  async getHotelAvailability(query: AvailabilityQuery): Promise<AvailabilityResult> {
    const record = catalogFixture.hotels.find((entry) => entry.slug === query.hotelSlug);
    if (!record) return { status: "unavailable" };
    if (fnv1a(`${query.hotelSlug}:${query.checkIn}`) % 7 === 0) return { status: "unavailable" };

    const { nights, weekendNights } = nightsBetween(query.checkIn, query.checkOut);
    const uplift = 1 + 0.1 * (weekendNights / nights);
    const detail = buildHotelDetail(record, record.card.badge);
    // About one room type in four is sold out for a given stay (deterministic per hotel, room and check-in date); the entry room is never sold out here, so a hotel that is not "sold out" always has a room.
    const rooms = detail.rooms.map((room, index) => {
      const perNight = Math.round((room.priceFrom?.amount ?? 0) * uplift);
      return {
        roomId: room.id,
        available: index === 0 || fnv1a(`${query.hotelSlug}:${room.id}:${query.checkIn}`) % 4 !== 0,
        perNight: { amount: perNight, currency: "USD" },
        total: { amount: perNight * nights, currency: "USD" },
      };
    });
    const cheapest = rooms.filter((room) => room.available).reduce((best, room) => (room.total.amount < best.total.amount ? room : best));
    return { status: "available", nights, total: cheapest.total, perNight: cheapest.perNight, rooms };
  },

  /**
   * Mock live prices of an experience departure: each room's price per person is its indicative "from" price with a 5%
   * uplift for a weekend departure. About one departure in seven is sold out and about one room type in four is sold out
   * (deterministic per experience, room and start date); the entry room never is. Prices are always USD.
   */
  async getExperienceAvailability(query: ExperienceAvailabilityQuery): Promise<ExperienceAvailabilityResult> {
    const record = catalogFixture.experiences.find((entry) => entry.card.id === query.experienceSlug);
    if (!record) return { status: "unavailable" };
    if (fnv1a(`${query.experienceSlug}:${query.checkIn}`) % 7 === 0) return { status: "unavailable" };

    const { nights } = nightsBetween(query.checkIn, query.checkOut);
    const startDay = new Date(`${query.checkIn}T00:00:00Z`).getUTCDay();
    const uplift = startDay === 5 || startDay === 6 ? 1.05 : 1;
    const detail = buildExperienceDetail(record, record.card.category);
    const rooms = detail.rooms.map((room, index) => ({
      roomId: room.id,
      available: index === 0 || fnv1a(`${query.experienceSlug}:${room.id}:${query.checkIn}`) % 4 !== 0,
      perPerson: { amount: Math.round((room.priceFrom?.amount ?? 0) * uplift), currency: "USD" },
    }));
    return { status: "available", nights, rooms };
  },

  /**
   * Mock room availability for the one flow of the hotel and experience pages. Takes about a second (so skeletons can be seen).
   * Scenarios (`options.scenario`, from the dev-only `?mock=` param): "available" (default) every room type is available;
   * "partial" every second room type is sold out (the first never is); "none" all are sold out; "error" the call fails.
   * Prices: a hotel room's `priceFrom` per night with a 10% weekend uplift; an experience or package room's `priceFrom` per person, 5% more
   * for a weekend start. TODO(api): the real service.
   */
  async getRoomAvailability(request: RoomAvailabilityRequest, options): Promise<RoomAvailabilityResponse> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const scenario = options?.scenario ?? "available";
    if (scenario === "error") throw new Error("mock availability error");
    const detail =
      request.kind === "hotel"
        ? (() => {
            const record = catalogFixture.hotels.find((entry) => entry.slug === request.id);
            return record ? buildHotelDetail(record, record.card.badge).rooms : [];
          })()
        : request.kind === "package"
          ? (() => {
              const source = packageSourceById.get(request.id);
              return source ? buildPackageDetail(source).stays.flatMap((stay) => stay.rooms) : [];
            })()
          : (() => {
              const record = catalogFixture.experiences.find((entry) => entry.card.id === request.id);
              return record ? buildExperienceDetail(record, record.card.category).rooms : [];
            })();
    const { nights, weekendNights } = nightsBetween(request.checkIn, request.checkOut);
    const startDay = new Date(`${request.checkIn}T00:00:00Z`).getUTCDay();
    // The default scenario has two room types sold out, picked by hotel and dates (the same search always gives the same rooms),
    // and never the whole list. TODO(api): real availability.
    const soldOut = pickSoldOut(`${request.kind}|${request.id}|${request.checkIn}|${request.checkOut}`, detail.length, 2);
    return {
      rooms: detail.map((room, index) => {
        const amount = request.kind === "hotel" ? Math.round((room.priceFrom?.amount ?? 0) * (1 + 0.1 * (weekendNights / Math.max(nights, 1)))) : Math.round((room.priceFrom?.amount ?? 0) * (startDay === 5 || startDay === 6 ? 1.05 : 1));
        const available = scenario === "available" ? !soldOut.has(index) : scenario === "partial" && index % 2 === 0;
        return { roomId: room.id, available, price: { amount, currency: "USD" }, unit: request.kind === "hotel" ? ("night" as const) : ("person" as const) };
      }),
    };
  },
};
