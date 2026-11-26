export type TierSegmentState = "complete" | "current" | "upcoming";

/** One state per level. Levels up to and including the current one are filled; the current one is flagged for bold labels. */
export function tierSegments(level: number, totalLevels: number): { level: number; filled: boolean; current: boolean }[] {
  return Array.from({ length: totalLevels }, (_, index) => ({
    level: index + 1,
    filled: index + 1 <= level,
    current: index + 1 === level,
  }));
}

/** "You're 9 bookings away from Wellness level 3". */
export function bookingsAwayText(bookingsToNextLevel: number, nextLevel: number): string {
  const noun = bookingsToNextLevel === 1 ? "booking" : "bookings";
  return `You're ${bookingsToNextLevel} ${noun} away from Wellness level ${nextLevel}`;
}

/** Avatar initials: first two letters of the first name, uppercase ("Faical" -> "FA"). */
export function initialsOf(firstName: string): string {
  return firstName.trim().slice(0, 2).toUpperCase() || "VC";
}
