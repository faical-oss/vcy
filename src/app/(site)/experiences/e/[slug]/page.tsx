import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExperienceCard } from "@/components/cards/experience-card";
import { ExperienceAccommodation } from "@/components/sections/experience/experience-accommodation";
import { ExperienceHeader } from "@/components/sections/experience/experience-header";
import { ExperienceOverview } from "@/components/sections/experience/experience-overview";
import { ItineraryTab } from "@/components/sections/experience/itinerary-tab";
import { DetailActions } from "@/components/sections/detail/detail-actions";
import { DetailGallery } from "@/components/sections/detail/detail-gallery";
import { DetailShell } from "@/components/sections/detail/detail-shell";
import { DetailTabs } from "@/components/sections/detail/detail-tabs";
import { MobileBookingBar } from "@/components/sections/detail/mobile-booking-bar";
import { BookingBox } from "@/components/sections/hotel/booking-box";
import { BookingAvailabilityPrice } from "@/components/sections/hotel/availability-price";
import { BookingForm } from "@/components/sections/hotel/booking-form";
import { RoomsPanel } from "@/components/sections/hotel/rooms-panel";
import { AvailabilityController } from "@/features/availability/availability-controller";
import { HotelReviewsPanel } from "@/components/sections/hotel/hotel-reviews";
import { ReviewForm } from "@/components/sections/hotel/review-form";
import { JsonLd } from "@/components/seo/json-ld";
import { CardGrid } from "@/components/ui/card-grid";
import { Container } from "@/components/ui/container";
import { experienceCategory, experienceDetail } from "@/constants/routes";
import { SITE_NAME } from "@/constants/site";
import { getExperience, getExperienceSlugs, getSimilarExperiences } from "@/features/catalog/get-catalog";
import { EXPERIENCE_DETAIL_CONTENT, experienceDetailCrumbs, experienceDetailMetadata } from "@/features/catalog/listing-content";
import { productJsonLd } from "@/features/seo/json-ld";
import { PageBreadcrumb } from "@/features/seo/page-breadcrumb";
import { pageSeo } from "@/features/seo/url-policy";
import { loadMoreReviewsAction, submitReviewAction } from "@/features/reviews/actions";
import { getSiteUrl } from "@/lib/env";
import { areMoreReviewsEnabled, isCheckoutStubEnabled, isReviewFormEnabled } from "@/lib/flags";

export async function generateStaticParams() {
  return (await getExperienceSlugs()).map((slug) => ({ slug }));
}

/** Never reads `searchParams` (departure dates): metadata stays static, and dated URLs canonicalise to the clean URL. */
export async function generateMetadata({ params }: PageProps<"/experiences/e/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const experience = await getExperience(slug);
  if (!experience) notFound();

  const { title, description } = experienceDetailMetadata(experience);
  const path = experienceDetail(experience.slug);
  return {
    title,
    description,
    ...pageSeo({ type: "detail", path }),
    openGraph: { type: "website", siteName: SITE_NAME, title: `${title} | ${SITE_NAME}`, description, url: path, images: experience.images[0] ? [experience.images[0].src] : undefined },
  };
}

/**
 * The experience's static content is cached and prerendered. The unknown-slug check runs first, before anything streams, so
 * an unknown experience is a real 404. `searchParams` (dates and travellers) are never awaited here: they are read only inside
 * <Suspense> blocks (live price, room prices, booking form), so the page shell stays static. Every tab panel is rendered in
 * the HTML (Overview, Itinerary, Hotel & Rooms, Reviews); the hash only decides which one is visible on the client.
 */
