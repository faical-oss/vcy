# Navigation spec: header menus and the pages they open

> **Superseded (2026-11-17).** This is the original investigation (a draft for approval). The routes in section 6 were decided and built; current behaviour is in `docs/features/navigation.md`, `docs/features/destinations.md` and `docs/features/hotels-and-experiences.md`.

Status: **DRAFT for approval** (Step 1 of the navigation task). Read-only investigation, no code changed.
Investigated 2026-11-16 in the built-in browser against https://glad-red-27377678.figma.site/, plus `src/constants/navigation.ts`, `src/constants/routes.ts`, `docs/PROJECT_DECISIONS.md` and the migration notes in `../vku-migration/`.

## 0. Sources and caveats
- The 3 screenshots mentioned in the task (Yoga Retreats, Bali, Eco Lodges) were **not attached** to the message. I used the live reference (I opened Eco Lodges, Hiking & Trekking, Bali and others and screenshotted them) and the repo-root screenshots `Vacayou- Experiences.png`, `Vacayou - Destination.png`, `Vacayou - Hotels.png`. The large root screenshots were not opened in this step. Please re-attach the three screenshots if they differ from the live site.
- The reference is a **single-page prototype**: every screen lives at `https://glad-red-27377678.figma.site/` (no URL change, title always "Figma Make App"). It has no `sitemap.xml` (any path returns Home). So "URL" below means our proposed route, and "page" means the on-screen heading.
- `../vku-migration/seo/redirect-map.csv` and `url-inventory.csv` contain **only the header row**, so there is no SEO map to stay consistent with yet. `PROJECT_DECISIONS.md` says menu hrefs are provisional.
- Not verified: the Experience category hero image (I read its text only), hover and focus states of the pages, and whether the destination category chips filter the cards (my click test was inconclusive).

## 1. How the reference behaves (important)
1. Only **three templates** sit behind the dropdowns. Every menu item reuses one of them with the clicked label as the title:
   - **A. Experience category page** (any Experiences item)
   - **B. Hotel category page** (any Hotels item)
   - **C. Destination page** (any Destinations item)
2. The reference **does not really filter**. Content is a fixed pool:
   - Hotels: every item shows the same 6 hotels (Amanpuri, Six Senses Yao Noi, COMO Shambhala, Ananda, then Amanpuri and Six Senses again). "Under $150/night" shows $580 and $420 hotels. "6 results" is constant.
   - Experiences: "Yoga Retreats" shows 4 yoga items and "Hiking & Trekking" shows 4 hiking items, but "Trending Now" shows 6 items led by yoga ones. Other categories were not all tested.
   - Destinations: every destination shows the same experience cards (Bali shows a Rishikesh retreat).
   The task requires related items only, so we deliberately **improve** on the reference here.
3. The top-level triggers are also clickable. Experiences opens "Transformative Experiences", Destinations opens "All Destinations", Hotels opens "Exceptional Places to Stay" (listing screens, not in scope here, see section 8).
4. "View offer" on the three featured cards opens the **login dialog** while signed out (forced login, same as clicking any card).
5. Lifestyle opens a small dropdown with two **external** links that open in a new tab (`target=_blank`):
   - Magazine: `https://vacayou.com/magazine/`
   - Glossary: `https://vacayou.com/magazine/wellness-glossary/`
6. Inconsistency in the reference: the Destinations menu says "Bali, Indonesia" but the All Destinations card says "Bali". The card gives rich data, the menu item falls back to generic data (see 4C).

## 2. Menu inventory (matches `src/constants/navigation.ts` exactly)
Verified item by item in the reference for all four menus: 46 experience links, 57 destination links, 43 hotel links, 2 lifestyle links, 3 featured cards, 1 footer link.

