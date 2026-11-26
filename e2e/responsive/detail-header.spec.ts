import type { Page } from "@playwright/test";
import { DATES } from "./routes";
import { expect, openRoute, test } from "./helpers";

/*
 * Task 6 of the Responsively review: the detail page header and its order, the newsletter, and the rating lines. It resizes one page through 320,
 * 360, 390, 768 and 1024 (and 1280 for the newsletter), so each test runs once (in the 1280 project).
 *   - The page reads header, gallery, tabs at every width, in DOM order (Task 9 replaced the gallery-first mobile order; round2.spec.ts checks the
 *     actions row and the photos). Below 768 the header reads title, rating and review count, location, the key facts, then the badges.
 *   - Nothing overlaps, nothing is cut (a long title wraps), nothing makes the page scroll sideways.
 *   - The newsletter stacks below 640 (text, name, email, button, each full width, 44px or more, labels visible).
 *   - Rating lines: the stars and the text share one centre line, the text one baseline, nothing is clipped, and a count that does not fit wraps below.
 */
const WIDTHS = [320, 360, 390, 768, 1024];
const PAGES = [
  { kind: "hotel", path: "/hotels/h/azure-spa-and-wellness-resort-krabi", facts: false },
  { kind: "experience", path: "/experiences/e/ubud-yoga-and-detox-retreat", facts: true },
  { kind: "package", path: "/packages/p/bali-soul-surf", facts: true },
] as const;

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "laptop-1280", "resizes one page through the widths itself: runs once");
});

const tops = (page: Page, selectors: Record<string, string>) =>
  page.evaluate((map) => {
    const out: Record<string, { top: number; bottom: number; left: number; right: number } | null> = {};
    for (const [key, selector] of Object.entries(map)) {
      const element = document.querySelector(selector);
      const box = element?.getBoundingClientRect();
      out[key] = box && box.width > 0 ? { top: box.top, bottom: box.bottom, left: box.left, right: box.right } : null;
    }
    return out;
  }, selectors);

