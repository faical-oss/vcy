import { DestinationIndexSkeleton } from "@/components/sections/listing/destination-index-skeleton";
import { LISTING_CONTENT } from "@/features/catalog/listing-content";

export default function Loading() {
  return <DestinationIndexSkeleton label={LISTING_CONTENT.loadingLabel} />;
}
