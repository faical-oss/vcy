import { formatMoney } from "@/helpers/format";
import type { Money } from "@/interfaces";

/**
 * "From $1,295 per person" lockup used on every card. The amount is formatted here, at render time. Without a price (no valid dates, or
 * a related card) there is no text at all, only a line of the lockup's own height, so the cards keep their height and nothing moves when the
 * prices arrive. `unavailable` (sold out for the dates): "Not available for these dates".
 */
export function Price({ price, unit, unavailable }: { price?: Money; unit: string; unavailable?: boolean }) {
  if (unavailable) return <span className="text-caption font-medium text-body">Not available for these dates</span>;
  if (!price) return <span aria-hidden className="inline-flex items-baseline text-base font-bold">&nbsp;</span>;
  return (
    <span className="inline-flex items-baseline gap-1 whitespace-nowrap">
      <span className="text-caption text-body">From</span>
      <span className="text-base font-bold text-accent">{formatMoney(price)}</span>
      <span className="text-caption text-body">{unit}</span>
    </span>
  );
}
