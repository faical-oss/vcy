/**
 * The state of the search box (hero and docked bar share it), its reducer and its URL. Pure, so the two bars, the provider and
 * the tests apply one rule. Dates and guests reuse the stay rules (`guest-rules`, `stay-url`).
 * URL (`searchHref`): the repo's own parameters, `type` (experience, package or hotel: the tab), `category` (the picked type of
 * experience, package or hotel), `destination`, `checkIn`, `checkOut`, `flex`, `rooms`, `adults`, `children`, `childAges`, and `q`
 * for text typed into a field but not picked from its list. The target page is `SEARCH_TARGET`: change it in one place.
 */
import { ROUTES } from "@/constants/routes";
import type { ProductType, SearchOption } from "@/interfaces";
import { formatDateRange, formatDateShort } from "./format";
import { changeAdults, changeChildren, changeRooms, normalizeGuests } from "./guest-rules";
import { todayIso } from "./stay-params";
import { readStayFromSearch } from "./stay-url";

export const SEARCH_TARGET = ROUTES.search;
/** Days between the default check-in (tomorrow) and check-out. */
export const DEFAULT_NIGHTS = 2;

const addDays = (iso: string, days: number): string => new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
/** The dates a search always has: check-in tomorrow (UTC, like the calendar's first day), check-out two nights later. */
export const defaultDates = (today: string = todayIso()) => ({ checkIn: addDays(today, 1), checkOut: addDays(today, 1 + DEFAULT_NIGHTS) });
/** The four fields of the search box by their visible names: short, so they never truncate in a narrow field. The full meaning is in the accessible name. */
export const FIELD_NAMES = { type: "What", destination: "Where", dates: "When", guests: "Who" } as const;

/**
 * The dates as the bar shows them, as short as a stay can be written: "25-27 Nov 2026" (an en dash), "28 Nov - 3 Dec 2026",
 * "28 Dec 2026 - 3 Jan 2027". Half a range reads "From 25 Nov 2026"; none, "Add dates" (the default dates are not shown as chosen).
 */
export function datesSummary(state: { checkIn: string | null; checkOut: string | null }): string {
  if (state.checkIn && state.checkOut) return formatDateRange(state.checkIn, state.checkOut, { locale: "en-GB", today: "" });
  if (state.checkIn) return `From ${formatDateShort(state.checkIn)}`;
  return "Add dates";
}
export const SEARCH_TABS = ["experience", "package", "hotel"] as const satisfies readonly ProductType[];
export type SearchTab = ProductType;

export interface SearchBoxState {
  tab: SearchTab;
  /** Text in the type field; `type` is the picked option (null while the text is only typed). */
  typeText: string;
  type: SearchOption | null;
  destinationText: string;
  destination: SearchOption | null;
  checkIn: string | null;
  checkOut: string | null;
  flexDays: number;
  rooms: number;
  adults: number;
  children: number;
  /** One entry per child; null is a child whose age is not chosen (there is no default). */
  childAges: (number | null)[];
}

const FRESH = { typeText: "", type: null, destinationText: "", destination: null, checkIn: null, checkOut: null, flexDays: 0, rooms: 1, adults: 1, children: 0, childAges: [] } as const;
export const initialSearchState = (tab: SearchTab = "experience"): SearchBoxState => ({ tab, ...FRESH, childAges: [] });

export type SearchAction =
  | { kind: "tab"; tab: SearchTab }
  | { kind: "typeText"; text: string }
  | { kind: "type"; option: SearchOption | null }
  | { kind: "destinationText"; text: string }
  | { kind: "destination"; option: SearchOption | null }
  | { kind: "dates"; checkIn: string | null; checkOut: string | null }
  | { kind: "flex"; days: number }
  | { kind: "rooms" | "adults" | "children"; value: number }
  | { kind: "childAge"; index: number; age: number | null }
  /** Gives a state without dates the default stay; a state that has dates (from a results URL, say) is left alone. */
  | { kind: "defaultDates" }
  | { kind: "load"; state: SearchBoxState };

const fitAges = (ages: readonly (number | null)[], count: number) => Array.from({ length: count }, (_, index) => ages[index] ?? null);
const withGuests = (state: SearchBoxState, next: { rooms: number; adults: number; children: number }): SearchBoxState => ({ ...state, ...next, childAges: fitAges(state.childAges, next.children) });

