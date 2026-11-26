import { GALLERY_WELLNESS, GALLERY_YOGA, local, unsplash } from "../home/assets";
import { seededPick } from "@/helpers/seeded-pick";

/**
 * Image pools tagged by theme. Only assets that already exist (local `public/images/home` files and the Unsplash
 * photos the Home fixtures already use), so no new remote host is needed. There is no cycling-specific photo yet:
 * cycling items use the "countryside" theme.
 */
export type ImageTheme = "yoga" | "wellness" | "meditation" | "hiking" | "water" | "countryside" | "coast" | "tropical" | "jungle" | "resort";

export const IMAGE_POOLS: Record<ImageTheme, readonly string[]> = {
  yoga: [...GALLERY_YOGA, local("exp-yoga-bali.png"), local("exp-rishikesh.png"), local("exp-surf-yoga.png"), local("exp-bali-ttc.png")],
  wellness: [...GALLERY_WELLNESS, local("exp-thai.png"), local("exp-ayurveda.png"), local("exp-vegan.png"), local("exp-blue-lagoon.png")],
  meditation: [local("mag-digital-detox.jpg"), GALLERY_YOGA[0], GALLERY_WELLNESS[2], local("exp-rishikesh.png")],
  hiking: [unsplash("1533130061792-64b345e4a833"), unsplash("1524492412937-b28074a5d7da"), local("mag-rishikesh.png")],
  water: [local("mag-cycling-france.png"), unsplash("1512343879784-a960bf40e7f2"), unsplash("1571896349842-33c89424de2d")],
  countryside: [unsplash("1523531294919-4bcd7c65e216"), unsplash("1545389336-cf090694435e"), unsplash("1570077188670-e3a8d69ac5ff")],
  coast: [unsplash("1570077188670-e3a8d69ac5ff"), unsplash("1545389336-cf090694435e"), unsplash("1523531294919-4bcd7c65e216")],
  tropical: [
    unsplash("1512343879784-a960bf40e7f2"),
    unsplash("1537996194471-e657df975ab4"),
    unsplash("1571896349842-33c89424de2d"),
    unsplash("1596178060810-72f53ce9a65c"),
    unsplash("1537953773345-d172ccf13cf1"),
  ],
  jungle: [unsplash("1580259679654-9276b39fd2d5"), unsplash("1537996194471-e657df975ab4"), unsplash("1537953773345-d172ccf13cf1")],
  resort: [
    unsplash("1566073771259-6a8506099945"),
    unsplash("1571896349842-33c89424de2d"),
    unsplash("1596178060810-72f53ce9a65c"),
    unsplash("1537996194471-e657df975ab4"),
  ],
};

/** A deterministic gallery for a card: `lead` first, then pool images picked by hashing `seed` (the item id). */
export function galleryFor(theme: ImageTheme, seed: string, lead?: string): string[] {
  const rest = seededPick(IMAGE_POOLS[theme].filter((image) => image !== lead), seed, lead ? 3 : 4, (image) => image);
  return lead ? [lead, ...rest] : rest;
}
