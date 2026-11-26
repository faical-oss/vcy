import type { PopularSearch } from "@/interfaces";
import { destination, experienceCategory } from "@/constants/routes";

export const popularSearches: PopularSearch[] = [
  { id: "yoga-retreats", label: "Yoga Retreats", href: experienceCategory("yoga-retreats") },
  { id: "bali", label: "Bali", href: destination("bali-indonesia") },
  { id: "safari", label: "Safari", href: experienceCategory("safari-and-wildlife") },
  { id: "cycling-tours", label: "Cycling Tours", href: experienceCategory("cycling-tours") },
  { id: "maldives", label: "Maldives", href: destination("maldives") },
  { id: "meditation", label: "Meditation", href: experienceCategory("meditation-retreats") },
];
