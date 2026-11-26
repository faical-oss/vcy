# UI QA report: Vacayou front end (vku-web)

Date: 2026-11-16. Dev server: http://localhost:3001. Reference: https://glad-red-27377678.figma.site/ plus the screenshots in the repo root.
Viewports: 1440, 768, 390. One `ui-qa` agent per page, run sequentially. No repo files were edited by the agents.

Note (2026-11-19): written before the search box existed; the rows about `popular-searches.tsx` and `hero-search-placeholder.tsx` (files since deleted) are obsolete.

Caveat: every measurement below is the agent's. None was re-measured independently.
Account pages have no reference design. They were checked against Home, the documented tokens, and each other.

## Verdicts

| Page | Verdict |
|---|---|
| `/` | Minor differences (carousel card widths, chip weight, footer rhythm, small a11y items) |
| `/support` | Minor differences (form card stretch, mobile spacing, 14px inputs on mobile) |
| `/privacy` | Matches. One Low spacing defect and one breadcrumb behaviour difference |
| `/terms` | Matches. Same two Low items as `/privacy` |
| `/account` | Minor differences (token drift from Home, contrast, same h1 on every tab) |
| `/account/trips` | Minor differences. Empty state only, CTA leads to a 404 |
| `/account/favorites` | Consistent chrome. Populated state unreachable from the UI |
| `/account/preferences` | Several accessibility and flow issues (focus, live region, unsaved changes) |
| `/account/profile` | Several accessibility and validation issues. No editable name or email fields |

## Consolidated findings, most severe first

No High findings. "acct" means the issue appears on every account page.

### Medium

| # | Page | Viewport | Element | Reference/expected vs implementation | Likely file |
|---|---|---|---|---|---|
| 1 | `/support` | 1440, 768 | Form card | Reference: card stretches to the sidebar height (868x739 at 1440). Implementation: 868x576, about 163px of empty space below it. | `src/components/sections/support/support-page.tsx:97` (`items-start`) |
| 2 | `/` | 1440 | Packages carousel | Reference: cards 340px wide, pitch 360, section 809px, 3 visible plus a clipped 4th. Implementation: cards 397px, section 848px (+39px). The docs call card widths a design call. | `src/components/sections/home/packages-section.tsx` plus the shared carousel |
| 3 | `/support`, `/account/profile` | 390 | Text inputs | Reference: 16px on mobile. Implementation: 14px at every width, which causes iOS focus-zoom. Profile password inputs have the same 14px. | `src/components/ui/input.tsx`, `FIELD_STYLE` in `support-page.tsx:33` |
| 4 | acct | all | h1 in the welcome band | Expected: each route's h1 names the page. Implementation: "Welcome back, Dev" on all 5 routes, so heading navigation never reflects the current page. | `src/components/account/account-identity.tsx`, `account-shell.tsx`, `src/app/(site)/account/layout.tsx` |
| 5 | acct | all | Eyebrows, stat labels, tier numbers, "No preferences selected" text, `dt` labels | Expected: 4.5:1 contrast. Implementation: `#A7BCC1` on white or cream is about 1.9:1. The italic empty-state text on `/account/preferences` is real content, not just an eyebrow. The same colour is used on Home. | `account-section.tsx`, `stat-card.tsx`, `tier-progress.tsx`, `preference-summary.tsx`, `overview-view.tsx` |
| 6 | `/account` | all | Stat numbers ("0" in the cards) | Expected: Cormorant 400/500, the only weights loaded. Implementation: weight 600, so the browser fakes the bold. | `overview-view.tsx` (`BIG_NUMBER` `font-semibold`), `src/app/fonts.ts` |
| 7 | `/account/trips`, `/account/favorites` | all | "Explore experiences" CTA | Expected: a working page. Implementation: `/experiences` returns 404 (route not built). | `trips-section.tsx` (`ACTION`), `favorites-view.tsx` |
| 8 | `/account/favorites` | all | Favorites list | Expected: the empty-state copy says to tap the heart on any card to save it. Implementation: the heart is local state only (`useState(false)`), so the page stays empty. Saved cards would also show an unfilled heart and could not be removed. | `src/components/ui/favorite-button.tsx`, `favorites-grid.tsx`, `src/features/account/actions.ts` |
| 9 | `/account/preferences`, `/account/profile` | all | Focus after Save, Cancel, "Change password", Connect/Disconnect | Expected: focus moves to the result or the next control. Implementation: `document.activeElement` becomes `BODY`. | `preference-wizard.tsx`, `preferences-view.tsx`, `profile-view.tsx`, `password-form.tsx`, `connected-account-row.tsx` |
| 10 | `/account/preferences`, `/account/profile` | all | Success status | Expected: a persistent live region that is filled on success. Implementation: `<p role="status">` mounted with its text already in it, so screen readers often skip it. Connect/Disconnect results have no live region. The newsletter state is announced twice. | `preference-summary.tsx`, `profile-view.tsx`, `connected-account-row.tsx` |
| 11 | `/account/preferences` | all | Unsaved changes and edit exit | Implementation: edits are discarded silently on navigation or Cancel. While editing, Cancel appears only on step 1, so steps 2 to 5 have no exit. | `preference-wizard.tsx` (footer), `preferences-view.tsx` |
| 12 | `/account/profile` | all | "Change password" button | Implementation: `aria-expanded="false"` with an `aria-controls` that points at nothing. The button is unmounted when the panel opens, so it can never report "true". | `profile-view.tsx` |
| 13 | `/account/profile` | all | Password validation | Implementation: errors update only on blur, and the confirm field is not re-validated when the new password changes, so stale errors stay visible. | `password-form.tsx` (`validateField` only on `onBlur`) |

