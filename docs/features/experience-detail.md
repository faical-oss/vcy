# Experience detail

Last updated: 2026-11-25

## Purpose
`/experiences/e/<slug>`: one experience with a gallery (video modal, lightbox), four tabs (Overview, Itinerary, Hotel & Rooms, Reviews), a sticky booking card priced per person, and three related experiences. Built from the Figma Make spec (`vacayou-experience-spec/SPEC.md`, screenshots S01 to S18) on the shared detail shell of the hotel page.

## Routes
- `experienceDetail(slug)` in `src/constants/routes.ts` (`/experiences/e/<slug>`, the provisional scheme of PROJECT_DECISIONS; the spec's `/experiences/[slug]?tab=` was not used). The slug is the experience card id. Page: `src/app/(site)/experiences/e/[slug]/page.tsx` (no `loading.tsx`: an unknown slug is a real 404 on the first request).
- The tab is chosen by the URL hash (`#itinerary`, `#rooms`, `#reviews`); every panel is in the server HTML. Stay parameters: `checkIn`, `checkOut` (the start plus the fixed nights), `rooms`, `adults`, `children`, `childAges`, `flex` (all in `FILTER_PARAMS`, so a dated URL is noindex,follow with the clean canonical).

## Rules
> Updated 2026-11-18: the availability flow ([availability-flow.md](availability-flow.md)) replaces the single "Check availability" button and the "From $X per person" header below; prices show only after dates are chosen, and "Reserve now" opens checkout once rooms are available.

- Price is per person ("From $X per person"); the duration is fixed. Picking a start date sets the end date (`departureEnd`, `src/helpers/experience-stay.ts`).
- Group size lives in one constant, `EXPERIENCE_GROUP_SIZE` (`src/constants/experience.ts`, default 4 to 12): the maximum is enforced (the adults and children steppers stop at it, `travellerLimits`; the server rejects a larger group); the minimum is only the note "Runs with 4+ guests" and never blocks "Check availability".
- One primary button, "Check availability": without dates it opens the dates; with a valid stay (dates, the fixed nights, a group within the maximum, child ages, rooms <= adults) it opens the checkout stub with the stay in the URL (parameters below). There is no Reserve now button. While there is no checkout (`FEATURE_CHECKOUT_STUB` off) it says "Online booking opens soon."
- **Rooms are not chosen on this page (decided 2026-11-18, Figma change); they are chosen in checkout.** The Hotel & Rooms tab is informational: room cards with the photo carousel, the details dialog, features and a "From $X per person" price. The experience cards have no "Select room" button (removed 2026-11-18); `HotelRooms` takes an optional `action`, so the cards stay informational; `RoomCheckoutLink` and `ExperienceRoomCheckoutAction` stay exported for a shortcut later. Hotels do not follow this: they choose rooms on their page. The page price stays "From $X per person"; no total depends on a room selection.
- Used by the hotel page and left in place for checkout (exported and tested, not rendered on this page): `RoomPicker`, `RoomsSummaryBar`, `ReserveGate`, `ExperienceBookingPrice`, `ExperienceRoomAction`, `ExperienceRoomsSummary`, `ExperiencePricePanel` with `followSelection`, `helpers/room-selection.ts`, `helpers/guest-rules.ts`, `helpers/experience-pricing.ts` (per-person pricing, guests split over the chosen rooms), `store/stay-store.ts` (selection saved by page and dates).

### Parameters the checkout accepts
| Parameter | Meaning |
|---|---|
| `type` | `hotel` or `experience` |
| `id` | the hotel or experience slug |
| `checkIn` / `checkOut` | ISO dates; for an experience `checkOut` is always `checkIn` plus its nights |
| `rooms` | 1 to 8, never more than adults |
| `adults` | 1 to 9 (experiences: up to the group maximum, 12) |
| `children` | 0 to 6 |
| `childAges` | comma-separated ages 0-17, one per child; absent without children |
| `flex` | date flexibility in days (1, 2, 3 or 7); absent for exact dates |
| `roomId` | optional: a room preselected from a room card; never required |

- Children need an age (0-17); there is no default: the select shows "Select age" and a missing age makes the search invalid. Adults go up to the group maximum (12, `EXPERIENCE_GROUP_SIZE`). Favorite requires login (`DetailActions`).

## Data
- `ICatalogService.getExperience(slug)`, `getSimilarExperiences(slug, limit)`, `listExperienceSlugs(limit)` and `ExperienceDetail` (`src/interfaces/detail.ts`). Mock content: `mocks/fixtures/catalog/experience-detail-builder.ts` (one coherent dataset per base category, filled with each card's place, provider, nights and price). Rooms reuse `HotelRoom` and the ten room types (`room-types.ts`; `priceFrom` is per person).
- Live availability: `IAvailabilityService.getExperienceAvailability` (`ExperienceAvailabilityQuery`, per-person prices and per-room `available`), cached 60 s (`loadExperienceAvailability`). Server panels: `src/features/availability/experience-availability.tsx`.

## Caching and SEO
- Static shell: `getExperience`, `getSimilarExperiences` are `"use cache"`, `cacheLife("hours")`, tags `catalog`, `experience:<slug>`, `category:<slug>`. `searchParams` are read only inside `<Suspense>`.
- Unique title and description per experience (`experienceDetailMetadata`, at most 160 characters), canonical to the clean URL (`pageSeo`), Open Graph, `Product` JSON-LD through `productJsonLd` (no rating or price while mocks are on), a visible breadcrumb with its `BreadcrumbList`. In the sitemap and in `e2e/dynamic-routes.ts`.

## Tests
`src/helpers/experience-stay.test.ts`, `experience-pricing.test.ts`, `src/mocks/fixtures/catalog/experience-details.test.ts`, `src/components/sections/experience/experience.test.tsx`, `src/features/availability/experience-availability.test.tsx`, plus the gallery and lightbox tests in `src/components/sections/detail/detail.test.tsx`.

## Open questions and mocks
- `TODO(api)`: group size per experience, the real video URL and captions, 23 photos (the mock has 8), venue coordinates for the map, the real price rule across several rooms (shared occupancy, child prices), children's ages and the per-room guest split in the availability request, flexibility, real reviews and review submission (the form reuses the hotel review action), a checkout to continue to (Continue is off).
- The Favorites count badge in the header (spec section 2) is not part of this page.

## Photo gallery modal (Airbnb style, shared by hotels and experiences)
- **Open:** a click on any photo of the page gallery, the "+N more" tile, or the two links below `md` opens the full-screen modal (`PhotoGalleryModal`, `src/components/sections/detail/photo-gallery-modal.tsx`, opened by `DetailGallery`). A click on a specific photo scrolls the modal to that photo's section (the first group is already at the top, under the strip). The page's visible photos stay in the server HTML; the modal's content mounts on open.
- **Layout:** a strip at the top, fixed (sticky) while the sections scroll, with one thumbnail and label per group (one click scrolls smoothly to the section, which stops just under the strip; the current group is highlighted as you scroll; keyboard-focusable buttons); then one section per group: the title on the left (sticky from `md`), the grid on the right (one full-width photo, then two side by side, repeating, all with fixed aspect ratios and lazy loading). Below `md` it is one column with the title above the grid and no sticky title.
- **Dialog behaviour:** role dialog and aria-modal, label "Photos of <name>", Radix focus trap, scroll lock and focus return (to the photo or tile that opened it), Escape and the close button close it. It lives in the `#photos` hash (`useHashDialog`): opening adds a history entry, so the browser back button closes it and returns to the page's tab hash (`#rooms`) without scrolling; closing goes back exactly once. A link that already ends in `#photos` opens it.
- **Lightbox:** a photo in the modal opens the existing `PhotoLightbox` (arrows, keyboard, counter over all photos); closing it keeps the modal and its scroll position and returns focus to that photo.
- **Data:** `GalleryGroup { id, title, thumbnail, images[] }` (`src/interfaces/detail.ts`), optional `galleryGroups` on `HotelDetail` and `ExperienceDetail`. Hotels: Overview, one group per room type, then Pool, Restaurant, Lobby. Experiences: Overview, Accommodation, Activities, Food, Facilities. Mock (`mocks/fixtures/catalog/gallery-groups.ts`); `TODO(api)`: images grouped by category. Without groups the modal is one "All photos" section and no strip (`resolveGroups`).
- **Videos in a group:** `GalleryGroup.videos` (`GalleryVideo { url, title, poster }`) show a poster tile with a play button first in their section (the Overview group has one in the mock, hotels and experiences). It opens the same player as "Watch video" in its own dialog; closing it keeps the gallery and returns focus to the tile. `TODO(api)`: the real videos and posters. The page's "Watch video" tile (experiences, from `videoUrl`) is unchanged.

## Changelog
- 2026-11-25: Task 10. Below `md` the photos are a 16:10 hero and one row of 4:3 thumbnails (it replaces the 1, 1, 2 mosaic; `--spacing-mosaic` is gone), and the header reads breadcrumb, Back, Favorite and Share side by side, then the title block (DOM, visual and focus order the same). The header's one column is `minmax(0,1fr)`, so the badge row can no longer stretch it and clip the action buttons. From `md` unchanged.
- 2026-11-25: Detail pages (hotel, experience, package) read header, gallery, tabs in DOM order at every width, with no CSS reordering of the blocks. Below `md` the header is Back, then Favorite and Share side by side, the breadcrumb, the title, the rating and review count, the location, the key facts, then the badges (this replaces the Task 6 gallery-first order; from `md` the badges still sit above the title and the rating at the end of the meta row). Below `md` the gallery is a 4-photo mosaic of 25rem (`h-mosaic`) in rows of 1, 1 and 2, with "View all N photos" on the last tile.
- 2026-11-25: The review list never traps the scroll (reverses the 2026-11-25 containment): below `md` it has no inner box and grows with the page; from `md` the box scrolls inside with `overscroll-behavior: auto` and is a keyboard stop only while it scrolls.
- 2026-11-25: No card (related cards included) says "Select your dates to see prices": a card without dates has no price text and keeps its height (`Price`). The skip-link target `#main` has a scroll margin for the navbar and the docked bar.
- 2026-11-24: Below `lg` the page reads gallery, header, tabs, and below `md` the header reads title, rating and review count, location, then the key facts (CSS `order`, the DOM keeps the header and its h1 first); the rating line wraps its review count below the score on a narrow screen. Task 6 of the Responsively review.
- 2026-11-24: The reserve bar below `lg` shows the dates, travellers and price like the booking card (hotels also the rooms chosen and the total), with an obvious change button; see availability-flow.md.
- 2026-11-24: The docked search bar (the pill from `md` to below `xl`, the row from `xl`) is on this page from the first pixel; the page reserves its 4rem, and the sticky tabs and booking box sit under it. See search.md.
- 2026-11-23: Chip, pill, badge and tab rows are one scrolling line below 1024 (`ScrollRow`); see responsive-testing.md, Chip rows.
- 2026-11-23: One card grid for the site (`CardGrid`, `src/constants/grids.ts`): tiles 1/2/3/4 columns (560/768/1024), listing cards 1/2/3 (640/1280); see responsive-testing.md, Card grids.
- 2026-11-22 (2): "Back to search results" when opened from a result card; compact "You might also like" cards; booking bar and overlays keep the safe-area insets.
- 2026-11-22: Detail title is 24 px on phones (shared header); the footer gets room under the fixed booking bar.
- 2026-11-19: Dates follow the shared `StayDuration` rule: every experience is fixed at its nights (start date only), and one (Tuscan Hills Yoga Weekend) is flexible, 3 to 7 nights: every date can be picked and a range outside the limits shows "Choose a stay of 3–7 nights.". A fixed link with a wrong end date is repaired from the start date instead of dropped (it was invalid). The date button shows the nights count. The header and title read the duration. Same page components now also serve packages ([packages](packages.md)).
- 2026-11-19: Same "Load more reviews" and green success message as the hotel page (see [hotel-detail](hotel-detail.md)).
- 2026-11-19: Uses the rebuilt review form (see [hotel-detail](hotel-detail.md)).
- 2026-11-18 (same booking card as hotels): the experience booking card uses the hotel labels ("Check-in – check-out", "Rooms & guests"); only the fixed nights, the group maximum and choosing rooms in checkout differ.
- 2026-11-18 (availability follow-ups): adults up to the group maximum (12); no default child age; the date picker closes once the range (experiences: the start date) is chosen. See [availability-flow.md](availability-flow.md).
- 2026-11-18 (availability flow): same flow as hotels: prices hidden until dates are chosen, one primary button (Check availability, then Reserve now to checkout), display-only Rooms tab with per-person prices and sold-out rooms after the search, `?mock=` scenarios. See [availability-flow.md](availability-flow.md).
- 2026-11-18 (gallery video): the Overview section of the gallery modal now starts with a video tile (mock video) that opens the player.
- 2026-11-18 (gallery strip): the modal strip is sticky, follows the scroll (current group highlighted) and a thumbnail needs one click (the thumbnail's own scrollIntoView had cancelled the section scroll).
- 2026-11-18 (photo gallery): Airbnb-style full-screen photo gallery with grouped sections, a strip, the `#photos` hash and the lightbox behind a photo click (see "Photo gallery modal"); `DetailTabs` no longer scrolls when the hash returns to the open tab.
- 2026-11-18 (room price): each room card shows only "From $X per person"; the live per-room price line and the sold-out badge were removed from the experience cards (`ExperienceRoomLivePrice` stays exported).
- 2026-11-18 (rooms tab): the "Select room" shortcut was removed from the experience room cards and the room details dialog; they are purely informational.
- 2026-11-18 (checkout): rooms are no longer chosen on the page: "Check availability" opens checkout with the stay; the rooms tab is informational with a "Select room" shortcut (`roomId`); the page keeps the "From $X per person" price; the room-selection pieces stay for checkout. Reviews tab matched to the design (square single-initial avatar, the five design categories). Mobile bar price is one line.
- 2026-11-18: Doc created. Experience detail page built on the hotel detail shell; the gallery now has a video modal and a keyboard-driven lightbox (also used by hotels); `DetailHeader` shared by hotel and experience; `DetailTabs` can scroll the tab bar into view (`scrollOnSelect`); the booking form, rooms list and summary bar gained an experience mode.
