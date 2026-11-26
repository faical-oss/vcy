"use client";

import { Check, ChevronUp, Star } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { cn } from "@/helpers/cn";
import { PRICE_BOUNDS } from "@/helpers/search-results";
import type { ProductType, SearchFacets, SearchFilters, SearchResultsContent } from "@/interfaces";

const BOX_STYLE =
  "flex size-4 shrink-0 items-center justify-center border bg-card text-primary-foreground peer-checked:bg-primary peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100";

function Group({ title, count, dense, children }: { title: string; count: number; dense: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  const id = useId();
  return (
    <section className="border-t border-border py-4 first:border-t-0 first:pt-0">
      <h3>
        <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} className={cn("flex min-h-8 w-full items-center justify-between text-[13px] text-primary", dense ? "font-medium" : "font-semibold")}>
          <span className="flex items-center gap-2">
            {title}
            {count > 0 ? (
              <span aria-label={`${count} applied`} className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                {count}
              </span>
            ) : null}
          </span>
          <ChevronUp className={cn("size-4 text-muted-blue transition-transform", !open && "rotate-180")} aria-hidden />
        </button>
      </h3>
      <div id={id} hidden={!open} className="mt-2">
        {children}
      </div>
    </section>
  );
}

function Option({ label, checked, dense, onChange }: { label: string; checked: boolean; dense: boolean; onChange: () => void }) {
  return (
    <label className={cn("flex cursor-pointer items-center gap-2.5 text-[13px] text-primary", dense ? "min-h-7" : "min-h-8")}>
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={onChange} />
      <span aria-hidden className={cn(BOX_STYLE, dense ? "border-card-border" : "border-primary")}>
        <Check className="size-3" />
      </span>
      {label}
    </label>
  );
}

const bound = (text: string, fallback: number) => (/^\d{1,5}$/.test(text) ? Math.min(PRICE_BOUNDS.max, Number(text)) : fallback);

/** Two thumbs on one track plus Min and Max boxes. The thumbs commit when released, the boxes as they are typed. */
function PriceRange({ min, max, onCommit }: { min: number; max: number; onCommit: (min: number, max: number) => void }) {
  const [draft, setDraft] = useState({ min: String(min), max: String(max) });
  const [seen, setSeen] = useState({ min, max });
  // The URL moved (a chip was removed, filters cleared): the boxes follow it.
  if (seen.min !== min || seen.max !== max) {
    setSeen({ min, max });
    setDraft({ min: String(min), max: String(max) });
  }
  const lo = bound(draft.min, PRICE_BOUNDS.min);
  const hi = bound(draft.max, PRICE_BOUNDS.max);
  const span = PRICE_BOUNDS.max - PRICE_BOUNDS.min;
  const commit = () => onCommit(Math.min(lo, hi), Math.max(lo, hi));
  const thumb = { type: "range" as const, min: PRICE_BOUNDS.min, max: PRICE_BOUNDS.max, step: 50, className: "dual-range", onPointerUp: commit, onKeyUp: commit, onBlur: commit };
  const box = "w-full min-w-0 border border-border px-2 py-1.5 text-sm text-primary";
  return (
    <div>
      <div className="relative mx-2 mt-1 h-5 [@media(pointer:coarse)]:h-11">
        <div className="absolute inset-x-0 top-2 h-1 rounded-full bg-border [@media(pointer:coarse)]:top-5" />
        <div className="absolute top-2 h-1 rounded-full bg-primary [@media(pointer:coarse)]:top-5" style={{ left: `${(Math.min(lo, hi) / span) * 100}%`, right: `${100 - (Math.max(lo, hi) / span) * 100}%` }} />
        <input {...thumb} aria-label="Minimum price" value={lo} onChange={(event) => setDraft({ ...draft, min: event.target.value })} />
        <input {...thumb} aria-label="Maximum price" value={hi} onChange={(event) => setDraft({ ...draft, max: event.target.value })} />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-1 border border-border px-2 [@media(pointer:coarse)]:min-h-11 text-xs text-muted-blue focus-within:border-primary">
          Min
          <input inputMode="numeric" value={draft.min} onChange={(event) => { setDraft({ ...draft, min: event.target.value }); const next = bound(event.target.value, PRICE_BOUNDS.min); onCommit(next, Math.max(next, hi)); }} className={cn(box, "border-0 px-0 text-right outline-none")} />
        </label>
        <span aria-hidden className="text-muted-blue">–</span>
        <label className="flex min-w-0 flex-1 items-center gap-1 border border-border px-2 [@media(pointer:coarse)]:min-h-11 text-xs text-muted-blue focus-within:border-primary">
          Max
          <input inputMode="numeric" value={draft.max} onChange={(event) => { setDraft({ ...draft, max: event.target.value }); const next = bound(event.target.value, PRICE_BOUNDS.max); onCommit(Math.min(lo, next), next); }} className={cn(box, "border-0 px-0 text-right outline-none")} />
        </label>
      </div>
    </div>
  );
}

