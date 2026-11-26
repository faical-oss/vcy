import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

/* Package cards link to their package page; there is no /packages listing page, so nothing links to it. */
const baseUrl = process.env.E2E_BASE_URL as string;
const links = async (path: string) => {
  const html = await (await fetch(`${baseUrl}${path}`)).text();
  return [...new JSDOM(html).window.document.querySelectorAll("a[href]")].map((link) => link.getAttribute("href") ?? "");
};

describe("links to /packages", () => {
  it.each(["/", "/destinations/asia", "/destinations/italy", "/lifestyle/yoga"])("%s links no card to /packages, and every package link resolves", async (path) => {
    const hrefs = await links(path);
    expect(hrefs.filter((href) => href === "/packages" || href === "/packages/"), "links to the missing listing").toEqual([]);
    const packages = [...new Set(hrefs.filter((href) => href.startsWith("/packages/p/")))];
    for (const href of packages) expect((await fetch(`${baseUrl}${href}`)).status, href).toBe(200);
  });

  it("Home shows eight package cards, each linked", async () => {
    expect([...new Set((await links("/")).filter((href) => href.startsWith("/packages/p/")))]).toHaveLength(8);
  });

  it("the Lifestyle pages link their package cards", async () => {
    expect([...new Set((await links("/lifestyle/yoga")).filter((href) => href.startsWith("/packages/p/")))]).toHaveLength(6);
  });
});
