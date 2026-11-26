import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { navigationFixture } from "../src/mocks/fixtures/navigation";

/*
 * The header navigation in the BUILT server's HTML, read without JavaScript. Every dropdown, with every link of every group, is in the
 * HTML as real <a href> (a closed dropdown is `hidden`, not missing), the triggers are buttons that only open a dropdown, and each
 * dropdown has a "View all" link to its section (Lifestyle has no section page of its own, so only its vacancies and external links).
 */
const baseUrl = process.env.E2E_BASE_URL as string;
const PAGES = ["/", "/destinations", "/hotels/wellness-resorts"];

async function load(path: string) {
  const html = await (await fetch(`${baseUrl}${path}`)).text();
  return new JSDOM(html).window.document;
}

describe("header navigation in the server HTML", () => {
  it.each(PAGES)("%s: every dropdown and every one of its links is a real link in the HTML", async (path) => {
    const nav = (await load(path)).querySelector('nav[aria-label="Main"]');
    expect(nav, `${path}: the main navigation`).toBeTruthy();
    for (const menu of navigationFixture) {
      const trigger = nav!.querySelector(`[data-nav-trigger="${menu.id}"]`);
      expect(trigger?.tagName, `${menu.label}: the trigger is a button`).toBe("BUTTON");
      expect(trigger?.hasAttribute("href"), `${menu.label}: the trigger has no href (it only opens the dropdown)`).toBe(false);
      const panel = nav!.querySelector(`[id="${trigger!.getAttribute("aria-controls")}"]`);
      expect(panel, `${menu.label}: its dropdown is in the HTML`).toBeTruthy();
      expect(panel!.hasAttribute("hidden"), `${menu.label}: closed in the HTML`).toBe(true);

      for (const group of menu.groups) {
        for (const link of group.links) {
          const anchor = [...panel!.querySelectorAll("a[href]")].find((entry) => entry.getAttribute("href") === link.href && entry.textContent?.includes(link.label));
          expect(anchor, `${menu.label} / ${group.title}: "${link.label}" is an <a href="${link.href}">`).toBeTruthy();
          if (link.external) expect(anchor!.getAttribute("target"), `${link.label}: external links open in a new tab`).toBe("_blank");
        }
        if (group.href) {
          const viewAll = [...panel!.querySelectorAll("a[href]")].find((entry) => entry.getAttribute("href") === group.href && /^\s*View all /.test(entry.textContent ?? ""));
          expect(viewAll, `${menu.label} / ${group.title}: a "View all ${group.title}" link to ${group.href}`).toBeTruthy();
        }
      }
      if (menu.id !== "lifestyle") {
        expect(menu.footerLink?.label, `${menu.label}: a menu-level "View all" in the data`).toMatch(/^View all /);
        const footer = [...panel!.querySelectorAll("a[href]")].find((entry) => entry.getAttribute("href") === menu.footerLink?.href && (entry.textContent ?? "").includes(menu.footerLink!.label));
        expect(footer, `${menu.label}: the menu's "${menu.footerLink?.label}" is a link in the HTML`).toBeTruthy();
      }
    }
  });
});
