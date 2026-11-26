import "server-only";
import { z } from "zod";

const siteEnvSchema = z.enum(["development", "staging", "production"]);
export type SiteEnv = z.infer<typeof siteEnvSchema>;

export function getSiteEnv(): SiteEnv {
  const parsed = siteEnvSchema.safeParse(process.env.SITE_ENV);
  return parsed.success ? parsed.data : "development";
}

export function isProduction(): boolean {
  return getSiteEnv() === "production";
}

/** Why `INDEXING_ENABLED=true` cannot be honoured, or null when the combination is safe. Pure, so it is unit tested. */
export function indexingConflict(env: Readonly<Record<string, string | undefined>>): string | null {
  if (env.INDEXING_ENABLED !== "true") return null;
  if (env.USE_MOCKS === "true") return "INDEXING_ENABLED=true is not allowed while USE_MOCKS=true: mock data must never be indexed.";
  if (env.SITE_ENV !== "production") return "INDEXING_ENABLED=true is only allowed when SITE_ENV=production.";
  return null;
}

/**
 * The single switch for search-engine indexing (meta robots, robots.txt, sitemap and the indexation policy all ask here).
 * Off unless INDEXING_ENABLED=true. Read at build time, so going live means rebuilding with the flag on.
 * An unsafe combination throws (it also fails the build in next.config.ts).
 */
export function isIndexingEnabled(): boolean {
  const conflict = indexingConflict(process.env);
  if (conflict) throw new Error(conflict);
  return process.env.INDEXING_ENABLED === "true";
}

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export function shouldUseMocks(): boolean {
  return process.env.USE_MOCKS === "true";
}

const apiEnvSchema = z.object({
  TRIPFUSION_API_BASE_URL: z.url(),
  TRIPFUSION_API_KEY: z.string().min(1),
  TRIPFUSION_API_VERSION: z.string().min(1).default("v1"),
});
export type ApiEnv = z.infer<typeof apiEnvSchema>;

/** Validated lazily so the build does not need API credentials. Never echoes values. */
export function getApiEnv(): ApiEnv {
  const parsed = apiEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const keys = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Invalid or missing environment variables: ${keys}`);
  }
  return parsed.data;
}
