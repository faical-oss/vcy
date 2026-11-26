// Shared logic of the feature-documentation checks (see CLAUDE.md, "Documentation definition of done").
// Pure functions, no I/O: the presence test (src/features/feature-docs.test.ts, runs in `npm test`) and the change check
// (scripts/docs-check.mjs, `npm run docs:check`) both use them.

/**
 * Feature folders (src/features/<folder>) whose doc is NOT docs/features/<folder>.md. Everything else maps to its own name.
 */
export const DOC_FOR_FOLDER = {
  privacy: "static-pages", // Privacy, Terms and Support share one doc: three small content-only pages
  terms: "static-pages",
  support: "static-pages",
  seo: "seo-and-caching",
  availability: "hotel-detail", // live price and availability of the hotel detail page (later also packages and experiences)
  reviews: "hotel-detail", // the review form of the hotel detail page
};

/**
 * Feature folders that need no doc. Keep this empty or tiny: adding a folder here is a visible decision, say why.
 * (none today)
 */
/** @type {string[]} */
export const NO_DOC_FOLDERS = [];

/**
 * Route folders under src/app/(site) that belong to a feature doc, so a page change also asks for a doc update.
 * The home page (src/app/(site)/page.tsx) is matched separately. `layout.tsx` and unknown routes are not mapped.
 */
export const DOC_FOR_ROUTE = {
  destinations: "destinations",
  hotels: "hotels-and-experiences",
  experiences: "hotels-and-experiences",
  account: "account",
  privacy: "static-pages",
  terms: "static-pages",
  support: "static-pages",
};

export const FEATURE_DOCS_DIR = "docs/features";

/** Name (without .md) of the doc a feature folder must have. */
export function docNameForFolder(folder) {
  return DOC_FOR_FOLDER[folder] ?? folder;
}

/** Valid "YYYY-MM-DD" (a real calendar date). */
export function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** The date of the first "Last updated: YYYY-MM-DD" line, or null. */
export function parseLastUpdated(text) {
  const match = text.match(/^Last updated:\s*(\d{4}-\d{2}-\d{2})\s*$/m);
  return match ? match[1] : null;
}