### Low-Medium

| # | Page | Viewport | Element | Reference/expected vs implementation | Likely file |
|---|---|---|---|---|---|
| 14 | acct | all | Section h2 | Home H2: Cormorant 36px, line-height 40px, tracking -0.66px. Implementation: 34px with line-height 1.5 (51px), tracking normal. It also varies by tab: overview uses 30/32, profile and preferences hand-roll their own headings with different sizes and a different eyebrow. | `globals.css` (`--text-heading`), `overview-view.tsx`, `trips-view.tsx`, `profile-view.tsx`, `preference-wizard.tsx`, `preference-summary.tsx`, `account-section.tsx` |
| 15 | `/account/profile` | all | Password inputs | Support: radius 2px, placeholder `#A7BCC1`. Implementation: radius 4px, placeholder `#616161`, and "Current password" has no placeholder. A focused invalid field also loses its red border to `focus:border-accent`. | `password-form.tsx` (`FIELD_STYLE`), `input.tsx` |

### Low

| # | Page | Viewport | Element | Reference/expected vs implementation | Likely file |
|---|---|---|---|---|---|
| 16 | `/support` | 390 | Hero, body gap, headings, side cards | Reference: hero 303px, H1 42px, padding 48px, intro 14px, body gap 32px, section H2 line-height 45px, side-card padding 20px. Implementation: hero 327px, H1 36px, padding 56px, intro 16px, gap 48px, H2 line-height 36px, side-card padding 24px. | `support-page.tsx:56-64, 100, 38` |
| 17 | `/support` | 768 | Hero | Reference: 333px (padding 64px). Implementation: 365px (`sm:py-20` kicks in at 640), which shifts everything below it down 32px. | `support-page.tsx:56` |
| 18 | `/support` | various | Form and sidebar details | Eyebrow `#767676` vs `#616161` (3.99:1). Topic-card hover border `#757575` vs `#A7BCC1`. "Browse inspiration" lacks 12px of horizontal padding and hovers with opacity instead of underline. Submit letter-spacing 1.4px vs 1.2px. Email and message are `required` (reference: not). Submit handler is a no-op (TODO). | `support-page.tsx:58, 82, 115, 140, 150, 173-179` |
| 19 | `/privacy`, `/terms` | all | Gap above the footer | Reference: 48px (container padding). Implementation: 80px, because the last section keeps `mb-8`. Footer starts 32px lower at every width. | `src/components/sections/legal/legal-section.tsx` (`last:mb-0` would fix it) |
| 20 | `/privacy`, `/terms` | all | Breadcrumb bar | Reference: `sticky top-0 z-40`, so it scrolls away behind the header. Implementation: `sticky top-header z-30` (top 64px), so it stays pinned. May be intentional. | `legal-breadcrumb.tsx` |
| 21 | `/` | 1440 | Experiences and Hotels cards | Experiences: reference cards 300px, section 774px; implementation 293px, 767px. Hotels: reference cards 260px, section 726px, long titles wrap to 2 lines; implementation 293px, 717px, and titles wrap differently (1 line for most). | `experiences-section.tsx`, `hotels-section.tsx`, `src/components/cards/hotel-card.tsx` |
| 22 | `/` | 1440 | Footer | "Follow us": reference line-height 27px and letter-spacing -0.405px, implementation 40.5px and normal. Link pitch 36px vs 34px. Blurb line-height 19.5px vs 18.85px. Footer is +5px overall (558 vs 553). | `src/components/layout/footer.tsx:30, 31, 46` |
| 23 | `/` | 1440 | Popular chips | Reference: `button`, weight 500. Implementation: `a`, weight 400. | `popular-searches.tsx` (add `font-medium`) |
| 24 | `/` | 390 | Mobile menu button | Reference: 44x44. Implementation: 40x40. `aria-label` stays "Open menu" while the menu is open and should become "Close menu". | `src/components/layout/mobile-menu.tsx:70-77` |
| 25 | `/` | 390, 768 | Hero | Reference: 781px at 390 and 504px at 768, because it shows the search form. Implementation: 480px, the known placeholder. | `hero-search-placeholder.tsx` |
| 26 | acct | all | Buttons and links | Home CTA: 13px, hover `#B8885B`. Implementation: 14px, hover `bg-accent/90` (lighter, not darker). "Browse more" is 14px, 600, uppercase, no underline until hover (Home "View all" is sentence case with underline). Inside the profile and preferences cards there are two button styles (14/500 normal case vs 14/600 uppercase). Chips are 40px / 14px normal case vs Home chip 34px / 13px uppercase. | `button.tsx`, `empty-state.tsx`, `account-section.tsx`, `chip.tsx`, `connected-account-row.tsx` |
| 27 | acct | all | Focus ring | The settled ring is gold `#C49A6C`, 2px, offset 2px (correct). On focus the outline colour transitions from the text colour (white on gold buttons, navy or grey on nav links), so a read at that instant looks white. Gold on cream is 2.43:1. | `button.tsx`, `account-nav.tsx` (`ITEM_BASE`), `globals.css:~129` |
| 28 | `/account` | all | Page title | "Overview \| Vacayou" vs "My trips \| My Account \| Vacayou" on the other tabs. The `title.template` does not apply to the page in the same segment. | `src/app/(site)/account/layout.tsx`, `page.tsx` |
| 29 | acct | 768, 390 | Account nav and small text | Nav grid takes about 217px, with "Profile" alone in the last row. On `/account` at 390, 9px text (stat labels, "Wellness level", "10% discount") and 8px tier numbers. | `account-nav.tsx`, `account-shell.tsx`, `stat-card.tsx`, `tier-progress.tsx`, `overview-view.tsx` |
| 30 | acct, `/`, `/support`, legal | 390, 768 | Touch targets | Many controls are 36-40px high and many links 20px: header account button 36px, menu button 40px, CTAs 36px, "Browse more" 142x20, legal "Back" 20px, chips 40px, newsletter switch about 58x38. The reference has the same sizes except the Home mobile menu button (44px). | `button.tsx`, `empty-state.tsx`, `header-account.tsx`, `legal-breadcrumb.tsx`, `chip.tsx`, `switch.tsx` |
| 31 | acct, `/`, `/support` | all | White text on gold `#C49A6C` | 2.57:1. The same colour pair is on Home and in the reference. | `globals.css` tokens |
| 32 | `/account/preferences`, `/account/profile` | 390 | Button order | `flex-col-reverse` shows Save/Update above Cancel/Back, but Tab goes to Cancel/Back first. | `preference-wizard.tsx`, `password-form.tsx` |
| 33 | acct | all | Console | `scroll-behavior: smooth` warning on `<html>`. Dev-only preloaded-font warnings on Home and `/account/profile`. | `globals.css:~119`, `src/app/layout.tsx` |
| 34 | various | all | Smaller items | Home: about 18 gallery images with `alt=""`, and all 8 trust logos share one generic alt. Profile: the three read-only tiles use three separate `<dl>`, the Google tile says "Connected" while its row says "Not connected", and the connected dot is the same grey in both states. Preferences: selected chips have no hover state, and the card height jumps between wizard steps. Trips: `BookingCard` is marked ASSUMED in code (no design). Favorites: "Browse more" and "Explore experiences" go to the same place. Account: the h1 wraps to two lines at 768. | cards, `footer.tsx`, `profile-view.tsx`, `chip.tsx`, `booking-card.tsx`, `account-shell.tsx` |

