"use client";

import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from "react";
import { initialSearchState, searchReducer, type SearchAction, type SearchBoxState } from "@/helpers/search-box";

interface SearchContextValue {
  state: SearchBoxState;
  dispatch: Dispatch<SearchAction>;
}

const SearchContext = createContext<SearchContextValue | null>(null);

/**
 * One search state for the whole site layout, so the hero box on a page and the docked bar in the layout show the same values
 * (typing in one is reflected in the other). A context rather than a store: it is browser-only UI state that starts empty on
 * every load, the server render is the same for everyone.
 */
export function SearchProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(searchReducer, undefined, () => initialSearchState());
  // The default dates are set in the browser, not in the initial state: the page is built ahead of time, so "tomorrow" there would be stale.
  useEffect(() => {
    dispatch({ kind: "defaultDates" });
  }, []);
  return <SearchContext.Provider value={{ state, dispatch }}>{children}</SearchContext.Provider>;
}

export function useSearchBox(): SearchContextValue {
  const value = useContext(SearchContext);
  if (!value) throw new Error("useSearchBox must be used inside <SearchProvider>");
  return value;
}
