import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";
import { FOOTER_COLUMNS } from "./navigation";
import { EXTERNAL_URLS, LEGACY_PATHS } from "./routes";

describe("magazine links", () => {
  it("redirects /magazine to the external magazine with a temporary (307) redirect", async () => {
    const redirects = await nextConfig.redirects!();
    expect(redirects).toContainEqual({ source: LEGACY_PATHS.magazine, destination: EXTERNAL_URLS.magazine, permanent: false });
  });

  it("links the footer's Magazine and Glossary to the external site, as external links", () => {
    const links = FOOTER_COLUMNS.flatMap((column) => column.links);
    expect(links.find((link) => link.label === "Magazine")).toEqual({ label: "Magazine", href: EXTERNAL_URLS.magazine, external: true });
    expect(links.find((link) => link.label === "Glossary")).toEqual({ label: "Glossary", href: EXTERNAL_URLS.glossary, external: true });
    expect(links.some((link) => link.href === LEGACY_PATHS.magazine)).toBe(false);
  });
});
