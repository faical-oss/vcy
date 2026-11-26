import { ROUTE_CASES } from "./routes";
import { expect, isTouch, openRoute, test, viewportWidth, type Issue } from "./helpers";

/*
 * Layout checks, the same for every route and size. One page load per route; each check is a soft assertion named after the
 * check, so a failure message says which rule broke and on which selector. Rules: docs/features/responsive-testing.md.
 */
const MIN_TARGET = 44;
const SITE_MAX = 1280; // --container-site
const LARGE = 1920;

interface Report {
  cls: number;
  issues: Issue[];
}

function analyse(args: { touch: boolean; width: number; minTarget: number; siteMax: number; large: number }): Issue[] {
  const { touch, minTarget, siteMax, large } = args;
  const issues: Issue[] = [];
  const add = (check: string, element: Element, detail: string) => issues.push({ check, selector: selectorOf(element), detail });
  function selectorOf(element: Element): string {
    const parts: string[] = [];
    for (let node: Element | null = element; node && node !== document.body && parts.length < 3; node = node.parentElement) {
      const id = node.id ? `#${node.id}` : "";
      const classes = typeof node.className === "string" ? node.className.split(/\s+/).filter((name) => name && !/[:\[\]\/]/.test(name)).slice(0, 2).map((name) => `.${name}`).join("") : "";
      const label = node.getAttribute("aria-label") ? `[aria-label="${node.getAttribute("aria-label")?.slice(0, 24)}"]` : "";
      parts.unshift(`${node.tagName.toLowerCase()}${id}${classes}${label}`);
    }
    return parts.join(" > ");
  }
  const visible = (element: Element): boolean => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.visibility !== "hidden" && style.display !== "none" && Number(style.opacity) > 0 && rect.width > 1 && rect.height > 1 && !element.closest("[inert],[aria-hidden='true'],[hidden]");
  };
  /** Clipped by an ancestor that hides or scrolls its overflow, so it cannot widen the page. */
  const clipped = (element: Element): boolean => {
    for (let node = element.parentElement; node && node !== document.documentElement; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (/(hidden|auto|scroll|clip)/.test(style.overflowX)) return true;
      if (style.position === "fixed") return false;
    }
    return false;
  };
  const viewport = document.documentElement.clientWidth;
  const all = [...document.body.querySelectorAll("*")].filter((element) => !/^(script|style|link|meta|noscript|template|head|title)$/i.test(element.tagName));

  // 1. horizontal overflow
  const overflow = document.documentElement.scrollWidth - viewport;
  if (overflow > 1) add("overflow", document.documentElement, `page is ${overflow}px wider than the viewport`);
  for (const element of all) {
    if (!visible(element) || clipped(element)) continue;
    const rect = element.getBoundingClientRect();
    if (rect.right > viewport + 1 || rect.left < -1) {
      // A wide child of a visible wide parent is reported once, on the parent.
      const parent = element.parentElement;
      if (parent && parent !== document.body && visible(parent) && !clipped(parent)) {
        const parentRect = parent.getBoundingClientRect();
        if (parentRect.right > viewport + 1 || parentRect.left < -1) continue;
      }
      add("wider-than-viewport", element, `${Math.round(rect.left)}..${Math.round(rect.right)} of ${viewport}px`);
    }
  }

  // 2. tap targets (touch projects only): inline text links are allowed, and so are the skip link and screen-reader-only controls.
  if (touch) {
    const targets = document.body.querySelectorAll("a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab], [role=link], [role=checkbox], [role=radio], [role=menuitem], [role=switch]");
    for (const element of targets) {
      if (!visible(element) || element.closest(".sr-only")) continue;
      const rect = element.getBoundingClientRect();
      // The invisible hit area of src/app/globals.css (an absolutely positioned ::after) counts as part of the control.
      const hit = getComputedStyle(element, "::after");
      const hitWidth = hit.position === "absolute" ? parseFloat(hit.width) || 0 : 0;
      const hitHeight = hit.position === "absolute" ? parseFloat(hit.height) || 0 : 0;
      if (Math.max(rect.width, hitWidth) >= minTarget - 0.5 && Math.max(rect.height, hitHeight) >= minTarget - 0.5) continue;
      // Allowlist (docs/features/responsive-testing.md): text links of the footer and of breadcrumbs sit in stacked lists; the image dots are secondary to swiping.
      const aria = element.getAttribute("aria-label") ?? "";
      if (element.tagName === "A" && /\S/.test(element.textContent ?? "") && (element.closest("footer") || /breadcrumb/i.test(element.closest("nav")?.getAttribute("aria-label") ?? ""))) continue;
      if (/^Go to image/.test(aria)) continue;
      const inlineLink = element.tagName === "A" && getComputedStyle(element).display === "inline" && /\S/.test((element.parentElement?.textContent ?? "").replace(element.textContent ?? "", ""));
      if (inlineLink) continue;
      // A label that wraps (or is wrapped by) a bigger control counts as that control.
      const label = element.closest("label");
      if (label && label.getBoundingClientRect().width >= minTarget && label.getBoundingClientRect().height >= minTarget) continue;
      add("tap-target", element, `${Math.round(rect.width)}x${Math.round(rect.height)}px "${(element.textContent ?? "").trim().slice(0, 20)}"`);
    }
  }

  // 3. clipped text (no ellipsis, no line clamp), fixed elements overlapping each other, and bars covering the end of the page
  for (const element of all) {
    if (!visible(element)) continue;
    const style = getComputedStyle(element);
    if (/(hidden|clip)/.test(style.overflowX) && element.scrollWidth > element.clientWidth + 1 && style.textOverflow !== "ellipsis" && !style.webkitLineClamp.match(/\d/) && /\S/.test(element.textContent ?? "") && element.children.length === 0)
      add("clipped-text", element, `scrollWidth ${element.scrollWidth} > clientWidth ${element.clientWidth}`);
  }
  // Sticky bars count only while they are stuck (their top equals the `top` they ask for), fixed bars always.
  const stuck = (element: Element) => {
    const style = getComputedStyle(element);
    if (style.position === "fixed") return true;
    if (style.position !== "sticky") return false;
    const top = parseFloat(style.top);
    return !Number.isNaN(top) && Math.abs(element.getBoundingClientRect().top - top) < 1 && window.scrollY > 0;
  };
  const fixed = all.filter((element) => stuck(element) && visible(element) && element.getBoundingClientRect().height < window.innerHeight * 0.9 && !element.closest("[role=dialog]"));
  for (let a = 0; a < fixed.length; a++)
    for (let b = a + 1; b < fixed.length; b++) {
      if (fixed[a].contains(fixed[b]) || fixed[b].contains(fixed[a])) continue;
      const first = fixed[a].getBoundingClientRect();
      const second = fixed[b].getBoundingClientRect();
      const overlapX = Math.min(first.right, second.right) - Math.max(first.left, second.left);
      const overlapY = Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top);
      if (overlapX > 2 && overlapY > 2) add("fixed-overlap", fixed[a], `overlaps ${selectorOf(fixed[b])} by ${Math.round(overlapX)}x${Math.round(overlapY)}px`);
    }

  // Bottom of the page: the last line of the footer must not sit under a fixed bar.
  if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
    const last = [...document.querySelectorAll("footer a, footer p")].filter(visible).at(-1);
    if (last) {
      const box = last.getBoundingClientRect();
      const top = document.elementFromPoint(box.left + Math.min(box.width / 2, 20), box.top + box.height / 2);
      if (top && !last.contains(top) && !top.contains(last)) add("covered-by-bar", last, `covered by ${selectorOf(top)}`);
    }
  }

  // 4. images: loaded, sized, inside their card
  for (const image of document.images) {
    if (!visible(image)) continue;
    const rect = image.getBoundingClientRect();
    if (image.complete && image.naturalWidth === 0) add("image", image, `failed to load ${image.currentSrc.slice(0, 60)}`);
    const sized = (image.hasAttribute("width") && image.hasAttribute("height")) || getComputedStyle(image).position === "absolute";
    if (!sized && !image.closest("picture,svg")) add("image", image, "no width/height attributes and not absolutely positioned: reserves no space");
    const parent = image.parentElement;
    if (parent && getComputedStyle(parent).position !== "static") {
      const box = parent.getBoundingClientRect();
      if (rect.right > box.right + 1 || rect.left < box.left - 1) add("image", image, `overflows its parent by ${Math.round(Math.max(rect.right - box.right, box.left - rect.left))}px`);
    }
  }

  // 5. large screens: the content (text, controls, images) stays in the site column
  if (window.innerWidth >= large) {
    let left = Infinity;
    let right = -Infinity;
    for (const element of document.querySelectorAll("main h1, main h2, main h3, main p, main a, main button, main input, main img, footer a, footer p, footer h2")) {
      // Sideways scrollers and the logo marquee run past the column on purpose: only what is not clipped counts.
      if (!visible(element) || (element as HTMLElement).offsetParent === null || clipped(element)) continue;
      const rect = element.getBoundingClientRect();
      left = Math.min(left, rect.left);
      right = Math.max(right, rect.right);
    }
    if (right - left > siteMax + 2) add("max-width", document.body, `content spans ${Math.round(right - left)}px (> ${siteMax})`);
    if (Math.abs(left - (viewport - right)) > 20) add("centered", document.body, `left gap ${Math.round(left)}px, right gap ${Math.round(viewport - right)}px`);
  }
  return issues;
}

