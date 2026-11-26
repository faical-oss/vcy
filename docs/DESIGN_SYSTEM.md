# Design System

**Source of truth:** the published Figma Make site https://glad-red-27377678.figma.site/ (inspect with browser devtools/JS) and the screenshots in the `VCY figma` folder (`~/Desktop/VCY figma`; copies in the repo root: `Vacayou - Home.png`, `Palette & Styles.png`, etc.). The Figma MCP is rate-limited on the Starter plan, so work from the published site + screenshots. **Do not invent specs**; measure the original.

All tokens live in `src/app/globals.css` (`@theme`). Components use utilities (`bg-primary`, `text-body`, `font-display`, `rounded-card`, `text-eyebrow`...) and **never raw hex**. When the shared white-label theme lands, change values only there.

## Brand palette (given by the user) vs tokens (verified in code)
| Brand color | Role | Token |
|---|---|---|
| `#000000` Primary | brand primary | **No token**: the original UI uses `#002C36` for dark text/surfaces. Only `--color-overlay` (black 40%) uses black. Unresolved how `#000000` should be used. |
| `#002C36` Secondary | headings, dark surfaces, nav text | `--color-primary` |
| `#A7BCC1` Accent | eyebrows, icons, muted text on light, nav chevrons | `--color-muted-blue` |
| `#E9F1FB` Light Blue | alt sections, newsletter, active tab | `--color-surface-blue` |
| `#F9F9F7` Off White | section background | `--color-surface` |

Additional colors measured from the original (all in `@theme`): gold CTA `#C49A6C` = `accent` (hover `#B8885B` = `accent-hover`), body text `#616161` = `body`, borders `#E0E0E0` = `border`, card hover border `#757575` = `border-strong`, star `#FFC107`, testimonial card border `#D0D0D0` (`card-border`), quote text `#444444` (`quote`), caption `#767676` (`muted`), hairline `#F0F0F0` (`divider`), avatar `#E8E8E8`/`#C8C8C8`, footer legal divider `#49454F` (`divider-dark`). Naming note: Tailwind `accent` = gold, which differs from the brand-sheet "Accent #A7BCC1" (`muted-blue`).

## Typography (fonts: `src/app/fonts.ts`)
- **Cormorant Garamond** (`font-display`): headings. Loaded weights 400, 500. **Verified on the original:** hero H1 is 400; section H2 and card H3 are 500 (not 400).
- **Albert Sans** (`font-sans`, body default): UI and body. Weights 400/500/600/700.

Verified computed styles (original at 1440px; ours match):
| Element | Font | Size / line-height / tracking / weight | Color |
|---|---|---|---|
| Hero H1 | Cormorant | 60 / 75 / normal / 400 (30/36px mobile, `leading-tight`) | white |
| Section H2 (`text-title`) | Cormorant | 36 / 40 / -0.66px / 500 | `#002C36` |
| Card H3 (`text-title-sm`) | Cormorant | 24 / 33 / normal / 500 | `#002C36` |
| Eyebrow / tab / small CTA (`text-eyebrow`) | Albert | 13 / 19.5 / 1.3px / 600, uppercase | `#A7BCC1` (white on buttons) |
| Filter chip (`text-chip`) | Albert | 13 / 19.5 / 1.1px, uppercase; 600 active, 400 inactive | white / `#002C36` |
| Hero subtitle | Albert | 16 / 24 / 400 (hidden <sm) | white 90% |
| Card meta | Albert | 12 / 16 / 400 | `#616161` |
| Rating, "From", "per person" (`text-caption`) | Albert | 11 / 16.5 | `#616161` |
| Price | Albert | 16 / 24 / 700 | `#C49A6C` |
| Card badge / category (`text-micro`) | Albert | 10 / 15 / tracking-widest (badge 0.5px, 500 on packages) | white / `#A7BCC1` |
| Destination caption | Albert | name 16/20 500, region 13/16 400, count 12/16 `#A7BCC1` | `#002C36` |
| Link ("View all…") | Albert | 14 / 500, 1px underline | `#002C36` |
| Testimonial quote | Albert | 14 / 22.75 italic | `#444444` |
| Footer headings | Cormorant | 27 / leading-tight / -0.405px / 500 | white |
| Footer links | Albert | 13 / 400 | white 90% (hover white) |