## Per-page notes

### `/` (Home)
Matches the reference: H1/H2/H3 typography, header (65px) and nav triggers, section background colours, testimonials/magazine/newsletter/editorial section heights, mega menu on hover (Experiences), and the mobile menu accordion with scroll lock and Escape. Console has no errors (2 dev-only font preload warnings). All network requests are 200 (one aborted video range request, which is normal). No horizontal overflow at any width.
At 768 the implementation collapses the header to logo, account icon and hamburger, while the reference shows the desktop nav and overflows horizontally to 1068px. This matches the documented decision to switch at `lg`, so keep it.

### `/support`
Copy, fonts, colours, radii, field sizes (44px, 2px radius, 1px `#E0E0E0`), topic cards (403x112), side column (340px) and typography at 1440 and 768 match to the pixel. One H1, labelled inputs, skip link and landmarks are fine. Console and network are clean.

### `/privacy`
Copy is identical (3707 characters). All 10 heading positions match at all three widths. H1, "Last updated", H2 and paragraph typography match. Console and network are clean. The reference has horizontal overflow at 768 (scrollWidth 1068); the implementation has none.

### `/terms`
Copy is identical (SHA-256 of all text matches, 23 nodes). Typography and positions match. Console and network are clean. Titles: "Terms of Use | Vacayou".

