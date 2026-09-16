import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Bewust genegeerde destructured/gebonden waarden (bv. `const { ok: _ok, ...body } = result`,
      // `catch (_err)`) expliciet toestaan met een `_`-prefix i.p.v. ze stilzwijgend te laten staan.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Gegenereerde output, geen bron.
    "coverage/**",
    // Eenmalige devops/migratie/debug-scripts (root en scripts/) -- geen productiecode,
    // draaien handmatig via `node`/`tsx`, niet onderdeel van de Next.js-app.
    "scripts/**",
    "add-reality-check-nurture-columns.js",
    "check-db.ts",
    "check-demo-counts.ts",
    "create-push-tables.js",
    "create-reality-check-table.js",
    "create-wins-tables.js",
    "run-schema.js",
  ]),
]);

export default eslintConfig;
