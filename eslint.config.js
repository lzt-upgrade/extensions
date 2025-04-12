import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import globals from "globals";
import oxlint from "eslint-plugin-oxlint";

export default defineConfig([
  {
    ignores: ["dist/*"],
  },
  js.configs.recommended,
  {
    rules: {
      "no-control-regex": 0,
      "no-async-promise-executor": 0,
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.greasemonkey,
        // Forum globals
        XenForo: "readonly",
        FroalaEditor: "readonly",
        DOMPurify: "readonly",
        injectStyle: "readonly",
      },
    },
  },
  oxlint.configs["flat/recommended"], // oxlint should be the last one
]);
