import { formatMoney } from "@/helpers/format";
import type { BarPrice, BarSummary } from "@/helpers/booking-bar-summary";

/** The rooms line shows its types, and only the count on a short screen (landscape). Under 360px wide there is no room for the line at all (the sheet has the rooms). */
const FULL_ONLY = "[@media(max-height:500px)]:hidden";
const SHORT_ONLY = "hidden [@media(max-height:500px)]:inline";

function Price({ price }: { price: BarPrice }) {
  switch (price.kind) {
    case "loading":
      return (
        <span role="status" aria-busy="true" aria-label="Loading prices" className="block py-0.5">
          <span aria-hidden className="block h-3 w-28 animate-pulse rounded-sm bg-border/70 motion-reduce:animate-none" />
        </span>
      );
    case "from":
      return (
        <span className="block whitespace-nowrap">
          <span className="text-xs text-body">From </span>
          <span className="text-sm font-bold leading-4 text-accent">{formatMoney(price.money)}</span>
          <span className="text-xs text-body"> per {price.unit}</span>
        </span>
      );
    case "total":
      return (
        <span className="block">
          <span className="text-xs text-body">Total for {price.nights} {price.nights === 1 ? "night" : "nights"} </span>
          <span className="text-sm font-bold leading-4 text-accent">{formatMoney(price.money)}</span>
        </span>
      );
    case "problem":
      return <span className="block text-xs font-medium text-error">{price.text}</span>;
    case "note":
      return <span className="block text-xs text-body">{price.text}</span>;
  }
}

/** Rooms listed in the bar: two at most, then "+N more" (the sheet has them all). */
const MAX_ROOMS = 2;

/**
 * The text of the mobile bar's summary button: the dates and the travellers and, for hotels, the rooms chosen (the count, then one room per line,
 * two at most and "+N more", then what is still to do). The price is `BookingBarPrice`, on the right above the button. The bar's height follows its content (`MobileBookingBar` publishes it
 * as `--booking-bar-h`). In landscape the rooms are the count only, and under 360px wide there is no rooms line at all.
 */
export function BookingBarSummary({ summary }: { summary: BarSummary }) {
  const rooms = summary.rooms;
  const shown = rooms?.items.slice(0, MAX_ROOMS) ?? [];
  const more = (rooms?.items.length ?? 0) - shown.length;
  return (
    <span className="block min-w-0 text-left">
      <span className="block text-xs font-semibold leading-[14px] text-primary">
        {summary.dates} · {summary.guests}
      </span>
      {rooms ? (
        <span className="block text-xs leading-[14px] text-body [@media(max-width:359px)]:hidden">
          <span className="block">
            <span className={FULL_ONLY}>{rooms.summary}</span>
            <span className={SHORT_ONLY}>{rooms.short}</span>
          </span>
          {shown.length > 0 ? (
            <span className={`${FULL_ONLY} flex flex-col`} data-booking-rooms>
              {shown.map((item, index) => (
                <span key={`${item}-${index}`} className="block">
                  {item}
                  <span className="sr-only">{index < shown.length - 1 || more > 0 ? "," : ""}</span>
                </span>
              ))}
              {more > 0 ? <span className="block">+{more} more</span> : null}
            </span>
          ) : null}
          {rooms.note ? <span className={`${FULL_ONLY} block`}>{rooms.note}</span> : null}
        </span>
      ) : null}
    </span>
  );
}

/** The price, on the bar's right side above the button (`Price` right-aligned). Nothing when there is no price. */
export function BookingBarPrice({ summary }: { summary: BarSummary }) {
  return summary.price ? (
    <span className="block text-right leading-[16px]" data-booking-price>
      <Price price={summary.price} />
    </span>
  ) : null;
}
