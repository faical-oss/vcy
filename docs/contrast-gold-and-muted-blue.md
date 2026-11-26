# Contrast: where gold and muted blue carry text, labels or icons

Last updated: 2026-11-22

The brand tokens are **not changed** (`--color-accent #c49a6c`, `--color-accent-hover #b8885b`, `--color-muted-blue #a7bcc1`). This is the list to send to the designer, with the ratio of every use and a proposed alternative. Ratios are WCAG 2.2 relative-luminance ratios, computed from the hex values. The axe run (`npm run test:responsive`) reports the same problems as `color-contrast` annotations (60 findings on the last full run).

Thresholds: normal text 4.5:1; large text (24 px, or 18.66 px bold) 3:1; icons and other parts of controls that are needed to understand them, and focus indicators, 3:1. Purely decorative graphics are exempt.

## Ratios

| Colour | on white `#fff` | on `surface #f9f9f7` | on `surface-blue #e9f1fb` | on `border #e0e0e0` | on primary `#002c36` |
|---|---|---|---|---|---|
| muted blue `#a7bcc1` | **1.98** | **1.88** | **1.74** | **1.50** | 7.50 pass |
| gold `#c49a6c` | **2.57** | **2.43** | **2.25** | **1.94** | 5.79 pass |
| gold hover `#b8885b` | **3.13** | **2.97** | **2.75** | n/a | 4.75 pass |
| white on gold `#c49a6c` | **2.57** | | | | |
| white on gold hover `#b8885b` | **3.13** | | | | |
| primary `#002c36` on gold | 5.79 pass | | | | |

Bold = fails its threshold. **On dark surfaces (primary, the hero overlay, the editorial banner) both colours pass**; every problem below is on a light surface.

## What to change, by kind of use

Each row says where it is used, the ratio, and the proposal. Files are under `src/`.

### 1. Muted blue as text on light surfaces (1.7 to 2.0:1, needs 4.5:1)

Small labels, eyebrows, captions, field labels, hints, placeholders and values. All of these are real text, so the large-text exception does not apply (they are 9 to 14 px).

| Group | Where |
|---|---|
| Eyebrows and section labels (uppercase, 9 to 12 px) | `sections/search/search-bar.tsx` (field labels), `sections/search/search-popovers.tsx`, `sections/search/suggestion-panel.tsx`, `sections/search/results/active-filters.tsx`, `sections/hotel/booking-form.tsx`, `sections/hotel/room-details-dialog.tsx`, `sections/hotel/hotel-rooms.tsx` (price caption), `sections/hotel/booking-price.tsx`, `sections/package/package-stays.tsx`, `sections/support/support-page.tsx`, `sections/status/*`, `sections/home/hero.tsx` and `testimonials-section.tsx` (the home eyebrow on the light section), `components/account/*` (account-section, booking-card, profile-view, preference-summary, preference-wizard, stat-card, tier-progress), `layout/main-nav.tsx` (mega menu group titles) |
| Badges and tags | `sections/search/results/result-list-card.tsx` (outline tag, hotel badge), `sections/hotel/hotel-header.tsx`, `sections/experience/experience-header.tsx`, `cards/package-card.tsx` (category) |
| Captions and meta | `cards/destination-card.tsx` (count), `sections/home/magazine-section.tsx` (category, read time), `sections/hotel/reviews-list.tsx` (reviewer location), `sections/hotel/room-row.tsx` and `room-details-dialog.tsx` (Size / Bed / Board labels), `sections/hotel/hotel-location.tsx`, `sections/listing/destination-stats.tsx`, `sections/legal/legal-page.tsx` ("Last updated"), `sections/hotel/booking-box.tsx` (note), `features/availability/experience-availability.tsx` ("for your dates"), `sections/search/results/mobile-search-summary.tsx` (dates line), `sections/hotel/date-range-picker.tsx` (weekday header) |
| Form text | `ui/guest-fields.tsx` (hints, "Child ages"), `ui/textarea.tsx` and `sections/support/support-page.tsx` (placeholders), `sections/hotel/booking-form.tsx` (placeholder value), `sections/search/results/filters-panel.tsx` (min / max labels), `auth/auth-modal.tsx` ("Or continue with") |
| Disabled "Reserve" button label | `sections/hotel/reserve-cta.tsx`: muted blue on `bg-border/60`, 1.68 (disabled controls are exempt from the rule, but the reason it is disabled is not) |

**Proposal:** a darker blue-grey for text on light surfaces, `#4f6d75`: 5.56 on white, 5.27 on surface, 4.88 on surface-blue, 4.21 on `border` grey. Keep `#a7bcc1` for dark surfaces and for decoration. A second, lighter value is not needed for text.

### 2. Muted blue as an icon or control mark on light surfaces (needs 3:1 when the icon carries meaning)

