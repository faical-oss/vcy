import Link from "next/link";
import { SectionTag } from "@/components/ui/section-tag";
import { ROUTES } from "@/constants/routes";
import { NewsletterForm } from "./newsletter-form";

export function NewsletterSection() {
  return (
    <section aria-labelledby="newsletter-title" className="flex justify-center bg-surface px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex w-full max-w-site flex-col items-stretch gap-8 rounded-input bg-surface-blue p-6 sm:p-8 md:p-12 xl:flex-row xl:items-center">
        <div className="flex-1">
          <SectionTag>Stay inspired</SectionTag>
          <h2 id="newsletter-title" className="mb-2 mt-2 font-display text-title font-medium text-primary">
            Get the Vacayou Newsletter
          </h2>
          <p className="max-w-sm text-base text-primary">
            Curated travel inspiration, exclusive offers and expert wellness travel advice — direct to your inbox.
          </p>
        </div>
        <div className="w-full flex-1">
          <NewsletterForm />
          <p className="mt-2 text-xs text-primary">
            No spam. Unsubscribe at any time. By subscribing you agree to our{" "}
            <Link href={ROUTES.privacy} className="underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
