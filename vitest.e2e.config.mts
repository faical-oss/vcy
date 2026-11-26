import path from "node:path";
import { defineConfig } from "vitest/config";

/** End-to-end checks against a BUILT server (run `npm run build` first, then `npm run test:e2e`). Not part of `npm test`. */
export default defineConfig({
  test: { environment: "node", include: ["e2e/**/*.test.ts"], testTimeout: 60_000, hookTimeout: 60_000, globalSetup: ["e2e/global-setup.ts"] },
  resolve: { alias: { "server-only": path.resolve(import.meta.dirname, "src/mocks/server-only.ts"), "@": path.resolve(import.meta.dirname, "src") } },
});
