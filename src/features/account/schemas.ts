import { z } from "zod";
import { PREFERENCE_CATEGORIES } from "@/constants/preferences";

/** Only known option ids are accepted, at most once each. */
export const travelPreferencesSchema = z.object(
  Object.fromEntries(
    PREFERENCE_CATEGORIES.map(({ key, options }) => [
      key,
      z.array(z.enum(options.map((option) => option.id) as [string, ...string[]])).max(options.length),
    ]),
  ) as Record<string, z.ZodArray<z.ZodEnum<{ [k: string]: string }>>>,
);

export const connectedAccountInputSchema = z.object({
  provider: z.enum(["google", "apple", "facebook"]),
  connected: z.boolean(),
});

export const newsletterInputSchema = z.boolean();

/** Ids are opaque strings from the client: bounded so a forged request cannot ask for an unbounded list. */
export const favoriteRefsSchema = z
  .array(z.object({ kind: z.enum(["experience", "package", "hotel"]), id: z.string().min(1).max(100) }))
  .max(200);
