export function formatPrice(amount: number, currency = "USD", locale = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Experience counts as shown on cards: "1,300+". */
export function formatCount(count: number, locale = "en-US"): string {
  return `${new Intl.NumberFormat(locale).format(count)}+`;
}

/** Formats an ISO date (YYYY-MM-DD) without timezone drift. */
export function formatDate(isoDate: string, locale = "en-US"): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00Z`));
}

/** Formats a money value at render time ("$1,295"). Prices are stored as `{ amount, currency }`, never as formatted strings. */
export function formatMoney({ amount, currency }: { amount: number; currency: string }, locale = "en-US"): string {
  return formatPrice(amount, currency, locale);
}

/** "March 2026" from an ISO date (YYYY-MM-DD), without timezone drift. */
export function formatMonthYear(isoDate: string, locale = "en-US"): string {
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${isoDate}T00:00:00Z`));
}

/** "07 Oct 2026" from an ISO date (YYYY-MM-DD), without timezone drift. Used by the date fields of the booking box. */
export function formatDateShort(isoDate: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${isoDate}T00:00:00Z`)).replace(/\bSept\b/, "Sep");
}

/**
 * A stay as one short range: "12–19 Mar" (one month collapsed), "28 Feb – 3 Mar", with the year when it is not the current
 * one ("12–19 Mar 2027"). `today` is an ISO date, passed in so the function stays pure. The locale is the visitor's by default
 * (the browser's), the separator is an en dash with no spaces. Without a locale that supports ranges it falls back to two dates.
 */
export function formatDateRange(start: string, end: string, { locale, today }: { locale?: string | string[]; today: string }): string {
  const thisYear = today.slice(0, 4);
  const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", timeZone: "UTC", ...(start.slice(0, 4) === thisYear && end.slice(0, 4) === thisYear ? {} : { year: "numeric" }) };
  const format = new Intl.DateTimeFormat(locale, options);
  const from = new Date(`${start}T00:00:00Z`);
  const to = new Date(`${end}T00:00:00Z`);
  try {
    // ICU puts thin spaces around the dash; the line reads tighter without them ("12–19 Mar").
    return format.formatRange(from, to).replace(/[\s\u2009\u202f\u00a0]*–[\s\u2009\u202f\u00a0]*/, "–");
  } catch {
    return `${format.format(from)}–${format.format(to)}`;
  }
}