Gotchas: custom size tokens must be registered in `src/helpers/cn.ts` (`extendTailwindMerge`) or `cn()` mistakes `text-chip` etc. for a color and drops it. Eyebrow line-height is 1.5 (matches original).

## Layout and spacing
- Container: `Container` = `max-w-site` (1280px), `px-4 sm:px-6`. Header uses `px-6`; Destinations section uses `px-6` at all sizes (matches original).
- Section padding: `py-10 sm:py-14` (56px) typical; Destinations `py-[57px]`; Experiences `pt-6 pb-14`; Testimonials `py-14`.
- Heading block: eyebrow row (rule `w-4 h-px` + text), H2 4px below, description `text-sm` 4px below; heading `mb-8` (Experiences `mb-6` then chips `mb-8`).
- Header height 64px + 1px border (65px). Hero 260px / 310px (md+); with search + Popular row the hero section is 480px at 1440px.
- Breakpoints: Tailwind defaults (sm 640, md 768, lg 1024, xl 1280). Full desktop nav shows from `lg` (the original switches at md; the nav does not fit at 768, kept `lg`, unresolved). Header paddings tighten below `xl`.

### Sticky stack under the header
`--spacing-header` is 4rem (64px; the header is 65px with its border) and `top-header` uses it. `--docked-search-h` (`globals.css`) is 4rem while the docked search bar shows from `md` up, otherwise 0 (set through `data-docked-search` on `<html>`).

| Element | z-index | `top` |
|---|---|---|
| Site header | `z-40` | `0` |
| Docked search bar (its popovers are `z-40` inside it) | `z-[35]` | `top-header` |
| Lifestyle sub-nav | `z-30` | `top-header + --docked-search-h` |
| Legal breadcrumb bar (no docked bar on these pages) | `z-30` | `top-header` |
A new sticky bar under the header adds `--docked-search-h` to its `top` and to the `scroll-mt` of its anchor targets.

