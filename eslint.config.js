// @ts-check

import js from "@eslint/js";
import typescriptEslint from "typescript-eslint";
import eslintPluginVue from "eslint-plugin-vue";

export default typescriptEslint.config(
  {
    extends: [
      js.configs.recommended,
      ...typescriptEslint.configs.strictTypeChecked,
      ...eslintPluginVue.configs["flat/recommended"],
    ],
    files: ["**/*.{ts,vue}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        parser: typescriptEslint.parser,
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: [".vue"],
      },
    },
    rules: {
      "@typescript-eslint/strict-boolean-expressions": [
        "error",
        {
          allowString: false,
          allowNumber: false,
          allowNullableObject: false,
          allowNullableBoolean: false,
          allowNullableString: false,
          allowNullableNumber: false,
          allowAny: false,
        },
      ],
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNullish: true, allowBoolean: true },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-for-in-array": "error",
      "@typescript-eslint/no-unnecessary-condition": "error",
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "console",
              importNames: ["assert"],
              message: "Import assert from the assert/strict library instead",
            },
            {
              name: "assert",
              message: "Import asserts from assert/strict instead",
            },
          ],
        },
      ],
      "@typescript-eslint/no-unnecessary-boolean-literal-compare": "off",
      // Prettier compat
      "vue/max-attributes-per-line": "off",
      "vue/html-closing-bracket-newline": "off",
      "vue/html-self-closing": "off",
      "vue/html-indent": "off",
      "vue/multiline-html-element-content-newline": "off",
      "vue/singleline-html-element-content-newline": "off",

      // Misc
      "block-scoped-var": "error",
      "no-inner-declarations": "off",
    },
  },
  {
    ignores: ["node_modules", "*.js"],
  }
);
