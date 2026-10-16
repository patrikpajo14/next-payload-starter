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
    // Agent worktrees and skills hold their own build output and copies of the repo.
    ".claude/**",
  ]),
  {
    // Tests pass optional variables on to child processes, where "" is the value.
    ignores: ["tests/**"],
    rules: {
      // An empty fallback hides a missing secret until something fails later.
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "LogicalExpression[operator=/^(\\?\\?|\\|\\|)$/][left.object.object.name='process'][left.object.property.name='env'][right.value='']",
          message: 'Do not fall back to "" on process.env. Use requireEnv() from lib/require-env.ts.',
        },
      ],
    },
  },
]);

export default eslintConfig;
