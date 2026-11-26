// Reads test-results/responsive.json (written by `npm run test:responsive`) and prints a route x size-group table plus the distinct
// problems found (check + selector, with the routes and sizes they appear on). Writes the same to screenshots/responsive-check/summary.md.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const file = process.argv[2] ?? "test-results/responsive.json";
const strip = (text) => text.replace(/\x1b\[[0-9;]*m/g, "");
const group = (project) => (project.startsWith("webkit") ? "webkit" : project.startsWith("firefox") ? "firefox" : project.split("-")[0]);
const rows = [];
(function walk(suite) {
  for (const spec of suite.specs ?? []) for (const test of spec.tests) for (const result of test.results.slice(-1)) rows.push({ spec: suite.file ?? "", title: spec.title, project: test.projectName, status: result.status, errors: (result.errors ?? []).map((error) => strip(error.message ?? "")) });
  for (const child of suite.suites ?? []) walk({ ...child, file: child.file ?? suite.file });
})({ suites: JSON.parse(readFileSync(file, "utf8")).suites });

const groups = [...new Set(rows.map((row) => group(row.project)))];
const routes = [...new Set(rows.map((row) => row.title))];
const cell = (title, g) => {
  const found = rows.filter((row) => row.title === title && group(row.project) === g);
  if (!found.length || found.every((row) => row.status === "skipped")) return "-";
  return found.filter((row) => row.status !== "skipped").every((row) => row.status === "passed") ? "pass" : "FAIL";
};
const out = ["| test | " + groups.join(" | ") + " |", "|---|" + groups.map(() => "---|").join("")];
for (const title of routes) out.push(`| ${title} | ${groups.map((g) => cell(title, g)).join(" | ")} |`);

const problems = new Map();
for (const row of rows) {
  if (row.status === "passed" || row.status === "skipped") continue;
  for (const message of row.errors) {
    const check = /Error: ([a-z -]+?):/.exec(message)?.[1] ?? (/Test timeout/.test(message) ? "timeout" : "other");
    const selectors = [...message.matchAll(/"selector": "(.*?)"[\s\S]*?(?=\n\s*\+?\s*\}|$)/g)].map((m) => m[1]);
    const details = [...message.matchAll(/"detail": "(.*?)"/g)].map((m) => m[1]);
    // Plain string lists (axe): one problem per quoted line.
    const lines = [...message.matchAll(/^\s*\+\s+"(.+)",?\s*$/gm)].map((m) => m[1]);
    if (!selectors.length && lines.length) selectors.push(...lines);
    if (!selectors.length) selectors.push(message.split("\n").find((line) => line.trim())?.slice(0, 100) ?? "?");
    selectors.forEach((selector, index) => {
      const key = `${check} | ${selector}`;
      const entry = problems.get(key) ?? { check, selector, detail: details[index] ?? "", where: new Set() };
      entry.where.add(`${row.title}@${row.project}`);
      problems.set(key, entry);
    });
  }
}
out.push("", `## Problems (${problems.size} distinct)`, "");
for (const entry of [...problems.values()].sort((a, b) => b.where.size - a.where.size)) out.push(`- **${entry.check}** \`${entry.selector}\` ${entry.detail} (${entry.where.size}: ${[...entry.where].slice(0, 3).join(", ")}${entry.where.size > 3 ? ", ..." : ""})`);
const text = out.join("\n");
mkdirSync("screenshots/responsive-check", { recursive: true });
writeFileSync("screenshots/responsive-check/summary.md", text);
console.log(text);
