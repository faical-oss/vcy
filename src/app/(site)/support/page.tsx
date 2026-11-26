import type { Metadata } from "next";
import { SupportPage } from "@/components/sections/support/support-page";
import { SUPPORT_CONTENT } from "@/features/support/content";
import { pageSeo } from "@/features/seo/url-policy";
import { ROUTES } from "@/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Support",
    description:
      "Get help planning a trip, managing an existing booking or asking anything else. Send a message to the Vacayou team.",
    ...pageSeo({ type: "static", path: ROUTES.support }),
  };
}

export default function SupportRoute() {
  return <SupportPage content={SUPPORT_CONTENT} />;
}
