import { describe, expect, it } from "vitest";

/* `/magazine` is not a page of this site: a temporary (307) redirect to the external magazine, and not in the sitemap. */
const baseUrl = process.env.E2E_BASE_URL as string;

describe("/magazine", () => {
  it("redirects temporarily (307, not 308) to the external magazine", async () => {
    const response = await fetch(`${baseUrl}/magazine`, { redirect: "manual" });
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://vacayou.com/magazine/");
  });

  it("is not in the sitemap", async () => {
    const xml = await (await fetch(`${baseUrl}/sitemap.xml`)).text();
    expect(xml).not.toMatch(/\/magazine/);
  });

  it("is not linked as an internal path anywhere on the Home page", async () => {
    const html = await (await fetch(`${baseUrl}/`)).text();
    expect(html).not.toMatch(/href="\/magazine/);
    expect(html).toContain('href="https://vacayou.com/magazine/"');
  });
});
