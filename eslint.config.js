import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["dist/**", "docs/**"],
  },
  js.configs.recommended,
  {
    files: ["src/**/*.js", "vite.config.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        L: "readonly",
      },
    },
  },
  {
    files: ["public/service-worker.js"],
    languageOptions: {
      globals: globals.serviceworker,
    },
  },
];
