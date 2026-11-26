import { EXPERIENCE_GROUP_SIZE } from "@/constants/experience";
import { fnv1a } from "@/helpers/seeded-pick";
import type { DetailImage, ExperienceDetail, ExperienceHighlight, ExperienceIncludedItem, HotelRoom, ItineraryDay, HotelReview, StayDuration } from "@/interfaces";
import { EXPERIENCE_IMAGE_THEMES } from "./experiences";
import { galleryGroup, galleryVideo, labelled, MOCK_VIDEO_URL } from "./gallery-groups";
import { IMAGE_POOLS, type ImageTheme } from "./images";
import { ROOM_TYPES } from "./room-types";
import type { ExperienceRecord } from "./types";

/**
 * ASSUMED mock content. Builds the detail of one experience from its card record: one coherent dataset per base category
 * (yoga, wellness, meditation, hiking, cycling, diving), filled with the record's own place, provider, nights and price.
 * Deterministic: same input, same output. The real content comes from Trip Fusion.
 */

const CURRENCY = "USD";
const round5 = (value: number) => Math.round(value / 5) * 5;

interface Template {
  /** Verb phrase for the activity, used in copy ("practise yoga"). */
  activity: string;
  aboutMiddle: string;
  highlights: [ExperienceHighlight["icon"], string][];
  included: string[];
  excluded: string;
  days: string[];
  dayText: string[];
  meals: string;
}

