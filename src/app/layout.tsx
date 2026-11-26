import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/constants/site";
import { getSiteUrl, isIndexingEnabled } from "@/lib/env";
import { albert, cormorant } from "./fonts";
import "./globals.css";


export function generateMetadata(): Metadata {
  // Indexable only when INDEXING_ENABLED=true (production build, no mocks). Everything else must never leak into search.
  const indexable = isIndexingEnabled();

  return {
    metadataBase: new URL(getSiteUrl()),
    title: { default: `${SITE_NAME} – ${SITE_TAGLINE}`, template: `%s | ${SITE_NAME}` },
    description: SITE_DESCRIPTION,
    robots: { index: indexable, follow: indexable },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${cormorant.variable} ${albert.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
