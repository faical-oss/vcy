import { CalendarDays } from "lucide-react";
import { CardGrid } from "@/components/ui/card-grid";
import { ROUTES } from "@/constants/routes";
import type { Booking } from "@/interfaces";
import { BookingCard } from "./booking-card";
import { EmptyState } from "./empty-state";

interface TripsSectionProps {
  bookings: readonly Booking[];
  /** "overview": compact sentence + button. "page": icon, title and description. */
  variant: "overview" | "page";
  /** Cap for previews (Overview). Omit to show everything. */
  limit?: number;
}

const OVERVIEW_COPY =
  "You have no upcoming bookings yet. Explore restorative retreats, inspiring adventures and exceptional stays selected by our travel experts.";
const PAGE_COPY = "Confirmed trips will appear here with quick access to your full booking summary.";
const ACTION = { label: "Explore experiences", href: ROUTES.browseExperiences, arrow: true } as const;

/** My trips content shared by the Overview preview and the My trips page. */
export function TripsSection({ bookings, variant, limit }: TripsSectionProps) {
  if (bookings.length === 0) {
    return variant === "overview" ? (
      <EmptyState description={OVERVIEW_COPY} action={ACTION} />
    ) : (
      <EmptyState icon={CalendarDays} title="No bookings yet" description={PAGE_COPY} action={ACTION} className="mt-6 px-5 py-10 sm:mt-6" />
    );
  }
  const visible = limit ? bookings.slice(0, limit) : bookings;
  return (
    <CardGrid as="ul" className="mt-5 sm:mt-6">
      {visible.map((booking) => (
        <li key={booking.id} className="flex [&>article]:w-full">
          <BookingCard booking={booking} />
        </li>
      ))}
    </CardGrid>
  );
}
