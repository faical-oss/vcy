import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LISTING_GRID } from "@/constants/grids";
import { cn } from "@/helpers/cn";
import type { SearchView } from "@/helpers/search-results";

const BLOCK = "animate-pulse bg-border motion-reduce:animate-none";

/** Placeholders shaped like the results (rows in the list view, cards in the grid view). Not a spinner. */
export function ResultsSkeleton({ view, count = 4 }: { view: SearchView; count?: number }) {
  return (
    <div aria-hidden className={view === "grid" ? LISTING_GRID : "flex flex-col gap-4"}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={cn("overflow-hidden rounded-xl border border-border bg-card", view === "list" && "@2xl:flex")}>
          <div className={cn(BLOCK, "aspect-[4/3] w-full", view === "list" && "@2xl:w-[280px] @2xl:shrink-0 @4xl:w-[320px]")} />
          <div className="flex flex-1 flex-col gap-2 p-4">
            <div className={cn(BLOCK, "h-6 w-3/5 rounded-card")} />
            <div className={cn(BLOCK, "h-3 w-1/3 rounded-card")} />
            <div className={cn(BLOCK, "h-3 w-1/2 rounded-card")} />
            <div className={cn(BLOCK, "mt-3 h-4 w-2/3 rounded-card")} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Nothing matched. "Clear all filters" is always there: with filters on it clears them, without it widens the search (see the controller). */
export function ResultsEmpty({ filtered, onClear }: { filtered: boolean; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
      <Search className="size-8 text-muted-blue" aria-hidden />
      <p className="text-sm text-body">{filtered ? "No results match your current filters." : "No results match your search. Try other dates, another destination or a different type."}</p>
      <button type="button" onClick={onClear} className="border-b border-primary text-sm font-medium text-primary hover:border-primary/70 hover:text-primary/70">
        Clear all filters
      </button>
    </div>
  );
}

/** The search failed: plain language and a retry. The error itself is never shown. */
export function ResultsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-card border border-border bg-card px-6 py-12 text-center">
      <p className="font-display text-title-sm font-medium text-primary">We couldn&apos;t load the results</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-body">Something went wrong on our side. Your search is unchanged.</p>
      <Button size="lg" className="mt-6 min-h-11 uppercase tracking-cta" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

/** Shown while the URL has no valid dates: the results are listed, only prices and availability need dates. */
export function DatesBanner() {
  return (
    <p role="status" className="mb-4 rounded-card border border-border bg-surface-blue px-4 py-2.5 text-sm font-medium text-primary">
      Choose your dates to see prices
    </p>
  );
}

/** The search is missing or incomplete, so nothing is asked of the API. */
export function SearchNotice({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-card bg-surface px-4 py-12 text-center sm:px-5">
      <h2 className="font-display text-title-sm font-medium text-primary">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-body">{text}</p>
    </div>
  );
}
