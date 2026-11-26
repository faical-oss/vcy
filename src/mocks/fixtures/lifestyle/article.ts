import { EXTERNAL_URLS } from "@/constants/routes";
import type { MagazineArticle } from "@/interfaces";

/** A magazine card: the magazine lives on vacayou.com, so every card links out (new tab). */
export const article = (id: string, category: string, title: string, excerpt: string, author: string, readTimeMinutes: number, image: string): MagazineArticle => ({
  id,
  category,
  title,
  excerpt,
  author,
  readTimeMinutes,
  href: EXTERNAL_URLS.magazine,
  external: true,
  imageSrc: image,
});
