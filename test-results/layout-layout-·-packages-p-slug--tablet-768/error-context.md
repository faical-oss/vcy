# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: layout.spec.ts >> layout · /packages/p/[slug]
- Location: e2e/responsive/layout.spec.ts:196:3

# Error details

```
Error: tap-stolen: 1 found

expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 7

- Array []
+ Array [
+   Object {
+     "check": "tap-stolen",
+     "detail": "a tap at 32,169 lands on div \"Bali Soul & SurfFive\"",
+     "selector": "a \"Home\"",
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
              - generic [ref=e53]: Packages
            - listitem [aria-hidden] [ref=e54]
            - listitem [ref=e57]:
              - generic [ref=e58]: Bali Soul & Surf
        - generic [ref=e60]:
          - link "Back" [ref=e61] [cursor=pointer]:
            - /url: /
          - button "Favorite" [ref=e64]
          - button "Share" [ref=e67]
          - status [ref=e74]
        - generic [ref=e75]:
          - heading "Bali Soul & Surf" [level=1] [ref=e76]
          - paragraph [ref=e77]: Fivelements Retreat Bali
          - paragraph [ref=e78]:
            - generic [ref=e79]:
              - generic [ref=e80]:
                - img "4.9 out of 5" [ref=e81]
                - generic [ref=e92]: "4.9"
              - generic [ref=e93]: (124 reviews)
            - generic [ref=e94]: Bali, Indonesia
            - generic [ref=e100]: 7 nights
            - generic [ref=e106]: 1–12 people
          - group "Highlights" [ref=e114]:
            - generic [ref=e115]: Surf & Wellness
            - generic [ref=e116]: Best Seller
      - generic [ref=e118]:
        - generic [ref=e120]:
          - generic [ref=e121]:
            - 'img "Bali Soul & Surf, Bali, Indonesia: photo 1 of 8" [ref=e122]'
            - 'button "Open all photos, starting with: Bali Soul & Surf, Bali, Indonesia: photo 1 of 8" [ref=e123]'
          - generic [ref=e124]:
            - 'img "Bali Soul & Surf, Bali, Indonesia: photo 2 of 8" [ref=e125]'
            - 'button "Open all photos, starting with: Bali Soul & Surf, Bali, Indonesia: photo 2 of 8" [ref=e127]'
            - button "Watch video" [ref=e128]
          - generic [ref=e131]:
            - generic [ref=e132]:
              - 'img "Bali Soul & Surf, Bali, Indonesia: photo 3 of 8" [ref=e133]'
              - 'button "Open all photos, starting with: Bali Soul & Surf, Bali, Indonesia: photo 3 of 8" [ref=e134]'
            - generic [ref=e135]:
              - 'img "Bali Soul & Surf, Bali, Indonesia: photo 4 of 8" [ref=e136]'
              - button "+21 more photos of Bali Soul & Surf" [ref=e137]:
                - generic [ref=e138]: +21 more
                - generic [ref=e139]: photos of Bali Soul & Surf
        - generic [ref=e141]:
          - tablist "Package information" [ref=e143]:
            - tab "Overview" [selected] [ref=e144]
            - tab "Itinerary" [ref=e145]
            - tab "Accommodation" [ref=e146]
            - tab "Reviews" [ref=e147]
          - tabpanel "Overview" [ref=e148]:
            - generic [ref=e149]:
              - region "About this package" [ref=e150]:
                - heading "About this package" [level=2] [ref=e151]
                - generic [ref=e152]:
                  - paragraph [ref=e153]: Bali Soul & Surf is a 7-night wellness experience with Fivelements Retreat Bali in Bali, Indonesia. You arrive, settle in and leave the planning to the team.
                  - paragraph [ref=e154]: Daily treatments, mindful movement and nourishing food are planned for you, so the only decision is how deeply to rest.
                  - paragraph [ref=e155]: Small groups, honest food and a setting in Bali that makes it easy to switch off. Everything is included, so you can simply be there.
              - region "Highlights" [ref=e156]:
                - heading "Highlights" [level=2] [ref=e157]
                - list [ref=e158]:
                  - listitem [ref=e159]: Personal wellness plan on arrival
                  - listitem [ref=e163]: Daily spa or Ayurveda treatment
                  - listitem [ref=e167]: Nutritionist-designed menus
                  - listitem [ref=e171]: Morning movement and stretching
                  - listitem [ref=e178]: Sleep and stress coaching
                  - listitem [ref=e181]: Quiet setting with space to unplug
              - region "What's included" [ref=e185]:
                - heading "What's included" [level=2] [ref=e186]
                - list [ref=e187]:
                  - listitem [ref=e188]:
                    - generic [ref=e191]: 7 nights accommodation
                  - listitem [ref=e192]:
                    - generic [ref=e195]: Daily treatments
                  - listitem [ref=e196]:
                    - generic [ref=e199]: All meals (full board)
                  - listitem [ref=e200]:
                    - generic [ref=e203]: Airport transfers
                  - listitem [ref=e204]:
                    - generic [ref=e207]: Doctor or therapist consultation
                  - listitem [ref=e208]:
                    - generic [ref=e211]: Welcome drinks and a wellness briefing
                  - listitem [ref=e212]:
                    - generic [ref=e216]:
                      - text: Extra spa treatments
                      - generic [ref=e217]: (not included)
              - region "Location" [ref=e218]:
                - heading "Location" [level=2] [ref=e219]
                - generic [ref=e220]:
                  - generic [ref=e221]:
                    - paragraph [ref=e222]: Fivelements Retreat Bali
                    - paragraph [ref=e223]: Bali, Indonesia
                  - paragraph [ref=e228]: BALI, INDONESIA
                  - link "Open in Maps (opens in a new tab)" [ref=e229] [cursor=pointer]:
                    - /url: https://www.openstreetmap.org/search?query=Fivelements%20Retreat%20Bali%2C%20Bali%2C%20Indonesia
                    - text: Open in Maps
                    - generic [ref=e234]: (opens in a new tab)
    - generic [ref=e236]:
      - heading "You might also like" [level=2] [ref=e237]
      - list [ref=e238]:
        - listitem [ref=e239]:
          - article [ref=e240]:
            - generic [ref=e241]:
              - generic [ref=e242]:
                - img "3-Day Solo Transformational Retreat in Joshua Tree" [ref=e244]
                - generic [ref=e245]: Solo journey
                - button "Add 3-Day Solo Transformational Retreat in Joshua Tree to favorites" [ref=e246]
              - generic [ref=e249]:
                - generic [ref=e250]:
                  - text: Solo Meditation
                  - heading [level=3] [ref=e251]:
                    - link "3-Day Solo Transformational Retreat in Joshua Tree" [ref=e252] [cursor=pointer]:
                      - /url: /packages/p/joshua-tree-solo
                  - paragraph [ref=e253]: Camp Vortex
                - paragraph [ref=e254]: Joshua Tree, California
                - paragraph [ref=e258]: 2 nights
        - listitem [ref=e264]:
          - article [ref=e265]:
            - generic [ref=e266]:
              - generic [ref=e267]:
                - generic [ref=e268]:
                  - img "Pura Vida Yoga & Surf" [ref=e269]
                  - generic [ref=e270]:
                    - button "Go to image 1" [ref=e271]
                    - button "Go to image 2" [ref=e273]
                    - button "Go to image 3" [ref=e275]
                    - button "Go to image 4" [ref=e277]
                - generic [ref=e279]: New
                - button "Add Pura Vida Yoga & Surf to favorites" [ref=e280]
              - generic [ref=e283]:
                - generic [ref=e284]:
                  - text: Yoga & Surf
                  - heading [level=3] [ref=e285]:
                    - link "Pura Vida Yoga & Surf" [ref=e286] [cursor=pointer]:
                      - /url: /packages/p/pura-vida
                  - paragraph [ref=e287]: Blue Osa Yoga Retreat
                - paragraph [ref=e288]: Osa Peninsula, Costa Rica
                - paragraph [ref=e292]: 7 nights
        - listitem [ref=e298]:
          - article [ref=e299]:
            - generic [ref=e300]:
              - generic [ref=e301]:
                - img "Maldives Wellness Escape" [ref=e303]
                - generic [ref=e304]: Luxury
                - button "Add Maldives Wellness Escape to favorites" [ref=e305]
              - generic [ref=e308]:
                - generic [ref=e309]:
                  - text: Luxury Wellness
                  - heading [level=3] [ref=e310]:
                    - link "Maldives Wellness Escape" [ref=e311] [cursor=pointer]:
                      - /url: /packages/p/maldives-escape
                  - paragraph [ref=e312]: JOALI BEING
                - paragraph [ref=e313]: Maldives
                - paragraph [ref=e317]: 6 nights
    - button "Select dates" [ref=e326]
  - contentinfo [ref=e329]:
    - generic [ref=e330]:
      - generic [ref=e331]:
        - generic [ref=e332]:
          - link "Vacayou home" [ref=e333] [cursor=pointer]:
            - /url: /
            - img "Vacayou" [ref=e334]
          - paragraph [ref=e343]: Wellness travel, active adventures and transformative experiences — curated for the mindful explorer.
          - paragraph [ref=e344]: Follow us
          - list [ref=e345]:
            - listitem [ref=e346]:
              - link "Instagram" [ref=e347] [cursor=pointer]:
                - /url: "#"
            - listitem [ref=e352]:
              - link "Facebook" [ref=e353] [cursor=pointer]:
                - /url: "#"
            - listitem [ref=e356]:
              - link "X" [ref=e357] [cursor=pointer]:
                - /url: "#"
            - listitem [ref=e360]:
              - link "Pinterest" [ref=e361] [cursor=pointer]:
                - /url: "#"
            - listitem [ref=e364]:
              - link "RSS feed" [ref=e365] [cursor=pointer]:
                - /url: "#"
        - navigation "Explore" [ref=e370]:
          - heading "Explore" [level=2] [ref=e371]
          - list [ref=e372]:
            - listitem [ref=e373]:
              - link "Experiences" [ref=e374] [cursor=pointer]:
                - /url: /experiences/groups/wellness
            - listitem [ref=e375]:
              - link "Destinations" [ref=e376] [cursor=pointer]:
                - /url: /destinations
            - listitem [ref=e377]:
              - link "Hotels" [ref=e378] [cursor=pointer]:
                - /url: /hotels/groups/by-type
            - listitem [ref=e379]:
              - link "Magazine (opens in a new tab)" [ref=e380] [cursor=pointer]:
                - /url: https://vacayou.com/magazine/
                - text: Magazine
                - generic [ref=e381]: (opens in a new tab)
            - listitem [ref=e382]:
              - link "Glossary (opens in a new tab)" [ref=e383] [cursor=pointer]:
                - /url: https://vacayou.com/magazine/wellness-glossary/
                - text: Glossary
                - generic [ref=e384]: (opens in a new tab)
        - navigation "Information" [ref=e385]:
          - heading "Information" [level=2] [ref=e386]
          - list [ref=e387]:
            - listitem [ref=e388]:
              - link "About us" [ref=e389] [cursor=pointer]:
                - /url: /information/about-us
            - listitem [ref=e390]:
              - link "Why book with Vacayou" [ref=e391] [cursor=pointer]:
                - /url: /information/why-book-with-vacayou
            - listitem [ref=e392]:
              - link "Travel Insurance" [ref=e393] [cursor=pointer]:
                - /url: /information/travel-insurance
            - listitem [ref=e394]:
              - link "Contact us" [ref=e395] [cursor=pointer]:
                - /url: /support
        - navigation "Become a Partner" [ref=e396]:
          - heading "Become a Partner" [level=2] [ref=e397]
          - list [ref=e398]:
            - listitem [ref=e399]:
              - link "Resorts & Retreats" [ref=e400] [cursor=pointer]:
                - /url: /partners/resorts-and-retreats
            - listitem [ref=e401]:
              - link "Tour Providers" [ref=e402] [cursor=pointer]:
                - /url: /partners/tour-providers
            - listitem [ref=e403]:
              - link "Hotels & Spas" [ref=e404] [cursor=pointer]:
                - /url: /partners/hotels-and-spas
            - listitem [ref=e405]:
              - link "List your experience" [ref=e406] [cursor=pointer]:
                - /url: /partners/list-your-experience
      - list [ref=e408]:
        - listitem [ref=e409]:
          - img "Trust accreditation" [ref=e410]
        - listitem [ref=e411]:
          - img "Trust accreditation" [ref=e412]
        - listitem [ref=e413]:
          - img "Trust accreditation" [ref=e414]
        - listitem [ref=e415]:
          - img "Trust accreditation" [ref=e416]
        - listitem [ref=e417]:
          - img "Trust accreditation" [ref=e418]
        - listitem [ref=e419]:
          - img "Trust accreditation" [ref=e420]
        - listitem [ref=e421]:
          - img "Trust accreditation" [ref=e422]
        - listitem [ref=e423]:
          - img "Trust accreditation" [ref=e424]
        - listitem [aria-hidden] [ref=e425]
        - listitem [aria-hidden] [ref=e427]
        - listitem [aria-hidden] [ref=e429]
        - listitem [aria-hidden] [ref=e431]
        - listitem [aria-hidden] [ref=e433]
        - listitem [aria-hidden] [ref=e435]
        - listitem [aria-hidden] [ref=e437]
        - listitem [aria-hidden] [ref=e439]
      - generic [ref=e441]:
        - paragraph [ref=e442]: © 2026 Vacayou.com. All rights reserved.
        - list [ref=e443]:
          - listitem [ref=e444]:
            - link "Terms of Use" [ref=e445] [cursor=pointer]:
              - /url: /terms
          - listitem [ref=e446]:
            - link "Privacy Policy" [ref=e447] [cursor=pointer]:
              - /url: /privacy
  - alert [ref=e448]
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
      |                                                                                                                         ^ Error: tap-stolen: 1 found
  228 |     }
  229 |     expect.soft(report.cls, "cumulative layout shift").toBeLessThan(0.1);
  230 |   });
  231 | }
  232 | 
```