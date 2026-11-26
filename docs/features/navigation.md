# Navigation (header menus)

Last updated: 2026-11-25

## Purpose
The sticky header's mega menus (Experiences, Destinations, Hotels), the Lifestyle panel and the mobile accordion, all driven by one cached data set. Every menu item is a real link built with the route helpers.

## Routes
- No pages of its own. Menu hrefs use `experienceCategory`, `hotelCategory`, `destination`, `destinationRegion`, `experienceGroup`, `hotelGroup` and `ROUTES` from `src/constants/routes.ts`; Lifestyle has two columns (`layout: "columns"`): Lifestyle (Magazine and Glossary, the external `EXTERNAL_URLS`, new tab) and Lifestyle Vacations (Adventure, Golf, Meditation, Spa, Yoga, linking to the [lifestyle pages](lifestyle.md) via `lifestyleVacation()`), plus a featured package card (`featured.heading`, `featured.cta`) that is a placeholder (`TODO(api)`).
- **A header item only opens its dropdown, it never navigates** (decided 2026-11-25). Every trigger (Experiences, Destinations, Hotels, Lifestyle) is a `<button>` with `aria-expanded` and `aria-controls`; the `href` of a menu in the data (Destinations) is not used by the trigger. Each dropdown ends with a "View all" link to its section (`footerLink`: View all experiences, View all destinations, View all hotels; Lifestyle has no section page), and a mega panel's group lists end with "View all <group>" when the group has a page. The left-hand group rows link to the group pages (hover or focus previews their links; a click or Enter follows); the right-hand items link to the category pages.
- **Server HTML:** every dropdown, with every link of every group, is rendered in the HTML as real `<a href>` (a closed one is `hidden`, not missing; only the active group's list is visible, the others are `hidden`), so crawlers and a page without JavaScript have them. `e2e/nav-html.test.ts` reads the built server's HTML (no JavaScript) and checks every link, the "View all" items and that the triggers are buttons.
- **Interaction (desktop, from 1024):** hover opens a dropdown and closes it 120ms after the pointer leaves; a mouse click keeps it open and never navigates; touch: a tap opens it, the next tap closes it; Enter, Space or ArrowDown open it and move the focus into it; focus alone opens it; ArrowDown and ArrowUp move between the links (ArrowDown and ArrowUp between the groups, ArrowRight into the links, ArrowLeft back); Escape closes it and returns the focus to the trigger; tabbing out or pressing outside closes it. **Mobile menu (below 1024):** the rows are toggles only (no link on a row); an expanded section ends with its "View all" link; the menu works from 320 to 1023.

## Data
- `getNavigation()` (`src/features/navigation/get-navigation.ts`) returns `NavMenu[]` (`src/interfaces/navigation.ts`: `NavMenu`, `NavGroup` with optional `href`, `NavLink`, `NavFeatured`). Mock only: `src/mocks/services/navigation.mock.ts`, `src/mocks/fixtures/navigation/index.ts`; menu labels in `src/constants/navigation.ts`. Counts: Experiences 46 links in 6 groups, Destinations 57 in 6, Hotels 43 in 6, Lifestyle 2.
- Without a navigation service (mocks off) it returns `[]`: the header shows only the logo and account button.
- UI: `src/components/layout/main-nav.tsx` (shared `MegaPanel`: hover or focus previews a group, a group with `href` navigates on click and closes the panel; keyboard and touch behaviour is described in `docs/ARCHITECTURE.md`) and `mobile-menu.tsx` (a menu with `href` is a link plus a chevron button that toggles the accordion; groups with `href` get a "View all <group>" link).

## Caching
- `"use cache"`, `cacheLife("days")`, tag `navigation`; read in the `(site)` layout without cookies or headers. The session-dependent part (`SessionHeader`) sits in `<Suspense>`; its fallback is the signed-out header, and the account pill has a minimum width so the swap does not shift the layout.

## SEO
- Links are plain anchors; no markup. Nothing here is a page, so no `pageSeo`. The group and category pages the menus point to are in the sitemap via the catalog.

## Tests
- `src/features/navigation/get-navigation.test.ts` (link counts, every link resolves to a page), `get-navigation-errors.test.ts`, `src/components/layout/main-nav.test.tsx`, `mobile-menu.test.tsx`.

## Decisions
- [Group listing routes](../PROJECT_DECISIONS.md#group-listing-routes).
- `docs/NAVIGATION_SPEC.md` is the original investigation (a draft, partly superseded by this doc).

## Open questions and mocks
- Featured cards (title, price, image) are mock and their prices are pre-formatted strings, not `Money`; the Unsplash images are hotlinks.
- The desktop breakpoint is `lg` while the original uses `md` (does not fit at 768px); not decided.
- Maldives, Sri Lanka and Zanzibar appear in two Destinations groups; their links point to one page.
- The Lifestyle links go to the existing vacayou.com magazine and glossary, which have no page here.

## Changelog
- 2026-11-25: Header items only open their dropdown (buttons, never links); every dropdown and every link of every group is in the server HTML; each dropdown ends with "View all"; arrow keys move between links; the mobile menu rows are toggles. Task 7 of the Responsively review.
- 2026-11-23: The menu header's account button is a 44px circle in both menu states (it was a wide pill when the menu was open).
- 2026-11-22 (2): The phone menu keeps the safe-area insets (`viewport-fit=cover`); the footer social icons are 44 px boxes on touch screens.
- 2026-11-22: Mobile menu: Support and Favorites moved to the bottom (mobile design).
- 2026-11-19: The footer's Magazine and Glossary links are external too (`EXTERNAL_URLS`, new tab, `rel="noopener"`, "opens in a new tab" hint); `ROUTES.magazine` and `ROUTES.glossary` are gone.
- 2026-11-19: The five Lifestyle Vacations links point to the new `/lifestyle/<slug>` pages instead of experience categories.
- 2026-11-19: The Lifestyle menu is a three-column panel (Lifestyle, Lifestyle Vacations, featured package) instead of a small dropdown.
- 2026-11-17: The Hotels featured card links to the real hotel detail page (`azure-spa-and-wellness-resort-krabi`).
- 2026-11-17: Doc created, backfilled from the source. The account pill got a fixed minimum width for the Suspense fallback; menu hrefs come from the route helpers.
- 2026-11-16: Data-driven menus, group links and the shared panel were built (`src/features/navigation` created this day, file-system date; investigation in `docs/NAVIGATION_SPEC.md`). History before this date not documented (no git history).