### 2.1 Experiences (mega menu, 6 groups, 46 links)
| Group | Links |
|---|---|
| Wellness | Yoga Retreats, Meditation Retreats, Ayurveda Retreats, Detox Retreats, Spa & Thermal Retreats, Holistic Wellness, Anti-Ageing Retreats, Healing Retreats, Mental Health Retreats |
| Active & Adventure | Hiking & Trekking, Cycling Tours, Diving Trips, Climbing Holidays, Winter Sports, Multi-Adventure Trips, Safari & Wildlife, Surfing Retreats, Martial Arts Camps |
| Mind & Spirit | Spiritual Retreats, Personal Development, Plant Medicine Retreats, Buddhist Retreats, Shamanic Retreats, Breathwork Retreats, Sound Healing, Astrology & Tarot |
| Lifestyle & Culture | Culinary Vacations, Art & Creative Retreats, Cultural Immersion, Language Immersion, Motorcycle Tours, Ranch Stays, Volunteer Travel, Writing Retreats |
| Health & Fitness | Fitness Retreats, Weight Loss Retreats, Boot Camp Retreats, Triathlon Training, Nutrition Retreats, CrossFit & HIIT, Pilates Retreats |
| Curated for You | Trending Now, Exclusive Offers, Best Value, New & Noteworthy, Editor's Picks |

- Featured: eyebrow "Editor's Pick", "8-Day Mediterranean Wellness Retreat", "From $2,490 per person", link "View offer".
- No footer link.

### 2.2 Destinations (mega menu, 6 groups, 57 links)
| Group | Links |
|---|---|
| Asia | Bali, Indonesia; Thailand; India; Nepal; Sri Lanka; Vietnam; Japan; Cambodia; Maldives; Malaysia; Philippines |
| Europe | Italy, Spain, Greece, Portugal, France, Croatia, Turkey, Switzerland, Austria, UK & Ireland, Iceland |
| Americas | Costa Rica, Mexico, Peru, Colombia, Brazil, Ecuador, Guatemala, USA, Canada, Argentina, Chile |
| Africa & Middle East | Kenya, Tanzania, South Africa, Morocco, Egypt, Jordan, Dubai, Oman, Zanzibar, Rwanda |
| Oceania & Pacific | Australia, New Zealand, Fiji, French Polynesia, Vanuatu, Hawaii, Cook Islands |
| Indian Ocean | Maldives, Sri Lanka, Seychelles, Mauritius, Réunion, Zanzibar, Madagascar |

- Featured: eyebrow "Top Destination", "Bali: Wellness & Discovery Package", "From $1,895 per person", "View offer".
- Footer link: "All destinations".
- **Duplicates:** Maldives, Sri Lanka (Asia and Indian Ocean) and Zanzibar (Africa and Indian Ocean) appear twice. They must resolve to the same page.

### 2.3 Hotels (mega menu, 6 groups, 43 links)
| Group | Links |
|---|---|
| By Type | Wellness Resorts, Luxury Spa Hotels, Boutique Retreats, Eco Lodges, City Wellness Hotels, Beach Resorts, Mountain Retreats, Safari Lodges, Overwater Villas, Treehouses & Unique Stays |
| By Experience | Yoga-Focused, Spa & Thermal, Detox & Cleanse, Fitness & Sport, Meditation & Mindfulness, Family Wellness, Couples Retreats, Solo Traveller, Digital Detox |
| Asia & Pacific | Six Senses Hotels, Aman Resorts, COMO Hotels, Anantara, Banyan Tree, Alila Hotels, Soneva |
| Europe | Chiva-Som Samui, SHA Wellness Clinic, Palazzo Fiuggi, Lanserhof, Clinique La Prairie, Longevity Hotel, Chenot Palace |
| By Budget | Under $150/night, $150–$300/night, $300–$600/night, Luxury $600+/night, All-Inclusive, Value Packages |
| Curated for You | Editor's Selection, New Openings, Best Value, Exclusive Offers |

- Featured: eyebrow "Special Offer", "Azure Spa & Wellness Resort", "From $385 per night", "View offer".
- No footer link.
- The group "Asia & Pacific" holds hotel **brands**, and "Europe" holds single **properties**. These are not categories of the same kind as "Eco Lodges". See open questions.

### 2.4 Lifestyle (small dropdown, 2 links, both external)
| Label | Target | New tab |
|---|---|---|
| Magazine | `https://vacayou.com/magazine/` | yes |
| Glossary | `https://vacayou.com/magazine/wellness-glossary/` | yes |

