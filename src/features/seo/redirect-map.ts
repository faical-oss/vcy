import { isBuiltRoute } from "@/constants/routes";

export interface RedirectRow {
  oldUrl: string;
  newUrl: string;
  status: string;
  notes: string;
}

export const REDIRECT_MAP_HEADER = ["old_url", "new_url", "status", "notes"] as const;

/** Splits one CSV line (double-quoted fields with "" escapes are supported). */
function splitLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (quoted) {
      if (char === '"' && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else current += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      fields.push(current);
      current = "";
    } else current += char;
  }
  fields.push(current);
  return fields.map((field) => field.trim());
}

/** Parses `old_url,new_url,status,notes`. A wrong header throws; blank lines are skipped. */
export function parseRedirectMap(csv: string): RedirectRow[] {
  const [header, ...lines] = csv.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (!header || splitLine(header).join(",") !== REDIRECT_MAP_HEADER.join(",")) {
    throw new Error(`redirect map: header must be ${REDIRECT_MAP_HEADER.join(",")}`);
  }
  return lines.map((line) => {
    const [oldUrl = "", newUrl = "", status = "", notes = ""] = splitLine(line);
    return { oldUrl, newUrl, status, notes };
  });
}

/** Path (and query) of a URL, absolute or not. Null when it is not a usable site URL. */
export function toSitePath(url: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url, "http://site.invalid");
    if (parsed.host !== "site.invalid" && !/^https?:$/.test(parsed.protocol)) return null;
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return null;
  }
}

/**
 * Static checks of the redirect map. Every old URL must 301 to a path the site serves, once: no duplicates, no chains
 * (a target that is itself redirected), no self-redirects, no query strings on targets. Whether the target slug exists
 * is a catalog question, checked against a running server (see redirect-map.test.ts).
 */
export function validateRedirectMap(rows: readonly RedirectRow[]): string[] {
  const problems: string[] = [];
  const oldPaths = new Set<string>();
  const seen = new Set<string>();
  for (const row of rows) {
    const oldPath = toSitePath(row.oldUrl);
    if (oldPath) oldPaths.add(oldPath);
  }
  rows.forEach((row, index) => {
    const label = `row ${index + 2} (${row.oldUrl || "empty"})`;
    const oldPath = toSitePath(row.oldUrl);
    const newPath = toSitePath(row.newUrl);
    if (!oldPath) return problems.push(`${label}: old_url is not a URL or path`);
    if (!newPath) return problems.push(`${label}: new_url is not a URL or path`);
    if (row.status !== "301") problems.push(`${label}: status must be 301, got "${row.status}"`);
    if (seen.has(oldPath)) problems.push(`${label}: old_url appears more than once`);
    seen.add(oldPath);
    if (oldPath === newPath) problems.push(`${label}: redirects to itself`);
    if (newPath.includes("?")) problems.push(`${label}: new_url must not carry a query string`);
    else if (!isBuiltRoute(newPath)) problems.push(`${label}: new_url ${newPath} is not a page the site serves`);
    if (oldPaths.has(newPath) && oldPath !== newPath) problems.push(`${label}: redirect chain, ${newPath} is itself redirected`);
  });
  return problems;
}
