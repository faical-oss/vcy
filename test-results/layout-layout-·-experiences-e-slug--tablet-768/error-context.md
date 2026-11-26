# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: layout.spec.ts >> layout · /experiences/e/[slug]
- Location: e2e/responsive/layout.spec.ts:196:3

# Error details

```
Error: tap-stolen: 2 found

expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 12

- Array []
+ Array [
+   Object {
+     "check": "tap-stolen",
+     "detail": "a tap at 32,169 lands on div \"6-Day Ubud Yoga & De\"",
+     "selector": "a \"Home\"",
+   },
+   Object {
+     "check": "tap-stolen",
+     "detail": "a tap at 200,169 lands on div \"6-Day Ubud Yoga & De\"",
+     "selector": "a \"Yoga Retreats\"",
+   },
+ ]
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to content" [ref=e2] [cursor=pointer]:
    - /url: "#main"
  - banner [ref=e3]:
    - generic [ref=e4]:
      - link "Vacayou home" [ref=e5] [cursor=pointer]:
        - /url: /
        - img "Vacayou" [ref=e6]
      - generic [ref=e16]:
        - button "Open account" [ref=e17]
        - button "Open menu" [ref=e21]
  - 'button "Edit search: Anywhere 27–29 Nov 2026 · 1 traveller" [ref=e26]':
    - generic [ref=e30]:
      - generic [ref=e31]: "Edit search:"
      - generic [ref=e32]: Anywhere
      - generic [ref=e33]: 27–29 Nov 2026 · 1 traveller
  - main [ref=e40]:
    - generic [ref=e41]:
      - generic [ref=e43]:
        - navigation "Breadcrumb" [ref=e45]:
          - list [ref=e46]:
            - listitem [ref=e47]:
              - link "Home" [ref=e48] [cursor=pointer]:
                - /url: /
            - listitem [aria-hidden] [ref=e49]
            - listitem [ref=e52]:
              - generic [ref=e53]: Experiences
            - listitem [aria-hidden] [ref=e54]
            - listitem [ref=e57]:
              - link "Yoga Retreats" [ref=e58] [cursor=pointer]:
                - /url: /experiences/yoga-retreats
            - listitem [aria-hidden] [ref=e59]
            - listitem [ref=e62]:
              - generic [ref=e63]: 6-Day Ubud Yoga & Detox Retreat
        - generic [ref=e65]:
          - link "Back" [ref=e66] [cursor=pointer]:
            - /url: /experiences/yoga-retreats
          - button "Favorite" [ref=e69]
          - button "Share" [ref=e72]
          - status [ref=e79]
        - generic [ref=e80]:
          - heading "6-Day Ubud Yoga & Detox Retreat" [level=1] [ref=e81]
          - paragraph [ref=e82]: Sawah Valley Retreat
          - paragraph [ref=e83]:
            - generic [ref=e84]:
              - generic [ref=e85]:
                - img "4.8 out of 5" [ref=e86]
                - generic [ref=e97]: "4.8"
              - generic [ref=e98]: (212 reviews)
            - generic [ref=e99]: Ubud, Bali
            - generic [ref=e105]: 6 nights
            - generic [ref=e111]: 4–12 people
          - group "Highlights" [ref=e119]:
            - generic [ref=e120]: Yoga Retreats
            - generic [ref=e121]: Best seller
      - generic [ref=e123]:
        - generic [ref=e125]:
          - generic [ref=e126]:
            - 'img "6-Day Ubud Yoga & Detox Retreat, Ubud, Bali: photo 1 of 8" [ref=e127]'
            - 'button "Open all photos, starting with: 6-Day Ubud Yoga & Detox Retreat, Ubud, Bali: photo 1 of 8" [ref=e128]'
          - generic [ref=e129]:
            - 'img "6-Day Ubud Yoga & Detox Retreat, Ubud, Bali: photo 2 of 8" [ref=e130]'
            - 'button "Open all photos, starting with: 6-Day Ubud Yoga & Detox Retreat, Ubud, Bali: photo 2 of 8" [ref=e132]'
            - button "Watch video" [ref=e133]
          - generic [ref=e136]:
            - generic [ref=e137]:
              - 'img "6-Day Ubud Yoga & Detox Retreat, Ubud, Bali: photo 3 of 8" [ref=e138]'
              - 'button "Open all photos, starting with: 6-Day Ubud Yoga & Detox Retreat, Ubud, Bali: photo 3 of 8" [ref=e139]'
            - generic [ref=e140]:
              - 'img "6-Day Ubud Yoga & Detox Retreat, Ubud, Bali: photo 4 of 8" [ref=e141]'
              - button "+21 more photos of 6-Day Ubud Yoga & Detox Retreat" [ref=e142]:
                - generic [ref=e143]: +21 more
                - generic [ref=e144]: photos of 6-Day Ubud Yoga & Detox Retreat
        - generic [ref=e146]:
          - tablist "Experience information" [ref=e148]:
            - tab "Overview" [selected] [ref=e149]
            - tab "Itinerary" [ref=e150]
            - tab "Hotel & Rooms" [ref=e151]
            - tab "Reviews" [ref=e152]
          - tabpanel "Overview" [ref=e153]:
            - generic [ref=e154]:
              - region "About this experience" [ref=e155]:
                - heading "About this experience" [level=2] [ref=e156]
                - generic [ref=e157]:
                  - paragraph [ref=e158]: 6-Day Ubud Yoga & Detox Retreat is a 6-night yoga experience with Sawah Valley Retreat in Ubud, Bali. You arrive, settle in and leave the planning to the team.
                  - paragraph [ref=e159]: Each day starts with a gentle sunrise practice and ends with a long meditation, with free time in between to swim, walk or rest.
                  - paragraph [ref=e160]: Small groups, honest food and a setting in Ubud that makes it easy to switch off. Everything is included, so you can simply be there.
              - region "Highlights" [ref=e161]:
                - heading "Highlights" [level=2] [ref=e162]
                - list [ref=e163]:
                  - listitem [ref=e164]: Sunrise yoga with expert teachers
                  - listitem [ref=e171]: Meditation and breathwork sessions
                  - listitem [ref=e175]: Fresh plant-forward meals
                  - listitem [ref=e179]: Evening sound bath
                  - listitem [ref=e183]: Guided nature walk
                  - listitem [ref=e187]: Small groups, personal attention
              - region "What's included" [ref=e190]:
                - heading "What's included" [level=2] [ref=e191]
                - list [ref=e192]:
                  - listitem [ref=e193]:
                    - generic [ref=e196]: 6 nights accommodation
                  - listitem [ref=e197]:
                    - generic [ref=e200]: Daily yoga and meditation classes
                  - listitem [ref=e201]:
                    - generic [ref=e204]: All meals (full board)
                  - listitem [ref=e205]:
                    - generic [ref=e208]: Airport transfers
                  - listitem [ref=e209]:
                    - generic [ref=e212]: Welcome ceremony and wellness consultation
                  - listitem [ref=e213]:
                    - generic [ref=e216]: Welcome drinks and a yoga briefing
                  - listitem [ref=e217]:
                    - generic [ref=e221]:
                      - text: Spa treatments (bookable on site)
                      - generic [ref=e222]: (not included)
              - region "Location" [ref=e223]:
                - heading "Location" [level=2] [ref=e224]
                - generic [ref=e225]:
                  - generic [ref=e226]:
                    - paragraph [ref=e227]: Sawah Valley Retreat
                    - paragraph [ref=e228]: Ubud, Bali
                  - paragraph [ref=e233]: UBUD, BALI
                  - link "Open in Maps (opens in a new tab)" [ref=e234] [cursor=pointer]:
                    - /url: https://www.openstreetmap.org/search?query=Sawah%20Valley%20Retreat%2C%20Ubud%2C%20Bali
                    - text: Open in Maps
                    - generic [ref=e239]: (opens in a new tab)
    - generic [ref=e241]:
      - heading "You might also like" [level=2] [ref=e242]
      - list [ref=e243]:
        - listitem [ref=e244]:
          - article [ref=e245]:
            - generic [ref=e246]:
              - generic [ref=e247]:
                - generic [ref=e248]:
                  - img "7-Day Surf & Yoga Week" [ref=e249]
                  - generic [ref=e250]:
                    - button "Go to image 1" [ref=e251]
                    - button "Go to image 2" [ref=e253]
                    - button "Go to image 3" [ref=e255]
                    - button "Go to image 4" [ref=e257]
                - button "Add 7-Day Surf & Yoga Week to favorites" [ref=e259]
                - generic [ref=e262]: Yoga Retreats
              - generic [ref=e263]:
                - heading [level=3] [ref=e264]:
                  - link "7-Day Surf & Yoga Week" [ref=e265] [cursor=pointer]:
                    - /url: /experiences/e/canggu-surf-and-yoga-week
                - paragraph [ref=e266]: Echo Beach Collective
                - paragraph [ref=e267]: Canggu, Bali
                - paragraph [ref=e271]: 7 nights
                - generic [ref=e276]:
                  - img "4.6 out of 5" [ref=e277]
                  - generic [ref=e288]: 4.6 (94)
        - listitem [ref=e291]:
          - article [ref=e292]:
            - generic [ref=e293]:
              - generic [ref=e294]:
                - generic [ref=e295]:
                  - img "5-Day Himalayan Yoga Immersion" [ref=e296]
                  - generic [ref=e297]:
                    - button "Go to image 1" [ref=e298]
                    - button "Go to image 2" [ref=e300]
                    - button "Go to image 3" [ref=e302]
                    - button "Go to image 4" [ref=e304]
                - button "Add 5-Day Himalayan Yoga Immersion to favorites" [ref=e306]
                - generic [ref=e309]: Yoga Retreats
              - generic [ref=e310]:
                - heading [level=3] [ref=e311]:
                  - link "5-Day Himalayan Yoga Immersion" [ref=e312] [cursor=pointer]:
                    - /url: /experiences/e/himalayan-yoga-immersion
                - paragraph [ref=e313]: Ganga Shala Rishikesh
                - paragraph [ref=e314]: Rishikesh, India
                - paragraph [ref=e318]: 5 nights
                - generic [ref=e323]:
                  - img "4.9 out of 5" [ref=e324]
                  - generic [ref=e335]: 4.9 (168)
        - listitem [ref=e338]:
          - article [ref=e339]:
            - generic [ref=e340]:
              - generic [ref=e341]:
                - generic [ref=e342]:
                  - img "4-Day Tuscan Hills Yoga Weekend" [ref=e343]
                  - generic [ref=e344]:
                    - button "Go to image 1" [ref=e345]
                    - button "Go to image 2" [ref=e347]
                    - button "Go to image 3" [ref=e349]
                    - button "Go to image 4" [ref=e351]
                - button "Add 4-Day Tuscan Hills Yoga Weekend to favorites" [ref=e353]
                - generic [ref=e356]: Yoga Retreats
              - generic [ref=e357]:
                - heading [level=3] [ref=e358]:
                  - link "4-Day Tuscan Hills Yoga Weekend" [ref=e359] [cursor=pointer]:
                    - /url: /experiences/e/tuscan-hills-yoga-weekend
                - paragraph [ref=e360]: Podere Santa Chiara
                - paragraph [ref=e361]: Tuscany, Italy
                - paragraph [ref=e365]: 4 nights
                - generic [ref=e370]:
                  - img "4.7 out of 5" [ref=e371]
                  - generic [ref=e382]: 4.7 (57)
    - button "Select dates" [ref=e388]
  - contentinfo [ref=e391]:
    - generic [ref=e392]:
      - generic [ref=e393]:
        - generic [ref=e394]:
          - link "Vacayou home" [ref=e395] [cursor=pointer]:
            - /url: /
            - img "Vacayou" [ref=e396]
          - paragraph [ref=e405]: Wellness travel, active adventures and transformative experiences — curated for the mindful explorer.
          - paragraph [ref=e406]: Follow us
          - list [ref=e407]:
            - listitem [ref=e408]:
              - link "Instagram" [ref=e409] [cursor=pointer]:
                - /url: "#"
            - listitem [ref=e414]:
              - link "Facebook" [ref=e415] [cursor=pointer]:
                - /url: "#"
            - listitem [ref=e418]:
              - link "X" [ref=e419] [cursor=pointer]:
                - /url: "#"
            - listitem [ref=e422]:
              - link "Pinterest" [ref=e423] [cursor=pointer]:
                - /url: "#"
            - listitem [ref=e426]:
              - link "RSS feed" [ref=e427] [cursor=pointer]:
                - /url: "#"
        - navigation "Explore" [ref=e432]:
          - heading "Explore" [level=2] [ref=e433]
          - list [ref=e434]:
            - listitem [ref=e435]:
              - link "Experiences" [ref=e436] [cursor=pointer]:
                - /url: /experiences/groups/wellness
            - listitem [ref=e437]:
              - link "Destinations" [ref=e438] [cursor=pointer]:
                - /url: /destinations
            - listitem [ref=e439]:
              - link "Hotels" [ref=e440] [cursor=pointer]:
                - /url: /hotels/groups/by-type
            - listitem [ref=e441]:
              - link "Magazine (opens in a new tab)" [ref=e442] [cursor=pointer]:
                - /url: https://vacayou.com/magazine/
                - text: Magazine
                - generic [ref=e443]: (opens in a new tab)
            - listitem [ref=e444]:
              - link "Glossary (opens in a new tab)" [ref=e445] [cursor=pointer]:
                - /url: https://vacayou.com/magazine/wellness-glossary/
                - text: Glossary
                - generic [ref=e446]: (opens in a new tab)
        - navigation "Information" [ref=e447]:
          - heading "Information" [level=2] [ref=e448]
          - list [ref=e449]:
            - listitem [ref=e450]:
              - link "About us" [ref=e451] [cursor=pointer]:
                - /url: /information/about-us
            - listitem [ref=e452]:
              - link "Why book with Vacayou" [ref=e453] [cursor=pointer]:
                - /url: /information/why-book-with-vacayou
            - listitem [ref=e454]:
              - link "Travel Insurance" [ref=e455] [cursor=pointer]:
                - /url: /information/travel-insurance
            - listitem [ref=e456]:
              - link "Contact us" [ref=e457] [cursor=pointer]:
                - /url: /support
        - navigation "Become a Partner" [ref=e458]:
          - heading "Become a Partner" [level=2] [ref=e459]
          - list [ref=e460]:
            - listitem [ref=e461]:
              - link "Resorts & Retreats" [ref=e462] [cursor=pointer]:
                - /url: /partners/resorts-and-retreats
            - listitem [ref=e463]:
              - link "Tour Providers" [ref=e464] [cursor=pointer]:
                - /url: /partners/tour-providers
            - listitem [ref=e465]:
              - link "Hotels & Spas" [ref=e466] [cursor=pointer]:
                - /url: /partners/hotels-and-spas
            - listitem [ref=e467]:
              - link "List your experience" [ref=e468] [cursor=pointer]:
                - /url: /partners/list-your-experience
      - list [ref=e470]:
        - listitem [ref=e471]:
          - img "Trust accreditation" [ref=e472]
        - listitem [ref=e473]:
          - img "Trust accreditation" [ref=e474]
        - listitem [ref=e475]:
          - img "Trust accreditation" [ref=e476]
        - listitem [ref=e477]:
          - img "Trust accreditation" [ref=e478]
        - listitem [ref=e479]:
          - img "Trust accreditation" [ref=e480]
        - listitem [ref=e481]:
          - img "Trust accreditation" [ref=e482]
        - listitem [ref=e483]:
          - img "Trust accreditation" [ref=e484]
        - listitem [ref=e485]:
          - img "Trust accreditation" [ref=e486]
        - listitem [aria-hidden] [ref=e487]
        - listitem [aria-hidden] [ref=e489]
        - listitem [aria-hidden] [ref=e491]
        - listitem [aria-hidden] [ref=e493]
        - listitem [aria-hidden] [ref=e495]
        - listitem [aria-hidden] [ref=e497]
        - listitem [aria-hidden] [ref=e499]
        - listitem [aria-hidden] [ref=e501]
      - generic [ref=e503]:
        - paragraph [ref=e504]: © 2026 Vacayou.com. All rights reserved.
        - list [ref=e505]:
          - listitem [ref=e506]:
            - link "Terms of Use" [ref=e507] [cursor=pointer]:
              - /url: /terms
          - listitem [ref=e508]:
            - link "Privacy Policy" [ref=e509] [cursor=pointer]:
              - /url: /privacy
  - alert [ref=e510]
```

