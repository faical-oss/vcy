import type { Metadata } from "next";
import { Suspense } from "react";
import { DestinationGroup } from "@/components/sections/listing/destination-group";
import { DestinationIndexResultsSkeleton } from "@/components/sections/listing/destination-index-skeleton";
import { FilterChips } from "@/components/sections/listing/filter-chips";
import { ListingEmptyState } from "@/components/sections/listing/listing-empty-state";
import { Container } from "@/components/ui/container";
import { ROUTES } from "@/constants/routes";
import { SITE_NAME } from "@/constants/site";
import { getDestinationIndex } from "@/features/catalog/get-catalog";
import {
  DESTINATION_INDEX_CONTENT,
  LISTING_CONTENT,
  countIndexDestinations,
  destinationIndexChips,
  destinationIndexMetadata,
} from "@/features/catalog/listing-content";
import { firstParam } from "@/features/catalog/schemas";
import { pageSeo } from "@/features/seo/url-policy";
import { ListingPageHero } from "@/features/seo/listing-page-hero";

/** Never reads `searchParams`: metadata stays static, and `?region=` URLs canonicalise to the unfiltered index. */
export async function generateMetadata(): Promise<Metadata> {
  const index = await getDestinationIndex();
  const { title, description } = destinationIndexMetadata(countIndexDestinations(index.groups), index.regions);
  return {
    title,
    description,
    ...pageSeo({ type: "destination", path: ROUTES.destinations }),
    openGraph: { type: "website", siteName: SITE_NAME, title: `${title} | ${SITE_NAME}`, description, url: ROUTES.destinations },
  };
}

/**
 * The hero depends on nothing but the catalog, so it is prerendered. `searchParams` is request-time data: it is only
 * read inside the Suspense boundary, so the region chips' active state and the filtered groups stream in behind a skeleton.
 */
export default async function DestinationsPage({ searchParams }: PageProps<"/destinations">) {
  const index = await getDestinationIndex();
  const total = countIndexDestinations(index.groups);

  return (
    <>
      <ListingPageHero
        size="index"
        title={DESTINATION_INDEX_CONTENT.title}
        eyebrow={DESTINATION_INDEX_CONTENT.eyebrow}
        subtitle={DESTINATION_INDEX_CONTENT.subtitle(total)}
        crumbs={[{ label: LISTING_CONTENT.homeCrumb, href: ROUTES.home }, { label: DESTINATION_INDEX_CONTENT.title }]}
        breadcrumbLabel={LISTING_CONTENT.breadcrumbLabel}
        ornament
        image={index.groups[0]?.destinations[0]?.imageSrc}
      />
      <Suspense fallback={<DestinationIndexResultsSkeleton label={LISTING_CONTENT.loadingLabel} />}>
        <DestinationIndexResults searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function DestinationIndexResults({ searchParams }: Pick<PageProps<"/destinations">, "searchParams">) {
  const { region } = await searchParams;
  const { regions, groups, activeRegion } = await getDestinationIndex({ region: firstParam(region) });
  const visible = groups.filter((group) => group.destinations.length > 0);

  return (
    <>
      <div className="bg-card py-4">
        <Container className="px-6">
          <FilterChips chips={destinationIndexChips(regions, activeRegion)} label={DESTINATION_INDEX_CONTENT.filterLabel} tone="compact" />
        </Container>
      </div>
      <div className="bg-surface">
        <Container className="flex flex-col gap-14 px-6 pb-14 pt-14">
          {visible.length > 0 ? (
            visible.map((group) => <DestinationGroup key={group.region.slug} id={`region-${group.region.slug}`} title={group.region.name} destinations={group.destinations} />)
          ) : (
            <ListingEmptyState {...LISTING_CONTENT.empty} />
          )}
        </Container>
      </div>
    </>
  );
}
