# Responsive testing (Playwright)

Last updated: 2026-11-25

## Purpose
Checks that every page works at every device size, in the browser, and a side-by-side look at the mobile design screenshots. It is emulation (viewport, touch, user agent), not real devices.

## Routes
All built routes, from the routes contract and `e2e/dynamic-routes.ts` (`e2e/responsive/routes.ts`): Home, destinations (index, country, region), category and group pages, lifestyle (5), hotel, experience and package details, `/search` (hotel, experience, package, no dates, empty), support, privacy, terms, the 5 `/account/*` pages (with the mock dev session cookie `vku_dev_session`; no real auth) and the 404 page. Checkout is left out (stub).

## Data
Mock data (`USE_MOCKS=true` in `.env.local`) and fixed 2099 dates, so results are the same every run. No network service is stubbed: photos load from the CDN the site uses.

## How to run
| Command | What it does |
|---|---|
| `npm run test:responsive` | Quick run: Chromium at 375, 768 and 1280, on the dev server (`next dev` on port 3001, reused when running). |
| `npm run test:responsive:full` | `npm run build`, then the whole matrix against `next start` on port 3001. |
| `npm run test:responsive:baseline` | Generates (or rewrites) your local screenshot baselines (production server, Chromium 375, 768, 1280). Not committed. |
| `npm run test:responsive:report` | Prints the route x size table and the distinct problems from `test-results/responsive.json` (also written to `screenshots/responsive-check/summary.md`). |

Environment: `PW_SET=quick|full`, `PW_MODE=prod` (`next start`, never reuses a running server), `PW_PORT` (default 3001; the Vitest server `e2e/global-setup.ts` uses `E2E_PORT` 3199 and refuses to start on `PW_PORT`), `PW_WORKERS`. One project: `npx playwright test --project=phone-390`. For the JSON file add `--reporter=dot,json` with `PLAYWRIGHT_JSON_OUTPUT_NAME=test-results/responsive.json`. Restart the dev server after editing `globals.css` (it served stale CSS twice).

Playwright only runs `e2e/responsive/*.spec.ts`. The older rendered-HTML suite is Vitest (`e2e/*.test.ts`, `npm run test:e2e`, port 3199) and is untouched.

## Matrix (`playwright.config.ts`)
- Phones 320x568 (overflow and critical flows), 360x740, 375x812, 390x844, 412x915, 430x932; landscape 667x375 and 844x390.
- Tablets 600x960, 768x1024, 820x1180, landscape 1024x768.
- Laptop 1280x800, desktop 1440x900, 1920x1080, 2560x1440.
- WebKit at 390, 768 and 1280; Firefox at 1280. Touch (and `isMobile` in Chromium) for phones and tablets.
- Quick set: 375, 768, 1280 in Chromium.

