import { slugify } from "@/helpers/slugify";
import type { ExperienceCategory, HotelCategory, HotelCategoryKind } from "@/interfaces";

/** Menu groups with their labels: the single source for both the header menus and the category registries. */
export interface LabelGroup {
  title: string;
  labels: readonly string[];
}

export const EXPERIENCE_GROUPS: readonly LabelGroup[] = [
  { title: "Wellness", labels: ["Yoga Retreats", "Meditation Retreats", "Ayurveda Retreats", "Detox Retreats", "Spa & Thermal Retreats", "Holistic Wellness", "Anti-Ageing Retreats", "Healing Retreats", "Mental Health Retreats"] },
  { title: "Active & Adventure", labels: ["Hiking & Trekking", "Cycling Tours", "Diving Trips", "Climbing Holidays", "Winter Sports", "Multi-Adventure Trips", "Safari & Wildlife", "Surfing Retreats", "Martial Arts Camps"] },
  { title: "Mind & Spirit", labels: ["Spiritual Retreats", "Personal Development", "Plant Medicine Retreats", "Buddhist Retreats", "Shamanic Retreats", "Breathwork Retreats", "Sound Healing", "Astrology & Tarot"] },
  { title: "Lifestyle & Culture", labels: ["Culinary Vacations", "Art & Creative Retreats", "Cultural Immersion", "Language Immersion", "Motorcycle Tours", "Ranch Stays", "Volunteer Travel", "Writing Retreats"] },
  { title: "Health & Fitness", labels: ["Fitness Retreats", "Weight Loss Retreats", "Boot Camp Retreats", "Triathlon Training", "Nutrition Retreats", "CrossFit & HIIT", "Pilates Retreats"] },
  { title: "Curated for You", labels: ["Trending Now", "Exclusive Offers", "Best Value", "New & Noteworthy", "Editor's Picks"] },
];

export const EXPERIENCE_COLLECTION_GROUP = "Curated for You";

export const HOTEL_GROUPS: readonly (LabelGroup & { kind: HotelCategoryKind })[] = [
  { title: "By Type", kind: "type", labels: ["Wellness Resorts", "Luxury Spa Hotels", "Boutique Retreats", "Eco Lodges", "City Wellness Hotels", "Beach Resorts", "Mountain Retreats", "Safari Lodges", "Overwater Villas", "Treehouses & Unique Stays"] },
  { title: "By Experience", kind: "experience", labels: ["Yoga-Focused", "Spa & Thermal", "Detox & Cleanse", "Fitness & Sport", "Meditation & Mindfulness", "Family Wellness", "Couples Retreats", "Solo Traveller", "Digital Detox"] },
  { title: "Asia & Pacific", kind: "brand", labels: ["Six Senses Hotels", "Aman Resorts", "COMO Hotels", "Anantara", "Banyan Tree", "Alila Hotels", "Soneva"] },
  { title: "Europe", kind: "property", labels: ["Chiva-Som Samui", "SHA Wellness Clinic", "Palazzo Fiuggi", "Lanserhof", "Clinique La Prairie", "Longevity Hotel", "Chenot Palace"] },
  { title: "By Budget", kind: "budget", labels: ["Under $150/night", "$150–$300/night", "$300–$600/night", "Luxury $600+/night", "All-Inclusive", "Value Packages"] },
  { title: "Curated for You", kind: "curated", labels: ["Editor's Selection", "New Openings", "Best Value", "Exclusive Offers"] },
];

export const experienceCategories: ExperienceCategory[] = EXPERIENCE_GROUPS.flatMap((group) =>
  group.labels.map((label) => ({
    slug: slugify(label),
    label,
    group: group.title,
    kind: group.title === EXPERIENCE_COLLECTION_GROUP ? ("collection" as const) : ("category" as const),
  })),
);

export const hotelCategories: HotelCategory[] = HOTEL_GROUPS.flatMap((group) =>
  group.labels.map((label) => ({ slug: slugify(label), label, group: group.title, kind: group.kind })),
);

/**
 * Nightly price ranges (USD, min inclusive, max exclusive) for the "By Budget" price categories.
 * ASSUMED boundaries: the menu labels overlap at the edges ("$150" ends one range and starts the next).
 */
export const HOTEL_BUDGET_RANGES: Readonly<Record<string, { min: number; max?: number }>> = {
  [slugify("Under $150/night")]: { min: 0, max: 150 },
  [slugify("$150–$300/night")]: { min: 150, max: 300 },
  [slugify("$300–$600/night")]: { min: 300, max: 600 },
  [slugify("Luxury $600+/night")]: { min: 600 },
};

/**
 * Top-up preference: when a category has fewer than 3 matches, items that carry one of these categories (keyed by
 * menu group) are used first, then anything. ASSUMED pairings; they only affect which fillers are shown.
 */
export const EXPERIENCE_TOP_UP_AFFINITY: Readonly<Record<string, readonly string[]>> = {
  Wellness: ["Yoga Retreats", "Holistic Wellness", "Meditation Retreats"].map(slugify),
  "Active & Adventure": ["Hiking & Trekking", "Cycling Tours", "Diving Trips"].map(slugify),
  "Mind & Spirit": ["Meditation Retreats", "Yoga Retreats"].map(slugify),
  "Lifestyle & Culture": ["Cycling Tours", "Holistic Wellness"].map(slugify),
  "Health & Fitness": ["Yoga Retreats", "Hiking & Trekking", "Cycling Tours"].map(slugify),
};

export const HOTEL_TOP_UP_AFFINITY: Readonly<Record<string, readonly string[]>> = {
  "By Type": ["Wellness Resorts", "Luxury Spa Hotels", "Eco Lodges"].map(slugify),
  "By Experience": ["Wellness Resorts", "Luxury Spa Hotels"].map(slugify),
  "Asia & Pacific": ["Wellness Resorts", "Luxury Spa Hotels"].map(slugify),
  Europe: ["Wellness Resorts", "Luxury Spa Hotels"].map(slugify),
};
