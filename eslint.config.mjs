import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // React 19 strict rule that flags the common "fetch-then-setState in
      // useEffect" pattern used across every client page in this codebase.
      // TODO: migrate to Server Components / Suspense and re-enable as error.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
