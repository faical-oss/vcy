import { Check } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Booking box (338px, border and no shadow): live or "from" price, the dates and guests fields with RESERVE NOW and Check
 * availability (`form`), what all rooms include, and the cancellation note. `id` differs between the desktop box and the
 * mobile sheet.
 */
export function BookingBox({ id, price, form, includes, note, includesTitle = "All rooms include", label = "Book this hotel" }: { id: string; price: ReactNode; form: ReactNode; includes: string[]; note: string; includesTitle?: string; label?: string }) {
  return (
    <aside id={id} aria-label={label} className="border border-border bg-card p-5">
      {price}
      <div className="mt-5">{form}</div>
      <div className="mt-5 border-t border-border pt-5">
        <p className="text-sm font-semibold text-primary">{includesTitle}</p>
        <ul className="mt-3 space-y-2.5">
          {includes.map((item) => (
            <li key={item} className="flex items-center gap-2.5 text-sm text-body">
              <Check className="size-3.5 shrink-0 text-primary" strokeWidth={3} aria-hidden /> {item}
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-5 border-t border-border pt-5 text-center text-xs text-muted-blue">{note}</p>
    </aside>
  );
}
