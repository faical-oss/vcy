import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PackageCard } from "@/components/cards/package-card";
import { DetailActions } from "@/components/sections/detail/detail-actions";
import { DetailGallery } from "@/components/sections/detail/detail-gallery";
import { DetailShell } from "@/components/sections/detail/detail-shell";
import { DetailTabs } from "@/components/sections/detail/detail-tabs";
import { MobileBookingBar } from "@/components/sections/detail/mobile-booking-bar";
import { ExperienceAccommodation } from "@/components/sections/experience/experience-accommodation";
import { ExperienceHeader } from "@/components/sections/experience/experience-header";
import { ExperienceOverview } from "@/components/sections/experience/experience-overview";
import { ItineraryTab } from "@/components/sections/experience/itinerary-tab";
import { BookingAvailabilityPrice } from "@/components/sections/hotel/availability-price";
import { BookingBox } from "@/components/sections/hotel/booking-box";
import { BookingForm } from "@/components/sections/hotel/booking-form";
import { HotelReviewsPanel } from "@/components/sections/hotel/hotel-reviews";
import { ReviewForm } from "@/components/sections/hotel/review-form";
import { RoomsPanel } from "@/components/sections/hotel/rooms-panel";
import { PackageStays } from "@/components/sections/package/package-stays";
import { JsonLd } from "@/components/seo/json-ld";
import { CardGrid } from "@/components/ui/card-grid";
import { Container } from "@/components/ui/container";
import { ROUTES, packageDetail } from "@/constants/routes";
import { SITE_NAME } from "@/constants/site";
import { AvailabilityController } from "@/features/availability/availability-controller";
import { getHotel } from "@/features/catalog/get-catalog";
import { getPackage, getPackageSlugs, getSimilarPackages } from "@/features/packages/get-package";
import { PACKAGE_DETAIL_CONTENT, packageDetailCrumbs, packageDetailMetadata } from "@/features/packages/package-content";
import { productJsonLd } from "@/features/seo/json-ld";
import { PageBreadcrumb } from "@/features/seo/page-breadcrumb";
import { pageSeo } from "@/features/seo/url-policy";
import { loadMoreReviewsAction, submitReviewAction } from "@/features/reviews/actions";
import { getSiteUrl } from "@/lib/env";
import { areMoreReviewsEnabled, isCheckoutStubEnabled, isReviewFormEnabled } from "@/lib/flags";

export function generateStaticParams() {
  return getPackageSlugs().map((slug) => ({ slug }));
}

/** Never reads `searchParams` (dates): metadata stays static, and dated URLs canonicalise to the clean URL. */
export async function generateMetadata({ params }: PageProps<"/packages/p/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await getPackage(slug);
  if (!pkg) notFound();

  const { title, description } = packageDetailMetadata(pkg);
  const path = packageDetail(pkg.id);
  return {
    title,
    description,
    ...pageSeo({ type: "detail", path }),
    openGraph: { type: "website", siteName: SITE_NAME, title: `${title} | ${SITE_NAME}`, description, url: path, images: pkg.images[0] ? [pkg.images[0].src] : undefined },
  };
}

/**
 * Built like the experience page: the static content is cached and prerendered, the unknown-slug check runs first (a real 404
 * on the first request), and `searchParams` (dates and travellers) are never awaited here: the live price and availability are
 * fetched in the browser once dates are chosen. Every tab is in the HTML. The Accommodation tab shows the one property like the
 * experience page does, or one card and one room list per property for a package of several.
 */
