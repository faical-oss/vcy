"use client";

import { StatusPage } from "@/components/sections/status/status-page";
import { Button, ButtonLink } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

/** Last-resort error boundary: same look as the 404 page. The error itself is never shown. */
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main">
      <StatusPage
        label="Something went wrong"
        title="We couldn't load this page"
        message="This is on our side. Try again in a moment, or head back to the home page."
        actions={
          <>
            <Button size="lg" className="uppercase tracking-cta" onClick={() => reset()}>
              Try again
            </Button>
            <ButtonLink href={ROUTES.home} variant="outline" size="lg" className="uppercase tracking-cta">
              Back to home
            </ButtonLink>
          </>
        }
      />
    </main>
  );
}
