# If hotels become display-only: what would change

Last updated: 2026-11-24. A note for a later decision, not a plan. Nothing here is built. It is for deciding **after** it is known which parameters the checkout accepts.

## The contradiction in `docs/features/hotel-detail.md`
- The section **"Rooms are chosen on the hotel page (decided 2026-11-18, reverses a same-day change)"** (line 62) opens with a block that says "**Superseded 2026-11-18 (availability flow): the Rooms tab is display only** and prices appear after dates are chosen".
- The changelog entry **"2026-11-18 (selection returns)"** (line 85, the newest of the day) says the opposite: "**hotels choose rooms on the page again**, now after the prices load: a Select room button on each available room, the chosen rooms and total in the booking card ... Reserve now gated on the choice". `availability-flow.md` (lines 17 and 19) and the code agree with that entry.
- The entry "2026-11-18 (availability flow)" (line 87) is the one the "Superseded" block comes from, and the later "(selection returns)" entry reverses it, but the block was never updated.
- `experience-detail.md` (the section "Rooms are chosen in checkout on experience pages only ... hotels excluded") and `packages.md` ("Rooms are display-only; they are chosen in checkout") are consistent with the code. **The code today: hotels choose rooms on the page; experiences and packages do not.**

## What would change for display-only hotels
**Components** (all under `src/components/sections/hotel/` unless noted)
- `room-picker.tsx` (Select room button and stepper), `rooms-summary-bar.tsx` (sticky "N of M rooms selected" bar), `reserve-gate.tsx`: no longer rendered.
- `rooms-panel.tsx` (the `selectable` branch), `room-details-dialog.tsx` (the `dialogAction` picker).
- `availability-price.tsx` (`SelectedRooms`: the rooms chosen, their nightly price and "Total for N nights"), and the unused `booking-price.tsx`.
- `booking-form.tsx` and `src/hooks/use-booking-state.ts` (the `rooms` option and `selectionNote`: "Reserve now" would be enabled by availability alone).
- `src/store/stay-store.ts` (`selection`, `adjustRoom`, `clampSelection`) and `src/helpers/room-selection.ts` (`checkCapacity`, `selectedCount`).
- `src/app/(site)/hotels/h/[slug]/page.tsx` (`selectableRooms`, the `selectable` prop).
- The mobile reserve bar (Task 5): the rooms line and the total of `src/helpers/booking-bar-summary.ts` and `booking-bar-summary.tsx` disappear by themselves once the hotel page stops passing `rooms`; only the count of rooms would remain in the guests text.

**Checkout link** (`src/helpers/checkout-params.ts`)
- Hotels send `selection` ("roomId:quantity" pairs adding up to `rooms`) and optionally `roomId`. Without room choice on the page, the hotel link would send `type`, `id`, the dates, `rooms`, `adults`, `children`, `childAges`, `flex` only, like experiences, and the **checkout would have to let the visitor choose the rooms** (the checkout is a stub today: `app/(site)/checkout/page.tsx`).
- Open question for whoever owns the checkout: does it accept a hotel without `selection`? If not, it needs a room step, and the price shown on the page ("From $X per night") would no longer have a total before checkout.

**Tests**
- Unit: `room-selection.test.ts`, `stay-store.test.ts`, `booking-flow.test.tsx`, `hotel.test.tsx`, `rooms-panel.test.tsx`, `availability-panel.test.tsx`, `checkout-params.test.ts`, `experience.test.tsx` (shared helpers), `mobile-bar-state.test.tsx`, `booking-bar-summary.test.ts`.
- E2E: the hotel test in `e2e/responsive/booking-bar.spec.ts` (the rooms line and the total), and the room picker steps of the interaction specs.

**Docs**
- `docs/features/hotel-detail.md` (the contradictory section and the changelog), `availability-flow.md` (lines 17, 19, 51), `experience-detail.md` and `PROJECT_DECISIONS.md` (the "Shared with hotels" list), `responsive-testing.md` (Reserve bar).

## What does not need to change
Experiences and packages (already display-only), the availability request and its mock scenarios, the dates and travellers panels, the booking sheet, and the rest of the reserve bar.
