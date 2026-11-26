import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorialBanner } from "@/components/sections/home/editorial-banner";
import { MagazineSection } from "@/components/sections/home/magazine-section";
import { NewsletterSection } from "@/components/sections/home/newsletter-section";
import { TestimonialsSection } from "@/components/sections/home/testimonials-section";
import { LifestyleDestinations } from "@/components/sections/lifestyle/lifestyle-destinations";
import { LifestyleIntro } from "@/components/sections/lifestyle/lifestyle-intro";
import { LifestylePackages } from "@/components/sections/lifestyle/lifestyle-packages";
import { LifestyleRows } from "@/components/sections/lifestyle/lifestyle-rows";
import { LINK_CAPS } from "@/components/sections/lifestyle/link-caps";
import { LifestyleSubNav } from "@/components/sections/lifestyle/lifestyle-sub-nav";
import { ButtonLink } from "@/components/ui/button";
import { EXTERNAL_URLS, lifestyleVacation } from "@/constants/routes";
import { SITE_NAME } from "@/constants/site";
import { getHomeContent } from "@/features/home/get-home-content";
import { getLifestylePage, getLifestyleSlugs } from "@/features/lifestyle/get-lifestyle-page";
import { LIFESTYLE_CONTENT, lifestyleCrumbs } from "@/features/lifestyle/lifestyle-content";
import { ListingPageHero } from "@/features/seo/listing-page-hero";
import { pageSeo } from "@/features/seo/url-policy";

export function generateStaticParams() {
  return getLifestyleSlugs().map((slug) => ({ slug }));
}

/** Never reads `searchParams`: the page has no filter URLs, so one clean canonical per page. */
export async function generateMetadata({ params }: PageProps<"/lifestyle/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await getLifestylePage(slug);
  if (!page) notFound();

  const url = lifestyleVacation(page.slug);
  const { title, description } = page.seo;
  return {
    title,
    description,
    ...pageSeo({ type: "category", path: url }),
    openGraph: { type: "website", siteName: SITE_NAME, title: `${title} | ${SITE_NAME}`, description, url, images: [page.hero.image.src] },
  };
}

export default async function LifestylePage({ params }: PageProps<"/lifestyle/[slug]">) {
  const { slug } = await params;
  const page = await getLifestylePage(slug);
  if (!page) notFound();
  const home = await getHomeContent();
  const { hero, subNav, intro, rows, packages, quote, magazine, destinations } = page;
  const ids = { why: "why", find: "find", packages: "packages" } as const;

  return (
    <>
      <ListingPageHero
        size="feature"
        title={hero.h1}
        crumbs={lifestyleCrumbs(page)}
        breadcrumbLabel={LIFESTYLE_CONTENT.breadcrumbLabel}
        eyebrow={hero.eyebrow}
        subtitle={hero.sub}
        ornament
        image={hero.image.src}
        imageAlt={hero.image.alt}
        actions={
          <>
            <ButtonLink href={`#${ids.packages}`} size="lg" className="uppercase tracking-cta">
              {hero.primaryCta} <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
            <ButtonLink href={`#${ids.why}`} variant="outline" size="lg" className="border-white/70 bg-transparent uppercase tracking-cta text-white hover:bg-white/10">
              {hero.secondaryCta}
            </ButtonLink>
          </>
        }
      />
      <LifestyleSubNav label={LIFESTYLE_CONTENT.subNavLabel} items={subNav.map((label, index) => ({ label, id: [ids.why, ids.find, ids.packages][index] }))} />
      <LifestyleIntro id={ids.why} {...intro} />
      <LifestyleRows id={ids.find} {...rows} />
      <LifestylePackages id={ids.packages} eyebrow={packages.eyebrow} title={packages.title} sub={packages.sub} filters={packages.filters} items={packages.items} viewAllLabel={packages.viewAllLabel} viewAllHref={packages.viewAllHref} />
      <EditorialBanner {...quote} />
      <MagazineSection
        articles={[magazine.featured, ...magazine.items]}
        heading={{ tag: magazine.eyebrow, title: LIFESTYLE_CONTENT.magazineTitle, description: magazine.sub }}
        visitLink={{ href: EXTERNAL_URLS.magazine, external: true, className: LINK_CAPS }}
      />
      <LifestyleDestinations id="destinations" {...destinations} />
      <TestimonialsSection testimonials={home.testimonials} moments={home.moments} />
      <NewsletterSection />
    </>
  );
}