for (const entry of PAGES) {
  test(`${entry.kind}: header, gallery, tabs; the title, rating, location, key facts, badges below 768; nothing overlaps or is cut`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await openRoute(page, { name: entry.kind, path: `${entry.path}?${DATES}` });

    // The DOM order and the heading order are the header's, whatever the screen shows.
    const dom = await page.evaluate(() => {
      const h1s = [...document.querySelectorAll("h1")];
      const header = document.querySelector('[data-detail="header"]')!;
      const gallery = document.querySelector('[data-detail="gallery"]')!;
      const tabs = document.querySelector('[data-detail="tabs"]')!;
      const firstH2 = document.querySelector("main h2");
      const before = (a: Element, b: Element) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
      return { h1s: h1s.length, h1InHeader: header.contains(h1s[0]), headerBeforeGallery: before(header, gallery), galleryBeforeTabs: before(gallery, tabs), h1BeforeH2: !firstH2 || before(h1s[0], firstH2) };
    });
    expect(dom.h1s, "one h1").toBe(1);
    expect(dom.h1InHeader, "the h1 is in the header").toBe(true);
    expect(dom.headerBeforeGallery, "DOM: the header is before the gallery").toBe(true);
    expect(dom.galleryBeforeTabs, "DOM: the gallery is before the tabs").toBe(true);
    expect(dom.h1BeforeH2, "DOM: the h1 comes before the first h2").toBe(true);

    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(200);
      const at = `${entry.kind} at ${width}px`;
      const box = await tops(page, {
        gallery: '[data-detail="gallery"]',
        header: '[data-detail="header"]',
        tabs: '[data-detail="tabs"]',
        title: "[data-detail=header] h1",
        rating: '[data-detail=header] [role="img"][aria-label$="out of 5"]',
        place: "[data-detail=header] svg.lucide-map-pin",
        badges: '[data-detail=header] [role="group"][aria-label="Highlights"]',
        clock: "[data-detail=header] svg.lucide-clock",
      });
      expect(box.header!.top, `${at}: the header comes first`).toBeLessThan(box.gallery!.top);
      expect(box.gallery!.top, `${at}: then the gallery`).toBeLessThan(box.tabs!.top);
      if (width < 768) {
        const order = [box.title, box.rating, box.place, ...(entry.facts ? [box.clock] : []), box.badges];
        expect(order.every(Boolean), `${at}: every part of the header is there`).toBe(true);
        for (let i = 1; i < order.length; i++) expect(order[i]!.top, `${at}: header order title, rating, location, key facts, badges (item ${i})`).toBeGreaterThanOrEqual(order[i - 1]!.top - 1);
      }

      // Nothing overlaps, nothing is cut.
      const report = await page.evaluate(() => {
        const header = document.querySelector<HTMLElement>('[data-detail="header"]')!;
        const blocks = [...header.querySelectorAll<HTMLElement>("h1, [role=group][aria-label=Highlights], :scope > header > *:nth-child(2), nav")].map((element) => ({ name: element.tagName.toLowerCase(), box: element.getBoundingClientRect() }));
        const overlaps: string[] = [];
        for (let a = 0; a < blocks.length; a++)
          for (let b = a + 1; b < blocks.length; b++) {
            const x = Math.min(blocks[a].box.right, blocks[b].box.right) - Math.max(blocks[a].box.left, blocks[b].box.left);
            const y = Math.min(blocks[a].box.bottom, blocks[b].box.bottom) - Math.max(blocks[a].box.top, blocks[b].box.top);
            if (x > 1 && y > 1) overlaps.push(`${blocks[a].name} / ${blocks[b].name}`);
          }
        const title = header.querySelector<HTMLElement>("h1")!;
        const out = [...header.querySelectorAll<HTMLElement>("*")].filter((element) => element.getBoundingClientRect().right > window.innerWidth + 1 && !element.closest("[data-scroll-row]"));
        return { overlaps, titleCut: title.scrollWidth > title.clientWidth + 1, outside: out.map((element) => element.tagName).slice(0, 3), page: document.documentElement.scrollWidth - window.innerWidth };
      });
      expect(report.overlaps, `${at}: header blocks overlap`).toEqual([]);
      expect(report.titleCut, `${at}: the title is cut`).toBe(false);
      expect(report.outside, `${at}: something leaves the screen`).toEqual([]);
      expect(report.page, `${at}: the page scrolls sideways`).toBeLessThanOrEqual(1);

      // A long title wraps over several lines and is never cut or put under the rating.
      const long = await page.evaluate(() => {
        const title = document.querySelector<HTMLElement>("[data-detail=header] h1")!;
        const original = title.textContent;
        title.textContent = "An exceptionally long and thoughtful retreat name for the wellness traveller who wants every single day to feel unhurried";
        const rating = document.querySelector<HTMLElement>('[data-detail=header] [role="img"][aria-label$="out of 5"]')!.getBoundingClientRect();
        const box = title.getBoundingClientRect();
        const result = { cut: title.scrollWidth > title.clientWidth + 1, lines: Math.round(box.height / parseFloat(getComputedStyle(title).lineHeight)), over: window.innerWidth < 768 && box.bottom > rating.top + 1 && box.top < rating.bottom, page: document.documentElement.scrollWidth - window.innerWidth };
        title.textContent = original;
        return result;
      });
      expect(long.cut, `${at}: a long title is cut`).toBe(false);
      expect(long.lines, `${at}: a long title wraps over several lines`).toBeGreaterThan(1);
      expect(long.over, `${at}: a long title runs into the rating`).toBe(false);
      expect(long.page, `${at}: a long title makes the page scroll sideways`).toBeLessThanOrEqual(1);
    }
  });

  test(`${entry.kind}: the last line of the footer stays above the reserve bar`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await openRoute(page, { name: entry.kind, path: `${entry.path}?${DATES}` });
    for (const width of [320, 360, 390, 768]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(200);
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForTimeout(150);
      const ends = await page.evaluate(() => ({
        footer: Math.max(...[...document.querySelector("footer")!.querySelectorAll<HTMLElement>("*")].filter((node) => node.getBoundingClientRect().height > 0).map((node) => node.getBoundingClientRect().bottom)),
        bar: document.querySelector("[data-booking-bar]")!.getBoundingClientRect().top,
      }));
      expect(ends.footer, `${entry.kind} at ${width}px: the footer's last line is above the bar`).toBeLessThanOrEqual(ends.bar + 1);
    }
  });
}

