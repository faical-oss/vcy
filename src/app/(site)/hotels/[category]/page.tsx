import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HotelCard } from "@/components/cards/hotel-card";
import { CardGrid } from "@/components/ui/card-grid";
import { ListingEmptyState } from "@/components/sections/listing/listing-empty-state";
import { ResultsLine } from "@/components/sections/listing/results-line";
import { Container } from "@/components/ui/container";
import { hotelCategory } from "@/constants/routes";
import { SITE_NAME } from "@/constants/site";
import { getHotelCategorySlugs, getHotelsByCategory } from "@/features/catalog/get-catalog";
import {
  LISTING_CONTENT,
  hotelCategoryCrumbs,
  hotelCategoryMetadata,
  listingHeroImage,
} from "@/features/catalog/listing-content";
import { pageSeo } from "@/features/seo/url-policy";
import { ListingPageHero } from "@/features/seo/listing-page-hero";

export async function generateStaticParams() {
  return (await getHotelCategorySlugs()).map((category) => ({ category }));
}

export async function generateMetadata({ params }: PageProps<"/hotels/[category]">): Promise<Metadata> {
  const { category } = await params;
  const listing = await getHotelsByCategory(category);
  if (!listing) notFound();

  const { title, description } = hotelCategoryMetadata(listing);
  const image = listingHeroImage(listing.items);
  return {
    title,
    description,
    ...pageSeo({ type: "category", path: hotelCategory(listing.category.slug) }),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: `${title} | ${SITE_NAME}`,
      description,
      url: hotelCategory(listing.category.slug),
      images: image ? [image] : undefined,
    },
  };
}

export default async function HotelCategoryPage({ params }: PageProps<"/hotels/[category]">) {
  const { category } = await params;
  const listing = await getHotelsByCategory(category);
  if (!listing) notFound();

  return (
    <>
      <ListingPageHero
        title={listing.category.label}
        crumbs={hotelCategoryCrumbs(listing.category.label)}
        breadcrumbLabel={LISTING_CONTENT.breadcrumbLabel}
        image={listingHeroImage(listing.items)}
      />
      <Container className="py-10">
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
