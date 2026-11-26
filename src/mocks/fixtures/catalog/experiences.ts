import { slugify } from "@/helpers/slugify";
import { local, unsplash } from "../home/assets";
import { experienceRecord } from "./builders";
import type { ImageTheme } from "./images";
import type { ExperienceRecord } from "./types";

/** Image themes allowed for the photos of an item, by primary category (checked by the fixture tests). */
export const EXPERIENCE_IMAGE_THEMES: Readonly<Record<string, readonly ImageTheme[]>> = {
  [slugify("Yoga Retreats")]: ["yoga"],
  [slugify("Holistic Wellness")]: ["wellness", "coast"],
  [slugify("Meditation Retreats")]: ["meditation"],
  [slugify("Hiking & Trekking")]: ["hiking"],
  [slugify("Cycling Tours")]: ["countryside"],
  [slugify("Diving Trips")]: ["water"],
};

/** ASSUMED mock content: 6 base categories x 4 items over 8 destinations. Names, prices and ratings are invented. */
export const experienceRecords: ExperienceRecord[] = [
  // Yoga Retreats
  experienceRecord({ id: "ubud-yoga-and-detox-retreat", title: "6-Day Ubud Yoga & Detox Retreat", provider: "Sawah Valley Retreat", destination: "Bali, Indonesia", place: "Ubud", rating: 4.8, reviewCount: 212, nights: 6, price: 1180, categories: ["Yoga Retreats", "Detox Retreats", "Trending Now"], theme: "yoga", leadImage: local("exp-yoga-bali.png") }),
  experienceRecord({ id: "himalayan-yoga-immersion", title: "5-Day Himalayan Yoga Immersion", provider: "Ganga Shala Rishikesh", destination: "India", place: "Rishikesh", rating: 4.9, reviewCount: 168, nights: 5, price: 820, categories: ["Yoga Retreats", "Spiritual Retreats", "Best Value"], theme: "yoga", leadImage: local("exp-rishikesh.png") }),
  experienceRecord({ id: "canggu-surf-and-yoga-week", title: "7-Day Surf & Yoga Week", provider: "Echo Beach Collective", destination: "Bali, Indonesia", place: "Canggu", rating: 4.6, reviewCount: 94, nights: 7, price: 1490, categories: ["Yoga Retreats", "Surfing Retreats", "New & Noteworthy"], theme: "yoga", leadImage: local("exp-surf-yoga.png") }),
  experienceRecord({ id: "tuscan-hills-yoga-weekend", title: "4-Day Tuscan Hills Yoga Weekend", provider: "Podere Santa Chiara", destination: "Italy", place: "Tuscany", rating: 4.7, reviewCount: 57, nights: 4, price: 1320, categories: ["Yoga Retreats", "Culinary Vacations", "Editor's Picks"], theme: "yoga" }),
  // Holistic Wellness
  experienceRecord({ id: "thai-holistic-wellness-journey", title: "7-Day Thai Holistic Wellness Journey", provider: "Baan Suan Wellness", destination: "Thailand", place: "Koh Samui", rating: 4.9, reviewCount: 305, nights: 7, price: 2050, categories: ["Holistic Wellness", "Healing Retreats", "Spa & Thermal Retreats", "Exclusive Offers", "Trending Now"], theme: "wellness", leadImage: local("exp-thai.png") }),
  experienceRecord({ id: "kerala-ayurveda-reset", title: "5-Day Kerala Ayurveda Reset", provider: "Varkala Cliff Ayurveda", destination: "India", place: "Kerala", rating: 4.7, reviewCount: 143, nights: 5, price: 790, categories: ["Holistic Wellness", "Ayurveda Retreats", "Detox Retreats", "Best Value"], theme: "wellness", leadImage: local("exp-ayurveda.png") }),
  experienceRecord({ id: "mediterranean-wellness-retreat", title: "8-Day Mediterranean Wellness Retreat", provider: "Aegean Light Retreat", destination: "Greece", place: "Crete", rating: 4.9, reviewCount: 188, nights: 8, price: 2490, categories: ["Holistic Wellness", "Yoga Retreats", "Anti-Ageing Retreats", "Editor's Picks", "Exclusive Offers"], theme: "coast", leadImage: unsplash("1545389336-cf090694435e") }),
  experienceRecord({ id: "plant-based-wellness-escape", title: "4-Day Plant-Based Wellness Escape", provider: "Lanna Garden Retreat", destination: "Thailand", place: "Chiang Mai", rating: 4.5, reviewCount: 76, nights: 4, price: 640, categories: ["Holistic Wellness", "Nutrition Retreats", "Weight Loss Retreats", "New & Noteworthy"], theme: "wellness", leadImage: local("exp-vegan.png") }),
  // Meditation Retreats
  experienceRecord({ id: "silent-meditation-retreat-chiang-mai", title: "7-Day Silent Meditation Retreat", provider: "Doi Stillness Centre", destination: "Thailand", place: "Chiang Mai", rating: 4.8, reviewCount: 131, nights: 7, price: 760, categories: ["Meditation Retreats", "Buddhist Retreats", "Mental Health Retreats", "Best Value"], theme: "meditation" }),
  experienceRecord({ id: "ubud-mindfulness-and-stillness", title: "6-Day Mindfulness & Stillness Retreat", provider: "Tirta Mind House", destination: "Bali, Indonesia", place: "Ubud", rating: 4.7, reviewCount: 119, nights: 6, price: 1240, categories: ["Meditation Retreats", "Breathwork Retreats", "Personal Development"], theme: "meditation" }),
  experienceRecord({ id: "himalayan-meditation-retreat", title: "5-Day Himalayan Meditation Retreat", provider: "Kopan Valley Guest House", destination: "Nepal", place: "Kathmandu Valley", rating: 4.9, reviewCount: 88, nights: 5, price: 690, categories: ["Meditation Retreats", "Buddhist Retreats", "Sound Healing", "Trending Now"], theme: "meditation" }),
  experienceRecord({ id: "umbrian-mindful-living-retreat", title: "7-Day Mindful Living Retreat", provider: "Casale dei Silenzi", destination: "Italy", place: "Umbria", rating: 4.6, reviewCount: 62, nights: 7, price: 1560, categories: ["Meditation Retreats", "Personal Development", "Writing Retreats", "New & Noteworthy"], theme: "meditation" }),
  // Hiking & Trekking
  experienceRecord({ id: "annapurna-base-camp-trek", title: "10-Day Annapurna Base Camp Trek", provider: "Mountain Spirit Guides", destination: "Nepal", place: "Annapurna", rating: 4.9, reviewCount: 241, nights: 10, price: 1890, categories: ["Hiking & Trekking", "Multi-Adventure Trips", "Trending Now", "Editor's Picks"], theme: "hiking" }),
  experienceRecord({ id: "cinque-terre-coastal-hiking", title: "7-Day Cinque Terre Coastal Hiking", provider: "Sentieri Liguri", destination: "Italy", place: "Liguria", rating: 4.7, reviewCount: 135, nights: 7, price: 1740, categories: ["Hiking & Trekking", "Culinary Vacations", "Exclusive Offers"], theme: "hiking" }),
  experienceRecord({ id: "batur-sunrise-and-rice-terrace-trek", title: "6-Day Volcano & Rice Terrace Trek", provider: "Kintamani Trails", destination: "Bali, Indonesia", place: "Kintamani", rating: 4.5, reviewCount: 73, nights: 6, price: 980, categories: ["Hiking & Trekking", "Cultural Immersion", "Best Value"], theme: "hiking" }),
  experienceRecord({ id: "cretan-gorges-walking-week", title: "7-Day Cretan Gorges Walking Week", provider: "White Mountains Walks", destination: "Greece", place: "Crete", rating: 4.8, reviewCount: 101, nights: 7, price: 1410, categories: ["Hiking & Trekking", "Cultural Immersion", "New & Noteworthy"], theme: "hiking" }),
  // Cycling Tours
  experienceRecord({ id: "tuscany-cycling-tour", title: "7-Day Tuscany Cycling Tour", provider: "Chianti Velo", destination: "Italy", place: "Chianti", rating: 4.8, reviewCount: 156, nights: 7, price: 2180, categories: ["Cycling Tours", "Culinary Vacations", "Triathlon Training", "Editor's Picks"], theme: "countryside" }),
  experienceRecord({ id: "chiang-mai-countryside-cycling", title: "6-Day Countryside Cycling Escape", provider: "Northern Pedal Co.", destination: "Thailand", place: "Chiang Mai", rating: 4.6, reviewCount: 69, nights: 6, price: 910, categories: ["Cycling Tours", "Cultural Immersion", "Best Value"], theme: "countryside" }),
  experienceRecord({ id: "bali-cycling-and-culture-tour", title: "5-Day Bali Cycling & Culture Tour", provider: "Island Gears Bali", destination: "Bali, Indonesia", place: "Ubud", rating: 4.4, reviewCount: 48, nights: 5, price: 860, categories: ["Cycling Tours", "Cultural Immersion", "Fitness Retreats"], theme: "countryside" }),
  experienceRecord({ id: "peloponnese-cycling-tour", title: "8-Day Peloponnese Cycling Tour", provider: "Argolis Cycle Holidays", destination: "Greece", place: "Peloponnese", rating: 4.7, reviewCount: 84, nights: 8, price: 2040, categories: ["Cycling Tours", "Multi-Adventure Trips", "Exclusive Offers"], theme: "countryside" }),
  // Diving Trips
  experienceRecord({ id: "maldives-dive-and-wellness-week", title: "7-Day Dive & Wellness Week", provider: "Baa Atoll Dive Club", destination: "Maldives", place: "Baa Atoll", rating: 4.9, reviewCount: 197, nights: 7, price: 2890, categories: ["Diving Trips", "Holistic Wellness", "Trending Now", "Exclusive Offers"], theme: "water" }),
  experienceRecord({ id: "koh-tao-diving-course", title: "6-Day Koh Tao Diving Course", provider: "Sairee Dive Academy", destination: "Thailand", place: "Koh Tao", rating: 4.6, reviewCount: 228, nights: 6, price: 780, categories: ["Diving Trips", "Best Value"], theme: "water" }),
  experienceRecord({ id: "guanacaste-pacific-dive-trip", title: "5-Day Pacific Dive Trip", provider: "Papagayo Divers", destination: "Costa Rica", place: "Guanacaste", rating: 4.5, reviewCount: 52, nights: 5, price: 1350, categories: ["Diving Trips", "Multi-Adventure Trips", "New & Noteworthy"], theme: "water" }),
  experienceRecord({ id: "maldives-liveaboard-dive-trip", title: "8-Day Liveaboard Dive Trip", provider: "Indigo Atoll Liveaboards", destination: "Maldives", place: "Ari Atoll", rating: 4.8, reviewCount: 110, nights: 8, price: 3150, categories: ["Diving Trips", "Editor's Picks"], theme: "water" }),
];
