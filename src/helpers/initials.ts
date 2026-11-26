/** Initials of a person's name: first letter of the first and last name, or the first two letters of a single name. Uppercase. */
export function initialsOf(name: string): string {
  const words = name.replace(/[^\p{L}\p{N}\s'’-]/gu, " ").split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return Array.from(words[0]).slice(0, 2).join("").toUpperCase();
  return (Array.from(words[0])[0] + Array.from(words[words.length - 1])[0]).toUpperCase();
}
