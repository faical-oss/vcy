import type { PreferenceCategory, TravelPreferences } from "@/interfaces";

export const PREFERENCE_KEYS: readonly PreferenceCategory[] = ["experiences", "regions", "places", "purpose", "style"];

export function emptyPreferences(): TravelPreferences {
  return { experiences: [], regions: [], places: [], purpose: [], style: [] };
}

/** Total selections across all categories. */
export function countSelected(preferences: TravelPreferences): number {
  return PREFERENCE_KEYS.reduce((total, key) => total + preferences[key].length, 0);
}

/** "1 preference selected" / "12 preferences selected". */
export function formatSelectedCount(count: number): string {
  return `${count} ${count === 1 ? "preference" : "preferences"} selected`;
}

export function toggleId(ids: readonly string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((current) => current !== id) : [...ids, id];
}