const TEMPLATES: Record<string, Template> = {
  "yoga-retreats": {
    activity: "yoga",
    aboutMiddle: "Each day starts with a gentle sunrise practice and ends with a long meditation, with free time in between to swim, walk or rest.",
    highlights: [["sun", "Sunrise yoga with expert teachers"], ["leaf", "Meditation and breathwork sessions"], ["utensils", "Fresh plant-forward meals"], ["sparkles", "Evening sound bath"], ["pin", "Guided nature walk"], ["heart", "Small groups, personal attention"]],
    included: ["Accommodation for every night", "Daily yoga and meditation classes", "All meals (full board)", "Airport transfers", "Welcome ceremony and wellness consultation", "Use of mats and props"],
    excluded: "Spa treatments (bookable on site)",
    days: ["Arrival and welcome circle", "Morning flow and a day to settle", "Yoga and a visit to a local temple", "Breathwork and nature walk", "Full day of practice and workshops", "Free day: spa, swim or explore", "Closing ceremony and farewell dinner", "Departure"],
    dayText: ["Arrive, settle in and meet your teachers over a light dinner.", "A gentle sunrise class, then time to rest and explore the grounds.", "Morning practice, then a short outing with your guide.", "Breathwork at dawn, and a guided walk through the surroundings.", "Longer sessions and a hands-on workshop with the whole group.", "A day at your own pace: book a treatment, swim or simply rest.", "A closing circle and a shared dinner to mark the end of the week.", "Breakfast and your transfer to the airport."],
    meals: "All meals (full board)",
  },
  "holistic-wellness": {
    activity: "wellness",
    aboutMiddle: "Daily treatments, mindful movement and nourishing food are planned for you, so the only decision is how deeply to rest.",
    highlights: [["leaf", "Personal wellness plan on arrival"], ["sparkles", "Daily spa or Ayurveda treatment"], ["utensils", "Nutritionist-designed menus"], ["sun", "Morning movement and stretching"], ["heart", "Sleep and stress coaching"], ["pin", "Quiet setting with space to unplug"]],
    included: ["Accommodation for every night", "Daily treatments", "All meals (full board)", "Airport transfers", "Doctor or therapist consultation", "Daily movement classes"],
    excluded: "Extra spa treatments",
    days: ["Arrival and consultation", "Detox and gentle movement", "Treatments and workshop", "Nature day and herbal kitchen", "Deep rest day", "Treatments and cooking class", "Integration and farewell", "Departure"],
    dayText: ["Arrive, meet your therapist and build your plan for the week.", "Light movement, a first treatment and an early night.", "A morning workshop and an afternoon treatment.", "An outing in nature, then a hands-on herbal cooking session.", "A slow day of rest, with treatments if you wish.", "Your favourite treatments and a cooking class.", "A reflection session to take the habits home, and a farewell dinner.", "Breakfast and your transfer to the airport."],
    meals: "All meals (full board)",
  },
  "meditation-retreats": {
    activity: "meditation",
    aboutMiddle: "Days follow a simple rhythm of sitting, walking and rest, with teachers on hand for guidance and quiet time to let it settle.",
    highlights: [["leaf", "Guided sitting and walking meditation"], ["sun", "Dawn practice in silence"], ["heart", "Daily teacher talks and Q&A"], ["utensils", "Simple vegetarian meals"], ["pin", "Quiet grounds for walking"], ["star", "Beginner friendly, no experience needed"]],
    included: ["Accommodation for every night", "Daily meditation instruction", "All vegetarian meals", "Airport transfers", "Teacher talks and small-group sessions", "Cushions and bolsters"],
    excluded: "Private teacher sessions",
    days: ["Arrival and orientation", "First day of silence", "Walking meditation", "Deep sitting day", "Teacher talks and practice", "Gentle day and journaling", "Closing circle", "Departure"],
    dayText: ["Arrive, meet the group and learn the daily rhythm.", "A day of practice with simple instruction.", "Sitting and walking in turns, with time outdoors.", "Longer sits, with breaks for tea and rest.", "Morning talks and small-group sessions with teachers.", "A lighter day to journal and integrate.", "Break the silence together over a shared meal.", "Breakfast and your transfer to the airport."],
    meals: "All vegetarian meals",
  },
  "hiking-trekking": {
    activity: "trekking",
    aboutMiddle: "Your guide sets an easy pace, carries the maps and knows where to stop for the best views and the best tea.",
    highlights: [["mountain", "Expert local guide every day"], ["compass", "Carefully chosen routes and viewpoints"], ["sun", "Early starts for the best light"], ["utensils", "Local meals at village guesthouses"], ["pin", "Quiet trails away from the crowds"], ["star", "Small groups with a flexible pace"]],
    included: ["Accommodation for every night", "Guide and route planning", "Breakfast and dinner", "Airport transfers", "Luggage transfers between stops", "First-aid kit and trail briefing"],
    excluded: "Personal trekking equipment",
    days: ["Arrival and gear check", "First trail: warm-up", "Climb to the high point", "Ridge walk", "Valley day", "Long day with a summit view", "Easy descent and celebration dinner", "Departure"],
    dayText: ["Arrive, meet your guide and check your gear.", "A short walk to find your legs and learn the route.", "A steady climb with plenty of stops.", "A scenic ridge with wide views on both sides.", "A gentler walk through villages and fields.", "The longest day, with the best view of the trip.", "An easy descent and a dinner to celebrate.", "Breakfast and your transfer to the airport."],
    meals: "Breakfast and dinner",
  },
  "cycling-tours": {
    activity: "cycling",
    aboutMiddle: "Routes are planned for quiet roads and good lunches, with a support vehicle and a guide who knows every shortcut.",
    highlights: [["bike", "Well-maintained bikes, road or e-bike"], ["compass", "Daily routes on quiet back roads"], ["utensils", "Long lunches at local favourites"], ["sun", "Rides timed for cool mornings"], ["pin", "Hilltop villages and viewpoints"], ["star", "Support vehicle on every ride"]],
    included: ["Accommodation for every night", "Bike hire and helmet", "Breakfast and lunch", "Airport transfers", "Support vehicle and guide", "Route maps and a GPS file"],
    excluded: "Dinners (recommended venues provided)",
    days: ["Arrival and bike fitting", "Warm-up ride", "Hills and a long lunch", "Coastal or valley ride", "Rest day and local market", "Longest ride of the week", "Easy ride and farewell dinner", "Departure"],
    dayText: ["Arrive, get fitted for your bike and meet the group.", "A short loop to get comfortable with the bikes.", "A rolling route with a long lunch in a hilltop village.", "A flat, scenic ride with time for a swim or a coffee.", "A free day to rest, shop or take a short ride.", "The longest ride, with the support vehicle close by.", "An easy morning ride and a shared dinner.", "Breakfast and your transfer to the airport."],
    meals: "Breakfast and lunch",
  },
  "diving-trips": {
    activity: "diving",
    aboutMiddle: "Dives are planned around the tides and your level, with small groups, experienced guides and time to rest between descents.",
    highlights: [["waves", "Two or three guided dives a day"], ["compass", "Sites chosen for your level"], ["star", "Small groups with a dive guide"], ["sun", "Boat trips in calm morning conditions"], ["utensils", "Fresh seafood after the dives"], ["heart", "Courses available for new divers"]],
    included: ["Accommodation for every night", "Guided dives with tanks and weights", "All meals (full board)", "Airport transfers", "Boat trips to the dive sites", "Dive briefings and a logbook stamp"],
    excluded: "Personal dive equipment (hire available)",
    days: ["Arrival and check dive", "Reef dives", "Wall dive and night snorkel", "Drift dive", "Rest day and boat trip", "Deep dive day", "Last dives and farewell dinner", "Departure"],
    dayText: ["Arrive, meet your guide and do an easy check dive.", "Two relaxed dives on the home reef.", "A wall dive in the morning and a night snorkel.", "A gentle drift dive with the current.", "A day above water: island trip or rest.", "Deeper sites for experienced divers, easy dives for others.", "Last dives of the trip and a farewell dinner.", "Breakfast and your transfer to the airport."],
    meals: "All meals (full board)",
  },
};
const FALLBACK = TEMPLATES["holistic-wellness"];

