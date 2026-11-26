import { fnv1a } from "@/helpers/seeded-pick";
import type { DetailFact, DetailImage, HotelDetail, HotelReview, HotelRoom } from "@/interfaces";
import { hotelDetailSeeds } from "./hotel-details";
import { hotelDetailExtras } from "./hotel-details-extra";
import { IMAGE_POOLS } from "./images";
import { galleryGroup, galleryVideo, groupId, labelled } from "./gallery-groups";
import { ROOM_TYPES } from "./room-types";
import type { HotelRecord } from "./types";
import { destinationBySlug } from "./destinations";

/** Builds the mock detail of one hotel from its card record and its seed. Deterministic: same input, same output. */

const CURRENCY = "USD";
const REVIEWERS = ["Sarah M.", "Daniel K.", "Priya R.", "Tom W.", "Elena S.", "Marcus L.", "Aiko T.", "Hannah B.", "Lucas P."];
const CATEGORY_LABELS = ["Location", "Room quality", "Service", "Food & dining", "Spa & wellness", "Value for money"];
const REVIEWER_PLACES = ["London, UK", "Sydney, Australia", "Dubai, UAE", "New York, USA", "Berlin, Germany", "Toronto, Canada", "Singapore", "Paris, France", "Auckland, New Zealand"];
const ROOM_INCLUDE_PHRASES: Partial<Record<string, string>> = { pool: "Pool access", spa: "Spa access", fitness: "Gym access", yoga: "Yoga classes", beach: "Beach access" };
const round5 = (value: number) => Math.round(value / 5) * 5;

/** At least eight distinct photos: the hotel's theme pool first, then related pools. */
function galleryImages(record: HotelRecord): string[] {
  const order = [record.theme, "resort", "tropical", "wellness", "coast", "countryside"] as const;
  const unique: string[] = [];
  for (const theme of [...record.card.images.map(() => record.theme), ...order]) {
    for (const src of IMAGE_POOLS[theme]) if (!unique.includes(src)) unique.push(src);
  }
  const lead = record.card.images.filter((src) => unique.includes(src));
  return [...new Set([...lead, ...unique])].slice(0, 8);
}

function seededScore(seed: string, base: number, spread: number): number {
  const offset = (fnv1a(seed) % 1000) / 1000;
  return Math.min(5, Math.round((base - spread * 0.7 + offset * spread) * 10) / 10);
}

/** Five "All rooms include" lines: the board, up to three amenity phrases, Wi-Fi, then fillers to make five. */
function roomsInclude(board: string, amenities: readonly (readonly [string, string])[]): string[] {
  const phrases = amenities.flatMap(([icon]) => ROOM_INCLUDE_PHRASES[icon] ?? []).slice(0, 3);
  const filler = amenities.some(([icon]) => icon === "service") ? "Concierge service" : "Daily housekeeping";
  return [...new Set([board === "Breakfast included" ? "Daily breakfast" : board, ...phrases, "Wi-Fi throughout", filler, "Daily housekeeping", "Bottled water on arrival"])].slice(0, 5);
}

