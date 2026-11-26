import { CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import { cn } from "@/helpers/cn";
import type { Booking, BookingStatus } from "@/interfaces";

const STATUS_LABEL: Record<BookingStatus, string> = { confirmed: "Confirmed", pending: "Pending", cancelled: "Cancelled" };

function formatRange(start: string, end: string): string {
  const format = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  return `${format.format(new Date(start))} – ${format.format(new Date(end))}`;
}

/** ASSUMED layout (the prototype only shows the empty state): reference, title, dates, status and total. */
export function BookingCard({ booking, className }: { booking: Booking; className?: string }) {
  return (
    <article className={cn("relative rounded-card border border-border bg-card p-5 transition-colors hover:border-border-strong", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-blue">Ref {booking.reference}</p>
        <span className="rounded-full bg-surface-blue px-2.5 py-1 text-xs font-semibold text-primary">{STATUS_LABEL[booking.status]}</span>
      </div>
      <h3 className="mt-2 font-display text-title-sm font-medium leading-snug text-primary">
        <Link href={booking.href} className="after:absolute after:inset-0">
          {booking.title}
        </Link>
      </h3>
      <p className="mt-2 flex items-center gap-1.5 text-xs text-body">
        <MapPin aria-hidden className="size-3 shrink-0" /> {booking.location}
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-body">
        <CalendarDays aria-hidden className="size-3 shrink-0" /> {formatRange(booking.startDate, booking.endDate)}
      </p>
      <p className="mt-3 border-t border-border pt-3 text-sm font-semibold text-primary">{booking.total}</p>
    </article>
  );
}
