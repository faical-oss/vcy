import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HotelCard } from "@/components/cards/hotel-card";
import { BookingBox } from "@/components/sections/hotel/booking-box";
import { BookingAvailabilityPrice } from "@/components/sections/hotel/availability-price";
import { BookingForm } from "@/components/sections/hotel/booking-form";
import { RoomsPanel } from "@/components/sections/hotel/rooms-panel";
import { AvailabilityController } from "@/features/availability/availability-controller";
import { HotelHeader } from "@/components/sections/hotel/hotel-header";
import { HotelLocation } from "@/components/sections/hotel/hotel-location";
import { HotelOverview } from "@/components/sections/hotel/hotel-overview";
import { HotelReviewsPanel } from "@/components/sections/hotel/hotel-reviews";
import { ReviewForm } from "@/components/sections/hotel/review-form";
import { DetailActions } from "@/components/sections/detail/detail-actions";
import { DetailGallery } from "@/components/sections/detail/detail-gallery";
import { DetailShell } from "@/components/sections/detail/detail-shell";
import { DetailTabs } from "@/components/sections/detail/detail-tabs";
import { MobileBookingBar } from "@/components/sections/detail/mobile-booking-bar";
import { JsonLd } from "@/components/seo/json-ld";
import { CardGrid } from "@/components/ui/card-grid";
import { Container } from "@/components/ui/container";
import { hotelCategory, hotelDetail } from "@/constants/routes";
import { SITE_NAME } from "@/constants/site";
import { getHotel, getHotelSlugs, getSimilarHotels } from "@/features/catalog/get-catalog";
import { HOTEL_DETAIL_CONTENT, hotelDetailCrumbs, hotelDetailMetadata } from "@/features/catalog/listing-content";
import { loadMoreReviewsAction, submitReviewAction } from "@/features/reviews/actions";
import { lodgingJsonLd } from "@/features/seo/json-ld";
import { PageBreadcrumb } from "@/features/seo/page-breadcrumb";
import { pageSeo } from "@/features/seo/url-policy";
import { getSiteUrl } from "@/lib/env";
import { areMoreReviewsEnabled, isCheckoutStubEnabled, isReviewFormEnabled } from "@/lib/flags";

export async function generateStaticParams() {
  return (await getHotelSlugs()).map((slug) => ({ slug }));
}

/** Never reads `searchParams` (stay dates): metadata stays static and dated URLs canonicalise to the clean URL. */
export async function generateMetadata({ params }: PageProps<"/hotels/h/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const hotel = await getHotel(slug);
  if (!hotel) notFound();

  const { title, description } = hotelDetailMetadata(hotel);
  const path = hotelDetail(hotel.slug);
  return {
    title,
    description,
    ...pageSeo({ type: "detail", path }),
    openGraph: { type: "website", siteName: SITE_NAME, title: `${title} | ${SITE_NAME}`, description, url: path, images: hotel.images[0] ? [hotel.images[0].src] : undefined },
  };
}

/**
 * The hotel's static content (name, photos, rooms, location, reviews) is cached and prerendered. The unknown-slug check
 * runs first, before anything streams, so an unknown hotel is a real 404. `searchParams` (dates and guests) are never
 * awaited here: they are read only inside the <Suspense> blocks (live price, room prices, booking form), so the page shell
 * stays static and the live price streams in.
 */
export default async function HotelDetailPage({ params }: PageProps<"/hotels/h/[slug]">) {
  const { slug } = await params;
  const hotel = await getHotel(slug);
  if (!hotel) notFound();
  const similar = await getSimilarHotels(slug, 3);

  const crumbs = hotelDetailCrumbs(hotel);
  const siteUrl = getSiteUrl();
  const firstImage = hotel.images[0];
  const checkoutEnabled = isCheckoutStubEnabled();
  // Hotels: rooms are chosen on the page (a Select button on each priced room), so the booking card needs what each room holds.
  const selectableRooms = hotel.rooms.map(({ id, name, maxAdults, maxOccupancy }) => ({ id, name, maxAdults, maxOccupancy }));
  const reviewForm = isReviewFormEnabled() ? <ReviewForm hotelSlug={hotel.slug} action={submitReviewAction} /> : undefined;

  /** The booking box. It is used twice (sticky aside from `lg`, sheet below it), so its id is a parameter. Prices stay hidden until dates are chosen. */
  const booking = (id: string) => (
    <BookingBox
      id={id}
      price={<BookingAvailabilityPrice selectable={selectableRooms} />}
      form={<BookingForm rooms={selectableRooms} checkout={{ kind: "hotel", id: hotel.slug, enabled: checkoutEnabled }} />}
      includes={hotel.roomsInclude}
      note={hotel.cancellationNote}
    />
  );

  return (
    <>
      <AvailabilityController product={{ kind: "hotel", id: hotel.slug }} />
      <JsonLd
        data={lodgingJsonLd(
          {
            name: hotel.name,
            path: hotelDetail(hotel.slug),
            image: new URL(firstImage.src, siteUrl).toString(),
            description: hotel.description[0],
            address: { locality: hotel.location.city, country: hotel.location.country },
            price: hotel.priceFrom,
            rating: { value: hotel.reviews.overall, count: hotel.reviews.count },
          },
          siteUrl,
        )}
      />
      <DetailShell
        header={
          <HotelHeader
            hotel={hotel}
            breadcrumb={<PageBreadcrumb crumbs={crumbs} label={HOTEL_DETAIL_CONTENT.breadcrumbLabel} />}
            actions={<DetailActions fallbackHref={hotelCategory(hotel.type.slug)} backLabel={HOTEL_DETAIL_CONTENT.back} favorite={{ kind: "hotel", id: hotel.id }} name={hotel.name} />}
          />
        }
        gallery={<DetailGallery images={hotel.images} groups={hotel.galleryGroups} videoUrl={hotel.videoUrl} title={hotel.name} />}
        tabs={
          <DetailTabs
            label={HOTEL_DETAIL_CONTENT.tabsLabel}
            scrollOnSelect
            tabs={[
              { id: "overview", label: "Overview", content: <HotelOverview hotel={hotel} /> },
              {
                id: "rooms",
                label: "Rooms",
                content: <RoomsPanel rooms={hotel.rooms} hotelName={hotel.name} cancellationNote={hotel.cancellationNote} unit="night" heading="Our rooms" selectable />,
              },
              { id: "location", label: "Location", content: <HotelLocation hotel={hotel} /> },
              { id: "reviews", label: "Reviews", content: <HotelReviewsPanel reviews={hotel.reviews} form={reviewForm} slug={hotel.slug} loadMore={areMoreReviewsEnabled() ? loadMoreReviewsAction : undefined} /> },
            ]}
          />
        }
        aside={booking("booking")}
        mobileBar={
          <MobileBookingBar
            hash="booking"
            label="Book this hotel"
            booking={{ rooms: selectableRooms, checkout: { kind: "hotel", id: hotel.slug, enabled: checkoutEnabled } }}
           
          >
            {booking("booking-sheet")}
          </MobileBookingBar>
        }
        similar={
          similar.length > 0 ? (
            <Container>
              <h2 className="font-display text-title-sm font-medium text-primary">{HOTEL_DETAIL_CONTENT.similar}</h2>
              <CardGrid as="ul" className="mt-6">
                {similar.map((item) => (
                  <li key={item.id} className="flex">
                    <HotelCard {...item} price={undefined} compact className="w-full" />
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
