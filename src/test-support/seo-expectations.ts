/**
 * The filter parameters that MUST be treated as filtered variants (noindex,follow), written out on purpose and NOT
 * derived from FILTER_PARAMS: a test that only loops over FILTER_PARAMS could never notice a parameter being removed from
 * it. Removing a name here is a visible decision (say why in the commit); adding one to FILTER_PARAMS needs no change here.
 */
export const REQUIRED_FILTER_PARAMS = ["region", "category", "checkIn", "checkOut", "room", "rooms", "adults", "children", "flex", "travellers", "sort", "minPrice", "maxPrice", "q"] as const;
