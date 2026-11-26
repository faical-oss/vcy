import { Albert_Sans, Cormorant_Garamond } from "next/font/google";

/** Display font: headings. Matches Figma "Cormorant Garamond" (Regular/Medium). */
export const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

/** UI + body font. Matches Figma "Albert Sans". */
export const albert = Albert_Sans({
  variable: "--font-albert",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