The code now links them to these external URLs everywhere (updated 2026-11-19).

## 3. Internal vs external
- **Internal (143):** every Experiences, Destinations and Hotels link, the three "View offer" links, and "All destinations".
- **External (2):** Lifestyle Magazine and Glossary. They need `external: true` (new tab, `rel="noopener noreferrer"`, no `next/link` prefetch) as in your `NavLink` type.

## 4. What each item opens

### 4A. Experience category page (e.g. Yoga Retreats, 4 results; Hiking & Trekking, 4 results)
| Part | Reference |
|---|---|
| Header | Standard header plus the docked search bar (built; see [features/search.md](features/search.md)) |
| Hero | Short image hero, breadcrumb `Experiences / <CATEGORY>` (uppercase current crumb), title = category name. Hero image: not captured |
| Results | "N results" line under the hero |
| Grid | 3-column card grid (1 on mobile) |
| Card | Badge (category, uppercase), favorite heart, photo carousel, title, provider, location with pin, star rating plus "4.8 (124)", "N nights", "From $X per person" |
| Reuses | The Home `ExperienceCard`. Distinct screen from the Search page |

### 4B. Hotel category page (e.g. Eco Lodges, 6 results)
| Part | Reference |
|---|---|
| Hero | Short photo hero (resort at dusk), breadcrumb `Hotels / ECO LODGES`, title "Eco Lodges" in the display font |
| Results | "6 results" |
| Grid | 3 columns |
| Card | Badge ("Wellness Resort" or "Wellness Retreat"), heart, photo carousel, 5 gold stars, hotel name, location, rating "4.9 (124)", amenity tags (e.g. Yoga studio, Spa, Private beach), "From $580 per night" |
| Reuses | The Home `HotelCard` |

### 4C. Destination page (e.g. Bali, Thailand, Italy)
| Part | Reference |
|---|---|
| Hero | Tall photo hero, breadcrumb `Destinations / <NAME>`, title, subtitle `<Region> · N+ experiences` |
| Stats row | Best time to visit, Avg. stay, Experiences, From (price in gold) |
| Intro | One paragraph |
| Section | "Experiences in <name>" with filter chips: ALL, YOGA RETREATS, WELLNESS, HIKING & TREKKING, MEDITATION, CYCLING, DIVING, then the card grid |

Data observed:
| Destination | Subtitle | Best time | Avg. stay | Experiences | From |
|---|---|---|---|---|---|
| Bali (from the All Destinations card) | Indonesia · 240+ | Apr – Oct | 10 nights | 240+ | $899 |
| Thailand | Southeast Asia · 310+ | Nov – Apr | 9 nights | 310+ | $749 |
| Italy | Europe · 190+ | Apr – Jun | 8 nights | 190+ | $749 |
| Any other / "Bali, Indonesia" (menu label) | World · 100+ | Year round | 7 nights | 100+ | $799 |

The last row is the reference's **generic fallback** ("Explore our hand-picked selection of experiences in <name>, personally vetted by our team."). It is a prototype shortcut, not something to copy. We will write real facts for about 8 destinations.

## 5. Existing decisions and conflicts
| Topic | Existing decision | Conflict or gap |
|---|---|---|
| Menu hrefs | Provisional (`PROJECT_DECISIONS.md`, `navigation.ts`) | None yet, nothing is built |
| Slugs | `navigation.ts` builds `/{base}/{slugify(label)}`, e.g. `/experiences/yoga-retreats`, `/destinations/bali-indonesia`, `/hotels/eco-lodges` | Slug rule for `$150–$300/night`, `Luxury $600+/night`, `UK & Ireland`, `Réunion` is not defined (check `src/helpers/slugify.ts`) |
| Destination path | `PROJECT_DECISIONS.md`: `/destinations/<region>/<country>` | `navigation.ts` uses a flat `/destinations/<slug>`. Duplicates (Maldives, Sri Lanka, Zanzibar) are ambiguous under `<region>/<country>` |
| Experience filters | `/experiences?type=<slug>` (Home popular chips) | Category pages would be `/experiences/<slug>` |
| Route structure proposal | `../vku-migration/docs/vku-web-structure.md`: `destinations/[...slug]`, `experiences/[...slug]`, `hotels/[slug]` | The proposal is unconfirmed. `/hotels/[slug]` would clash with hotel category slugs |
| Detail pages | Cards link to `/hotels` or `/experiences` today | Detail routes are not decided |
| Redirects / sitemap | `redirect-map.csv` and `url-inventory.csv` are empty | Live-site URLs cannot be matched yet |

