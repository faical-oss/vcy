export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Slug of a detail page: lowercase, readable, "<name>-<city>" (e.g. "Amanpuri", "Phuket" -> "amanpuri-phuket").
 * The city is left out when the name already contains it. Uniqueness is the data owner's job: two items with the same
 * name and city must get a distinguishing word in the name, and the catalog tests check uniqueness.
 */
export function detailSlug(name: string, city: string): string {
  const base = slugify(name);
  const place = slugify(city);
  if (!place || base === place || base.includes(place)) return base;
  return `${base}-${place}`;
}