test("newsletter: stacked below 640 (text, name, email, button at full width, 44px or more, labels visible), a row from 640, side by side from 1280", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await openRoute(page, { name: "home", path: "/" });
  for (const width of [...WIDTHS, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(200);
    const at = `newsletter at ${width}px`;
    const m = await page.evaluate(() => {
      const section = document.querySelector("section[aria-labelledby=newsletter-title]")!;
      section.scrollIntoView({ block: "center" });
      const box = (selector: string) => section.querySelector(selector)!.getBoundingClientRect();
      const form = box("form");
      const name = section.querySelector<HTMLInputElement>("#name")!;
      const email = section.querySelector<HTMLInputElement>("#email")!;
      const button = section.querySelector<HTMLButtonElement>('button[type="submit"]')!;
      const labels = [...section.querySelectorAll<HTMLLabelElement>("label")].map((label) => ({ w: label.getBoundingClientRect().width, h: label.getBoundingClientRect().height, sr: getComputedStyle(label).position === "absolute" }));
      const r = (element: Element) => element.getBoundingClientRect();
      return {
        heading: box("h2"), form,
        name: r(name), email: r(email), button: r(button),
        labels,
        page: document.documentElement.scrollWidth - window.innerWidth,
        section: { left: r(section).left, right: r(section).right },
      };
    });
    expect(m.page, `${at}: the page scrolls sideways`).toBeLessThanOrEqual(1);
    expect(m.name.height, `${at}: the name field is 44px or more`).toBeGreaterThanOrEqual(44);
    expect(m.email.height, `${at}: the email field is 44px or more`).toBeGreaterThanOrEqual(44);
    expect(m.button.height, `${at}: the button is 44px or more`).toBeGreaterThanOrEqual(44);
    expect(m.labels.length, `${at}: two labels`).toBe(2);
    for (const label of m.labels) expect(label.sr || label.w < 2 || label.h < 2, `${at}: the labels are visible`).toBe(false);
    if (width < 640) {
      for (const [key, control] of [["name", m.name], ["email", m.email], ["button", m.button]] as const) expect(Math.abs(control.width - m.form.width), `${at}: ${key} is full width`).toBeLessThanOrEqual(2);
      expect(m.heading.bottom, `${at}: the text is above the form`).toBeLessThanOrEqual(m.form.top + 1);
      expect(m.name.bottom, `${at}: the name is above the email`).toBeLessThanOrEqual(m.email.top + 1);
      expect(m.email.bottom, `${at}: the email is above the button`).toBeLessThanOrEqual(m.button.top + 1);
    } else if (width < 1280) {
      expect(m.heading.bottom, `${at}: the text is above the form`).toBeLessThanOrEqual(m.form.top + 1);
      expect(Math.abs(m.name.bottom - m.email.bottom), `${at}: a row`).toBeLessThanOrEqual(1);
      expect(m.name.right, `${at}: name then email`).toBeLessThanOrEqual(m.email.left + 1);
    } else expect(m.heading.right, `${at}: text and form side by side`).toBeLessThanOrEqual(m.form.left + 1);
    for (const control of [m.name, m.email, m.button]) {
      expect(control.left, `${at}: inside the card`).toBeGreaterThanOrEqual(m.section.left - 1);
      expect(control.right, `${at}: inside the card`).toBeLessThanOrEqual(m.section.right + 1);
    }
  }
});

/** One report per rating line: the stars, each piece of text and the container, for the baseline and the wrapping checks. */
const ratingReports = (page: Page, scope: string) =>
  page.evaluate((root) => {
    const climb = (element: Element) => {
      let node: Element | null = element.parentElement;
      while (node && getComputedStyle(node).flexWrap !== "wrap") node = node.parentElement;
      return node;
    };
    const containers = new Set<Element>();
    for (const stars of document.querySelectorAll(`${root} [role="img"][aria-label$="out of 5"]`)) {
      const wrap = climb(stars);
      if (wrap && /\d/.test(wrap.textContent ?? "")) containers.add(wrap);
    }
    return [...containers].map((container) => {
      const stars = container.querySelector<HTMLElement>('[role="img"]')!.getBoundingClientRect();
      const texts = [...container.querySelectorAll<HTMLElement>("*")]
        .filter((element) => [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && /\S/.test(node.textContent ?? "")))
        .map((element) => { const range = document.createRange(); range.selectNodeContents(element); const box = range.getBoundingClientRect(); return { text: (element.textContent ?? "").trim().slice(0, 18), top: box.top, bottom: box.bottom, left: box.left, right: box.right }; });
      const box = container.getBoundingClientRect();
      return { stars: { top: stars.top, bottom: stars.bottom, left: stars.left, right: stars.right }, texts, box: { left: box.left, right: box.right }, clipped: container.scrollWidth > container.clientWidth + 1, offscreen: box.right > window.innerWidth + 1 };
    });
  }, scope);

