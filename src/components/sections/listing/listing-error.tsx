"use client";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

interface ListingErrorProps {
  reset: () => void;
  title: string;
  description: string;
  retryLabel: string;
}

/** Error boundary body for listing pages: plain language and a retry. The error itself is never shown. */
export function ListingError({ reset, title, description, retryLabel }: ListingErrorProps) {
  return (
    <Container className="py-16">
      <div role="alert" className="rounded-card border border-border bg-card px-6 py-12 text-center">
        <h1 className="font-display text-title-sm font-medium text-primary">{title}</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-body">{description}</p>
        <Button size="lg" className="mt-6 min-h-11 uppercase tracking-cta" onClick={reset}>
          {retryLabel}
        </Button>
      </div>
    </Container>
  );
}
