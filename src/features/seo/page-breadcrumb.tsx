import { DetailBreadcrumb } from "@/components/sections/detail/detail-breadcrumb";
import { JsonLd } from "@/components/seo/json-ld";
import type { BreadcrumbItem } from "@/interfaces";
import { getSiteUrl } from "@/lib/env";
import { breadcrumbListJsonLd } from "./json-ld";

/**
 * The visible breadcrumb of a detail page (white background) and its BreadcrumbList JSON-LD, both built from the same
 * `crumbs`, like `ListingPageHero` does for photo heroes.
 */
export function PageBreadcrumb({ crumbs, label }: { crumbs: BreadcrumbItem[]; label: string }) {
  return (
    <>
      <JsonLd data={breadcrumbListJsonLd(crumbs, getSiteUrl())} />
      <DetailBreadcrumb crumbs={crumbs} label={label} />
    </>
  );
}
