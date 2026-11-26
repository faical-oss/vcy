import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Layering rules (see README): app -> features -> services -> lib.
// Client-safe layers must never reach server-only code; base layers must not depend on higher ones.
const serverOnlyPatterns = {
  group: ["@/services", "@/services/*", "@/lib", "@/lib/*", "@/mocks", "@/mocks/*", "server-only"],
  message: "Server-only code. Import it from app/ or features/ server components, never from client-safe layers.",
};
const higherLayerPatterns = {
  group: ["@/app", "@/app/*", "@/features", "@/features/*", "@/components", "@/components/*", "@/hooks", "@/hooks/*", "@/store", "@/store/*"],
  message: "helpers, constants and interfaces must not depend on higher layers.",
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/{hooks,store,components}/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": ["error", { patterns: [serverOnlyPatterns] }] },
  },
  {
    files: ["src/{helpers,constants,interfaces}/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [serverOnlyPatterns, higherLayerPatterns] }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