const REVIEWERS = ["Sarah M.", "James T.", "Priya K.", "Marcus L.", "Elena S.", "Daniel K."];
const REVIEWER_PLACES = ["London, UK", "Sydney, Australia", "Dubai, UAE", "New York, USA", "Berlin, Germany", "Toronto, Canada"];
const REVIEW_TITLES = ["Unforgettable and well run", "Best trip in years", "Wonderful, with room to improve", "A week that reset everything"];
const CATEGORY_LABELS = ["Overall experience", "Instruction quality", "Accommodation", "Food & nutrition", "Value for money"];
const ROOM_PICK = [0, 4, 7] as const;
const ROOM_FACTORS = [1, 1.25, 1.75] as const;


function seededScore(seed: string, base: number, spread: number): number {
  const offset = (fnv1a(seed) % 1000) / 1000;
  return Math.min(5, Math.round((base - spread * 0.7 + offset * spread) * 10) / 10);
}

function themePool(themes: readonly ImageTheme[]): string[] {
  const order = [...themes, "wellness", "resort", "tropical", "coast", "countryside"] as ImageTheme[];
  const unique: string[] = [];
  for (const theme of order) for (const src of IMAGE_POOLS[theme]) if (!unique.includes(src)) unique.push(src);
  return unique;
}

/**
 * Experiences with a flexible duration (the visitor picks the range, within the limits); every other experience is fixed at its
 * nights. One mock example. TODO(api): the duration comes with the experience.
 */
const FLEXIBLE_EXPERIENCES: Readonly<Record<string, StayDuration>> = {
  "tuscan-hills-yoga-weekend": { type: "flexible", minNights: 3, maxNights: 7 },
};

