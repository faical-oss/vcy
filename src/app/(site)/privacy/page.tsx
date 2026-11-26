import type { Metadata } from "next";
import { LegalDocument } from "@/components/sections/legal/legal-document";
import { PRIVACY_POLICY } from "@/features/privacy/content";
import { pageSeo } from "@/features/seo/url-policy";
import { ROUTES } from "@/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Privacy Policy",
    description:
      "How Vacayou collects, uses, shares and protects your personal data, and the rights you have over it.",
    ...pageSeo({ type: "static", path: ROUTES.privacy }),
  };
}

export default function PrivacyRoute() {
  return <LegalDocument document={PRIVACY_POLICY} />;
}