function expectRatings(reports: Awaited<ReturnType<typeof ratingReports>>, at: string) {
  expect(reports.length, `${at}: rating lines found`).toBeGreaterThan(0);
  for (const line of reports) {
    expect(line.clipped, `${at}: a rating line is clipped`).toBe(false);
    expect(line.offscreen, `${at}: a rating line leaves the screen`).toBe(false);
    const starsCentre = (line.stars.top + line.stars.bottom) / 2;
    // The text on the stars' row shares their centre line and one baseline; text that wrapped is below, not over them.
    const row = line.texts.filter((text) => text.top < line.stars.bottom - 1);
    for (const text of row) expect(Math.abs((text.top + text.bottom) / 2 - starsCentre), `${at}: "${text.text}" is centred on the stars`).toBeLessThanOrEqual(3);
    for (let i = 1; i < row.length; i++) expect(Math.abs(row[i].bottom - row[0].bottom), `${at}: "${row[i].text}" is on the baseline of "${row[0].text}"`).toBeLessThanOrEqual(1.5);
    for (const text of line.texts.filter((entry) => !row.includes(entry))) {
      expect(text.top, `${at}: wrapped "${text.text}" is below the stars, not over them`).toBeGreaterThanOrEqual(line.stars.bottom - 1);
      expect(text.left, `${at}: wrapped "${text.text}" stays in its line`).toBeGreaterThanOrEqual(line.box.left - 1);
    }
  }
}

test("ratings: the detail header's score and review count, and the cards', share a baseline and never clip or overlap", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await openRoute(page, { name: "hotel", path: "/hotels/h/azure-spa-and-wellness-resort-krabi" });
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(200);
    expectRatings(await ratingReports(page, "[data-detail=header]"), `hotel header at ${width}px`);
  }
  await openRoute(page, { name: "category", path: "/hotels/wellness-resorts" });
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(200);
    expectRatings(await ratingReports(page, "main"), `hotel cards at ${width}px`);
  }
});

test("ratings: the review form's 'Your rating' label, stars and value text line up, and the group wraps under the label", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await openRoute(page, { name: "hotel", path: "/hotels/h/azure-spa-and-wellness-resort-krabi" });
  await page.getByRole("tab", { name: "Reviews" }).click();
  const group = page.getByRole("radiogroup", { name: /rating/i });
  await expect(group, "the review form is on the page").toBeVisible();
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(200);
    await group.getByRole("radio", { name: /^5 out of 5/ }).check({ force: true });
    const m = await page.evaluate(() => {
      const radiogroup = document.querySelector<HTMLElement>('[role="radiogroup"]')!;
      const label = document.getElementById(radiogroup.getAttribute("aria-labelledby")!)!.getBoundingClientRect();
      const stars = radiogroup.getBoundingClientRect();
      const value = [...radiogroup.parentElement!.querySelectorAll("p")].find((p) => p.getAttribute("aria-hidden") === "true")!.getBoundingClientRect();
      const wrap = radiogroup.parentElement!.parentElement!;
      return { label: { top: label.top, bottom: label.bottom, right: label.right }, stars: { top: stars.top, bottom: stars.bottom, left: stars.left, right: stars.right }, value: { top: value.top, bottom: value.bottom, left: value.left, right: value.right }, clipped: wrap.scrollWidth > wrap.clientWidth + 1, page: document.documentElement.scrollWidth - window.innerWidth };
    });
    const at = `review rating at ${width}px`;
    expect(m.clipped, `${at}: clipped`).toBe(false);
    expect(m.page, `${at}: the page scrolls sideways`).toBeLessThanOrEqual(1);
    // The value text follows the stars on their row (centre line), or, when 44px touch stars fill the line, is under them, never over them.
    const valueOnRow = m.value.top < m.stars.bottom - 1;
    if (valueOnRow) {
      expect(Math.abs((m.value.top + m.value.bottom) / 2 - (m.stars.top + m.stars.bottom) / 2), `${at}: the value text is centred on the stars`).toBeLessThanOrEqual(3);
      expect(m.value.left, `${at}: the value text follows the stars`).toBeGreaterThanOrEqual(m.stars.right - 1);
    } else expect(m.value.left, `${at}: wrapped value text stays under the stars`).toBeGreaterThanOrEqual(m.stars.left - 1);
    // The label is on the same row when it fits, else above the stars, not over them.
    const sameRow = m.label.bottom > m.stars.top + 1;
    if (sameRow) expect(Math.abs((m.label.top + m.label.bottom) / 2 - (m.stars.top + m.stars.bottom) / 2), `${at}: the label is centred on the stars`).toBeLessThanOrEqual(3);
    else expect(m.label.bottom, `${at}: the label is above the stars`).toBeLessThanOrEqual(m.stars.top + 1);
  }
});
