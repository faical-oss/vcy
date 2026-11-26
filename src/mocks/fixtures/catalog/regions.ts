import type { RegionEditorial } from "./types";

/**
 * The six menu regions, in menu order. Counts, "from" prices, hero images and destination lists are computed from the
 * destination registry, never typed here. Editorial content (best time, stay, intro) is copied from the Figma prototype for all six.
 */
export const regionEditorial: RegionEditorial[] = [
  // ASSUMED/reference-prototype editorial mock for every region: best time, stay and intro as shown on the Figma prototype's region pages; replace with Trip Fusion/CMS content.
  {
    label: "Asia",
    bestTimeToVisit: "Oct – Apr",
    averageStay: "10 nights",
    intro: "Ancient wellness traditions, tropical islands, mountain temples and dynamic cities make Asia an endlessly rewarding region for transformative travel.",
  },
  {
    label: "Europe",
    bestTimeToVisit: "Apr – Oct",
    averageStay: "8 nights",
    intro: "Cobblestone cities, sun-drenched coasts, alpine passes and world-class cuisine — Europe rewards those who travel slowly and explore beyond the obvious.",
  },
  {
    label: "Americas",
    bestTimeToVisit: "Dec – Apr",
    averageStay: "10 nights",
    intro: "From rainforest eco-retreats and Andean trails to desert landscapes and vibrant coastal cities, the Americas offer adventure on an extraordinary scale.",
  },
  {
    label: "Africa & Middle East",
    bestTimeToVisit: "Sep – May",
    averageStay: "9 nights",
    intro: "Wildlife-rich plains, ancient medinas, desert camps and restorative coastal escapes create journeys filled with culture, nature and wonder.",
  },
  {
    label: "Oceania & Pacific",
    bestTimeToVisit: "Sep – Apr",
    averageStay: "12 nights",
    intro: "Remote islands, dramatic coastlines, indigenous culture and pristine wilderness make the Pacific a natural setting for meaningful escapes.",
  },
  {
    label: "Indian Ocean",
    bestTimeToVisit: "Nov – Apr",
    averageStay: "8 nights",
    intro: "Turquoise lagoons, coral reefs and nature-led island resorts make the Indian Ocean ideal for restorative wellness, diving and slow travel.",
  },
];
