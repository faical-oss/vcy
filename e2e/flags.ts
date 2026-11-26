import { readFileSync } from "node:fs";
import path from "node:path";

/*
 * The feature flags the built server was made with, read the way Next reads them: process.env first, then .env.local, then
 * .env (the same precedence as `next build`). The e2e tests use these instead of assuming a flag state, so they pass whether or
 * not a developer has turned a flag on locally (`.env.local` is never committed). Same rules as src/lib/flags.ts.
 */
const root = path.resolve(import.meta.dirname, "..");

function readEnvFile(name: string): Record<string, string> {
  try {
    const values: Record<string, string> = {};
    for (const line of readFileSync(path.join(root, name), "utf8").split("\n")) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
      if (match && !line.trim().startsWith("#")) values[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
    return values;
  } catch {
    return {};
  }
}

const files = { ...readEnvFile(".env"), ...readEnvFile(".env.local") };
const env = (key: string): string | undefined => process.env[key] ?? files[key];

const mocks = env("USE_MOCKS") === "true" && env("SITE_ENV") !== "production";

export const flags = {
  /** "Travelled on this trip?" review form is rendered. */
  reviewForm: env("FEATURE_REVIEW_FORM") === "true" && mocks,
  /** `/checkout` exists (the stub) and the detail pages can link to it. */
  checkoutStub: env("FEATURE_CHECKOUT_STUB") === "true" && mocks,
} as const;
