import { X } from "lucide-react";
import { ScrollRow } from "@/components/ui/scroll-row";
import { PRICE_BOUNDS, type FilterGroup } from "@/helpers/search-results";
import type { SearchFacets, SearchFilters, SearchResultsContent } from "@/interfaces";

export interface FilterChip {
  id: string;
  label: string;
  /** The filters without this one. */
  without: SearchFilters;
}

/** One chip per applied filter, in the order of the sidebar: types, stars, places, amenities, board, rating, price. */
export function activeChips(filters: SearchFilters, facets: SearchFacets | null, content: SearchResultsContent): FilterChip[] {
  // Until the first answer brings the options, a slug reads as words ("eco-lodge" -> "Eco lodge").
  const words = (slug: string) => slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
  const labelOf = (group: Exclude<FilterGroup, "stars">, slug: string) => facets?.[group].find((entry) => entry.slug === slug)?.label ?? words(slug);
  const chips: FilterChip[] = [];
  const add = (group: FilterGroup, value: string | number, label: string) =>
    chips.push({ id: `${group}-${value}`, label, without: { ...filters, [group]: (filters[group] as (string | number)[]).filter((entry) => entry !== value) } });
  for (const group of ["types", "stars", "places", "duration", "amenities", "board", "groupSize", "difficulty"] as const) {
    for (const value of filters[group] ?? []) add(group, value, group === "stars" ? `${value} star` : labelOf(group, value as string));
  }
  const rating = content.ratings.find((entry) => entry.value === filters.rating);
  if (rating) chips.push({ id: "rating", label: `Rating: ${rating.label}`, without: { ...filters, rating: undefined } });
  const { minPrice = PRICE_BOUNDS.min, maxPrice = PRICE_BOUNDS.max } = filters;
  if (minPrice > PRICE_BOUNDS.min || maxPrice < PRICE_BOUNDS.max) chips.push({ id: "price", label: `Price: $${minPrice}–$${maxPrice}`, without: { ...filters, minPrice: undefined, maxPrice: undefined } });
  return chips;
}

/** "Active filters:" with a removable chip for each, and "Clear all". Renders nothing without filters. */
export function ActiveFilters({ chips, onChange, onClear }: { chips: FilterChip[]; onChange: (filters: SearchFilters) => void; onClear: () => void }) {
  if (chips.length === 0) return null;
  return (
    <div className="mb-5 border-b border-border pb-4">
      <ScrollRow role="group" aria-label="Active filters" className="items-center">
        <span className="whitespace-nowrap text-micro uppercase tracking-widest text-muted-blue">Active filters:</span>
        {chips.map((chip) => (
          <button key={chip.id} type="button" onClick={() => onChange(chip.without)} aria-label={`Remove filter: ${chip.label}`} className="flex min-h-8 items-center gap-1.5 whitespace-nowrap rounded-full border border-primary bg-surface-blue px-3 text-xs font-medium text-primary hover:bg-surface-blue/70">
            {chip.label}
            <X className="size-3" aria-hidden />
          </button>
        ))}
        <button type="button" onClick={onClear} className="flex min-h-8 items-center whitespace-nowrap text-xs font-medium text-primary [&:hover>span]:border-primary/70">
          <span className="border-b border-primary">Clear all</span>
        </button>
      </ScrollRow>
    </div>
  );
}
