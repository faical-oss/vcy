"use client";

import { Button } from "@/components/ui/button";

/** Error boundary body for account views: plain language and a retry. The error itself is never shown or logged here. */
export function AccountError({ reset }: { reset: () => void }) {
  return (
    <div role="alert" className="rounded-card border border-border bg-card px-6 py-12 text-center">
      <h1 className="font-display text-title-sm font-medium text-primary">We couldn&apos;t load this page</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-body">
        Something went wrong on our side, and your details are safe. Try again in a moment.
      </p>
      <Button size="lg" className="mt-6 min-h-11 uppercase tracking-cta" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