export function buildExperienceDetail(record: ExperienceRecord, categoryLabel: string): ExperienceDetail {
  const { card } = record;
  const base = record.categories[0];
  const template = TEMPLATES[base] ?? FALLBACK;
  const themes = EXPERIENCE_IMAGE_THEMES[base] ?? ["wellness"];
  const pool = themePool(themes);
  const [place, ...country] = card.location.split(", ");
  const nights = card.nights;
  const slug = card.id;
  const photo = (src: string, label: string): DetailImage => ({ src, alt: `${card.title}, ${card.location}: ${label}` });

  const lead = card.images.filter((src) => pool.includes(src));
  const gallery = [...new Set([...lead, ...pool])].slice(0, 8);
  const images = gallery.map((src, index) => photo(src, `photo ${index + 1} of ${gallery.length}`));

  const about = [
    `${card.title} is a ${nights}-night ${template.activity} experience with ${card.provider} in ${card.location}. You arrive, settle in and leave the planning to the team.`,
    template.aboutMiddle,
    `Small groups, honest food and a setting in ${place} that makes it easy to switch off. Everything is included, so you can simply be there.`,
  ];

  const highlights: ExperienceHighlight[] = template.highlights.map(([icon, text]) => ({ icon, text }));
  const included: ExperienceIncludedItem[] = [
    ...template.included.slice(0, 5).map((text) => ({ text: text.replace("Accommodation for every night", `${nights} nights accommodation`), included: true })),
    { text: `Welcome drinks and a ${template.activity} briefing`, included: true },
    { text: template.excluded, included: false },
  ];

  const itinerary: ItineraryDay[] = Array.from({ length: nights }, (_, index) => {
    const day = index + 1;
    // First day: arrival. Last day: the closing day (the "Departure" entry is not a night). In between: the middle days in turn.
    const slot = day === 1 ? 0 : day === nights ? 6 : 1 + ((day - 2) % 5);
    const src = pool[(index * 2) % pool.length];
    return {
      day,
      title: template.days[slot],
      description: `${template.dayText[slot]} In ${place}.`,
      image: photo(src, `day ${day}`),
    };
  });

  const stars = card.rating >= 4.6 ? 5 : 4;
  const hotelImages = themePool(["resort"]).slice(0, 4).map((src, index) => photo(src, `accommodation photo ${index + 1}`));
  const rooms: HotelRoom[] = ROOM_PICK.map((typeIndex, position) => {
    const { key, images: roomImages, pricePerNight, ...type } = ROOM_TYPES[typeIndex];
    void pricePerNight; // hotel nightly price: experiences price per person
    return {
      ...type,
      id: `${slug}-room-${key}`,
      images: roomImages.map((src, index) => ({ src, alt: `${type.name} at ${card.provider}: photo ${index + 1}` })),
      priceFrom: { amount: position === 0 ? (card.price?.amount ?? 0) : round5((card.price?.amount ?? 0) * ROOM_FACTORS[position]), currency: CURRENCY },
    };
  });

  const reviewTexts = [
    `The ${template.activity} was the highlight of our week in ${place}. Everything felt calm and well run.`,
    `The team remembered our names and what we liked. We would book the same trip again.`,
    `A few small hiccups early on, which the team fixed quickly and with great grace.`,
    `We came hoping for a rest and left feeling completely renewed. Highly recommended.`,
  ];
  const items: HotelReview[] = reviewTexts.map((text, index) => {
    const key = `${slug}:review:${index}`;
    const month = ((fnv1a(key) % 6) + 6) % 12;
    return {
      id: key,
      // Four different reviewers per experience (a start offset per experience, then one step per review).
      author: REVIEWERS[(fnv1a(slug) + index) % REVIEWERS.length],
      location: REVIEWER_PLACES[(fnv1a(slug) + index) % REVIEWER_PLACES.length],
      title: REVIEW_TITLES[index],
      date: `2026-${String(month + 1).padStart(2, "0")}-15`,
      rating: index === 2 ? 4 : 5,
      text,
    };
  });

  return {
    id: card.id,
    slug,
    title: card.title,
    category: { slug: base, label: categoryLabel },
    badge: card.rating >= 4.8 ? "Best seller" : undefined,
    provider: card.provider,
    location: { label: card.location, city: place, country: country.join(", ") || place },
    nights,
    duration: FLEXIBLE_EXPERIENCES[slug] ?? { type: "fixed", nights },
    groupSize: { min: EXPERIENCE_GROUP_SIZE.min, max: EXPERIENCE_GROUP_SIZE.max },
    images,
    videoUrl: MOCK_VIDEO_URL,
    about,
    highlights,
    included,
    itinerary,
    hotel: {
      name: card.provider,
      stars,
      location: card.location,
      description: `${card.provider} is the home of this experience: a ${stars}-star stay in ${place} with quiet gardens, a shared dining room and a team that looks after every detail.`,
      amenities: ["Free Wi-Fi", "Shared dining room", "Garden", "Daily housekeeping", "Airport transfer", `${template.activity[0].toUpperCase()}${template.activity.slice(1)} space`],
      images: hotelImages,
    },
    // TODO(api): images grouped by category. Mock: Overview (the page's photos), then four groups from the content.
    galleryGroups: [
      galleryGroup("overview", "Overview", images, [galleryVideo(`${card.title}: video`, images[1] ?? images[0])]),
      galleryGroup("accommodation", "Accommodation", [...hotelImages, ...rooms.slice(0, 2).flatMap((room) => room.images.slice(0, 1))]),
      galleryGroup("activities", "Activities", itinerary.slice(0, 5).map((day) => day.image)),
      galleryGroup("food", "Food", labelled([IMAGE_POOLS.wellness[1], IMAGE_POOLS.wellness[2], IMAGE_POOLS.tropical[3]], card.title, "food")),
      galleryGroup("facilities", "Facilities", labelled([IMAGE_POOLS.resort[0], IMAGE_POOLS.resort[2], IMAGE_POOLS.coast[1]], card.title, "facilities")),
    ],
    rooms,
    reviews: {
      overall: card.rating,
      count: card.reviewCount,
      categories: CATEGORY_LABELS.map((label, index) => ({ label, score: Math.min(5, seededScore(`${slug}:${index}`, card.rating, 0.4)) })),
      items,
    },
    includedInAll: [`${nights} nights accommodation`, template.meals, `Daily ${template.activity} programme`, "Airport transfers"],
    freeCancellationDays: 30,
    priceFrom: card.price,
  };
}
