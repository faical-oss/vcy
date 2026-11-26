"use client";

import {
  Calendar,
  Compass,
  House,
  MapPin,
  Search,
  Tag,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { ScrollRow } from "@/components/ui/scroll-row";
import { cn } from "@/helpers/cn";
import { useMinWidth } from "@/hooks/use-min-width";
import {
  FIELD_NAMES,
  datesSummary,
  filterOptions,
  initialSearchState,
  searchHref,
  travellerSummary,
} from "@/helpers/search-box";
import type { ProductType, SearchBoxContent, SearchOption } from "@/interfaces";
import { AnchoredPanel, SearchSheet } from "./anchored-panel";
import { useSearchBox } from "./search-provider";
import { SuggestionPanel } from "./suggestion-panel";

// The calendar and the steppers load when a visitor first opens dates or travellers, not with the page.
const DatesPopover = dynamic(
  () => import("./search-popovers").then((module) => module.DatesPopover),
  { ssr: false },
);
const TravellersPopover = dynamic(
  () => import("./search-popovers").then((module) => module.TravellersPopover),
  { ssr: false },
);

const SEARCH_DELAY_MS = 500;
const subscribeNever = () => () => {};

type Open = "type" | "destination" | "dates" | "guests" | null;

const TAB_ICONS: Record<ProductType, LucideIcon> = {
  experience: Compass,
  package: Tag,
  hotel: House,
};
/** A field: the borders belong to its cell (`cellClass`), so the same field works in a column, a 2x2 grid and a row. No `truncate` anywhere: a long value wraps. */
const FIELD = "relative flex min-h-[64px] w-full items-center gap-3 px-4 py-2.5 text-left";
const LABEL = "block text-[0.6875rem] uppercase tracking-wider text-muted-blue";
const VALUE = "block break-words text-sm leading-snug";
/** A tab of the hero and the sheet: 56px high (44 at least), equal widths, the icon (20px) over a 13px label below 400px and beside it from 400px. Sentence case below sm so "Experiences" fits at 320px. */
const TAB =
  "flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-[13px] font-semibold transition-colors min-[400px]:flex-row min-[400px]:gap-2 sm:uppercase sm:tracking-wider";

/** Where a field's list or panel goes: in place under the field inside the sheet, else hanging from it (`AnchoredPanel`). */
function PanelFrame({ inline, bounds, width, rowBelowLg, children }: { inline: boolean; bounds: RefObject<HTMLElement | null>; width: number; rowBelowLg?: boolean; children: ReactNode }) {
  return inline ? (
    <div data-search-inline className="px-3 pb-3">
      {children}
    </div>
  ) : (
    <AnchoredPanel bounds={bounds} width={width} rowBelowLg={rowBelowLg}>
      {children}
    </AnchoredPanel>
  );
}

/**
 * The borders between the four fields. Hero: stacked below md (a line under each), a 2x2 grid from md (a line right of the left
 * column and under the top row), one row from lg. Docked (one row, from xl): a line right of all but the last. Sheet: stacked.
 */
function cellClass(index: number, variant: "hero" | "docked" | "sheet"): string {
  if (variant === "docked") return cn("border-border", index < 3 && "border-r");
  if (variant === "sheet") return cn("border-border", index < 3 && "border-b");
  return cn("border-b border-border", index % 2 === 0 && "md:border-r", "lg:border-b-0 lg:border-r");
}

/**
 * The hero search box: three tabs (Experiences, Packages, Hotels), four fields (type, destination, dates, travellers), a Search
 * button and the "Popular:" chips. The type and the destination are comboboxes (typing filters the list, the arrow keys move
 * through it, Enter picks); dates and travellers open popovers. One popover is open at a time; Escape and a click outside close
 * it. The values live in the layout's `SearchProvider`, so another bar shows the same ones. Search goes to `searchHref(state)`;
 * the chips fill a field and never submit. `variant="docked"` is the same bar in one row (tabs, fields, button, no chips) for the
 * sticky bar under the header: the same state, lists and popovers, only the layout differs.
 */
export function SearchBar({
  content,
  variant = "hero",
  chips = true,
  onSearched,
  onClose,
}: {
  content: SearchBoxContent;
  variant?: "hero" | "docked" | "sheet";
  /** The "Popular" chips under the hero variant. */
  chips?: boolean;
  /** `sheet`: called after a search starts (the sheet closes). */
  onSearched?: () => void;
  /** `sheet`: the Close button at the end of the tab row. */
  onClose?: () => void;
}) {
  const docked = variant === "docked";
  // The sheet of the pill: the fields stacked, every panel opens in place under its field (an accordion), the Search button is under the last field.
  const sheet = variant === "sheet";
  const { state: live, dispatch } = useSearchBox();
  // The server HTML is the empty bar. A bar inside <Suspense> can hydrate after the provider has already moved on (default dates, a results URL), so until it has hydrated it shows the empty state too.
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false);
  const state = hydrated ? live : initialSearchState();
  const router = useRouter();
  const uid = useId();
  const tab =
    content.tabs.find((entry) => entry.tab === state.tab) ?? content.tabs[0];
  const [open, setOpen] = useState<Open>(null);
  const [active, setActive] = useState(-1);
  // From lg a panel hangs under its field; below it the dates and travellers are a sheet and the lists are as wide as the bar.
  const wide = useMinWidth(1024);
  const root = useRef<HTMLDivElement>(null);
  const typeInput = useRef<HTMLTextAreaElement>(null);
  const destinationInput = useRef<HTMLTextAreaElement>(null);
  const datesButton = useRef<HTMLButtonElement>(null);
  const guestsButton = useRef<HTMLButtonElement>(null);

  // The lists, filtered by what was typed (while the text is not a picked option).
  const typeOptions = filterOptions(
    tab.types,
    state.type ? "" : state.typeText,
  );
  // The destination search is a request in real life: a query shows skeleton rows for half a second, then the matches.
  const destinationQuery = state.destination ? "" : state.destinationText;
  const [settledQuery, setSettledQuery] = useState("");
  useEffect(() => {
    if (!destinationQuery.trim()) return;
    const timer = setTimeout(
      () => setSettledQuery(destinationQuery),
      SEARCH_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [destinationQuery]);
  const searchingDestinations =
    destinationQuery.trim() !== "" && settledQuery !== destinationQuery;
  const destinationGroups = content.destinationGroups
    .map((group) => ({
      ...group,
      options: searchingDestinations
        ? []
        : filterOptions(group.options, destinationQuery),
    }))
    .sort((a, b) => a.column - b.column);
  const destinationFlat = destinationGroups.flatMap((group) => group.options);
  const flat =
    open === "type"
      ? typeOptions
      : open === "destination"
        ? destinationFlat
        : [];

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      const target = event.target as Element;
      // The sheet is in a portal, outside the bar: a press inside it is not "outside".
      if (root.current && !root.current.contains(target) && !target.closest?.("[data-search-sheet]"))
        setOpen(null);
    };
    // On the document, not the bar: a click on a button does not focus it in Safari, so Esc would never reach the bar.
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const field = {
        type: typeInput,
        destination: destinationInput,
        dates: datesButton,
        guests: guestsButton,
      }[open];
      setOpen(null);
      field.current?.focus();
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const show = (next: Open) => {
    setOpen(next);
    setActive(-1);
  };
  const pick = (kind: "type" | "destination", option: SearchOption) => {
    dispatch({ kind, option });
    setOpen(null);
  };

  /** The keys of a combobox: arrows move through the list (and open it), Enter picks the option the arrows are on. */
  function onComboKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
    kind: "type" | "destination",
  ) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (open !== kind) return show(kind);
      if (flat.length === 0) return;
      setActive((current) =>
        event.key === "ArrowDown"
          ? Math.min(current + 1, flat.length - 1)
          : Math.max(current - 1, 0),
      );
    } else if (
      event.key === "Enter" &&
      open === kind &&
      active >= 0 &&
      flat[active]
    ) {
      event.preventDefault();
      pick(kind, flat[active]);
    } else if (event.key === "Enter") {
      // A text area would take a line break: Enter searches, as it did in a one-line input.
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  const closeOnBlur =
    (kind: "type" | "destination") =>
    (event: React.FocusEvent<HTMLDivElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null))
        setOpen((current) => (current === kind ? null : current));
    };

  const dateSummary = datesSummary(state);

  function combo(kind: "type" | "destination", index: number) {
    const isType = kind === "type";
    const text = isType ? state.typeText : state.destinationText;
    const listId = `${uid}-${kind}-list`;
    const input = isType ? typeInput : destinationInput;
    const label = isType ? tab.typeLabel : "Destination";
    const shortName = isType ? FIELD_NAMES.type : FIELD_NAMES.destination;
    const Icon = isType ? Search : MapPin;
    return (
      <div className={cn("relative", cellClass(index, variant))} onBlur={closeOnBlur(kind)}>
        <label
          className={cn(FIELD, docked && "min-h-12 py-1.5", "cursor-text")}
        >
          <Icon className="size-4 shrink-0 text-muted-blue" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className={LABEL}>
              {shortName}
              <span className="sr-only"> ({label.toLowerCase()})</span>
            </span>
            {/* One line that wraps instead of cutting: a text area the height of its own text (the hidden twin sizes the cell, the area fills it). */}
            <span className="grid">
              <span aria-hidden data-mirror={`${text || (isType ? tab.typePlaceholder : tab.destinationPlaceholder)} `} className="invisible col-start-1 row-start-1 block whitespace-pre-wrap break-words text-sm leading-snug after:content-[attr(data-mirror)]" />
            <textarea
              rows={1}
              enterKeyHint="search"
              ref={input}
              role="combobox"
              aria-expanded={open === kind}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={
                open === kind && active >= 0
                  ? `${listId}-option-${active}`
                  : undefined
              }
              autoComplete="off"
              value={text}
              placeholder={
                isType ? tab.typePlaceholder : tab.destinationPlaceholder
              }
              onFocus={() => show(kind)}
              onClick={() => open !== kind && show(kind)}
              onChange={(event) => {
                dispatch({
                  kind: isType ? "typeText" : "destinationText",
                  text: event.target.value.replace(/\n/g, " "),
                });
                show(kind);
              }}
              onKeyDown={(event) => onComboKeyDown(event, kind)}
              className="col-start-1 row-start-1 block w-full resize-none overflow-hidden whitespace-pre-wrap break-words bg-transparent text-sm leading-snug text-primary placeholder:text-body focus:outline-none"
            />
            </span>
          </span>
          {text ? (
            <button
              type="button"
              aria-label={`Clear ${label.toLowerCase()}`}
              onClick={(event) => {
                event.preventDefault();
                dispatch({ kind, option: null });
                input.current?.focus();
              }}
              className="-mr-2 flex size-8 shrink-0 items-center justify-center text-muted-blue hover:text-primary"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          ) : null}
        </label>
        {open === kind ? (
          <PanelFrame inline={sheet} bounds={root} width={26} rowBelowLg>
            {isType ? (
              <SuggestionPanel
                id={listId}
                title={tab.typeLabel}
                layout={tab.typeLayout}
                groups={[{ options: typeOptions }]}
                activeIndex={active}
                query={text}
                selectedSlug={state.type?.slug}
                onPick={(option) => pick("type", option)}
                onClose={sheet ? undefined : () => setOpen(null)}
                inline={sheet}
              />
            ) : (
              <SuggestionPanel
                id={listId}
                title="Destination"
                layout={destinationQuery.trim() ? "list" : "columns"}
                groups={destinationGroups}
                activeIndex={active}
                query={text}
                selectedSlug={state.destination?.slug}
                loading={searchingDestinations}
                onPick={(option) => pick("destination", option)}
                onClose={sheet ? undefined : () => setOpen(null)}
                inline={sheet}
              />
            )}
          </PanelFrame>
        ) : null}
      </div>
    );
  }

  function popoverField(kind: "dates" | "guests", index: number) {
    const isDates = kind === "dates";
    const Icon = isDates ? Calendar : Users;
    const done = () => {
      setOpen(null);
      (isDates ? datesButton : guestsButton).current?.focus();
    };
    return (
      <div className={cn("relative", cellClass(index, variant))}>
        <button
          ref={isDates ? datesButton : guestsButton}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open === kind}
          onClick={() => show(open === kind ? null : kind)}
          className={cn(FIELD, docked && "min-h-12 py-1.5")}
        >
          <Icon className="size-4 shrink-0 text-muted-blue" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className={LABEL}>
              {isDates ? FIELD_NAMES.dates : FIELD_NAMES.guests}
              <span className="sr-only"> ({(isDates ? tab.datesLabel : tab.guestsLabel).toLowerCase()})</span>
            </span>
            <span
              className={cn(
                VALUE,
                isDates && !state.checkIn ? "text-body" : "text-primary",
              )}
            >
              {isDates ? dateSummary : travellerSummary(state)}
            </span>
          </span>
        </button>
        {open === kind ? (
          sheet ? (
            <div data-search-inline className="px-4 pb-4 pt-1">
              {isDates ? <DatesPopover sheet state={state} dispatch={dispatch} onDone={done} /> : <TravellersPopover sheet state={state} dispatch={dispatch} onDone={done} />}
            </div>
          ) : wide ? (
            <AnchoredPanel bounds={root} width={isDates ? 35 : 18}>
              {isDates ? <DatesPopover state={state} dispatch={dispatch} onDone={done} /> : <TravellersPopover state={state} dispatch={dispatch} onDone={done} />}
            </AnchoredPanel>
          ) : (
            <SearchSheet title={isDates ? "Choose your dates" : "Rooms and guests"} onClose={done} returnFocusTo={isDates ? datesButton : guestsButton}>
              {isDates ? <DatesPopover sheet state={state} dispatch={dispatch} onDone={done} /> : <TravellersPopover sheet state={state} dispatch={dispatch} onDone={done} />}
            </SearchSheet>
          )
        ) : null}
      </div>
    );
  }

  const searchSubmit = (
    <Button type="submit" size="lg" className={cn("uppercase tracking-cta", !docked && "w-full", variant === "hero" && "lg:w-auto")}>
      <Search className="size-4" aria-hidden /> Search
    </Button>
  );

  const tabs = (
    <div
      role="tablist"
      aria-label="What to search"
      className={docked ? "flex shrink-0 gap-5" : "grid min-w-0 flex-1 grid-cols-3"}
    >
      {content.tabs.map((entry, index) => {
        const Icon = TAB_ICONS[entry.tab];
        const selected = entry.tab === state.tab;
        return (
          <button
            key={entry.tab}
            id={`${uid}-tab-${entry.tab}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`${uid}-panel`}
            tabIndex={selected ? 0 : -1}
            onClick={() => {
              setOpen(null);
              dispatch({ kind: "tab", tab: entry.tab });
            }}
            onKeyDown={(event) => {
              const step =
                event.key === "ArrowRight"
                  ? 1
                  : event.key === "ArrowLeft"
                    ? -1
                    : 0;
              if (!step) return;
              event.preventDefault();
              const next =
                content.tabs[
                  (index + step + content.tabs.length) % content.tabs.length
                ];
              dispatch({ kind: "tab", tab: next.tab });
              setOpen(null);
              document.getElementById(`${uid}-tab-${next.tab}`)?.focus();
            }}
            className={
              docked
                ? cn(
                    "flex h-12 items-center gap-2 border-b-2 text-sm font-medium transition-colors",
                    selected
                      ? "border-primary text-primary"
                      : "border-transparent text-body hover:text-primary",
                  )
                : cn(
                    // Three equal tabs, 56px high, the icon over the label below sm (nothing clipped at 320), side by side from sm.
                    TAB,
                    sheet
                      ? cn("border-b-2", selected ? "border-primary text-primary" : "border-transparent text-body hover:text-primary")
                      : cn(
                          "first:rounded-tl-panel last:rounded-tr-panel",
                          selected ? "bg-surface-blue text-primary" : "bg-card text-muted-blue hover:text-primary",
                        ),
                  )
            }
          >
            <Icon className="size-5 shrink-0" aria-hidden />
            {entry.label}
          </button>
        );
      })}
    </div>
  );

  const fields = (
    <div
      id={`${uid}-panel`}
      role="tabpanel"
      aria-labelledby={`${uid}-tab-${state.tab}`}
      className={
        docked
          ? "relative grid min-w-0 flex-1 grid-cols-4 rounded-card border border-primary"
          : sheet
            ? "relative grid grid-cols-1 rounded-card border border-primary"
            : "relative grid grid-cols-1 border-t border-border md:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]"
      }
    >
      {combo("type", 0)}
      {combo("destination", 1)}
      {popoverField("dates", 2)}
      {popoverField("guests", 3)}
      {variant === "hero" ? <div className="p-3 md:col-span-2 lg:col-span-1 lg:flex lg:items-center lg:px-4">{searchSubmit}</div> : null}
    </div>
  );

  return (
    <div ref={root} data-panel-open={open ? "" : undefined} className={sheet ? "flex min-h-0 flex-1 flex-col" : undefined}>
      <form
        role="search"
        aria-label={sheet ? "Search Vacayou" : docked ? "Quick search" : "Search Vacayou"}
        onSubmit={(event) => {
          event.preventDefault();
          setOpen(null);
          router.push(searchHref(state));
          onSearched?.();
        }}
        className={cn(
          docked && "flex items-center gap-6",
          variant === "hero" && "rounded-panel border border-border bg-card shadow-xl",
          sheet && "flex min-h-0 flex-1 flex-col",
        )}
      >
        {sheet ? (
          <>
            <div className="flex shrink-0 items-stretch border-b border-border">
              {tabs}
              {onClose ? (
                <button type="button" aria-label="Close search" onClick={onClose} className="mx-2 flex size-11 shrink-0 items-center justify-center self-center rounded-full bg-surface text-body transition-colors hover:bg-surface-blue hover:text-primary motion-reduce:transition-none">
                  <X className="size-5" aria-hidden />
                </button>
              ) : null}
            </div>
            <div data-sheet-body className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-3">
              {fields}
            </div>
            {/* Under the last field, outside the scrolling body: the Search button is always on screen. */}
            <div className="shrink-0 bg-card px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{searchSubmit}</div>
          </>
        ) : (
          <>
            {tabs}
            {fields}
            {docked ? <div className="shrink-0">{searchSubmit}</div> : null}
          </>
        )}
      </form>

      {docked || sheet || !chips ? null : (
        <ScrollRow
          role="group"
          aria-label="Popular searches"
          className="mt-[calc(0.75rem-8px)] items-center"
        >
          <span className="mr-1 whitespace-nowrap text-micro uppercase tracking-widest text-muted-blue">
            Popular:
          </span>
          {tab.popular.map(({ field, option }) => {
            const current = field === "type" ? state.type : state.destination;
            const selected = current?.slug === option.slug;
            return (
              <button
                key={`${field}-${option.slug}`}
                type="button"
                aria-pressed={selected}
                onClick={() => dispatch({ kind: field, option })}
                className={cn(
                  "min-h-8 whitespace-nowrap rounded-full border bg-card px-3 py-1 text-xs font-medium text-body transition-colors hover:border-primary",
                  selected ? "border-primary text-primary" : "border-border",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </ScrollRow>
      )}
    </div>
  );
}
