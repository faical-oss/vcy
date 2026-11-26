# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: layout.spec.ts >> layout · /hotels/h/[slug]
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
+     "detail": "a tap at 32,169 lands on div \"Azure Spa & Wellness\"",
+     "selector": "a \"Home\"",
+   },
+   Object {
+     "check": "tap-stolen",
+     "detail": "a tap at 171,169 lands on div \"Azure Spa & Wellness\"",
+     "selector": "a \"Wellness Resorts\"",
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
              - generic [ref=e53]: Hotels
            - listitem [aria-hidden] [ref=e54]
            - listitem [ref=e57]:
              - link "Wellness Resorts" [ref=e58] [cursor=pointer]:
                - /url: /hotels/wellness-resorts
            - listitem [aria-hidden] [ref=e59]
            - listitem [ref=e62]:
              - generic [ref=e63]: Azure Spa & Wellness Resort
        - generic [ref=e65]:
          - link "Back" [ref=e66] [cursor=pointer]:
            - /url: /hotels/wellness-resorts
          - button "Favorite" [ref=e69]
          - button "Share" [ref=e72]
          - status [ref=e79]
        - generic [ref=e80]:
          - heading "Azure Spa & Wellness Resort" [level=1] [ref=e81]
          - paragraph [ref=e82]:
            - generic [ref=e83]:
              - generic [ref=e84]:
                - img "4.8 out of 5" [ref=e85]
                - generic [ref=e96]: "4.8"
              - generic [ref=e97]: (312 reviews)
            - generic [ref=e98]: Krabi, Thailand
          - group "Highlights" [ref=e104]:
            - img "5-star hotel" [ref=e105]
            - generic [ref=e116]: Wellness Resort
      - generic [ref=e118]:
        - generic [ref=e120]:
          - generic [ref=e121]:
            - 'img "Azure Spa & Wellness Resort, Krabi: photo 1 of 8" [ref=e122]'
            - 'button "Open all photos, starting with: Azure Spa & Wellness Resort, Krabi: photo 1 of 8" [ref=e123]'
          - generic [ref=e124]:
            - 'img "Azure Spa & Wellness Resort, Krabi: photo 2 of 8" [ref=e125]'
            - 'button "Open all photos, starting with: Azure Spa & Wellness Resort, Krabi: photo 2 of 8" [ref=e127]'
          - generic [ref=e128]:
            - generic [ref=e129]:
              - 'img "Azure Spa & Wellness Resort, Krabi: photo 3 of 8" [ref=e130]'
              - 'button "Open all photos, starting with: Azure Spa & Wellness Resort, Krabi: photo 3 of 8" [ref=e131]'
            - generic [ref=e132]:
              - 'img "Azure Spa & Wellness Resort, Krabi: photo 4 of 8" [ref=e133]'
              - button "+46 more photos of Azure Spa & Wellness Resort" [ref=e134]:
                - generic [ref=e135]: +46 more
                - generic [ref=e136]: photos of Azure Spa & Wellness Resort
        - generic [ref=e138]:
          - tablist "Hotel information" [ref=e140]:
            - tab "Overview" [selected] [ref=e141]
            - tab "Rooms" [ref=e142]
            - tab "Location" [ref=e143]
            - tab "Reviews" [ref=e144]
          - tabpanel "Overview" [ref=e145]:
            - generic [ref=e146]:
              - region "About the hotel" [ref=e147]:
                - heading "About the hotel" [level=2] [ref=e148]
                - generic [ref=e149]:
                  - paragraph [ref=e150]: Azure Spa & Wellness Resort sits on a quiet stretch of the Andaman coast near Krabi, between limestone cliffs and a long private beach. The resort is built around its spa, with a daily yoga schedule and treatment programmes planned with a wellness host on arrival.
                  - paragraph [ref=e151]: Rooms are set in tropical gardens a short walk from the sea. Meals centre on fresh seafood and plant-based Thai cooking, and boat trips to nearby islands can be arranged by the concierge.
              - region "Amenities" [ref=e152]:
                - heading "Amenities" [level=2] [ref=e153]
                - list [ref=e154]:
                  - listitem [ref=e155]: Infinity pool
                  - listitem [ref=e160]: Spa and treatment rooms
                  - listitem [ref=e164]: Daily yoga classes
                  - listitem [ref=e168]: 2 restaurants
                  - listitem [ref=e172]: Private beach
                  - listitem [ref=e176]: Fitness centre
                  - listitem [ref=e183]: Island boat trips
                  - listitem [ref=e187]: Concierge
                  - listitem [ref=e191]: Airport transfers
              - region "Good to know" [ref=e194]:
                - heading "Good to know" [level=2] [ref=e195]
                - generic [ref=e196]:
                  - generic [ref=e197]:
                    - term [ref=e198]: Check-in
                    - definition [ref=e199]: 3:00 PM
                  - generic [ref=e200]:
                    - term [ref=e201]: Check-out
                    - definition [ref=e202]: 12:00 PM
                  - generic [ref=e203]:
                    - term [ref=e204]: Min. stay
                    - definition [ref=e205]: 2 nights
                  - generic [ref=e206]:
                    - term [ref=e207]: Pets
                    - definition [ref=e208]: Not permitted
                  - generic [ref=e209]:
                    - term [ref=e210]: Languages
                    - definition [ref=e211]: English, Thai
                  - generic [ref=e212]:
                    - term [ref=e213]: Payment
                    - definition [ref=e214]: All major cards accepted
    - generic [ref=e216]:
      - heading "Similar hotels" [level=2] [ref=e217]
      - list [ref=e218]:
        - listitem [ref=e219]:
          - article [ref=e220]:
            - generic [ref=e221]:
              - generic [ref=e222]:
                - generic [ref=e223]:
                  - img "Chiva-Som" [ref=e224]
                  - generic [ref=e225]:
                    - button "Go to image 1" [ref=e226]
                    - button "Go to image 2" [ref=e228]
                    - button "Go to image 3" [ref=e230]
                    - button "Go to image 4" [ref=e232]
                - generic [ref=e234]: Wellness Resort
                - button "Add Chiva-Som to favorites" [ref=e235]
              - generic [ref=e238]:
                - generic [ref=e239]: 5-star hotel
                - heading [level=3] [ref=e240]:
                  - link "Chiva-Som" [ref=e241] [cursor=pointer]:
                    - /url: /hotels/h/chiva-som-hua-hin
                - paragraph [ref=e242]: Hua Hin, Thailand
                - generic [ref=e247]:
                  - img "4.9 out of 5" [ref=e248]
                  - generic [ref=e259]: 4.9 (187)
        - listitem [ref=e261]:
          - article [ref=e262]:
            - generic [ref=e263]:
              - generic [ref=e264]:
                - generic [ref=e265]:
                  - img "SHA Wellness Clinic" [ref=e266]
                  - generic [ref=e267]:
                    - button "Go to image 1" [ref=e268]
                    - button "Go to image 2" [ref=e270]
                    - button "Go to image 3" [ref=e272]
                    - button "Go to image 4" [ref=e274]
                - generic [ref=e276]: Wellness Resort
                - button "Add SHA Wellness Clinic to favorites" [ref=e277]
              - generic [ref=e280]:
                - generic [ref=e281]: 5-star hotel
                - heading [level=3] [ref=e282]:
                  - link "SHA Wellness Clinic" [ref=e283] [cursor=pointer]:
                    - /url: /hotels/h/sha-wellness-clinic-alicante
                - paragraph [ref=e284]: Alicante, Spain
                - generic [ref=e289]:
                  - img "4.9 out of 5" [ref=e290]
                  - generic [ref=e301]: 4.9 (356)
        - listitem [ref=e303]:
          - article [ref=e304]:
            - generic [ref=e305]:
              - generic [ref=e306]:
                - generic [ref=e307]:
                  - img "Six Senses Zighy Bay" [ref=e308]
                  - generic [ref=e309]:
                    - button "Go to image 1" [ref=e310]
                    - button "Go to image 2" [ref=e312]
                    - button "Go to image 3" [ref=e314]
                    - button "Go to image 4" [ref=e316]
                - generic [ref=e318]: Wellness Resort
                - button "Add Six Senses Zighy Bay to favorites" [ref=e319]
              - generic [ref=e322]:
                - generic [ref=e323]: 5-star hotel
                - heading [level=3] [ref=e324]:
                  - link "Six Senses Zighy Bay" [ref=e325] [cursor=pointer]:
                    - /url: /hotels/h/six-senses-zighy-bay-musandam
                - paragraph [ref=e326]: Musandam, Oman
                - generic [ref=e331]:
                  - img "4.9 out of 5" [ref=e332]
                  - generic [ref=e343]: 4.9 (268)
    - button "Select dates" [ref=e348]
  - contentinfo [ref=e351]:
    - generic [ref=e352]:
      - generic [ref=e353]:
        - generic [ref=e354]:
          - link "Vacayou home" [ref=e355] [cursor=pointer]:
            - /url: /
            - img "Vacayou" [ref=e356]
          - paragraph [ref=e365]: Wellness travel, active adventures and transformative experiences — curated for the mindful explorer.
          - paragraph [ref=e366]: Follow us
          - list [ref=e367]:
            - listitem [ref=e368]:
              - link "Instagram" [ref=e369] [cursor=pointer]:
                - /url: "#"
            - listitem [ref=e374]:
              - link "Facebook" [ref=e375] [cursor=pointer]:
                - /url: "#"
            - listitem [ref=e378]:
              - link "X" [ref=e379] [cursor=pointer]:
                - /url: "#"
            - listitem [ref=e382]:
              - link "Pinterest" [ref=e383] [cursor=pointer]:
                - /url: "#"
            - listitem [ref=e386]:
              - link "RSS feed" [ref=e387] [cursor=pointer]:
                - /url: "#"
        - navigation "Explore" [ref=e392]:
          - heading "Explore" [level=2] [ref=e393]
          - list [ref=e394]:
            - listitem [ref=e395]:
              - link "Experiences" [ref=e396] [cursor=pointer]:
                - /url: /experiences/groups/wellness
            - listitem [ref=e397]:
              - link "Destinations" [ref=e398] [cursor=pointer]:
                - /url: /destinations
            - listitem [ref=e399]:
              - link "Hotels" [ref=e400] [cursor=pointer]:
                - /url: /hotels/groups/by-type
            - listitem [ref=e401]:
              - link "Magazine (opens in a new tab)" [ref=e402] [cursor=pointer]:
                - /url: https://vacayou.com/magazine/
                - text: Magazine
                - generic [ref=e403]: (opens in a new tab)
            - listitem [ref=e404]:
              - link "Glossary (opens in a new tab)" [ref=e405] [cursor=pointer]:
                - /url: https://vacayou.com/magazine/wellness-glossary/
                - text: Glossary
                - generic [ref=e406]: (opens in a new tab)
        - navigation "Information" [ref=e407]:
          - heading "Information" [level=2] [ref=e408]
          - list [ref=e409]:
            - listitem [ref=e410]:
              - link "About us" [ref=e411] [cursor=pointer]:
                - /url: /information/about-us
            - listitem [ref=e412]:
              - link "Why book with Vacayou" [ref=e413] [cursor=pointer]:
                - /url: /information/why-book-with-vacayou
            - listitem [ref=e414]:
              - link "Travel Insurance" [ref=e415] [cursor=pointer]:
                - /url: /information/travel-insurance
            - listitem [ref=e416]:
              - link "Contact us" [ref=e417] [cursor=pointer]:
                - /url: /support
        - navigation "Become a Partner" [ref=e418]:
          - heading "Become a Partner" [level=2] [ref=e419]
          - list [ref=e420]:
            - listitem [ref=e421]:
              - link "Resorts & Retreats" [ref=e422] [cursor=pointer]:
                - /url: /partners/resorts-and-retreats
            - listitem [ref=e423]:
              - link "Tour Providers" [ref=e424] [cursor=pointer]:
                - /url: /partners/tour-providers
            - listitem [ref=e425]:
              - link "Hotels & Spas" [ref=e426] [cursor=pointer]:
                - /url: /partners/hotels-and-spas
            - listitem [ref=e427]:
              - link "List your experience" [ref=e428] [cursor=pointer]:
                - /url: /partners/list-your-experience
      - list [ref=e430]:
        - listitem [ref=e431]:
          - img "Trust accreditation" [ref=e432]
        - listitem [ref=e433]:
          - img "Trust accreditation" [ref=e434]
        - listitem [ref=e435]:
          - img "Trust accreditation" [ref=e436]
        - listitem [ref=e437]:
          - img "Trust accreditation" [ref=e438]
        - listitem [ref=e439]:
          - img "Trust accreditation" [ref=e440]
        - listitem [ref=e441]:
          - img "Trust accreditation" [ref=e442]
        - listitem [ref=e443]:
          - img "Trust accreditation" [ref=e444]
        - listitem [ref=e445]:
          - img "Trust accreditation" [ref=e446]
        - listitem [aria-hidden] [ref=e447]
        - listitem [aria-hidden] [ref=e449]
        - listitem [aria-hidden] [ref=e451]
        - listitem [aria-hidden] [ref=e453]
        - listitem [aria-hidden] [ref=e455]
        - listitem [aria-hidden] [ref=e457]
        - listitem [aria-hidden] [ref=e459]
        - listitem [aria-hidden] [ref=e461]
      - generic [ref=e463]:
        - paragraph [ref=e464]: © 2026 Vacayou.com. All rights reserved.
        - list [ref=e465]:
          - listitem [ref=e466]:
            - link "Terms of Use" [ref=e467] [cursor=pointer]:
              - /url: /terms
          - listitem [ref=e468]:
            - link "Privacy Policy" [ref=e469] [cursor=pointer]:
              - /url: /privacy
  - alert [ref=e470]
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