export default async function ExperienceDetailPage({ params }: PageProps<"/experiences/e/[slug]">) {
  const { slug } = await params;
  const experience = await getExperience(slug);
  if (!experience) notFound();
  const similar = await getSimilarExperiences(slug, 3);

  const crumbs = experienceDetailCrumbs(experience);
  const siteUrl = getSiteUrl();
  const firstImage = experience.images[0];
  const checkoutEnabled = isCheckoutStubEnabled();
  const reviewForm = isReviewFormEnabled() ? <ReviewForm hotelSlug={experience.slug} action={submitReviewAction} /> : undefined;

  /** The booking card. It is used twice (sticky aside from `lg`, sheet below it), so its id is a parameter. Prices stay hidden until dates are chosen. */
  const booking = (id: string) => (
    <BookingBox
      id={id}
      label="Book this experience"
      includesTitle="Included in all rooms"
      price={<BookingAvailabilityPrice />}
      form={<BookingForm product={{ duration: experience.duration, noun: "experience", group: experience.groupSize }} checkout={{ kind: "experience", id: experience.slug, enabled: checkoutEnabled }} />}
      includes={experience.includedInAll}
      note={`Free cancellation up to ${experience.freeCancellationDays} days before departure`}
    />
  );

  return (
    <>
      <AvailabilityController product={{ kind: "experience", id: experience.slug, duration: experience.duration, group: experience.groupSize }} />
      <JsonLd
        data={productJsonLd(
          {
            name: experience.title,
            path: experienceDetail(experience.slug),
            image: new URL(firstImage.src, siteUrl).toString(),
            rating: { value: experience.reviews.overall, count: experience.reviews.count },
          },
          siteUrl,
        )}
      />
      <DetailShell
        header={
          <ExperienceHeader
            experience={experience}
            breadcrumb={<PageBreadcrumb crumbs={crumbs} label={EXPERIENCE_DETAIL_CONTENT.breadcrumbLabel} />}
            actions={<DetailActions fallbackHref={experienceCategory(experience.category.slug)} backLabel={EXPERIENCE_DETAIL_CONTENT.back} favorite={{ kind: "experience", id: experience.id }} name={experience.title} />}
          />
        }
        gallery={<DetailGallery images={experience.images} groups={experience.galleryGroups} videoUrl={experience.videoUrl} title={experience.title} />}
        tabs={
          <DetailTabs
            label={EXPERIENCE_DETAIL_CONTENT.tabsLabel}
            scrollOnSelect
            tabs={[
              { id: "overview", label: "Overview", content: <ExperienceOverview experience={experience} /> },
              { id: "itinerary", label: "Itinerary", content: <ItineraryTab days={experience.itinerary} /> },
              {
                id: "rooms",
                label: "Hotel & Rooms",
                content: (
                  <div className="space-y-10">
                    <ExperienceAccommodation hotel={experience.hotel} />
                    <RoomsPanel rooms={experience.rooms} hotelName={experience.hotel.name} cancellationNote={`Free cancellation up to ${experience.freeCancellationDays} days before departure`} unit="person" heading="Room options" />
                  </div>
                ),
              },
              { id: "reviews", label: "Reviews", content: <HotelReviewsPanel reviews={experience.reviews} form={reviewForm} slug={experience.slug} loadMore={areMoreReviewsEnabled() ? loadMoreReviewsAction : undefined} avatar="square" /> },
            ]}
          />
        }
        aside={booking("booking")}
        mobileBar={
          <MobileBookingBar
            hash="booking"
            label="Book this experience"
            booking={{ product: { duration: experience.duration, noun: "experience", group: experience.groupSize }, checkout: { kind: "experience", id: experience.slug, enabled: checkoutEnabled } }}
           
          >
            {booking("booking-sheet")}
          </MobileBookingBar>
        }
        similar={
          similar.length > 0 ? (
            <Container>
              <h2 className="font-display text-title-sm font-medium text-primary">{EXPERIENCE_DETAIL_CONTENT.similar}</h2>
              <CardGrid as="ul" className="mt-6">
                {similar.map((item) => (
                  <li key={item.id} className="flex">
                    <ExperienceCard {...item} price={undefined} compact className="w-full" />
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
