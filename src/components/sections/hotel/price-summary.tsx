import { BedDouble, CalendarX2, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { formatMoney } from "@/helpers/format";
import type { Money } from "@/interfaces";

/**
 * Price header of the booking box, "from" state (no dates yet): the indicative cached price per night and a hint to pick
 * dates. `note` replaces the hint (for example "Check your dates and guests.").
 */
export function PriceFrom({ price, note, unit = "night", compact = false }: { price: Money; note?: string; unit?: "night" | "person"; /** One line only (the mobile bottom bar): no hint under the price. */ compact?: boolean }) {
  return (
    <div>
      <p className="flex items-baseline gap-2">
        <span className="text-xs text-body">From</span>
        <span className="text-heading-xs font-bold text-accent">{formatMoney(price)}</span>
        <span className="text-xs text-body">per {unit}</span>
      </p>
      {compact ? null : <p className="mt-3 text-sm text-body">{note ?? "Select your dates to see total prices."}</p>}
    </div>
  );
}

/** A problem with the price, as a banner (not plain text): no rooms for the dates, or the live prices could not be loaded. */
export function PriceBanner({ title, children, icon: Icon = CalendarX2 }: { title: string; children: ReactNode; icon?: LucideIcon }) {
  return (
    <div role="status" className="flex gap-3 border border-error/30 bg-error/5 p-3">
      <Icon className="mt-0.5 size-5 shrink-0 text-error" aria-hidden />
      <div>
        <p className="text-sm font-semibold text-error">{title}</p>
        <p className="mt-0.5 text-sm text-body">{children}</p>
      </div>
    </div>
  );
}

/**
 * Something the visitor still has to do (for example "Choose 1 more room"): one compact line with an icon on a light
 * accent tint, so it is seen without taking space. Not an error, so it is not red.
 */
export function PriceNotice({ children, icon: Icon = BedDouble }: { children: ReactNode; icon?: LucideIcon }) {
  return (
    <p className="mt-3 flex items-center gap-2 border-l-4 border-accent bg-accent/10 px-3 py-2 text-sm font-medium text-primary">
      <Icon className="size-4 shrink-0 text-accent-hover" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

export function PriceMessage({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="text-sm text-primary">
      {children}
    </p>
  );
}
