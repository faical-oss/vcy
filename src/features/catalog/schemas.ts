import { z } from "zod";

/** URL slugs produced by `slugify`: lowercase words joined by single hyphens. */
export const slugSchema = z.string().max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

/** A malformed or missing optional category is treated as "no filter". */
export function parseOptionalSlug(value: string | undefined): string | undefined {
  const parsed = slugSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

/** A query parameter may repeat (`?a=1&a=2`); only the first value is used. */
export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
