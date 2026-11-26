import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/*
 * Guard: internal URLs come only from src/constants/routes.ts (ROUTES and the helper functions), so a path changes in one
 * place. This scans the source and fails for a literal internal path used as an href / Link, a redirect, a router push or
 * replace, or a literal "/hotels", "/experiences", "/destinations" or "/packages" path anywhere in code. Comments, the
 * route type generics (PageProps<"/hotels/[category]">), routes.ts itself and tests are ignored.
 */
const SRC = path.resolve(import.meta.dirname, "..");
const ROUTES_FILE = path.join(SRC, "constants", "routes.ts");

const PATTERNS: { name: string; regex: RegExp }[] = [
  { name: "href with a literal path", regex: /\bhref\s*[:=]\s*\{?\s*["'`]\/(?!\/)/ },
  { name: "redirect with a literal path", regex: /\b(?:redirect|permanentRedirect)\(\s*["'`]\// },
  { name: "router push/replace with a literal path", regex: /\.(?:push|replace)\(\s*["'`]\// },
  { name: 'literal "/hotels|experiences|destinations|packages" path', regex: /(?<!(?:PageProps|LayoutProps|RouteContext)<)["'`]\/(?:hotels|experiences|destinations|packages)(?=[/?#"'`$]|\b)/ },
];

/** Source without comments, line structure kept so reported line numbers stay right. String contents are left alone. */
export function stripComments(source: string): string {
  const blank = (match: string) => match.replace(/[^\n]/g, " ");
  return source.replace(/\/\*[\s\S]*?\*\//g, blank).replace(/(^|[^:"'`\\])\/\/[^\n]*/g, (match, lead: string) => lead + " ".repeat(match.length - lead.length));
}

export function findHardcodedPaths(source: string): { line: number; check: string; text: string }[] {
  const lines = stripComments(source).split("\n");
  const found: { line: number; check: string; text: string }[] = [];
  lines.forEach((text, index) => {
    const hit = PATTERNS.find(({ regex }) => regex.test(text));
    if (hit) found.push({ line: index + 1, check: hit.name, text: text.trim().slice(0, 140) });
  });
  return found;
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(entry.name) && !/\.test\.(ts|tsx)$/.test(entry.name) && full !== ROUTES_FILE ? [full] : [];
  });
}

describe("findHardcodedPaths (the scanner)", () => {
  it("flags literal paths in href, redirect, router and section-name literals", () => {
    const code = [
      '<Link href="/hotels">x</Link>',
      "const a = { href: `/experiences/${slug}` };",
      'redirect("/");',
      'router.push("/account");',
      'const c = "/destinations/asia";',
      'const d = { href: "/magazine" };',
    ].join("\n");
    expect(findHardcodedPaths(code).map((hit) => hit.line)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("ignores comments, route generics, helpers, external URLs and non-path strings", () => {
    const code = [
      '// href="/hotels"',
      '/* redirect("/") */',
      'export async function generateMetadata({ params }: PageProps<"/hotels/[category]">) {}',
      '<Link href={hotelCategory(slug)}>x</Link>',
      '<a href="https://example.com/hotels">x</a>',
      'const url = "https://vacayou.com/experiences";',
      'const hash = { href: "#main" };',
      'redirect(ROUTES.home);',
    ].join("\n");
    expect(findHardcodedPaths(code)).toEqual([]);
  });
});

describe("no hardcoded internal paths outside routes.ts", () => {
  const violations = sourceFiles(SRC).flatMap((file) => findHardcodedPaths(readFileSync(file, "utf8")).map((hit) => ({ file: path.relative(path.resolve(SRC, ".."), file), ...hit })));

  it("finds none", () => {
    const report = violations.map((hit) => `${hit.file}:${hit.line} (${hit.check}) ${hit.text}`).join("\n");
    expect(violations, `Use ROUTES / the helpers in src/constants/routes.ts instead of a literal internal path:\n${report}`).toEqual([]);
  });
});
