/**
 * The query string a detail page sends to checkout. Pure, so the booking card, the room shortcut, the checkout stub and the
 * tests share one definition. This is also the list of parameters the real checkout must accept:
 *   type       "hotel" | "experience" | "package"
 *   id         the hotel or experience slug
 *   checkIn    ISO date (YYYY-MM-DD); for an experience the start date
 *   checkOut   ISO date; for an experience always checkIn + the experience's nights
 *   rooms      number of rooms (1 to 8, never more than adults)
 *   adults     number of adults (1 to 9; an experience: up to its group maximum, 12)
 *   children   number of children (0 to 6)
 *   childAges  comma-separated ages 0-17, one per child ("2,5"); absent without children
 *   flex       date flexibility in days (1, 2, 3 or 7); absent for exact dates
 *   roomId     optional: a room the visitor preselected from a room card; never required
 *   selection  hotels only (rooms are chosen on the hotel page): "roomId:quantity" pairs, comma-separated ("r1:2,r2:1"),
 *              adding up to `rooms`. Experiences never send it: their rooms are chosen in checkout.
 */
export type CheckoutKind = "hotel" | "experience" | "package";

export interface CheckoutInput {
  kind: CheckoutKind;
  id: string;
  checkIn?: string | null;
  checkOut?: string | null;
  rooms?: number;
  adults?: number;
  children?: number;
  childAges?: readonly number[];
  flexDays?: number;
  roomId?: string;
  /** Hotels: the rooms chosen on the page, as room id and quantity. */
  selection?: Readonly<Record<string, number>>;
}

/** Query string (without "?") for the checkout route. Parameters without a value are left out. */
export function checkoutQuery(input: CheckoutInput): string {
  const params = new URLSearchParams({ type: input.kind, id: input.id });
  if (input.checkIn) params.set("checkIn", input.checkIn);
  if (input.checkOut) params.set("checkOut", input.checkOut);
  if (input.rooms !== undefined) params.set("rooms", String(input.rooms));
  if (input.adults !== undefined) params.set("adults", String(input.adults));
  if (input.children !== undefined) params.set("children", String(input.children));
  if (input.childAges && input.childAges.length > 0) params.set("childAges", input.childAges.join(","));
  if (input.flexDays) params.set("flex", String(input.flexDays));
  if (input.roomId) params.set("roomId", input.roomId);
  const chosen = Object.entries(input.selection ?? {});
  if (chosen.length > 0) params.set("selection", chosen.map(([id, quantity]) => `${id}:${quantity}`).join(","));
  return params.toString();
}

const STAY_PARAMS = ["checkIn", "checkOut", "rooms", "adults", "children", "childAges", "flex"] as const;

/**
 * The same query built from the stay already in the page URL (it only holds a valid stay), for the room shortcut: whatever
 * the visitor chose so far travels along, and checkout asks for the rest.
 */
export function checkoutQueryFromUrl(current: URLSearchParams, target: { kind: CheckoutKind; id: string; roomId?: string }): string {
  const params = new URLSearchParams({ type: target.kind, id: target.id });
  for (const key of STAY_PARAMS) {
    const value = current.get(key);
    if (value) params.set(key, value);
  }
  if (target.roomId) params.set("roomId", target.roomId);
  return params.toString();
}

export type RawCheckoutParams = Record<string, string | string[] | undefined>;

/** `"r1:2,r2:1"` -> `{ r1: 2, r2: 1 }`. Entries that are not a room id with a whole quantity of 1 or more are dropped. */
export function parseSelection(raw: string): Record<string, number> {
  const selection: Record<string, number> = {};
  for (const part of raw.split(",")) {
    const [id, quantity] = part.split(":");
    if (id && /^\d{1,2}$/.test(quantity ?? "") && Number(quantity) >= 1) selection[id] = Number(quantity);
  }
  return selection;
}

/** What the checkout route reads: the kind and id (null when missing or unknown), the optional preselected room and, for hotels, the rooms chosen on the page. */
export function readCheckoutTarget(raw: RawCheckoutParams): { kind: CheckoutKind | null; id: string; roomId: string; selection: Record<string, number> } {
  const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";
  const type = one(raw.type);
  return { kind: type === "hotel" || type === "experience" || type === "package" ? type : null, id: one(raw.id), roomId: one(raw.roomId), selection: parseSelection(one(raw.selection)) };
}