## Listing pages (experience and hotel category, same layout; measured on the original at 1440/768/390)
Hero 260px (all widths), `bg-primary` behind a `object-cover` photo with `bg-overlay` (40% black); content bottom-aligned (`pb-6`) in `Container`. Breadcrumb `mb-2`: links 12px white/80 (ours white/90), current crumb 10px 600 uppercase `tracking-widest`; h1 Cormorant 500, 42/46px, -0.66px tracking at every width (`text-listing-title`). Ours adds a bottom gradient (`from-overlay`) so the 10-12px breadcrumb stays readable on bright photos. Below the hero: `Container py-10`, "N results" 14px `text-body` `mb-6`, then grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6` (cards 395px at 1440, 348px at 768, 358px at 390). The original has no "Home" crumb and a left chevron before "Experiences"; ours adds Home as required by the task.

### Region page and All Destinations (measured on reference screenshots 4-7, scale derived from text sizes)
Region hero: `ListingHero size="tall"` + `breadcrumbVariant="back"` ("< Destinations" 12px 600 white link with `ChevronLeft`, `ChevronRight` separator, current crumb 10px uppercase `tracking-widest` white/70) + `SunOrnament h-6 w-[97px] text-white mb-2.5` between crumb and title. Region body: facts and intro as the destination page; "Popular destinations in X" h2 32px (`text-title-md`) over a `CardCarousel` of `DestinationCard` (4 visible at lg, gap 20); packages: `RegionSection tone="soft"` (`bg-surface`, `py-14`), eyebrow `SectionTag`, h2 34px (`text-heading`), `CardGrid` 3 columns gap 24, "ALL PACKAGES" link 14px 500 uppercase `tracking-nav` underlined, `mt-6` right; hotels: white section, `gap-5`, 4 columns from `xl`. All Destinations: `ListingHero size="index"` (340px, `pb-12`, h1 `text-4xl sm:text-display-sm` 56px, eyebrow 12px 600 `tracking-eyebrow-lg`, subtitle 16px white/90 `mt-3`, `back-caps` crumb "< HOME" 13px 600 uppercase with `mb-4`); chip band `bg-card py-4 shadow-header`, chips `pillClassName(active, "soft")` (inactive: `bg-surface` no border, hover `bg-surface-blue`); groups `pt-14`, `gap-14`, eyebrow `mb-5`, grid 2/4 columns `gap-5`. Not matched exactly: the reference band casts a ~35px soft shadow (ours is `shadow-header`); hero photo is the first destination image (the reference uses a canyon road photo that is not in the data).

### Destination page (measured on the original at 1440/768/390)
`ListingHero size="tall"`: 340px at all widths, `px-6 pb-8`, h1 Cormorant 500 48/52 normal tracking (`text-destination-title`), subtitle 14/20 white/75 `mt-1`. Below it on white: facts row (`DestinationStats`, labels 10px 0.25px tracking uppercase `muted-blue`, values 14/20 500 `primary`, the From price 700 `accent`, 64px between items, 69px high), intro 14px/22.75 `body` max 720px (`pt-8`), then `pt-8 pb-14`: h2 24/32 500, chips (34px, same look as `Pill` via `pillClassName`, one scrolling row on mobile, wrapping from `sm`), grid as on category pages. Container is `px-6` at all widths. Deliberate differences: the original scrolls the facts row sideways on mobile (the price falls off screen), ours is a 2-column grid; ours adds a Home crumb, a "N results" line and shows catalog labels on the chips.

## Radii, shadows
`rounded-input` 4px (inputs, newsletter card), `rounded-card` 8px, `rounded-panel` 16px (search panel), cards in carousels `rounded-xl`, pills `rounded-full`. Header shadow `shadow-header` (0 2px 5px rgb(0 0 0 / 0.08)); search panel `shadow-sm`.

## Components and states
- **Button** (`ui/button.tsx`, cva): `primary` gold pill (hover `accent-hover` in header CTA), `secondary` navy, `outline`, `link` (underline via 1px border, hover 70%). Sizes `sm/md` are uppercase 13px with 1.3px tracking; `md` = h-9 px-6.
- **Cards** (experience 300 / package 340 / hotel 260 wide in the original; ours are computed per breakpoint): white, 1px `border`, `rounded-xl`, hover border `border-strong` (experience) or `primary` (package/hotel/destination); photo ratio 4/3 (experience, hotel) or 3/2 (package); body `p-4 gap-2`; price row pinned bottom with top border. Heart button + category/badge pinned top corners.
- **Pills/chips** (`ui/pill.tsx`): 34px high, `rounded-full`, hover border `primary`.
- **Nav triggers:** 13px/600 uppercase, hover `bg-surface`, open state `border-b-2 border-primary`, chevron rotates. Mega panel `shadow-xl`, links grid 2 columns, featured card at right. Mobile menu: fullscreen overlay.
- **Hover/transition conventions:** `transition-colors`/`transition-opacity`, images `group-hover:scale-105` with `duration-300`; carousel fade `duration-300`; footer links hover white, social/legal hover opacity 60%.
- **Animation:** footer logo marquee 40s linear infinite (`--animate-marquee`), reduced motion respected; `scroll-behavior: smooth` (disabled for reduced motion). Focus ring: 2px `accent` outline, 2px offset.

## Known unverified/unresolved
Hover colors were taken from the original's classes, not exercised in a browser. The search box (hero and docked bar) follows the prototype's screens: see [features/search.md](features/search.md). Account button label: original markup says "My Account", screenshots show "TRAVELLER"; we use "Traveller" (open question).