## 6. Proposed routes (needs your decision, see section 9)
Recommended, keeps the slugs the nav already generates:

| Page | Route | Notes |
|---|---|---|
| Experience category | `/experiences/[category]` | e.g. `/experiences/yoga-retreats`. Unknown slug: `notFound()` |
| Hotel category | `/hotels/[category]` | e.g. `/hotels/eco-lodges` |
| Destination | `/destinations/[slug]` | e.g. `/destinations/bali-indonesia`. Optional `?category=<experience-category-slug>` filter, rendered on the server |
| Experience detail (future) | `/experiences/[category]/[slug]` | Avoids the clash with the category route |
| Hotel detail (future) | `/hotels/[category]/[slug]` or `/hotel/[slug]` | Decide with the clash in mind |
| Magazine, Glossary | external links, no internal route | Replace `ROUTES.magazine` and `ROUTES.glossary` usage in the nav |

Route helpers to add in `src/constants/routes.ts` (hrefs never typed by hand): `experienceCategory(slug)`, `hotelCategory(slug)`, `destination(slug, { category? })`, plus external URL constants for Magazine and Glossary.

## 7. Proposed data shapes (for Step 2, matches your task text)
```ts
NavLink     { label; href; external? }
NavGroup    { title; links: NavLink[] }
NavFeatured { title; subtitle?; image; href }   // eyebrow and price go in subtitle or extra fields, see open question 6
NavMenu     { id; label; href; groups: NavGroup[]; featured?; footerLink? }
```
Content pools (mock): about 24 experiences, 18 hotels, 8 destinations with facts. Each item carries category slugs so lookups return **related** items only. If fewer than 3 match, top up with a **deterministic** pick seeded by a hash of the slug (no `Math.random`). Unknown slugs return `null`.

## 8. Not in scope but linked from these menus
- The listing screens behind the top-level triggers (All Destinations, "Transformative Experiences", "Exceptional Places to Stay") and the experience/hotel detail pages and checkout are not part of this task. The top-level trigger `href` (`/experiences`, `/destinations`, `/hotels`) will 404 until they exist.
- "View offer" in the three featured cards: the reference opens the login dialog. Our proposal is a normal link to the featured item's future detail route, which 404s until the detail pages exist.

## 9. Decisions I need from you
1. **Routes:** approve the section 6 routes, or choose `destinations/<region>/<country>` and catch-all `[...slug]` from the migration proposal.
2. **Detail route shape** for experiences and hotels, so category slugs never collide with detail slugs.
3. **Hotel "categories":** By Type and By Experience map to hotel tags. Are brands (Six Senses, Aman, ...) and properties (Chiva-Som, SHA, ...) also category pages, or should properties link to a hotel detail page? By Budget needs price ranges.
4. **Experience "Curated for You"** items (Trending Now, Exclusive Offers, Best Value, ...) are collections, not categories. Mock them as tagged subsets?
5. **Top-level triggers** (Experiences, Destinations, Hotels): make them links to the unbuilt listing pages (404 for now), or leave them as buttons until those pages exist?
6. **Featured cards:** keep eyebrow and price ("From $2,490 per person") as extra fields, since your `NavFeatured` type has only title, subtitle, image and href. I propose adding `eyebrow`, `price` and `priceUnit` (as today).
7. **Filter behaviour on the destination page:** `?category=` filters the cards on the server, and "ALL" removes the param. Chips are links (no client JS). Confirm.
8. **External links:** Magazine and Glossary open in a new tab on vacayou.com, as in the reference. Confirm.
9. **Mock destinations (about 8):** which ones? I suggest the ones with facts in the reference (Bali, Thailand, Italy) plus Japan, Costa Rica, Greece, Morocco, Maldives.
