"use client";

import { ChevronDown, LayoutGrid, List, ListFilter } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { HotelCard } from "@/components/cards/hotel-card";
import { ExperienceCard } from "@/components/cards/experience-card";
import { PackageCard } from "@/components/cards/package-card";
import { searchLabelFor } from "@/components/sections/search/docked-search";
import { ActiveFilters, activeChips } from "@/components/sections/search/results/active-filters";
import { FiltersDrawer } from "@/components/sections/search/results/filters-drawer";
import { FiltersPanel } from "@/components/sections/search/results/filters-panel";
import { rememberSearchReturn } from "@/helpers/search-return";
import { ResultListCard, type StayLabel } from "@/components/sections/search/results/result-list-card";
import { ResultsPager } from "@/components/sections/search/results/results-pager";
import { DatesBanner, ResultsEmpty, ResultsError, ResultsSkeleton, SearchNotice } from "@/components/sections/search/results/results-states";
import { LISTING_GRID } from "@/constants/grids";
import { cn } from "@/helpers/cn";
import { useHydrated } from "@/hooks/use-hydrated";
import { useMinWidth } from "@/hooks/use-min-width";
import { formatDateRange } from "@/helpers/format";
import { hasFilters, readResultsState, readSearchParams, writeResultsState, type ResultsState } from "@/helpers/search-results";
import { todayIso } from "@/helpers/stay-params";
import { writeStayToSearch } from "@/helpers/stay-url";
import type { SearchBoxContent, SearchResultItem, SearchResultsContent } from "@/interfaces";
import { getSearchResults } from "@/services/search-results";
import { createResultsLoader } from "./results-loader";

/** The toolbar controls share one height (34px, 44px on touch screens: a select cannot carry the invisible tap area) and one text size (13px); the pill, the select and the toggle buttons share the same 16px / 12px padding. */
const CONTROL = "h-[34px] text-[13px] pointer-coarse:h-11";
const TOGGLE = `${CONTROL} flex items-center gap-2 border-l border-border px-4 font-medium transition-colors first:border-l-0`;

/**
 * The results of the search in the URL. The server renders only the shell; this reads the URL in the browser and asks for results
 * when the search is valid (see `createResultsLoader` for the fetch rules). Filters, sort, view and page live in the URL and
 * replace the history entry (the Search button, in the search bar, pushes one). Hotels are priced per night, the rest per person.
 */
