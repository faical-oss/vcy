import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeading, SearchHeading } from "@/components/sections/search/results/search-heading";
import { ResultsSkeleton } from "@/components/sections/search/results/results-states";
import { Container } from "@/components/ui/container";
import { ROUTES } from "@/constants/routes";
import { getSearchBoxContent } from "@/features/search/get-search-box-content";
import { getSearchResultsContent } from "@/features/search/get-search-results-content";
import { SearchResults } from "@/features/search/search-results";
import { pageSeo } from "@/features/seo/url-policy";

/** Search results are never indexed (`urlPolicy` type "search"). There is no clean page to point the canonical at, so it points at `/search` itself. */
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Search results",
    description: "Experiences, packages and hotels that match your search, with prices and availability for your dates.",
    ...pageSeo({ type: "search", path: ROUTES.search }),
  };
}

/**
 * The shell is the same for every search: the general heading and a skeleton (the heading names the tab once in the browser). The results are fetched in the browser (`SearchResults`),
 * never on the server. The docked search bar shows from the first pixel on this page at every width (4rem, hence `pt-24`): the pill below `xl`, the row from `xl`.
 */
export default async function SearchPage() {
  const [content, searchBox] = await Promise.all([getSearchResultsContent(), getSearchBoxContent()]);
  return (
    <>
      {/* At least a screen tall, so the footer stays below the fold before and after the results arrive (no layout shift whatever the answer). */}
      <Container className="min-h-svh pb-16 pt-24">
        <Suspense fallback={<PageHeading as="div" title={content.title} intro={content.intro} />}>
          <SearchHeading content={content} />
        </Suspense>
        <Suspense fallback={<ResultsSkeleton view="list" />}>
          <SearchResults content={content} searchBox={searchBox} />
        </Suspense>
      </Container>
    </>
  );
}
