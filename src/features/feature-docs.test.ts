import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FEATURE_DOCS_DIR, NO_DOC_FOLDERS, checkChanged, checkPresence, docsForPath, hasDocsNone, isValidDate, parseChangelog, parseLastUpdated } from "../../scripts/docs/feature-docs.mjs";

/*
 * Feature docs presence check (CLAUDE.md, "Documentation definition of done"). The first block checks the real repo:
 * every folder under src/features has its doc, every doc is in docs/features/README.md with the same date, has a valid
 * "Last updated: YYYY-MM-DD" and a changelog whose newest entry has that date. The rest tests the check itself.
 * The folder-to-doc mapping and the small "no doc needed" allowlist are in scripts/docs/feature-docs.mjs.
 */
const ROOT = path.resolve(import.meta.dirname, "../..");
const featureFolders = readdirSync(path.join(ROOT, "src/features"), { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
const docsDir = path.join(ROOT, FEATURE_DOCS_DIR);
const docs = Object.fromEntries(
  readdirSync(docsDir)
    .filter((file) => file.endsWith(".md") && file !== "README.md")
    .map((file) => [file.replace(/\.md$/, ""), readFileSync(path.join(docsDir, file), "utf8")]),
);
const readme = readFileSync(path.join(docsDir, "README.md"), "utf8");

describe("feature docs of this repo", () => {
  it("finds the feature folders and docs", () => {
    expect(featureFolders.length).toBeGreaterThan(5);
    expect(Object.keys(docs).length).toBeGreaterThan(5);
  });

  it("has a doc for every feature folder, every doc listed in the README, valid dates and a changelog", () => {
    const problems = checkPresence({ featureFolders, docs, readme });
    expect(problems, `Feature docs are incomplete:\n- ${problems.join("\n- ")}`).toEqual([]);
  });

  it("keeps the no-doc allowlist small", () => {
    expect(NO_DOC_FOLDERS.length).toBeLessThanOrEqual(2);
  });
});

const DOC = (updated: string, entries: string[]) => `# X\n\nLast updated: ${updated}\n\n## Changelog\n${entries.map((entry) => `- ${entry}`).join("\n")}\n`;
const README_ROW = (name: string, date: string) => `| X | built | ${date} | [${name}.md](${name}.md) |\n`;

describe("checkPresence", () => {
  const ok = { featureFolders: ["home"], docs: { home: DOC("2026-11-17", ["2026-11-17: created."]) }, readme: README_ROW("home", "2026-11-17") };

  it("accepts a complete doc", () => {
    expect(checkPresence(ok)).toEqual([]);
  });

  it("names the missing feature and the file to create", () => {
    const [problem] = checkPresence({ ...ok, featureFolders: ["home", "billing"] });
    expect(problem).toContain('Feature "billing"');
    expect(problem).toContain("docs/features/billing.md");
  });

  it("maps privacy, terms and support to static-pages and seo to seo-and-caching", () => {
    expect(docsForPath("src/features/privacy/content.ts")).toEqual(["static-pages"]);
    expect(docsForPath("src/features/seo/url-policy.ts")).toEqual(["seo-and-caching"]);
    expect(checkPresence({ featureFolders: ["privacy", "terms", "support", "seo"], docs: {}, readme: "" })).toHaveLength(4);
  });

  it("flags a doc missing from the README, a missing or invalid date, and a missing changelog", () => {
    expect(checkPresence({ ...ok, readme: "" }).join()).toContain("not listed in docs/features/README.md");
    expect(checkPresence({ ...ok, docs: { home: "# X\n\n## Changelog\n- 2026-11-17: a.\n" } }).join()).toContain('no "Last updated: YYYY-MM-DD" line');
    expect(checkPresence({ ...ok, docs: { home: DOC("2026-13-45", ["2026-13-45: a."]) } }).join()).toContain("not a valid date");
    expect(checkPresence({ ...ok, docs: { home: "# X\n\nLast updated: 2026-11-17\n" } }).join()).toContain("no changelog entry");
  });

  it("requires the newest changelog entry (first) to equal the Last updated date, and newest first", () => {
    const stale = checkPresence({ ...ok, docs: { home: DOC("2026-11-17", ["2026-11-10: old.", "2026-11-17: new."]) } }).join();
    expect(stale).toContain("must equal the date of the newest changelog entry");
    expect(stale).toContain("newest first");
  });

  it("flags a README row whose doc does not exist", () => {
    expect(checkPresence({ ...ok, readme: ok.readme + README_ROW("ghost", "2026-11-17") }).join()).toContain("ghost.md but that file does not exist");
  });

  it("requires the README date to match the doc", () => {
    expect(checkPresence({ ...ok, readme: README_ROW("home", "2026-11-01") }).join()).toContain('lists home.md as updated "2026-11-01"');
  });
});

describe("parsing helpers", () => {
  it("validates real calendar dates only", () => {
    expect(isValidDate("2026-02-28")).toBe(true);
    expect(isValidDate("2026-02-30")).toBe(false);
    expect(isValidDate("26-02-28")).toBe(false);
  });
  it("reads the date and the changelog entries", () => {
    expect(parseLastUpdated(DOC("2026-11-17", ["2026-11-17: a."]))).toBe("2026-11-17");
    expect(parseChangelog(DOC("2026-11-17", ["2026-11-17: a.", "2026-11-10: b."])).map((entry) => entry.date)).toEqual(["2026-11-17", "2026-11-10"]);
    expect(parseChangelog("# X\n## Changelog\nnothing here")).toEqual([]);
  });
});

describe("checkChanged (the docs:check logic)", () => {
  it("passes when the feature doc changed with the feature", () => {
    expect(checkChanged({ changedFiles: ["src/features/catalog/get-catalog.ts", "docs/features/catalog.md"] })).toEqual({ skipped: false, problems: [] });
  });

  it("fails naming the feature and the doc to update", () => {
    const { problems } = checkChanged({ changedFiles: ["src/features/catalog/get-catalog.ts"] });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('Feature "catalog"');
    expect(problems[0]).toContain("docs/features/catalog.md");
    expect(problems[0]).toContain("docs: none");
  });

  it("covers the feature's pages: home and route folders", () => {
    expect(docsForPath("src/app/(site)/page.tsx")).toEqual(["home"]);
    expect(docsForPath("src/app/(site)/destinations/[slug]/page.tsx")).toEqual(["destinations"]);
    expect(docsForPath("src/app/(site)/hotels/groups/[group]/page.tsx")).toEqual(["hotels-and-experiences"]);
    expect(docsForPath("src/app/(site)/hotels/h/[slug]/page.tsx")).toEqual(["hotel-detail"]);
    expect(docsForPath("src/features/availability/get-availability.ts")).toEqual(["hotel-detail"]);
    expect(docsForPath("src/app/(site)/layout.tsx")).toEqual([]);
    expect(docsForPath("src/components/ui/pill.tsx")).toEqual([]);
  });

  it("is skipped by a 'docs: none' line in a commit message, and only by a line of its own", () => {
    expect(hasDocsNone(["Fix typo\n\ndocs: none\n"])).toBe(true);
    expect(hasDocsNone(["Fix typo\n\nDocs: none (formatting only)"])).toBe(true);
    expect(hasDocsNone(["we said docs: none somewhere in a sentence"])).toBe(false);
    expect(checkChanged({ changedFiles: ["src/features/catalog/get-catalog.ts"], messages: ["tweak\n\ndocs: none"] })).toEqual({ skipped: true, problems: [] });
  });
});