interface FiltersPanelProps {
  content: SearchResultsContent;
  type: ProductType;
  /** The options of the groups; null until the first answer. */
  facets: SearchFacets | null;
  filters: SearchFilters;
  /** The prototype's Experiences and Packages lists: 28px rows and grey boxes (the Hotels list has 32px rows and dark boxes). */
  dense?: boolean;
  onChange: (filters: SearchFilters) => void;
}

/** The filter groups of the tab, in the order of the content. Used in the sidebar and in the phone drawer. */
export function FiltersPanel({ content, type, facets, filters, dense = false, onChange }: FiltersPanelProps) {
  const toggle = (group: Exclude<(typeof content.groups)[ProductType][number]["key"], "rating">, value: string | number) => {
    const current = (filters[group] ?? []) as (string | number)[];
    onChange({ ...filters, [group]: current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value] });
  };
  const priced = (filters.minPrice ?? PRICE_BOUNDS.min) > PRICE_BOUNDS.min || (filters.maxPrice ?? PRICE_BOUNDS.max) < PRICE_BOUNDS.max;
  return (
    <div aria-busy={!facets}>
      <Group title={content.priceTitle} count={priced ? 1 : 0} dense={dense}>
        <PriceRange min={filters.minPrice ?? PRICE_BOUNDS.min} max={filters.maxPrice ?? PRICE_BOUNDS.max} onCommit={(minPrice, maxPrice) => onChange({ ...filters, minPrice, maxPrice })} />
      </Group>
      {/* The groups wait for the options, so nothing above them moves when they arrive (only the price range shows meanwhile). */}
      {(facets ? content.groups[type] : []).map(({ key, title }) => {
        if (key === "rating") {
          return (
            <Group key={key} title={title} count={filters.rating ? 1 : 0} dense={dense}>
              <ul>
                {content.ratings.map(({ value, label }) => (
                  <li key={value}>
                    <button type="button" aria-pressed={filters.rating === value} onClick={() => onChange({ ...filters, rating: filters.rating === value ? undefined : value })} className={cn("flex min-h-8 w-full items-center gap-2 px-1 text-primary hover:bg-surface", dense ? "text-xs" : "text-[13px]", filters.rating === value && "bg-surface-blue")}>
                      <span aria-hidden className="flex">
                        {Array.from({ length: 5 }, (_, index) => (
                          <Star key={index} className={cn("size-3", index < value ? "fill-star text-star" : "text-border")} />
                        ))}
                      </span>
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </Group>
          );
        }
        const options = key === "stars" ? facets!.stars.map((value) => ({ slug: String(value), label: `${value} star` })) : facets![key];
        // A group with nothing to choose between is left out (a search inside one destination has one place).
        if (options.length < 2) return null;
        return (
          <Group key={key} title={title} count={filters[key]?.length ?? 0} dense={dense}>
            <ul>
              {options.map(({ slug, label }) => (
                <li key={slug}>
                  <Option dense={dense} label={label} checked={((filters[key] ?? []) as (string | number)[]).includes(key === "stars" ? Number(slug) : slug)} onChange={() => toggle(key, key === "stars" ? Number(slug) : slug)} />
                </li>
              ))}
            </ul>
          </Group>
        );
      })}
    </div>
  );
}
