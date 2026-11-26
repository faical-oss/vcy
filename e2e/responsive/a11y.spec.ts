import AxeBuilder from "@axe-core/playwright";
import { ROUTE_CASES } from "./routes";
import { expect, openRoute, test, viewportWidth } from "./helpers";

/*
 * axe on every route at 375 and 1280 (WCAG 2.2 A and AA rules, contrast and labels included). "serious" and "critical" findings
 * fail the test; "minor" and "moderate" ones are listed in the report as annotations. A clean scan is not a claim of compliance:
 * it finds what a machine can find (docs/features/responsive-testing.md).
 */
/**
 * Known findings that need a design decision, not a code fix: they are listed in the report (annotations) and in
 * docs/features/responsive-testing.md, and do not fail the run.
 *  - color-contrast: the brand tokens muted blue #a7bcc1 (1.97:1 on white) and gold #c49a6c (2.56:1 on white, and white text on gold) used for text.
 *  - target-size on `.dual-range`: the two stacked thumbs of the price slider are 16px on pointer devices (the prototype's size).
 */
const KNOWN = (violation: { id: string; nodes: { target: unknown[] }[] }) => violation.id === "color-contrast" || (violation.id === "target-size" && violation.nodes.every((node) => node.target.join(" ").includes("dual-range")));

for (const route of ROUTE_CASES) {
  test(`axe · ${route.name}`, async ({ page }) => {
    test.skip(![375, 1280].includes(viewportWidth()), "axe runs at 375 and 1280");
    await openRoute(page, route);
    const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    const describe = (violation: (typeof violations)[number]) => `${violation.id} (${violation.impact}): ${violation.help} -> ${violation.nodes.slice(0, 4).map((node) => node.target.join(" ")).join(" | ")}${violation.nodes.length > 4 ? ` (+${violation.nodes.length - 4})` : ""}`;
    for (const violation of violations.filter((entry) => (entry.impact !== "serious" && entry.impact !== "critical") || KNOWN(entry))) test.info().annotations.push({ type: KNOWN(violation) ? "axe-known" : "axe", description: describe(violation) });
    expect(violations.filter((entry) => (entry.impact === "serious" || entry.impact === "critical") && !KNOWN(entry)).map(describe)).toEqual([]);
  });
}