### `/account`
Logged-out visit redirects to `/?auth=login&next=/account` and opens the auth dialog, as documented. Landmarks, `aria-current="page"` on all 5 nav items and a sane heading order are good. No overflow. The stat cards are 3 columns at 768 and stacked at 390. After a client navigation from Home, the Home route stays mounted but hidden in the DOM (Cache Components behaviour).

### `/account/trips`
Only the empty state is reachable (the mock returns no bookings). No tabs or filters exist. Shared chrome matches `/account`. Heading order h1 > h2 "My trips" > h3 "No bookings yet".

### `/account/favorites`
Section card, eyebrow, empty box and fonts match the other account sections. Tab order is logical. The only `aria-pressed` toggles are the card hearts on Home. On Home, clicking the heart flips `aria-pressed` but the favorite does not appear on this page.

### `/account/preferences`
A 5-step wizard (chips only) until saved, then a summary card with "Edit preferences". Chips are real buttons with `aria-pressed` and a check icon, so selection is not colour-only. Space toggles, Back keeps selections, a progressbar has `aria-valuetext`. During save the button is disabled and `aria-busy`. No inputs, selects or toggles exist on this page.

### `/account/profile`
No editable name or email. Name, email and sign-in method are read-only tiles. Only the three password fields are inputs, plus a newsletter switch and three connect/disconnect buttons. Label association, `aria-invalid`, `aria-describedby`, `autocomplete` values and focus on the first invalid field after an empty submit are all correct. Validation rules work (empty, under 8 characters, new equals current, mismatch). No overflow.
Unsaved password drafts survive a client-side navigation but are lost on reload or Cancel.

## Not verified, per page

- **`/`**: hover and disabled states on cards, buttons and chips. Mega menu panels other than Experiences. Pixel-level image comparison and card hover borders. Mobile section-by-section card sizes (only total height: 9889 vs 10103px). Carousel arrow disabled state and drag. The hero search widget (placeholder). Contrast was estimated, not run through a tool.
- **`/support`**: form submission (the handler is a no-op and no submit was made). Real-mouse hover (compared from class lists). Pixel overlay against the 1920px screenshot. A cold-load skeleton stayed visible for over 10s in the pane, likely pane throttling rather than an app defect.
- **`/privacy`**: real hover rendering. "Back" click behaviour. Sticky behaviour on scroll (inferred from computed styles). Tabbing past the first focusable element. The Figma MCP was not authorized, so the published site and the screenshot were used instead.
- **`/terms`**: "Back" click behaviour. Hover on "Back". There is no Terms screenshot in the repo, so only the live reference was used. Contrast was computed by hand.
- **`/account`**: error state. Populated trips and favorites (the mock has none and there is no UI to add them). Hover colours. Skeleton layout shift. Sign out.
- **`/account/trips`**: populated state and the `BookingCard` layout. Error state. Skeleton measurements. Pressed/active state of the CTA.
- **`/account/favorites`**: the populated grid, the heart on saved cards and remove behaviour. Error state. Skeleton measurements. Contrast was computed by hand.
- **`/account/preferences`**: save error state (`role="alert"`). Production first-load focus (dev Strict Mode double-runs the effect). A static disabled state. Tab order through every button. Progress bar contrast.
- **`/account/profile`**: server-error messages. Hover on "Change password", "Update", "Cancel" and the switch. Sign out (inspected only, not clicked). Screen reader output (inferred from the DOM). Contrast of every label.

All pages: only 1440, 768 and 390 were tested, as requested. 1024 and 360 were not.

## State left in the browser pane and mock

- The mock session cookie `vku_dev_session` is still active. Press Sign out to clear it.
- `/account/preferences`: the agent saved preferences, then saved again with nothing selected. The page now opens on the summary view with every category showing "No preferences selected", not the wizard. To get the wizard back, delete the `vku_dev_account` cookie in devtools.
- `/account/profile`: the newsletter switch and the Google connection were toggled and restored. A password change was submitted, but the mock stores nothing.
- A heart was clicked on Home ("7-Day Yoga & Mindfulness Retreat"). It is local state only and resets on reload.
- The reference-site tab is still open in the browser pane.
