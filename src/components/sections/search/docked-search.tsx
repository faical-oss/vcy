"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { Container } from "@/components/ui/container";
import { cn } from "@/helpers/cn";
import { DOCKED_SEARCH_SCROLL_PX, showsDockedSearch } from "@/helpers/docked-search";
import { SEARCH_TARGET, readSearchFromSearch } from "@/helpers/search-box";
import type { SearchBoxContent } from "@/interfaces";
import { SearchBar } from "./search-bar";
import { SearchPill, pillSummary } from "./search-pill";
import { useSearchBox } from "./search-provider";

const subscribe = (notify: () => void) => {
  window.addEventListener("scroll", notify, { passive: true });
  return () => window.removeEventListener("scroll", notify);
};
const pastThreshold = () => window.scrollY > DOCKED_SEARCH_SCROLL_PX;

function DockedPill({ content }: { content: SearchBoxContent }) {
  const { state } = useSearchBox();
  return <SearchPill content={content} summary={pillSummary(state)} />;
}

/**
 * The search bar docked under the site header, the same `SearchBar` as the hero's. `showsDockedSearch(pathname)` says whether this
 * page has it and when: from the top, or after a scroll of `DOCKED_SEARCH_SCROLL_PX`. It slides out from under the header.
 * Layout: a sticky wrapper with no height holds the bar, so showing it never moves the page. While it shows, `data-docked-search`
 * on <html> sets `--docked-search-h` (globals.css), which the Lifestyle sub-nav adds to its `top`. At every width: below `xl` the bar is the pill (`SearchPill`, the full width of the container, which opens a sheet); from `xl` it is the row.
 */
export function DockedSearch({ content }: { content: SearchBoxContent }) {
  const mode = showsDockedSearch(usePathname());
  const scrolled = useSyncExternalStore(subscribe, pastThreshold, () => false);
  const visible = mode === "top" || (mode === "scroll" && scrolled);

  useEffect(() => {
    document.documentElement.toggleAttribute("data-docked-search", visible);
    return () => document.documentElement.removeAttribute("data-docked-search");
  }, [visible]);

  if (!mode) return null;
  return (
    <div className="sticky top-header z-[35] h-0">
      {/* Out of reach while hidden: `inert` takes it out of the tab order and the accessibility tree. */}
      <div
        inert={!visible}
        className={cn(
          "absolute inset-x-0 top-0 h-16 border-b border-border bg-card shadow-header transition-[transform,opacity,visibility] duration-200 ease-out motion-reduce:transition-none",
          visible ? "translate-y-0 opacity-100" : "invisible -translate-y-full opacity-0",
        )}
      >
        <Container className="flex h-full items-center">
          {/* From xl the four fields fit in one row without cutting a value; below it the same search is one pill that opens a sheet. */}
          <div className="hidden w-full xl:block">
            <SearchBar variant="docked" content={content} />
          </div>
          <div className="w-full xl:hidden">
            <DockedPill content={content} />
          </div>
        </Container>
      </div>
    </div>
  );
}

/** The label of an option from its slug (the lists give it back; an unknown slug reads as words: "koh-samui" is "Koh Samui"). */
export const searchLabelFor = (content: SearchBoxContent) => (tab: string, kind: "category" | "destination", slug: string) => {
  const options = kind === "category" ? (content.tabs.find((entry) => entry.tab === tab)?.types ?? []) : content.destinationGroups.flatMap((group) => group.options);
  return options.find((option) => option.slug === slug)?.label ?? slug.replace(/-/g, " ").replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
};

/**
 * On the results page the URL wins over what the bar held: its parameters fill the bar. Elsewhere the bar keeps its state.
 * Reads the query, so the layout wraps it in <Suspense>.
 */
export function SearchUrlPrefill({ content }: { content: SearchBoxContent }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const { dispatch } = useSearchBox();

  useEffect(() => {
    if (pathname !== SEARCH_TARGET) return;
    const next = readSearchFromSearch(search, searchLabelFor(content));
    if (!next) return;
    dispatch({ kind: "load", state: next });
    dispatch({ kind: "defaultDates" });
  }, [pathname, search, content, dispatch]);

  return null;
}
