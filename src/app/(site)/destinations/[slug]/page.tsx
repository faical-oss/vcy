import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ExperienceCard } from "@/components/cards/experience-card";
import { CardGrid } from "@/components/ui/card-grid";
import { DestinationStats } from "@/components/sections/listing/destination-stats";
import { FilterChips } from "@/components/sections/listing/filter-chips";
import { ListingEmptyState } from "@/components/sections/listing/listing-empty-state";
import { RegionOffers } from "@/components/sections/listing/region-offers";
import { ResultsSkeleton } from "@/components/sections/listing/listing-skeleton";
import { RegionBody } from "@/components/sections/listing/region-body";
import { ResultsLine } from "@/components/sections/listing/results-line";
import { Container } from "@/components/ui/container";
import { destination, destinationRegion } from "@/constants/routes";
import { SITE_NAME } from "@/constants/site";
import { getDestination, getDestinationFilterCategories, getDestinationPageSlugs, getRegion } from "@/features/catalog/get-catalog";
import {
  DESTINATION_CONTENT,
  LISTING_CONTENT,
  destinationCrumbs,
  destinationFilterChips,
  destinationMetadata,
  destinationStats,
  regionCrumbs,
  regionMetadata,
  regionPageCopy,
  regionStats,
  regionSubtitle,
} from "@/features/catalog/listing-content";
import { firstParam } from "@/features/catalog/schemas";
import type { DestinationListing, RegionListing } from "@/interfaces";
import { pageSeo } from "@/features/seo/url-policy";
import { ListingPageHero } from "@/features/seo/listing-page-hero";

type Place = { kind: "destination"; listing: DestinationListing } | { kind: "region"; listing: RegionListing };

/** `/destinations/<slug>` is a destination (a country or island) or a region (Asia, Europe...). Destination slugs win; the sets are disjoint. */
async function resolvePlace(slug: string): Promise<Place | null> {
  const listing = await getDestination(slug);
  if (listing) return { kind: "destination", listing };
  const region = await getRegion(slug);
  return region ? { kind: "region", listing: region } : null;
}

export async function generateStaticParams() {
  return (await getDestinationPageSlugs()).map((slug) => ({ slug }));
}

/** Never reads `searchParams`: metadata stays static, and filtered URLs canonicalise to the unfiltered page. */
export async function generateMetadata({ params }: PageProps<"/destinations/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const place = await resolvePlace(slug);
  if (!place) notFound();

  const { slug: placeSlug, heroImage } = place.kind === "region" ? place.listing.region : place.listing.destination;
  const { title, description } = place.kind === "region" ? regionMetadata(place.listing.region) : destinationMetadata(place.listing.destination);
  const url = place.kind === "region" ? destinationRegion(placeSlug) : destination(placeSlug);
  return {
    title,
    description,
    ...pageSeo({ type: "destination", path: url }),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: `${title} | ${SITE_NAME}`,
      description,
      url,
      images: [heroImage],
    },
  };
}

/**
 * The shell (hero, facts, intro, heading) depends only on `params`, so it is prerendered per slug. `searchParams` is
 * request-time data: it is only read inside the Suspense boundary of a destination page, so just the chips' active state
 * and the filtered results stream in behind a skeleton. A region page has no filters and never reads it.
 */
export default async function DestinationPage({ params, searchParams }: PageProps<"/destinations/[slug]">) {
  const { slug } = await params;
  const resolved = await resolvePlace(slug);
  if (!resolved) notFound();
  if (resolved.kind === "region") return <RegionPage listing={resolved.listing} />;

  const { listing } = resolved;
  const { destination: place } = listing;
  const categories = await getDestinationFilterCategories();

  return (
    <>
      <ListingPageHero
        size="tall"
        title={place.name}
        subtitle={place.subtitle}
        crumbs={destinationCrumbs(place.name)}
        breadcrumbLabel={LISTING_CONTENT.breadcrumbLabel}
        image={place.heroImage}
      />
      <Container className="px-6">
        <DestinationStats stats={destinationStats(place)} />
        <p className="max-w-[720px] pt-8 text-sm leading-relaxed text-body">{place.intro}</p>
        <section className="pb-14 pt-8">
          <h2 className="mb-6 font-display text-title-sm font-medium leading-8 text-primary">{DESTINATION_CONTENT.sectionHeading(place.name)}</h2>
          <Suspense
            fallback={
              <div role="status" aria-busy="true" aria-label={LISTING_CONTENT.loadingLabel}>
                <div className="mb-8">
                  <FilterChips chips={destinationFilterChips(slug, categories, null).map((chip) => ({ ...chip, active: false }))} label={DESTINATION_CONTENT.filterLabel} />
                </div>
                <ResultsSkeleton />
              </div>
            }
          >
            <DestinationResults slug={slug} categories={categories} searchParams={searchParams} />
          </Suspense>
        </section>
      </Container>
      <RegionOffers packages={listing.packages} hotels={listing.hotels} copy={regionPageCopy(place.name)} />
    </>
  );
}

function RegionPage({ listing }: { listing: RegionListing }) {
  const { region, destinations, packages, hotels } = listing;
  return (
    <>
      <ListingPageHero
        size="tall"
        title={region.name}
        subtitle={regionSubtitle(region)}
        crumbs={regionCrumbs(region.name)}
        breadcrumbLabel={LISTING_CONTENT.breadcrumbLabel}
        ornament
        image={region.heroImage}
      />
      <RegionBody
        stats={regionStats(region)}
        intro={region.intro}
        destinations={destinations}
        packages={packages}
        hotels={hotels}
        copy={regionPageCopy(region.name)}
      />
    </>
  );
}

async function DestinationResults({
  slug,
  categories,
  searchParams,
}: Pick<PageProps<"/destinations/[slug]">, "searchParams"> & { slug: string; categories: { slug: string; label: string }[] }) {
  const { category } = await searchParams;
  const listing = await getDestination(slug, { category: firstParam(category) });

  return (
    <>
      <div className="mb-8">
        <FilterChips chips={destinationFilterChips(slug, categories, listing?.category ?? null)} label={DESTINATION_CONTENT.filterLabel} />
      </div>
      {listing && listing.items.length > 0 ? (
        <>
          <ResultsLine count={listing.total} />
          <CardGrid>
            {listing.items.map((item) => (
              <ExperienceCard key={item.id} {...item} />
            ))}
          </CardGrid>
        </>
      ) : (
        <ListingEmptyState {...LISTING_CONTENT.empty} />
      )}
    </>
  );
}