# Test source

```ts
  127 |     if (!visible(image)) continue;
  128 |     const rect = image.getBoundingClientRect();
  129 |     if (image.complete && image.naturalWidth === 0) add("image", image, `failed to load ${image.currentSrc.slice(0, 60)}`);
  130 |     const sized = (image.hasAttribute("width") && image.hasAttribute("height")) || getComputedStyle(image).position === "absolute";
  131 |     if (!sized && !image.closest("picture,svg")) add("image", image, "no width/height attributes and not absolutely positioned: reserves no space");
  132 |     const parent = image.parentElement;
  133 |     if (parent && getComputedStyle(parent).position !== "static") {
  134 |       const box = parent.getBoundingClientRect();
  135 |       if (rect.right > box.right + 1 || rect.left < box.left - 1) add("image", image, `overflows its parent by ${Math.round(Math.max(rect.right - box.right, box.left - rect.left))}px`);
  136 |     }
  137 |   }
  138 | 
  139 |   // 5. large screens: the content (text, controls, images) stays in the site column
  140 |   if (window.innerWidth >= large) {
  141 |     let left = Infinity;
  142 |     let right = -Infinity;
  143 |     for (const element of document.querySelectorAll("main h1, main h2, main h3, main p, main a, main button, main input, main img, footer a, footer p, footer h2")) {
  144 |       // Sideways scrollers and the logo marquee run past the column on purpose: only what is not clipped counts.
  145 |       if (!visible(element) || (element as HTMLElement).offsetParent === null || clipped(element)) continue;
  146 |       const rect = element.getBoundingClientRect();
  147 |       left = Math.min(left, rect.left);
  148 |       right = Math.max(right, rect.right);
  149 |     }
  150 |     if (right - left > siteMax + 2) add("max-width", document.body, `content spans ${Math.round(right - left)}px (> ${siteMax})`);
  151 |     if (Math.abs(left - (viewport - right)) > 20) add("centered", document.body, `left gap ${Math.round(left)}px, right gap ${Math.round(viewport - right)}px`);
  152 |   }
  153 |   return issues;
  154 | }
  155 | 
  156 | /**
  157 |  * Tap stealing (touch projects): the invisible 44x44 hit area of one control (src/app/globals.css) must not sit over the visible part
  158 |  * of a neighbour. Five points inside every control are hit-tested; the element under the finger must be the control itself or part of it.
  159 |  * Fixed and sticky bars legitimately cover what scrolls under them and are skipped.
  160 |  */
  161 | function stolenTaps(): Issue[] {
  162 |   const issues: Issue[] = [];
  163 |   const selector = "a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab], [role=link], [role=checkbox], [role=radio], [role=menuitem], [role=switch]";
  164 |   const name = (element: Element) => `${element.tagName.toLowerCase()}${element.getAttribute("aria-label") ? `[aria-label="${element.getAttribute("aria-label")?.slice(0, 24)}"]` : ""} "${(element.textContent ?? "").trim().slice(0, 20)}"`;
  165 |   const pinned = (element: Element) => {
  166 |     for (let node: Element | null = element; node; node = node.parentElement) {
  167 |       const position = getComputedStyle(node).position;
  168 |       if (position === "fixed" || position === "sticky") return true;
  169 |     }
  170 |     return false;
  171 |   };
  172 |   for (const element of document.body.querySelectorAll(selector)) {
  173 |     const style = getComputedStyle(element);
  174 |     const rect = element.getBoundingClientRect();
  175 |     if (style.visibility === "hidden" || style.display === "none" || rect.width < 4 || rect.height < 4 || element.closest(".sr-only,[inert],[aria-hidden='true']")) continue;
  176 |     // Two by design: the price slider inputs only take the pointer on their thumbs (pointer-events: none), and a big photo button
  177 |     // carries smaller buttons on top of it ("Watch video", the heart).
  178 |     // A button that fills its photo tile (absolute, as wide as the tile) carries the chip on top by design, however small the tile is.
  179 |     const fillsParent = style.position === "absolute" && !!element.parentElement && Math.abs(rect.width - element.parentElement.getBoundingClientRect().width) < 2;
  180 |     if ((element as HTMLInputElement).type === "range" || rect.width * rect.height > 40_000 || fillsParent) continue;
  181 |     for (const [fx, fy] of [[0.5, 0.5], [0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) {
  182 |       const x = rect.left + rect.width * fx;
  183 |       const y = rect.top + rect.height * fy;
  184 |       if (x < 0 || y < 0 || x >= window.innerWidth || y >= window.innerHeight) continue;
  185 |       const top = document.elementFromPoint(x, y);
  186 |       if (!top || element.contains(top) || top.contains(element) || (top.closest("label") && top.closest("label")?.contains(element)) || pinned(top)) continue;
  187 |       // A stretched card link covers its card by design; what sits above it (heart, tags) has its own z-index and passes the test.
  188 |       issues.push({ check: "tap-stolen", selector: name(element), detail: `a tap at ${Math.round(x)},${Math.round(y)} lands on ${name(top.closest(selector) ?? top)}` });
  189 |       break;
  190 |     }
  191 |   }
  192 |   return issues;
  193 | }
  194 | 
  195 | for (const route of ROUTE_CASES) {
  196 |   test(`layout · ${route.name}`, async ({ page }) => {
  197 |     await openRoute(page, route);
  198 |     const args = { touch: isTouch(), width: viewportWidth(), minTarget: MIN_TARGET, siteMax: SITE_MAX, large: LARGE };
  199 |     const issues = await page.evaluate(analyse, args);
  200 |     // The sticky and fixed bars are looked at again half way down and at the very bottom of the page.
  201 |     for (const fraction of [0.45, 1]) {
  202 |       await page.evaluate((f) => window.scrollTo(0, (document.documentElement.scrollHeight - window.innerHeight) * f), fraction);
  203 |       await page.waitForTimeout(100);
  204 |       const more = await page.evaluate(analyse, args);
  205 |       issues.push(...more.filter((issue) => issue.check === "fixed-overlap" || issue.check === "covered-by-bar"));
  206 |     }
  207 |     if (isTouch()) {
  208 |       // Walk down the page one screen at a time (elementFromPoint only sees what is on screen).
  209 |       const height = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  210 |       const seen = new Set<string>();
  211 |       for (let y = 0, steps = 0; y <= height && steps < 30; y += (page.viewportSize()?.height ?? 700) * 0.8, steps++) {
  212 |         await page.evaluate((top) => window.scrollTo(0, top), y);
  213 |         await page.waitForTimeout(60);
  214 |         for (const issue of await page.evaluate(stolenTaps)) {
  215 |           const key = `${issue.selector}|${issue.detail}`;
  216 |           if (!seen.has(key)) {
  217 |             seen.add(key);
  218 |             issues.push(issue);
  219 |           }
  220 |         }
  221 |       }
  222 |     }
  223 |     const cls = await page.evaluate(() => (window as unknown as { __clsLoad: number }).__clsLoad);
  224 |     const report: Report = { cls, issues };
  225 |     for (const check of ["overflow", "wider-than-viewport", "tap-target", "tap-stolen", "clipped-text", "fixed-overlap", "covered-by-bar", "image", "max-width", "centered"]) {
  226 |       const found = report.issues.filter((issue) => issue.check === check);
> 227 |       expect.soft(found.slice(0, 12), `${check}: ${found.length} found${found.length > 12 ? " (first 12 shown)" : ""}`).toEqual([]);
      |                                                                                                                         ^ Error: tap-stolen: 2 found
  228 |     }
  229 |     expect.soft(report.cls, "cumulative layout shift").toBeLessThan(0.1);
  230 |   });
  231 | }
  232 | 
```