export function SearchResults({ content, searchBox }: { content: SearchResultsContent; searchBox: SearchBoxContent }) {
  const search = useSearchParams().toString();
  const pathname = usePathname();
  const router = useRouter();
  // The URL the page is moving to after an edit (`pending`): the page follows it at once, and an edit made before the URL has
  // caught up builds on it, so two quick ticks both land. It is dropped as soon as the URL changes.
  const [pending, setPending] = useState<{ from: string; to: string } | null>(null);
  const live = pending && pending.from === search ? pending.to : search;
  const read = useMemo(() => readSearchParams(live, todayIso()), [live]);
  const state = useMemo(() => readResultsState(live), [live]);
  const [loader] = useState(() => createResultsLoader((params, signal) => getSearchResults(params, { signal, mock: new URLSearchParams(window.location.search).get("mock") })));
  const snapshot = useSyncExternalStore(loader.subscribe, loader.getSnapshot, loader.getSnapshot);
  const [showFilters, setShowFilters] = useState(true);
  const [drawer, setDrawer] = useState(false);
  const top = useRef<HTMLDivElement>(null);
  const filtersButton = useRef<HTMLElement | null>(null);
  const closeDrawer = useCallback(() => setDrawer(false), []);
  const hydrated = useHydrated();
  // The grid view is for tablets and up (the toggle is hidden below 768px): a phone always gets the list cards of the mobile design, whatever `view` the URL says.
  const gridFits = useMinWidth(768);

  useEffect(() => {
    loader.request(read.status === "ok" ? read.params : null);
  }, [loader, read]);
  useEffect(() => () => loader.stop(), [loader]);

  // The server renders the shell only (this skeleton), whatever the search: the results page is the same HTML for every URL.
  if (!hydrated) return <ResultsSkeleton view="list" />;
  if (read.status === "no-type") return <SearchNotice title="Start a search" text="Choose where you want to go and when, then press Search." />;
  if (read.status === "invalid-guests") return <SearchNotice title="Choose an age for each child" text="Add every child's age in the travellers field to see results." />;

  const { params, datesValid } = read;
  const replace = (patch: Partial<ResultsState>, keepPage = false) => {
    const to = writeResultsState(live, { ...state, ...(keepPage ? {} : { page: 1 }), ...patch });
    setPending({ from: search, to });
    router.replace(`${pathname}?${to}`, { scroll: false });
  };
  const clearFilters = () => replace({ filters: {} });
  // No filters left to clear: drop what narrows the search itself (the picked type, the destination, the typed text).
  const widenSearch = () => {
    const params = new URLSearchParams(live);
    for (const key of ["category", "destination", "q"]) params.delete(key);
    const to = writeResultsState(params.toString(), { ...state, page: 1 });
    setPending({ from: search, to });
    router.replace(`${pathname}?${to}`, { scroll: false });
  };
  const view = state.view === "grid" && gridFits ? "grid" : "list";
  const data = snapshot.status === "ready" ? snapshot.data : null;
  const facets = snapshot.previous?.facets ?? null;
  const chips = activeChips(state.filters, facets, content);
  const where = params.destination ? searchLabelFor(searchBox)(params.type, "destination", params.destination) : "";
  const what = params.category ? searchLabelFor(searchBox)(params.type, "category", params.category) : (params.q ?? "");
  // The experience and package tabs use the prototype's denser filter list (28px rows, grey boxes).
  const dense = params.type !== "hotel";
  // The dates and travellers go to the detail page, which prices and checks the stay itself.
  const stay = params.stay ? writeStayToSearch("", { checkIn: params.stay.checkIn, checkOut: params.stay.checkOut, ...params.guests, flexDays: params.stay.flexDays }) : "";
  const stayLabel: StayLabel | undefined = params.stay ? { dates: formatDateRange(params.stay.checkIn, params.stay.checkOut, { locale: "en-GB", today: "" }), guests: `${params.guests.adults + params.guests.children} ${params.guests.adults + params.guests.children === 1 ? "guest" : "guests"}` } : undefined;
  const hrefOf = (href: string) => (stay ? `${href}?${stay}` : href);
  const panel = <FiltersPanel content={content} type={params.type} facets={facets} filters={state.filters} dense={dense} onChange={(filters) => replace({ filters })} />;

  const card = (item: SearchResultItem) => {
    const unavailable = item.availability === "unavailable";
    if (item.kind === "hotel") return <HotelCard {...item} href={hrefOf(item.href)} unavailable={unavailable} />;
    if (item.kind === "experience") return <ExperienceCard {...item} href={hrefOf(item.href)} unavailable={unavailable} />;
    return <PackageCard {...item} href={item.href ? hrefOf(item.href) : undefined} unavailable={unavailable} />;
  };

  return (
    <div ref={top} className="scroll-mt-32">
      <div className="flex items-start">
        <aside id="results-filters" aria-label="Filters" inert={!showFilters} className={cn("hidden shrink-0 overflow-hidden transition-[width,opacity,margin] duration-200 motion-reduce:transition-none lg:block", showFilters ? "mr-6 w-[230px] opacity-100" : "invisible mr-0 w-0 opacity-0")}>
          <div className="w-[230px]">
            <div data-filters-header className="mb-4 flex h-[34px] items-center pointer-coarse:h-11 justify-between">
              <h2 className="text-sm font-semibold text-primary">Filters</h2>
              <button type="button" onClick={clearFilters} className={cn("border-b text-xs", dense ? "border-border text-body hover:text-primary" : "border-primary font-medium text-primary hover:border-primary/70")}>
                Clear all
              </button>
            </div>
            {panel}
          </div>
        </aside>

        <div className="@container min-w-0 flex-1">
          <div data-results-toolbar className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-border pb-4">
            <button type="button" onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters} aria-controls="results-filters" className={cn(CONTROL, "hidden items-center gap-2 rounded-full border border-border px-4 font-medium text-primary hover:border-primary lg:inline-flex")}>
              <ListFilter className="size-3.5" aria-hidden /> {showFilters ? "Hide filters" : "Show filters"}
            </button>
            <button type="button" onClick={(event) => { filtersButton.current = event.currentTarget; setDrawer(true); }} className={cn(CONTROL, "inline-flex items-center gap-2 rounded-full border border-border px-4 font-medium text-primary hover:border-primary lg:hidden")}>
              <ListFilter className="size-3.5" aria-hidden /> Filters
            </button>
            <p aria-live="polite" className="order-last basis-full text-[13px] text-body sm:order-none sm:basis-auto">
              {data ? (
                <>
                  <strong className="font-semibold text-primary">
                    {data.total} {data.total === 1 ? "result" : "results"}
                  </strong>
                  {what ? ` for "${what}"` : ""}
                  {where ? ` in ${where}` : ""}
                </>
              ) : snapshot.status === "loading" ? (
                "Searching…"
              ) : null}
            </p>
            <div className="ml-auto flex items-center gap-3">
              <label className="flex items-center gap-2 text-[13px] text-body">
                <span className="hidden sm:inline">Sort:</span>
                <span className="relative">
                  <select aria-label="Sort results" value={state.sort} onChange={(event) => replace({ sort: event.target.value as ResultsState["sort"] })} className={cn(CONTROL, "appearance-none border border-border bg-card pl-3.5 pr-10 text-primary")}>
                    {content.sorts.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  {/* Our own chevron, 14px in from the right edge (the native one sits against it). */}
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-blue" aria-hidden />
                </span>
              </label>
              <div role="group" aria-label="View" className="hidden overflow-hidden rounded-md border border-border md:flex">
                {(["list", "grid"] as const).map((mode) => (
                  <button key={mode} type="button" aria-pressed={state.view === mode} onClick={() => replace({ view: mode }, true)} className={cn(TOGGLE, state.view === mode ? "bg-primary text-primary-foreground" : "bg-card text-body hover:text-primary")}>
                    {mode === "list" ? <List className="size-3.5" aria-hidden /> : <LayoutGrid className="size-3.5" aria-hidden />}
                    {mode === "list" ? "List" : "Grid"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <ActiveFilters chips={chips} onChange={(filters) => replace({ filters })} onClear={clearFilters} />
          {datesValid ? null : <DatesBanner />}

          <div aria-busy={!data && snapshot.status !== "error"}>
            {snapshot.status === "error" ? (
              <ResultsError onRetry={loader.retry} />
            ) : !data ? (
              <ResultsSkeleton view={view} />
            ) : data.items.length === 0 ? (
              <ResultsEmpty filtered={hasFilters(state.filters)} onClear={hasFilters(state.filters) ? clearFilters : widenSearch} />
            ) : (
              <>
                {/* Following a card remembers this results page, so the detail page can offer "Back to search results". */}
                <ul
                  data-grid={view === "grid" ? "listing" : undefined}
                  onClickCapture={(event) => {
                    const link = (event.target as Element).closest("a[href]");
                    if (link) rememberSearchReturn(link.getAttribute("href") ?? "");
                  }}
                  className={cn(view === "grid" ? LISTING_GRID : "flex flex-col gap-4")}
                >
                  {data.items.map((item) => (
                    <li key={`${item.kind}-${item.id}`} className="flex flex-col [&>article]:flex-1">
                      {view === "grid" ? card(item) : <ResultListCard item={item} href={item.href ? hrefOf(item.href) : undefined} stay={stayLabel} />}
                    </li>
                  ))}
                </ul>
                <ResultsPager page={data.page} total={data.total} pageSize={data.pageSize} onPage={(page) => { replace({ page }, true); top.current?.scrollIntoView({ block: "start" }); }} />
              </>
            )}
          </div>
        </div>
      </div>

      <FiltersDrawer open={drawer} openerRef={filtersButton} onClose={closeDrawer} onClear={clearFilters} count={data?.total ?? null}>
        {panel}
      </FiltersDrawer>
    </div>
  );
}