export function buildHotelDetail(record: HotelRecord, typeLabel: string): HotelDetail {
  const seed = hotelDetailSeeds[record.card.id];
  const extra = hotelDetailExtras[record.card.id];
  if (!seed || !extra) throw new Error(`No hotel detail seed for ${record.card.id}`);
  const { card } = record;
  const destination = destinationBySlug.get(record.destination);
  const country = destination?.country ?? destination?.name ?? "";
    const photos = galleryImages(record);
  const images: DetailImage[] = photos.map((src, index) => ({ src, alt: `${card.title}, ${record.place}: photo ${index + 1} of ${photos.length}` }));

  // The ten shared room types, priced relative to the first (entry) room, which costs exactly the hotel card's price.
  const entry = ROOM_TYPES[0].pricePerNight;
  const rooms: HotelRoom[] = ROOM_TYPES.map(({ key, images: roomImages, pricePerNight, ...room }, index) => ({
    ...room,
    id: `${record.slug}-room-${key}`,
    images: roomImages.map((src, photo) => ({ src, alt: `${room.name} at ${card.title}: photo ${photo + 1}` })),
    priceFrom: { amount: index === 0 ? (card.price?.amount ?? 0) : round5(((card.price?.amount ?? 0) * pricePerNight) / entry), currency: CURRENCY },
  }));

  const [airportName, airportKm, airportMinutes] = seed.airport;
  const [centreName, centreKm] = seed.centre;
  const transport: DetailFact[] = [
    { label: "Nearest airport", value: `${airportName} · ${airportKm} km` },
    { label: centreName, value: `${centreKm} km` },
    { label: extra.nearby[0], value: extra.nearby[1] },
    { label: "Transfer time", value: `~${airportMinutes} min from airport` },
  ];

  const [a0, a1, a2] = seed.amenities.map(([, label]) => label.toLowerCase());
  const place = record.place;
  const reviewTitles = ["A calm and well run stay", "The staff made the difference", "Worth the journey"];
  const texts = [
    `The ${a0} was the highlight of our stay in ${place}. Everything felt calm and well run.`,
    `The staff remembered our names and what we liked. We went back to the ${a1} every day.`,
    `Beautiful setting and thoughtful food. We would return for the ${a2}.`,
  ];
  const items: HotelReview[] = texts.map((text, index) => {
    const key = `${record.slug}:review:${index}`;
    const hash = fnv1a(key);
    return {
      id: key,
      author: REVIEWERS[hash % REVIEWERS.length],
      location: REVIEWER_PLACES[(hash >>> 3) % REVIEWER_PLACES.length],
      title: reviewTitles[index],
      date: `2026-0${(hash % 8) + 1}-${String((hash % 27) + 1).padStart(2, "0")}`,
      rating: index === 0 ? 5 : index === 1 ? 5 : 4,
      text,
    };
  });

  return {
    id: card.id,
    slug: record.slug,
    name: card.title,
    stars: card.stars,
    badge: card.badge,
    highlights: card.rating >= 4.9 ? ["Top rated"] : [],
    type: { slug: record.tags[0], label: typeLabel },
    location: { label: `${record.place}, ${country}`, city: record.place, country, coordinates: { lat: seed.coordinates[0], lng: seed.coordinates[1] } },
    images,
    description: seed.description,
    amenities: seed.amenities.map(([icon, label]) => ({ icon, label })),
    goodToKnow: [
      { label: "Check-in", value: seed.stay.checkIn },
      { label: "Check-out", value: seed.stay.checkOut },
      { label: "Min. stay", value: `${seed.stay.minNights} ${seed.stay.minNights === 1 ? "night" : "nights"}` },
      { label: "Pets", value: seed.stay.pets },
      { label: "Languages", value: seed.languages },
      { label: "Payment", value: "All major cards accepted" },
    ],
    roomsInclude: roomsInclude(seed.board, seed.amenities),
    cancellationNote: "Free cancellation on most rooms · No prepayment needed",
    priceFrom: card.price,
    // TODO(api): images grouped by category. Mock: Overview (the page's photos), one group per room type, then three areas.
    galleryGroups: [
      galleryGroup("overview", "Overview", images, [galleryVideo(`${card.title}: video tour`, images[1] ?? images[0])]),
      ...rooms.map((room) => galleryGroup(groupId("room", room.name), room.name, room.images)),
      galleryGroup("area-pool", "Pool", labelled([IMAGE_POOLS.tropical[0], IMAGE_POOLS.tropical[2], IMAGE_POOLS.resort[1]], card.title, "pool")),
      galleryGroup("area-restaurant", "Restaurant", labelled([IMAGE_POOLS.wellness[1], IMAGE_POOLS.resort[3], IMAGE_POOLS.tropical[3]], card.title, "restaurant")),
      galleryGroup("area-lobby", "Lobby", labelled([IMAGE_POOLS.resort[0], IMAGE_POOLS.coast[0]], card.title, "lobby")),
    ],
    rooms,
    transport,
    attractions: [...seed.attractions, ...extra.moreAttractions].map(([label, value]) => ({ label, value })),
    reviews: {
      overall: card.rating,
      count: card.reviewCount,
      categories: CATEGORY_LABELS.map((label) => ({ label, score: seededScore(`${record.slug}:${label}`, card.rating, 0.5) })),
      items,
    },
  };
}
