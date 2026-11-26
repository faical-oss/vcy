import type { Metadata } from "next";
import { DestinationsSection } from "@/components/sections/home/destinations-section";
import { EditorialBanner } from "@/components/sections/home/editorial-banner";
import { ExperiencesSection } from "@/components/sections/home/experiences-section";
import { Hero } from "@/components/sections/home/hero";
import { HotelsSection } from "@/components/sections/home/hotels-section";
import { MagazineSection } from "@/components/sections/home/magazine-section";
import { NewsletterSection } from "@/components/sections/home/newsletter-section";
import { SearchBar } from "@/components/sections/search/search-bar";
import { PackagesSection } from "@/components/sections/home/packages-section";
import { TestimonialsSection } from "@/components/sections/home/testimonials-section";
import { ROUTES } from "@/constants/routes";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/constants/site";
import { getHomeContent } from "@/features/home/get-home-content";
import { getSearchBoxContent } from "@/features/search/get-search-box-content";
import { pageSeo } from "@/features/seo/url-policy";

export function generateMetadata(): Metadata {
  return {
    title: { absolute: `${SITE_NAME} – ${SITE_TAGLINE}` },
    description: SITE_DESCRIPTION,
    ...pageSeo({ type: "home", path: ROUTES.home }),
  };
}

export default async function HomePage() {
  const [content, searchContent] = await Promise.all([getHomeContent(), getSearchBoxContent()]);

  return (
    <>
      <Hero
        search={<SearchBar content={searchContent} />}
      />
      <ExperiencesSection filters={content.experienceFilters} experiences={content.experiences} />
      <DestinationsSection destinations={content.destinations} />
      <PackagesSection packages={content.packages} />
      <EditorialBanner {...content.editorial} />
      <MagazineSection articles={content.articles} />
      <HotelsSection hotels={content.hotels} />
      <TestimonialsSection testimonials={content.testimonials} moments={content.moments} />
      <NewsletterSection />
    </>
  );
}
