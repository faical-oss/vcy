import type { Booking } from "@/interfaces";
import { AccountSection } from "./account-section";
import { TripsSection } from "./trips-section";

export function TripsView({ bookings }: { bookings: readonly Booking[] }) {
  return (
    <AccountSection
      id="trips-title"
      eyebrow="Bookings"
      title="My trips"
      titleClassName="text-heading-sm sm:text-heading"
      description="Access your booking references, travel dates and complete confirmation details."
    >
      <TripsSection bookings={bookings} variant="page" />
    </AccountSection>
  );
}
