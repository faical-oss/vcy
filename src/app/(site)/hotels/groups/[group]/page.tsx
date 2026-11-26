import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HotelCard } from "@/components/cards/hotel-card";
import { CardGrid } from "@/components/ui/card-grid";
import { ListingEmptyState } from "@/components/sections/listing/listing-empty-state";
import { ResultsLine } from "@/components/sections/listing/results-line";
import { Container } from "@/components/ui/container";
import { hotelGroup } from "@/constants/routes";
import { SITE_NAME } from "@/constants/site";
import { getHotelGroup, getHotelGroupSlugs } from "@/features/catalog/get-catalog";
import { LISTING_CONTENT, hotelGroupMetadata, groupCrumbs, listingHeroImage } from "@/features/catalog/listing-content";
import { pageSeo } from "@/features/seo/url-policy";
import { ListingPageHero } from "@/features/seo/listing-page-hero";

export async function generateStaticParams() {
  return (await getHotelGroupSlugs()).map((group) => ({ group }));
}

/** Static metadata per group. */
export async function generateMetadata({ params }: PageProps<"/hotels/groups/[group]">): Promise<Metadata> {
  const { group } = await params;
  const listing = await getHotelGroup(group);
  if (!listing) notFound();

  const { title, description } = hotelGroupMetadata(listing);
  const url = hotelGroup(listing.group.slug);
  const image = listingHeroImage(listing.items);
  return {
    title,
    description,
    ...pageSeo({ type: "category", path: url }),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: `${title} | ${SITE_NAME}`,
      description,
      url,
      images: image ? [image] : undefined,
    },
  };
}

/** Fully static per group: no filter pills, just the hero, the result count and every card of the group. */
export default async function HotelGroupPage({ params }: PageProps<"/hotels/groups/[group]">) {
  const { group } = await params;
  const listing = await getHotelGroup(group);
  if (!listing) notFound();

  return (
    <>
      <ListingPageHero
        title={listing.group.title}
        crumbs={groupCrumbs("hotels", listing.group.title)}
        breadcrumbLabel={LISTING_CONTENT.breadcrumbLabel}
        image={listingHeroImage(listing.items)}
      />
      <Container className="px-6 py-10">
        {listing.items.length > 0 ? (
          <>
            <ResultsLine count={listing.total} />
            <CardGrid>
              {listing.items.map((item) => (
                <HotelCard key={item.id} {...item} />
              ))}
            </CardGrid>
          </>
        ) : (
          <ListingEmptyState {...LISTING_CONTENT.empty} />
        )}
      </Container>
    </>
  );
}
