import { cn } from "@/helpers/cn";

const BASE = "flex h-16 w-full flex-col items-center justify-center rounded-full px-8 text-sm font-semibold uppercase leading-tight tracking-cta transition-colors";
const HINT = "text-micro font-normal tracking-widest opacity-80";

/**
 * RESERVE NOW: a gold link when a live price makes it possible, otherwise the grey disabled pill of the design. The reason
 * it is disabled is available to screen readers and as a tooltip; `hint` replaces the small line under the label (for example
 * "Choose 2 more rooms").
 */
export function ReserveCta({ href, note, hint = "To lock in this price!" }: { href?: string; note?: string; hint?: string }) {
  return href ? (
    <a href={href} className={cn(BASE, "bg-accent text-accent-foreground hover:bg-accent-hover")}>
      Reserve now
      <span className={HINT}>{hint}</span>
    </a>
  ) : (
    <button type="button" disabled title={note} className={cn(BASE, "bg-border/60 text-muted-blue")}>
      Reserve now
      <span className={HINT}>{hint}</span>
      {note ? <span className="sr-only">{note}</span> : null}
    </button>
  );
}