| Group | Where |
|---|---|
| Select and accordion chevrons | `features/search/search-results.tsx` (sort), `ui/guest-fields.tsx`, `sections/hotel/booking-form.tsx`, `sections/experience/itinerary-tab.tsx`, `sections/search/results/filters-panel.tsx`, `sections/search/results/mobile-search-summary.tsx`, `layout/main-nav.tsx`, `layout/mobile-menu.tsx` |
| Field icons | `sections/search/search-bar.tsx`, `sections/hotel/booking-form.tsx`, `sections/hotel/room-details-dialog.tsx`, `sections/hotel/hotel-location.tsx`, `sections/support/support-page.tsx`, `auth/auth-modal.tsx` (lock, shield) |
| Header and menu links with icons | `layout/header-account.tsx` (Support, Favorites), `layout/mobile-menu.tsx` (Support, Favorites) |
| Carousel arrows | `ui/card-carousel.tsx`: border and arrow in muted blue on white, 1.98 |
| Ornaments | `brand/sun-ornament.tsx`, `sections/status/status-page.tsx`, `sections/search/results/results-states.tsx`, `sections/detail/location-map.tsx` (decorative: exempt) |

**Proposal:** `#6a8a92` is enough for non-text (3.71 on white, 3.52 on surface, 3.26 on surface-blue) and stays visibly "muted blue". If the designer prefers one value, use the text colour `#4f6d75` for both.

### 3. Gold as text: prices and figures (2.4 to 2.6:1, needs 4.5:1, or 3:1 at large size)

| Where | Size |
|---|---|
| `ui/price.tsx`, `sections/search/results/result-list-card.tsx` (card price) | 15 to 16 px bold |
| `sections/hotel/booking-price.tsx`, `price-summary.tsx`, `availability-price.tsx`, `hotel-rooms.tsx`, `rooms-panel.tsx`, `sections/experience/experience-booking-price.tsx` | 16 to 20 px bold |
| `sections/listing/destination-stats.tsx` (emphasised value), `sections/lifestyle/lifestyle-rows.tsx` (eyebrow), `account/overview-view.tsx` (discount), `layout/main-nav.tsx` and `layout/mobile-menu.tsx` (featured "From $..." on white) | 11 to 14 px |
| Hover colour of a suggestion row | `sections/search/suggestion-panel.tsx` (`hover:text-accent`) |

Even at the large-text threshold gold on white (2.57) fails 3:1, so making the prices bigger would not fix it.

**Proposal:** a text gold, `#8a6234`: 5.42 on white, 5.14 on surface, 4.76 on surface-blue. Or `#8f6538` (5.14 / 4.87 / 4.51). Keep `#c49a6c` for fills and for text on dark surfaces.

### 4. White label on a gold fill (2.57:1, hover 3.13:1, needs 4.5:1)

| Where |
|---|
| `ui/button.tsx` (the primary button, used everywhere) |
| `sections/hotel/reserve-cta.tsx` |
| `layout/header-account.tsx` (account pill, favourites count badge), `layout/mobile-menu.tsx` (account pill, round icon buttons), `sections/search/search-pill.tsx` (round search button) |

**Proposal, option A (keeps the brand look):** keep the gold fill and make the label dark teal (`primary #002c36`): 5.79 on gold, 4.75 on the hover gold. **Option B:** keep the white label and darken the fill to `#8f6538` (5.14 with white); this changes the look of every primary button.

### 5. Gold as an icon or graphic (needs 3:1)

| Where |
|---|
| Favorite heart when saved: `ui/favorite-button.tsx`, `sections/detail/detail-actions.tsx` (2.57) |
| Section icons: `sections/support/support-page.tsx`, `account/profile-view.tsx`, `account/empty-state.tsx`, `account/account-identity.tsx`, `account/stat-card.tsx`, `account/preference-*.tsx`, `auth/auth-modal.tsx` (mostly decorative next to a heading) |
| Ticks and the price-note icon: `cards/package-card.tsx` (tick), `sections/hotel/price-summary.tsx` and `room-details-dialog.tsx` (`accent-hover`, 3.13 on white, 2.97 on surface) |
| Progress: `account/tier-progress.tsx` and `account/preference-wizard.tsx` (gold bar on grey `border`, 1.94) |
| **Focus ring:** `app/globals.css` (2 px outline in gold, 2.57 on white): a focus indicator needs 3:1 against its surroundings (WCAG 2.2, 1.4.11 and 2.4.11) |

**Proposal:** a gold for graphics at 3:1 or more, `#a5763f` (3.99 on white, 3.79 on surface, 3.50 on surface-blue); the same gold works for the focus ring. For the progress bars either darken the filled part or add a visible end marker. If a dark focus ring is preferred, `primary` on white is 14:1.

## Summary to send

1. Add a **text blue** `#4f6d75` (replaces muted blue for text and meaningful icons on light surfaces; the current `#a7bcc1` stays for dark surfaces and decoration).
2. Add a **text gold** `#8a6234` for prices and gold text on light surfaces; the current gold stays for fills and dark surfaces.
3. Primary button: **dark teal label on the gold fill** (or a darker fill with a white label).
4. Gold icons and the focus ring: **`#a5763f`**.

These four values are proposals computed from the ratios above; the designer chooses the final colours. When they are chosen, they become new tokens in `src/app/globals.css`, the `color-contrast` annotation list in `e2e/responsive/a11y.spec.ts` goes away, and the axe run starts failing on any new contrast problem.
