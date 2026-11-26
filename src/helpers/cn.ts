import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Custom type-scale tokens from globals.css (@theme). tailwind-merge must know they are
 * font SIZES, otherwise `text-eyebrow` is mistaken for a text color and wipes `text-white`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display", "display-sm", "heading", "heading-sm", "title-xs", "title-md", "account-title", "listing-title", "destination-title", "heading-xs", "stat", "stat-lg", "nano", "pico", "title-lg", "title", "title-sm", "eyebrow", "chip", "caption", "micro"] }],
    },
  },
});

/** Merge class names; later Tailwind classes win over earlier conflicting ones. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
