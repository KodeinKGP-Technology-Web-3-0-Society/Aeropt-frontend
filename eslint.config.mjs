import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "split_clean.py",
    "split_ts_morph.js",
    "node_modules/**",
    // Locally installed agent/skill scaffolding. It ships .cjs config files
    // that eslint-config-next does not register a plugin for, so linting them
    // aborts the whole run ("could not find plugin react-hooks") — on this
    // machine only, since the directory is git-ignored.
    ".agents/**",
  ]),
  {
    rules: {
      // Existing code still trips React Compiler-era hook rules and `any`.
      // Report them; do not fail CI until they are cleaned up.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "prefer-const": "warn",

      // Accessibility. `eslint-plugin-jsx-a11y` is already registered by
      // eslint-config-next/core-web-vitals, but only a handful of its rules are
      // on, all as warnings. These are the ones that catch the failures that
      // actually lock a keyboard or screen-reader user out.
      //
      // `label-has-associated-control` is an error: every form control in the
      // app is now associated with its label, so a new unlabelled input fails
      // CI rather than sliding in.
      "jsx-a11y/label-has-associated-control": "error",
      // Deprecated in the plugin and redundant with the rule above — it demands
      // BOTH nesting and htmlFor, which no sane markup does. Explicitly off so
      // nobody re-enables it by accident.
      "jsx-a11y/label-has-for": "off",
      // The remaining violations live in files owned by other work-in-progress
      // sessions (slides/*, MarkdownMath, InteractivePracticeCanvas), so these
      // report instead of failing the build.
      "jsx-a11y/control-has-associated-label": "warn",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/no-noninteractive-element-interactions": "warn",
      "jsx-a11y/no-noninteractive-tabindex": "warn",
      "jsx-a11y/interactive-supports-focus": "warn",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/role-has-required-aria-props": "error",
      "jsx-a11y/role-supports-aria-props": "error",
      "jsx-a11y/tabindex-no-positive": "error",
    },
  },
]);