/**
 * Tap stealing (touch projects): the invisible 44x44 hit area of one control (src/app/globals.css) must not sit over the visible part
 * of a neighbour. Five points inside every control are hit-tested; the element under the finger must be the control itself or part of it.
 * Fixed and sticky bars legitimately cover what scrolls under them and are skipped.
 */
function stolenTaps(): Issue[] {
  const issues: Issue[] = [];
  const selector = "a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab], [role=link], [role=checkbox], [role=radio], [role=menuitem], [role=switch]";
  const name = (element: Element) => `${element.tagName.toLowerCase()}${element.getAttribute("aria-label") ? `[aria-label="${element.getAttribute("aria-label")?.slice(0, 24)}"]` : ""} "${(element.textContent ?? "").trim().slice(0, 20)}"`;
  const pinned = (element: Element) => {
    for (let node: Element | null = element; node; node = node.parentElement) {
      const position = getComputedStyle(node).position;
      if (position === "fixed" || position === "sticky") return true;
    }
    return false;
  };
  for (const element of document.body.querySelectorAll(selector)) {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    if (style.visibility === "hidden" || style.display === "none" || rect.width < 4 || rect.height < 4 || element.closest(".sr-only,[inert],[aria-hidden='true']")) continue;
    // Two by design: the price slider inputs only take the pointer on their thumbs (pointer-events: none), and a big photo button
    // carries smaller buttons on top of it ("Watch video", the heart).
    // A button that fills its photo tile (absolute, as wide as the tile) carries the chip on top by design, however small the tile is.
    const fillsParent = style.position === "absolute" && !!element.parentElement && Math.abs(rect.width - element.parentElement.getBoundingClientRect().width) < 2;
    if ((element as HTMLInputElement).type === "range" || rect.width * rect.height > 40_000 || fillsParent) continue;
    for (const [fx, fy] of [[0.5, 0.5], [0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) {
      const x = rect.left + rect.width * fx;
      const y = rect.top + rect.height * fy;
      if (x < 0 || y < 0 || x >= window.innerWidth || y >= window.innerHeight) continue;
      const top = document.elementFromPoint(x, y);
      if (!top || element.contains(top) || top.contains(element) || (top.closest("label") && top.closest("label")?.contains(element)) || pinned(top)) continue;
      // A stretched card link covers its card by design; what sits above it (heart, tags) has its own z-index and passes the test.
      issues.push({ check: "tap-stolen", selector: name(element), detail: `a tap at ${Math.round(x)},${Math.round(y)} lands on ${name(top.closest(selector) ?? top)}` });
      break;
    }
  }
  return issues;
}

for (const route of ROUTE_CASES) {
  test(`layout · ${route.name}`, async ({ page }) => {
    await openRoute(page, route);
    const args = { touch: isTouch(), width: viewportWidth(), minTarget: MIN_TARGET, siteMax: SITE_MAX, large: LARGE };
    const issues = await page.evaluate(analyse, args);
    // The sticky and fixed bars are looked at again half way down and at the very bottom of the page.
    for (const fraction of [0.45, 1]) {
      await page.evaluate((f) => window.scrollTo(0, (document.documentElement.scrollHeight - window.innerHeight) * f), fraction);
      await page.waitForTimeout(100);
      const more = await page.evaluate(analyse, args);
      issues.push(...more.filter((issue) => issue.check === "fixed-overlap" || issue.check === "covered-by-bar"));
    }
    if (isTouch()) {
      // Walk down the page one screen at a time (elementFromPoint only sees what is on screen).
      const height = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
      const seen = new Set<string>();
      for (let y = 0, steps = 0; y <= height && steps < 30; y += (page.viewportSize()?.height ?? 700) * 0.8, steps++) {
        await page.evaluate((top) => window.scrollTo(0, top), y);
        await page.waitForTimeout(60);
        for (const issue of await page.evaluate(stolenTaps)) {
          const key = `${issue.selector}|${issue.detail}`;
          if (!seen.has(key)) {
            seen.add(key);
            issues.push(issue);
          }
        }
      }
    }
    const cls = await page.evaluate(() => (window as unknown as { __clsLoad: number }).__clsLoad);
    const report: Report = { cls, issues };
    for (const check of ["overflow", "wider-than-viewport", "tap-target", "tap-stolen", "clipped-text", "fixed-overlap", "covered-by-bar", "image", "max-width", "centered"]) {
      const found = report.issues.filter((issue) => issue.check === check);
      expect.soft(found.slice(0, 12), `${check}: ${found.length} found${found.length > 12 ? " (first 12 shown)" : ""}`).toEqual([]);
    }
    expect.soft(report.cls, "cumulative layout shift").toBeLessThan(0.1);
  });
}
