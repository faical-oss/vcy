"use client";

import { useSearchParams } from "next/navigation";
import { SEARCH_TABS } from "@/helpers/search-box";
import { useHydrated } from "@/hooks/use-hydrated";
import type { SearchResultsContent } from "@/interfaces";

/** The one h1 of the page. The server HTML has the general heading; once in the browser it names the tab of the search ("Hotels", "Packages", "Experiences"). */
export function SearchHeading({ content }: { content: SearchResultsContent }) {
  const param = useSearchParams().get("type");
  const hydrated = useHydrated();
  const type = SEARCH_TABS.find((tab) => tab === param);
  const { title, intro } = hydrated && type ? content.headings[type] : content;
  return <PageHeading title={title} intro={intro} />;
}

/** `as="div"` is the look of the heading without the h1 (the Suspense fallback, so the server HTML has one h1 only). */
export function PageHeading({ title, intro, as: Tag = "h1" }: { title: string; intro: string; as?: "h1" | "div" }) {
  return (
    <div className="mb-6">
      <Tag className="text-xl font-semibold text-primary">{title}</Tag>
      <p className="mt-2 text-sm text-body">{intro}</p>
    </div>
  );
}