/** Changelog entries ("- YYYY-MM-DD: text") below a "## Changelog" heading, in file order. */
export function parseChangelog(text) {
  const start = text.search(/^##\s+Changelog\b/m);
  if (start === -1) return [];
  const rest = text.slice(start).split("\n").slice(1);
  const entries = [];
  for (const line of rest) {
    if (/^##\s/.test(line)) break;
    const match = line.match(/^[-*]\s+(\d{4}-\d{2}-\d{2}):\s+(\S.*)$/);
    if (match) entries.push({ date: match[1], text: match[2] });
  }
  return entries;
}

/** Date column of the README row that links to `<doc>.md`, or null when it is not listed. Row: `| Feature | Status | YYYY-MM-DD | [..](doc.md) |`. */
export function readmeDateFor(readme, doc) {
  const row = readme.split("\n").find((line) => line.startsWith("|") && line.includes(`(${doc}.md)`));
  if (!row) return null;
  const date = row.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  return date ? date[1] : "";
}

/**
 * Presence checks. `docs` maps doc name -> file text for every docs/features/*.md except README.md.
 * Returns human-readable problems; empty means fine.
 */
/**
 * @param {{ featureFolders: string[], docs: Record<string, string>, readme: string }} input
 * @returns {string[]}
 */
export function checkPresence({ featureFolders, docs, readme }) {
  /** @type {string[]} */
  const problems = [];
  const names = Object.keys(docs);
  for (const folder of featureFolders) {
    if (NO_DOC_FOLDERS.includes(folder)) continue;
    const doc = docNameForFolder(folder);
    if (!(doc in docs)) {
      problems.push(`Feature "${folder}" (src/features/${folder}) has no doc. Create ${FEATURE_DOCS_DIR}/${doc}.md from the template in ${FEATURE_DOCS_DIR}/README.md (rule: CLAUDE.md, "Documentation definition of done") and list it in ${FEATURE_DOCS_DIR}/README.md.`);
    }
  }
  for (const name of names) {
    const file = `${FEATURE_DOCS_DIR}/${name}.md`;
    const text = docs[name];
    const readmeDate = readmeDateFor(readme, name);
    if (readmeDate === null) problems.push(`${file} is not listed in ${FEATURE_DOCS_DIR}/README.md. Add a row: | Feature | Status | last updated | [${name}.md](${name}.md) |.`);
    const updated = parseLastUpdated(text);
    if (!updated) {
      problems.push(`${file} has no "Last updated: YYYY-MM-DD" line. Add it under the title.`);
    } else if (!isValidDate(updated)) {
      problems.push(`${file}: "Last updated: ${updated}" is not a valid date (YYYY-MM-DD).`);
    }
    const changelog = parseChangelog(text);
    if (changelog.length === 0) {
      problems.push(`${file} has no changelog entry. Add "## Changelog" at the bottom with at least one line "- YYYY-MM-DD: what changed and why".`);
    } else {
      const bad = changelog.find((entry) => !isValidDate(entry.date));
      if (bad) problems.push(`${file}: changelog date "${bad.date}" is not a valid date.`);
      if (updated && isValidDate(updated) && changelog[0].date !== updated) {
        problems.push(`${file}: "Last updated: ${updated}" must equal the date of the newest changelog entry (${changelog[0].date}, the first line). Newest entry goes first.`);
      }
      const sorted = [...changelog].map((entry) => entry.date).sort().reverse();
      if (sorted.join() !== changelog.map((entry) => entry.date).join()) problems.push(`${file}: changelog must be newest first.`);
    }
    if (updated && readmeDate !== null && readmeDate !== updated) {
      problems.push(`${FEATURE_DOCS_DIR}/README.md lists ${name}.md as updated "${readmeDate || "(no date)"}" but the doc says "${updated}". Update the README row.`);
    }
  }
  for (const line of readme.split("\n")) {
    if (!line.startsWith("|")) continue;
    const link = line.match(/\]\(([a-z0-9-]+)\.md\)/);
    if (link && link[1] !== "README" && !(link[1] in docs)) problems.push(`${FEATURE_DOCS_DIR}/README.md lists ${link[1]}.md but that file does not exist. Create it or remove the row.`);
  }
  return problems;
}

/** Doc names a changed repo-relative path belongs to (empty when it is not feature code). */
export function docsForPath(path) {
  const normalized = path.replaceAll("\\", "/");
  const feature = normalized.match(/^src\/features\/([^/]+)\//);
  if (feature) return NO_DOC_FOLDERS.includes(feature[1]) ? [] : [docNameForFolder(feature[1])];
  if (normalized === "src/app/(site)/page.tsx") return ["home"];
  if (normalized.startsWith("src/app/(site)/hotels/h/")) return ["hotel-detail"];
  const route = normalized.match(/^src\/app\/\(site\)\/([^/]+)\//);
  if (route && DOC_FOR_ROUTE[route[1]]) return [DOC_FOR_ROUTE[route[1]]];
  return [];
}

/** True when a commit message has a line "docs: none" (optionally followed by a reason). */
/** @param {string[]} messages */
export function hasDocsNone(messages) {
  return messages.some((message) => /^docs:\s*none\b/im.test(message));
}

/**
 * Change check: every feature touched by `changedFiles` must have its doc changed too.
 * Returns { skipped, problems }. `docs: none` in any message skips the check (the escape for changes that need no doc).
 */
/**
 * @param {{ changedFiles: string[], messages?: string[] }} input
 * @returns {{ skipped: boolean, problems: string[] }}
 */
export function checkChanged({ changedFiles, messages = /** @type {string[]} */ ([]) }) {
  if (hasDocsNone(messages)) return { skipped: true, problems: [] };
  const changed = new Set(changedFiles.map((file) => file.replaceAll("\\", "/")));
  /** @type {Map<string, string>} */
  const touched = new Map(); // doc -> first file that touched it
  for (const file of changed) {
    for (const doc of docsForPath(file)) if (!touched.has(doc)) touched.set(doc, file);
  }
  /** @type {string[]} */
  const problems = [];
  for (const [doc, file] of touched) {
    if (!changed.has(`${FEATURE_DOCS_DIR}/${doc}.md`)) {
      problems.push(`Feature "${doc}" changed (${file}) but ${FEATURE_DOCS_DIR}/${doc}.md did not. Update that doc (Last updated date, a changelog line, README row), or put "docs: none" in the commit message if no doc change is needed.`);
    }
  }
  return { skipped: false, problems };
}