## Checks
- `layout.spec.ts` (every route and size, one soft assertion per rule): page overflow and elements wider than the viewport (the selector is in the message); tap targets of 44x44 on touch projects; clipped text (no ellipsis); tap stealing (five points inside every control are hit-tested while walking down the page: the element under the finger must be the control itself, so the invisible hit area of a neighbour never covers it); fixed or stuck bars overlapping each other (at the top, half way and at the bottom of the page); a fixed bar covering the last footer line; images (loaded, sized, inside their parent); content stays in the 1280 px column and centred from 1920; layout shift below 0.1.
- `health` checks live in `openRoute` (`helpers.ts`): console errors, page errors and failed requests are collected; hydration warnings are kept apart.
- `interactions.spec.ts` (touch projects): header menu (focus trap, scroll lock, Escape, focus back, accordion), travellers selector (rooms never above adults, child ages), date picker (fits the width, range by touch), `/search` (summary bar, filter drawer, chips, sort, pager, list/grid toggle from md), detail tabs, booking bar and footer, photo gallery and viewer (focus, swipe, Escape), login dialog with a half-height keyboard, portrait to landscape and back.
- `listing.spec.ts`, `detail-sticky.spec.ts`, `nav.spec.ts`: Task 7 (see Task 7 checks).
- `task10.spec.ts`: Task 10: no class stars in hotel cards (home, a category, search results, "You might also like"; the class stays as screen-reader text, no gap), and the photo grid height at 320 to 1024.
- `round2.spec.ts`: Task 9 (the second round of screenshots): detail header order (breadcrumb, actions, title block), focus order, the unclipped action row and the hero with three thumbnails; the reserve bar's rooms list and `--booking-bar-h`; the search pill at every width on seven pages; the room dialog footer; the content-height search sheet; the tabs switch at 400px; the account menu grid.
- `account-pages.spec.ts`: the five account pages at 320 to 1024 (column inside the viewport, no sideways scroll; from 768 to 1023 the account tab row's fades at each end). The fade rule in `chips.spec.ts` is position-aware: 28px only on an edge with more content beyond it.
- `preference-tiles.spec.ts`: Task 8, the wizard's activity tiles (columns 1/2/3/4/5 at 320 to 1920, one gap, 16:10, 44px tiles, no sideways scroll, click and Space, live count, Continue below the last row, reduced motion).
- `detail-header.spec.ts`: the detail header order, the newsletter and the rating lines (see Detail header, newsletter and ratings).
- `booking-bar.spec.ts`: the reserve bar of the detail pages (see Reserve bar).
- `search-bar.spec.ts`: the search bar, the pill and its sheet (see Search bar).
- `panels.spec.ts`: the search panels at six widths and the menu header buttons (see Search panels).
- `chips.spec.ts`: chip, pill, badge and tab rows and the results toolbar (see Chip rows).
- `grids.spec.ts`: the card grids at eight widths (see Card grids).
- `safe-area.spec.ts`: the viewport meta asks for `viewport-fit=cover` and the booking bar's bottom padding is the safe area and the bar is 5rem plus it (Chromium cannot fake a notch; real insets are a hand test).
- `a11y.spec.ts`: axe (WCAG 2.2 A and AA) at 375 and 1280 on every route. Serious and critical findings fail, except the known ones below.
- `compare.spec.ts`: our pages at 390 and 430 into `screenshots/responsive-check/design/`, to look at next to the design. No pixel diff.
- `baselines.spec.ts`: full-page baselines for 6 pages x 3 sizes in `e2e/responsive/__baselines__/<project>/` (about 22 MB). **They are git-ignored and not committed.** Generate your own set once on a clean checkout with `npm run test:responsive:baseline`, make your change, then run `npm run test:responsive` to see what moved. Without a local set the spec skips itself instead of failing. Regenerate after a deliberate visual change, and look at the diff first. The fields that show today's date are masked.
- All pages are settled before any check: hydrated, animations and transitions off, caret hidden, Next's dev overlay hidden, fonts and lazy images loaded.

## Card grids
One rule for every card grid, in `src/constants/grids.ts` and the `CardGrid` component (`src/components/ui/card-grid.tsx`). Counts follow the viewport width. A page never writes its own `grid-cols-*`. Home carousels are not grids and keep `CardCarousel`'s own rule.

| Grid | Where | Columns | Gap | Photo |
|---|---|---|---|---|
| `tiles` | Home Popular Destinations, All Destinations (every region), Lifestyle destinations | below 560: 1, 560-767: 2, 768-1023: 3, 1024+: 4 | 24 | 4:3 alone in the row, square from 560 |
| `tiles` as a carousel | Region page "popular destinations" (`TILE_CAROUSEL_COLS`) | 1.4 (the next tile peeks in) below 560, then 2, 3, 4 at the same widths | 20 | square |
| `listing` | Region and country offers, hotel and experience categories and groups, "You might also like", Favorites, My trips, search results (grid view) | below 640: 1, 640-1279: 2, 1280+: 3 | 24 | one per card type: 4:3 hotels and experiences, 3:2 packages |

- **Search results:** the filter sidebar shows from 1024 (it used to show from 768 and left a 465px column: the stretched card of the tablet screenshot); below 1024 the filters are in the drawer and the cards have the whole width. The List and Grid toggle shows from 768; a phone always gets the list cards of the mobile design, even when the URL says `view=grid` (the URL is not changed, `useMinWidth(768)` decides). The default view is **list at every width**. The list card is horizontal from a 672px column (about 720px viewport and up); in a 576-671px column it is stacked with a 5:2 photo, below that 2:1.
- **Destination tiles:** the fixed 296px height is gone, so the shape holds at every column count. The caption is at most 40% of the tile (two lines of text plus padding), inside it, text not clipped; the photo is framed from its upper third (`object-position: 50% 35%`) so the caption covers the foreground. There is no per-photo focal point, so a subject low in a photo can still sit behind the caption.
- **Test:** `grids.spec.ts` resizes each page through 375, 430, 600, 768, 820, 1024, 1280 and 1440 and checks the columns of the first row, the narrowest card (at least 215px), page and grid overflow, one photo shape per grid, the caption share, and the sidebar. It runs once, in the 1280 project. My trips has no grid to measure (the mock account has no bookings).

## Chip rows and the results toolbar
`ScrollRow` (`src/components/ui/scroll-row.tsx`) is the one component for every row of chips, pills, badges and tabs. Below 1024 it is ONE line that never wraps: it scrolls sideways (scrollbar hidden), the edge that has more fades (28px mask), the chosen item (`aria-pressed`, `aria-current`, `aria-selected`) is scrolled into view on load and when it changes, and the row has 8px of padding above and below (cancelled by a -8px margin, so the layout does not move) for the 44px tap area of a 30-34px chip and the focus ring. From 1024 it wraps like before (`wrap`); tab rows (`wrap={false}`) scroll at every width. A row with nothing focusable in it (badges) becomes a focus stop itself while it scrolls. A caller that sets a top margin writes it as `mt-[calc(<space>-8px)]`.

| Row | Where |
|---|---|
| Experience types (Featured Experiences), hero "Popular" chips | Home |
| Filter chips (lifestyle packages), sub-navigation | Lifestyle pages |
| Region pills (`FilterChips`) | All Destinations |
| Applied filters + "Clear all" | Search results |
| Flexibility chips | Date and booking panels |
| Highlight badges, section tabs | Hotel, experience and package pages |
| Account menu | Account (a 2-column grid below 768, a scrolling row from 768, a vertical list from lg) |

**Not applied, on purpose:** lists whose items are content, not navigation: amenity and tag lists inside cards and detail sections, preference chips in the account wizard and summary, the category pills inside the search suggestion panel, breadcrumbs. They are information or a choice to be seen at once (hiding half of them in a scroller hides data), and a row inside a linked card cannot scroll. Say if one of them should scroll too.

**Results toolbar:** "Filters" (the drawer button below 1024) or "Hide filters", the count, Sort and List/Grid are one line from 768, one vertical centre, one control height (34px; 44px on touch screens, because a select cannot carry the invisible tap area). From 1024 the sidebar header ("Filters", "Clear all") has the same height and centre as that line.

**Test:** `chips.spec.ts` opens every route and checks each `[data-scroll-row]`: one line and one centre below 1024, no wrap, scrolls, fade, tap-area room, the chosen item in view; wrapping and visible overflow from 1024. Also with filters applied and the drawer open, with the date and travellers panels open, the picked chip scrolling into view, and the toolbar (one line and one centre from 768, same centre per line on phones, one control height, sidebar header aligned).

## Search panels and the menu header
The four panels of the search box follow one rule (see search.md, Panels): from 1024 anchored to the field and kept inside the bar and 16px from the viewport edge; below 1024 a bottom sheet (dates, travellers) or a bar-wide list with a Close button (type, destination). `panels.spec.ts` opens each panel in the hero, the docked bar, the results page's bar and on four more pages at 375, 430, 768, 820, 1024 and 1280 and checks: no sideways scroll of the page, the panel inside the viewport, inside the bar and 16px from the edge, not wider than the bar, the left edge on the field's when there is room (else pushed left to the edge of the bar), the panel on top at five points (sticky tabs and bars), the sheet full width with a Close button, Tab never leaving it, Escape closing it and returning focus to the field, and the lists as wide as the bar with a working Close button. It also opens the menu below 1024, closed and open, and checks that the account button and the menu or close button have the same width and height, are square, round, at least 44px and aligned. It runs once, in the 1280 project. In the docked bar at 768 the fields are icons only, so the test taps the field (the label).

## Search bar
Layout and rules: search.md ("The search box"). `search-bar.spec.ts` resizes the hero, the docked bar and the pill's sheet through 320 to 1440 (and 844x390 landscape) and checks: nothing is cut (no ellipsis, no clipped field or box, with the longest type, the longest destination, the longest stay and the most guests, on every tab); the hero's columns (1, 2, 4), fields of 48px or more, a full-width Search under the 2x2 grid; the tabs (equal, 44px or more, a 20-24px icon, a 13px label, no overlap or clipping at 320); the pill below 1280 and the row from 1280, none on a phone outside `/search`; the sheet (stacked fields of 48px or more, Search on screen while the body scrolls, scrolling inside in landscape, focus kept, Escape, focus back); the on-screen keyboard (a shorter viewport: the focused field and Search stay in view, typing filters in place); rooms never above adults; and the same search gives the same URL from the hero and from the sheet. The real keyboard of a phone is on the hand-test list.

## Reserve bar
Below lg the hotel, experience and package pages have a fixed bar (see availability-flow.md, Mobile). `booking-bar.spec.ts` checks it at 375, 430, 768 and 844x390, on the three pages: no dates means no price and one full-width "Select dates" with an icon that opens the dates; with dates the summary is one button (44px or more, a chevron, a pressed and a focus state), nothing in it is cut, its accessible name starts with its visible text and ends with "Change dates and guests" (no aria-label), and tapping it opens the sheet and gives the focus back; experiences and packages show no rooms line or total; nothing available says so with no price and a disabled button; the bar is 5rem plus the safe area in every state and equals `--booking-bar-h`; the last line of the footer ends above it; going from loading (the availability request delayed) to loaded does not move or resize the bar and shifts nothing (under 0.01). Hotels: the rooms line says what to do, then the count and the types, only the count in landscape and none at 320px, and the total follows. The Next.js dev indicator ("N") is hidden in every test and screenshot (`nextjs-portal`, `helpers.ts`).

## Detail header, newsletter and ratings
`detail-header.spec.ts` (320, 360, 390, 768, 1024; the newsletter also at 1280): the three detail pages read gallery, header, tabs below 1024 while the DOM keeps the header first (one h1, before the first h2 and before the gallery); below 768 the header's parts come in the order title, rating and review count, location, key facts; no block of the header overlaps another, nothing leaves the screen or makes the page scroll sideways, and a long title (injected) wraps over several lines, is not cut and does not run into the rating; the footer's last line stays above the reserve bar (`--booking-bar-h`) at 320, 360, 390 and 768. The newsletter stacks below 640 (text, name, email, button, each full width and 44px or more, labels visible), is a row from 640 and sits beside the text from 1280. The rating lines (the detail header, the cards, the review form): the text shares one baseline and the stars' centre line, nothing is clipped, and a review count that does not fit wraps below, never over. It runs once, in the 1280 project.

## Task 7 checks
`listing.spec.ts` (320 to 1280): the filters drawer stays open while a checkbox, the price slider and the rating change, the URL changes by replace (no new history entry), the focus stays on the control, the count is announced politely, and the four ways to close it close it and return the focus; no card of search (list, grid), Home, a category, a region or the related cards of a detail page says "Select your dates to see prices"; a card without dates has no price text and the same height as with a price. `detail-sticky.spec.ts`: on the three detail pages the pill (768 to 1279) or the row (from 1280) is there from the first pixel and sticks right under the navbar, nothing shifts when it sticks, the sticky tabs sit under both, tapping a tab never hides the start of its section, every in-page anchor has a scroll margin for the navbar and the bar, and below 768 the reserve bar is the only fixed element at the bottom; the review box does not pass its scroll to the page at its end (wheel, and a touch swipe through the Chrome DevTools protocol), and is a named tab stop that scrolls by keyboard. `nav.spec.ts`: the desktop items (1024, 1280) open on a click, Enter, Space or ArrowDown and never navigate, arrows move between links, Escape returns the focus, hover opens, "View all" goes to the section; the mobile menu (320 to 768) toggles its sections and never navigates. `e2e/nav-html.test.ts` (Vitest, built server, no JavaScript): every dropdown link and "View all" item is a real link in the HTML.

## Tap-target rule
44x44 on touch screens (`pointer: coarse`). `globals.css` gives every `button`, `[role=button|tab]` and icon link (and block-level link such as a button link) an invisible 44x44 `::after` centred on it, and a `<select>` and the price inputs are really 44 px tall. The test counts that hit area, and `tap-stolen` checks it never covers a neighbour (it found the footer social icons: 15 px icons 20 px apart, so each hit area sat over the previous icon; on touch screens they are now 44 px boxes next to each other). Dense places checked and clean: filter chips, pager, ratings, card actions, tabs. Not covered: controls that exist only while a drawer or dialog is open. Allowlist: text links inside a sentence, footer and breadcrumb text links (stacked lists; WCAG 2.5.8 spacing), and the image dots (`aria-label="Go to image N"`, 20 px apart; swiping is the way to move).

## Known findings (not code fixes)
- **Colour contrast** (axe `color-contrast`, serious): the brand tokens muted blue `#a7bcc1` (1.97:1 on white, 1.87:1 on `#f9f9f7`) and gold `#c49a6c` (2.56:1 on white; white text on gold buttons is also 2.56:1) are used for text on most pages. Listed as annotations, not failures. Every use, its ratio and a proposed alternative for the designer: [../contrast-gold-and-muted-blue.md](../contrast-gold-and-muted-blue.md).
- **Price slider thumbs** (axe `target-size`): the two stacked thumbs are 16 px on pointer devices (the prototype's size; 28 px on touch).
- **Real devices** are not covered (see below).

## Design comparison (mobile design folder)
Screenshots in "vacayou mobile design": Home, Menu, Search, Search (open), Experience, Account, Checkout 1 to 9. They were taken at different widths (about 2x of 420 to 520 px; the logo is 29% of the image width in Home and Menu, which is a 460 px screen, 32% in Account, 26% in Experience). Our 430 px captures are the closest match, 390 px is the narrow end. Source of truth: Home, Menu, Search, Search (open), Experience, Account. Differences that are decisions, or need one, are not copied:
- Search: Map button (skipped earlier), no Sort at phone width (ours keeps Sort, hides List/Grid below md), the open search uses an underlined tab row with the close button inside (ours reuses the home search box).
- Experience: no breadcrumb and a small "Back to search results" button (adopted, see below), a photo mosaic with "Watch video", a bottom bar with a full-width "Reserve now to lock in price" button.
- Home: no default dates in the search box ("Add dates"; **not changed**: the search URL always carries dates, a cleared bar falls back to the default stay and tests rely on it, so removing the default is a decision about the search rules), a newsletter block, two rows of "moments" tiles and static footer logos on phones (ours: one scrolling row and a marquee), tag and avatar icons of the magazine cards.
- Menu: the Lifestyle group shows Magazine and Glossary (ours: groups from the navigation data and a featured card).
- Account: sample trip and favorites (our mock session has none).
- **Checkout 1 to 9** (accordion booking flow: dates and guests, accommodation with hotel and room cards, golf and spa add-ons, guest form, payment, price sheet, confirmation page) are kept for later: there is no checkout to compare them with, and the flow (hotel plus golf) is not built.
Adopted on request: "Back to search results" on a detail page opened from a result card (the results URL is kept in `sessionStorage`, `src/helpers/search-return.ts`; shown only while the detail path matches), and compact "You might also like" cards (`compact` on the hotel, experience and package cards: no chips or highlights, the rating and the price share the bottom row). Fixed after the comparison: card carousels show a peeking second card on phones (`--cols:1.4`), the search list card photo is 2:1 on phones, the detail page title is 24 px on phones, Support and Favorites sit at the bottom of the menu.

## Still to test by hand on a real phone
Safari's address bar and toolbar (address bar collapse with `dvh` heights), the real home bar and notch under the fixed bars (the code adds `env(safe-area-inset-*)` padding, see Decisions, but only a real device shows it), the real on-screen keyboard (the test only shrinks the viewport), rubber-band scrolling and pull to refresh, momentum scrolling of the carousels, pinch zoom, real Safari form controls (date and select pickers), notch and landscape insets.

## Decisions
- Hit areas are one global rule in `globals.css`, not a class on each component, so new buttons are covered.
- The 44 px rule has the three allowlist entries above; everything else fails.
- Safe areas and heights: the site layout (`src/app/(site)/layout.tsx`) exports `viewport-fit=cover` (not the root layout: from there the responses lose `x-nextjs-prerender: 1`); the fixed booking bar, the full-screen overlays (menu, gallery, viewer, room details, video, filters drawer) and `<body>` (side insets) add `env(safe-area-inset-*)` padding (`src/constants/safe-area.ts`); `max-h-[90vh]`-style heights are `dvh`; `min-h-svh` stays for page-high skeletons.
- Swipe: `useSwipe` (`src/hooks/use-swipe.ts`) in the photo viewer and in room-row photos (`ImageCarousel swipe`); not on cards inside sideways lists, where the swipe belongs to the list.

## Open questions
- A darker text tone for muted blue and gold, to pass contrast (design decision, proposal in [../contrast-gold-and-muted-blue.md](../contrast-gold-and-muted-blue.md)).
- Whether Home shows "Add dates" instead of default dates (needs the search rules changed: a search without dates).
- Whether the phone menu, search and detail screens should follow the mobile design where it differs (list above).

## Changelog
- 2026-11-25: `listing.spec.ts`, `detail-sticky.spec.ts`, `nav.spec.ts` and `e2e/nav-html.test.ts` (task 7 of the Responsively review).
- 2026-11-24 (3): `detail-header.spec.ts` (task 6 of the Responsively review).
- 2026-11-24 (2): `booking-bar.spec.ts` (task 5 of the Responsively review).
- 2026-11-24: `search-bar.spec.ts` (task 4 of the Responsively review); the docked row of `panels.spec.ts` runs from 1280 (below it the pill and its sheet).
- 2026-11-23 (3): Search panels (`AnchoredPanel`, `SearchSheet`) and `panels.spec.ts` (task 3 of the Responsively review); the menu's account button is a 44px circle.
- 2026-11-23 (2): `ScrollRow` and `chips.spec.ts` (task 2 of the Responsively review); toolbar controls 44px on touch screens.
- 2026-11-23: Card grid rule and `grids.spec.ts` (task 1 of the Responsively review); the results sidebar moves from `md` to `lg`.
- 2026-11-22 (2): Baselines are git-ignored (generate locally); `tap-stolen` check and footer social icon fix; safe-area and `dvh` fixes with `viewport-fit=cover`; "Back to search results"; compact similar cards; contrast list.
- 2026-11-22: Suite created: matrix, layout, interaction, axe, comparison and baseline specs; scripts; hit-area rule; fixes found by it (date picker off screen at 768 to 1024, results never loading after React's dev double effect, footer under the booking bar, account and search layout shift, focusable moments strip, "Edit search" accessible name, swipe).
