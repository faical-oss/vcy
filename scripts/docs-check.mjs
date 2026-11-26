#!/usr/bin/env node
// Change check: fails when a feature changed but its doc (docs/features/<name>.md) did not.
// Usage: npm run docs:check            compares the working tree and commits against the base branch (main, or master)
//        DOCS_CHECK_BASE=develop npm run docs:check
//        node scripts/docs-check.mjs --message-file <path>   (commit-msg hook: also reads the message being written)
// Escape: a line "docs: none" in a commit message since the base (or in the message being written) skips the check.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { checkChanged } from "./docs/feature-docs.mjs";

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function fail(message) {
  console.error(`docs:check: ${message}`);
  process.exit(1);
}

try {
  git("rev-parse", "--is-inside-work-tree");
} catch {
  fail("this folder is not a git repository, so there is nothing to compare against the base branch. Run `git init` and commit a baseline on main first (or run this in the real repository).");
}

const candidates = process.env.DOCS_CHECK_BASE ? [process.env.DOCS_CHECK_BASE] : ["main", "master"];
const base = candidates.find((ref) => {
  try {
    git("rev-parse", "--verify", "--quiet", ref);
    return true;
  } catch {
    return false;
  }
});
if (!base) fail(`base branch not found (tried ${candidates.join(", ")}). Set DOCS_CHECK_BASE to your main branch.`);

let mergeBase;
try {
  mergeBase = git("merge-base", base, "HEAD");
} catch {
  fail(`no common ancestor between ${base} and HEAD.`);
}

const tracked = git("diff", "--name-only", mergeBase).split("\n").filter(Boolean);
const untracked = git("ls-files", "--others", "--exclude-standard").split("\n").filter(Boolean);
const messages = git("log", `${mergeBase}..HEAD`, "--format=%B%x00").split("\0").filter(Boolean);
const flag = process.argv.indexOf("--message-file");
if (flag !== -1 && process.argv[flag + 1]) messages.push(readFileSync(process.argv[flag + 1], "utf8"));

const { skipped, problems } = checkChanged({ changedFiles: [...new Set([...tracked, ...untracked])], messages });
if (skipped) {
  console.log('docs:check: skipped, a commit message says "docs: none".');
  process.exit(0);
}
if (problems.length > 0) {
  console.error(`docs:check failed (compared with ${base}):\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log(`docs:check ok (compared with ${base}).`);
