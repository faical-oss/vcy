import type { ComponentProps } from "react";
import { JsonLd } from "@/components/seo/json-ld";
import { ListingHero } from "@/components/sections/listing/listing-hero";
import { getSiteUrl } from "@/lib/env";
import { breadcrumbListJsonLd } from "./json-ld";

/**
 * The hero of every listing page: the visible breadcrumb and its BreadcrumbList JSON-LD, both built from the same
 * `crumbs` prop, so the markup can never differ from what the visitor sees. Pages use this instead of `ListingHero`
 * (src/app/page-seo-contract.test.ts fails for a page that imports `ListingHero` directly).
 */
export function ListingPageHero(props: ComponentProps<typeof ListingHero>) {
  return (
    <>
      <JsonLd data={breadcrumbListJsonLd(props.crumbs, getSiteUrl())} />
      <ListingHero {...props} />
    </>
  );
}
