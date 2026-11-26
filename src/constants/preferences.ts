import type { PreferenceCategory } from "@/interfaces";

export interface PreferenceOption {
  /** Stable slug: safe to persist. */
  id: string;
  label: string;
}

export interface PreferenceCategoryDef {
  key: PreferenceCategory;
  eyebrow: string;
  question: string;
  helper: string;
  options: readonly PreferenceOption[];
}

const slug = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const options = (labels: readonly string[]): readonly PreferenceOption[] => labels.map((label) => ({ id: slug(label), label }));

/** Copy from the original prototype's Preferences wizard. Order = step order. */
export const PREFERENCE_CATEGORIES: readonly PreferenceCategoryDef[] = [
  {
    key: "experiences",
    eyebrow: "Experiences",
    question: "What do you like to do on vacation?",
    helper: "Choose every activity or wellbeing goal that sounds like your kind of trip.",
    options: options([
      "Bike", "Detox", "Dive", "Get fit", "Golf", "Get healthy", "Hike", "Meditate", "Ski", "Be enlightened",
      "Lose weight", "Practice yoga", "Get pampered", "Run", "Have an adventure", "Heal", "Work and play", "Camp", "Surf", "Raft",
    ]),
  },
  {
    key: "regions",
    eyebrow: "Regions",
    question: "Where do you want to travel?",
    helper: "Select the parts of the world you would most like to explore.",
    options: options(["Europe", "North America", "South America", "Central America", "Asia", "Africa", "Caribbean"]),
  },
  {
    key: "places",
    eyebrow: "Places",
    question: "Where do you see yourself?",
    helper: "Tell us which kinds of settings make you want to pack your bags.",
    options: options(["Beaches", "Remote destinations", "Mountains", "Deserts", "Forests", "National parks", "Cities"]),
  },
  {
    key: "purpose",
    eyebrow: "Purpose",
    question: "Why do you travel?",
    helper: "Choose the feelings and outcomes you want your next journey to create.",
    options: options([
      "The thrill", "The food", "To be empowered", "To escape", "To rejuvenate", "To be transformed", "To find zen", "To explore", "To connect", "To learn",
    ]),
  },
  {
    key: "style",
    eyebrow: "Travel style",
    question: "Who do you like to travel with?",
    helper: "Select all the ways you typically like to experience a trip.",
    options: options(["With my partner", "With a group", "By myself", "With family", "With my girls", "With my guys"]),
  },
];
