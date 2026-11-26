import type { Metadata } from "next";
import { LegalDocument } from "@/components/sections/legal/legal-document";
import { TERMS_OF_USE } from "@/features/terms/content";
import { pageSeo } from "@/features/seo/url-policy";
import { ROUTES } from "@/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Terms of Use",
    description: "The terms that apply when you use Vacayou: bookings, cancellations, liability and governing law.",
    ...pageSeo({ type: "static", path: ROUTES.terms }),
  };
}

export default function TermsRoute() {
  return <LegalDocument document={TERMS_OF_USE} />;
}