export default async function PackageDetailPage({ params }: PageProps<"/packages/p/[slug]">) {
  const { slug } = await params;
  const pkg = await getPackage(slug);
  if (!pkg) notFound();
  const similar = await getSimilarPackages(slug, 3);

  const crumbs = packageDetailCrumbs(pkg);
  const siteUrl = getSiteUrl();
  const firstImage = pkg.images[0];
  const checkoutEnabled = isCheckoutStubEnabled();
  const reviewForm = isReviewFormEnabled() ? <ReviewForm hotelSlug={pkg.slug} action={submitReviewAction} /> : undefined;
  const { stays } = pkg;
  const several = stays.length > 1;
  const allRooms = stays.flatMap((stay) => stay.rooms);
  // A stay links to its hotel page only when that page exists.
  const hotelSlugs = new Set((await Promise.all(stays.map(async (stay) => (stay.hotelSlug && (await getHotel(stay.hotelSlug)) ? stay.hotelSlug : null)))).filter((value): value is string => value !== null));
  const cancellation = `Free cancellation up to ${pkg.freeCancellationDays} days before departure`;
  // The experience components take the first property as "the hotel" (the map and the header).
  const experienceLike = { ...pkg, hotel: stays[0].hotel, rooms: allRooms };
  const product = { duration: pkg.duration, noun: PACKAGE_DETAIL_CONTENT.noun, group: pkg.groupSize };

  /** The booking card. It is used twice (sticky aside from `lg`, sheet below it), so its id is a parameter. Prices stay hidden until dates are chosen. */
  const booking = (id: string) => (
    <BookingBox
      id={id}
      label={PACKAGE_DETAIL_CONTENT.bookLabel}
      includesTitle={PACKAGE_DETAIL_CONTENT.includesTitle}
      price={<BookingAvailabilityPrice />}
      form={<BookingForm product={product} checkout={{ kind: "package", id: pkg.slug, enabled: checkoutEnabled }} />}
      includes={pkg.includedInAll}
      note={cancellation}
    />
  );

  return (
    <>
      <AvailabilityController product={{ kind: "package", id: pkg.slug, duration: pkg.duration, group: pkg.groupSize }} />
      <JsonLd data={productJsonLd({ name: pkg.title, path: packageDetail(pkg.slug), image: new URL(firstImage.src, siteUrl).toString() }, siteUrl)} />
      <DetailShell
        header={
          <ExperienceHeader
            experience={experienceLike}
            breadcrumb={<PageBreadcrumb crumbs={crumbs} label={PACKAGE_DETAIL_CONTENT.breadcrumbLabel} />}
            actions={<DetailActions fallbackHref={ROUTES.home} backLabel={PACKAGE_DETAIL_CONTENT.back} favorite={{ kind: "package", id: pkg.id }} name={pkg.title} />}
          />
        }
        gallery={<DetailGallery images={pkg.images} groups={pkg.galleryGroups} videoUrl={pkg.videoUrl} title={pkg.title} />}
        tabs={
          <DetailTabs
            label={PACKAGE_DETAIL_CONTENT.tabsLabel}
            scrollOnSelect
            tabs={[
              { id: "overview", label: "Overview", content: <ExperienceOverview experience={experienceLike} noun={PACKAGE_DETAIL_CONTENT.noun} /> },
              { id: "itinerary", label: "Itinerary", content: <ItineraryTab days={pkg.itinerary} /> },
              {
                id: "rooms",
                label: PACKAGE_DETAIL_CONTENT.accommodationTab,
                content: (
                  <div className="space-y-10">
                    {several ? <PackageStays stays={stays} heading={PACKAGE_DETAIL_CONTENT.accommodationHeading} hotelSlugs={hotelSlugs} /> : <ExperienceAccommodation hotel={stays[0].hotel} />}
                    <RoomsPanel
                      rooms={allRooms}
                      hotelName={stays[0].hotel.name}
                      cancellationNote={cancellation}
                      unit="person"
                      heading={PACKAGE_DETAIL_CONTENT.roomsHeading}
                      stays={several ? stays.map((stay) => ({ id: stay.id, heading: stay.hotel.name, hotelName: stay.hotel.name, rooms: stay.rooms })) : undefined}
                    />
                  </div>
                ),
              },
              { id: "reviews", label: "Reviews", content: <HotelReviewsPanel reviews={pkg.reviews} form={reviewForm} slug={pkg.slug} loadMore={areMoreReviewsEnabled() ? loadMoreReviewsAction : undefined} avatar="square" /> },
            ]}
          />
        }
        aside={booking("booking")}
        mobileBar={
          <MobileBookingBar hash="booking" label={PACKAGE_DETAIL_CONTENT.bookLabel} booking={{ product, checkout: { kind: "package", id: pkg.slug, enabled: checkoutEnabled } }}>
            {booking("booking-sheet")}
          </MobileBookingBar>
        }
        similar={
          similar.length > 0 ? (
            <Container>
              <h2 className="font-display text-title-sm font-medium text-primary">{PACKAGE_DETAIL_CONTENT.similar}</h2>
              <CardGrid as="ul" className="mt-6">
                {similar.map((item) => (
                  <li key={item.id} className="flex">
                    <PackageCard {...item} compact className="w-full" />
                  </li>
                ))}
              </CardGrid>
            </Container>
          ) : undefined
        }
      />
    </>
  );
}
