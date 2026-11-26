/*
 * The two card grids of the site. Every page that lays out cards uses one of them (through `CardGrid`, or the class strings for
 * a skeleton); a page never writes its own `grid-cols-*`. Counts follow the viewport width, not the width of a parent, so the
 * same card has the same size on every page. Home carousels are not grids and keep their own rule (`CardCarousel`).
 *
 *   tiles    destination, region and country tiles   below 560: 1   560-767: 2   768-1023: 3   1024+: 4
 *   listing  hotel, experience and package cards     below 640: 1   640-1279: 2   1280+: 3
 *
 * With the filter sidebar (search results, 1024+) the listing grid has 2 columns up to 1279, then 3; below 1024 the filters are
 * in the drawer and the grid has the whole width. At the narrowest column counts a card is never narrower than about 220px.
 */
export const TILE_GRID = "grid grid-cols-1 gap-6 min-[560px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
export const LISTING_GRID = "grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3";

/** Photo tiles you pick from (the preferences wizard): 1 below 400, 2 from 400, 3 from 768, 4 from 1024, 5 from 1280. */
export const PICK_GRID = "grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";
/** `sizes` that match PICK_GRID, for the tile photos (the wizard card has 32px of padding a side from 640). */
export const PICK_GRID_SIZES = "(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 400px) 50vw, 100vw";

/** The same tile counts for a carousel of tiles (region pages): on phones the next tile peeks in, as in the mobile design. */
export const TILE_CAROUSEL_COLS = "[--cols:1.4] min-[560px]:[--cols:2] md:[--cols:3] lg:[--cols:4]";

/** Photo ratios (width / height), one per card type, so a card is the same shape in every grid. */
export const TILE_ASPECT = "aspect-[4/3] min-[560px]:aspect-square";