export function searchReducer(state: SearchBoxState, action: SearchAction): SearchBoxState {
  switch (action.kind) {
    case "tab":
      // Switching tabs swaps the labels and lists, so the fields start again.
      // The dates (and the default they came from) stay: a search is never without them.
      return action.tab === state.tab ? state : { ...initialSearchState(action.tab), checkIn: state.checkIn, checkOut: state.checkOut };
    case "typeText":
      return { ...state, typeText: action.text, type: null };
    case "type":
      return { ...state, type: action.option, typeText: action.option?.label ?? "" };
    case "destinationText":
      return { ...state, destinationText: action.text, destination: null };
    case "destination":
      return { ...state, destination: action.option, destinationText: action.option?.label ?? "" };
    case "dates":
      // A check-out that is not after the check-in is dropped.
      return { ...state, checkIn: action.checkIn, checkOut: action.checkIn && action.checkOut && action.checkOut > action.checkIn ? action.checkOut : null };
    case "flex":
      return { ...state, flexDays: action.days };
    case "rooms":
      return withGuests(state, changeRooms(state, action.value));
    case "adults":
      return withGuests(state, changeAdults(state, action.value));
    case "children":
      return withGuests(state, changeChildren(state, action.value));
    case "childAge":
      return action.index < 0 || action.index >= state.childAges.length ? state : { ...state, childAges: state.childAges.map((age, index) => (index === action.index ? action.age : age)) };
    case "defaultDates":
      return state.checkIn ? state : { ...state, ...defaultDates() };
    case "load":
      return action.state;
  }
}

/** "1 traveller", "3 travellers": adults plus children (rooms are not counted). */
export const travellerSummary = (state: Pick<SearchBoxState, "adults" | "children">) => {
  const count = state.adults + state.children;
  return `${count} ${count === 1 ? "traveller" : "travellers"}`;
};

/** The results URL for the search. Empty fields are left out, and so are the default guests (1 room, 1 adult, no children). */
export function searchHref(state: SearchBoxState): string {
  const params = new URLSearchParams({ type: state.tab });
  if (state.type) params.set("category", state.type.slug);
  if (state.destination) params.set("destination", state.destination.slug);
  const typed = [state.type ? "" : state.typeText.trim(), state.destination ? "" : state.destinationText.trim()].filter(Boolean).join(" ");
  if (typed) params.set("q", typed);
  // Dates are always sent: a missing one (or a half-picked range) falls back to the default stay.
  const fallback = defaultDates();
  const checkIn = state.checkIn ?? fallback.checkIn;
  params.set("checkIn", checkIn);
  params.set("checkOut", state.checkOut && state.checkOut > checkIn ? state.checkOut : addDays(checkIn, DEFAULT_NIGHTS));
  if (state.flexDays > 0) params.set("flex", String(state.flexDays));
  if (state.rooms !== 1) params.set("rooms", String(state.rooms));
  if (state.adults !== 1) params.set("adults", String(state.adults));
  if (state.children > 0) {
    params.set("children", String(state.children));
    params.set("childAges", state.childAges.map((age) => age ?? "").join(","));
  }
  return `${SEARCH_TARGET}?${params.toString()}`;
}

/**
 * The search box state for a results URL (`?type=hotel&destination=bali&...`), or null when the query has no `type`: only a search
 * URL fills the bar, never the stay parameters of a detail page. Options only carry their slug (the lists give the label back).
 */
export function readSearchFromSearch(search: string, labelFor: (tab: SearchTab, kind: "category" | "destination", slug: string) => string): SearchBoxState | null {
  const params = new URLSearchParams(search);
  const tab = SEARCH_TABS.find((entry) => entry === params.get("type"));
  if (!tab) return null;
  const option = (kind: "category" | "destination") => {
    const slug = params.get(kind);
    return slug ? { slug, label: labelFor(tab, kind, slug) } : null;
  };
  const { fields } = readStayFromSearch(search);
  const guests = normalizeGuests({ rooms: params.has("rooms") ? fields.rooms : 1, adults: params.has("adults") ? fields.adults : 1, children: fields.children });
  const type = option("category");
  const destination = option("destination");
  const dated = fields.checkIn && fields.checkOut && fields.checkOut > fields.checkIn;
  return {
    tab,
    type,
    typeText: type?.label ?? "",
    destination,
    destinationText: destination?.label ?? "",
    checkIn: dated ? fields.checkIn : null,
    checkOut: dated ? fields.checkOut : null,
    flexDays: dated ? fields.flexDays : 0,
    ...guests,
    childAges: fitAges(fields.childAges, guests.children),
  };
}

/** The suggestions with a word that starts with what was typed (case-insensitive); all of them while nothing is typed. */
export function filterOptions(options: readonly SearchOption[], query: string): SearchOption[] {
  const needle = query.trim();
  if (!needle) return [...options];
  const startsAWord = new RegExp(`(^|[^\\p{L}\\p{N}])${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "iu");
  return options.filter((option) => startsAWord.test(option.label));
}
