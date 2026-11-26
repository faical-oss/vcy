"use client";

import { ListingError } from "@/components/sections/listing/listing-error";
import { LISTING_CONTENT } from "@/features/catalog/listing-content";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { title, description, retry } = LISTING_CONTENT.error;
  return <ListingError reset={reset} title={title} description={description} retryLabel={retry} />;
}
