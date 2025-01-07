import pluginVue from "eslint-plugin-vue";
import {
  defineConfig,
  createConfig as vueTsEslintConfig,
} from "@vue/eslint-config-typescript";
import { includeIgnoreFile } from "@eslint/compat";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, ".gitignore");

export default defineConfig(
  includeIgnoreFile(gitignorePath),
  pluginVue.configs["flat/essential"],
  {
    files: ["**/*.ts", "**/*.vue"],
    rules: {
      // Manually turn strict rules https://typescript-eslint.io/rules/?=xrecommended-strict
      // Limitation of https://www.npmjs.com/package/@vue/eslint-config-typescript
      "@typescript-eslint/no-confusing-void-expression": "error",
      "@typescript-eslint/no-deprecated": "error",
      "@typescript-eslint/no-dynamic-delete": "error",
      "@typescript-eslint/no-extraneous-class": "error",
      "@typescript-eslint/no-invalid-void-type": "error",
      "@typescript-eslint/no-meaningless-void-operator": "error",
      "@typescript-eslint/no-mixed-enums": "error",
      "@typescript-eslint/no-non-null-asserted-nullish-coalescing": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-unnecessary-boolean-literal-compare": "error",
      "@typescript-eslint/no-unnecessary-condition": "error",
      "@typescript-eslint/no-unnecessary-template-expression": "error",
      "@typescript-eslint/no-unnecessary-type-arguments": "error",
      "@typescript-eslint/no-unnecessary-type-parameters": "error",
      // Note: you must disable the base rule as it can report incorrect errors
      "no-useless-constructor": "off",
      "@typescript-eslint/no-useless-constructor": "error",
      "@typescript-eslint/prefer-literal-enum-member": "error",
      "@typescript-eslint/prefer-reduce-type-parameter": "error",
      "@typescript-eslint/prefer-return-this-type": "error",
      "@typescript-eslint/related-getter-setter-pairs": "error",
      "@typescript-eslint/unified-signatures": "error",
      "@typescript-eslint/use-unknown-in-catch-callback-variable": "error",
      // Enable additional settings
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
        { allowNullish: true, allowBoolean: true, allowNumber: true },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-for-in-array": "error",
      "@typescript-eslint/no-unnecessary-condition": "error",
      "@typescript-eslint/no-unsafe-enum-comparison": "error",
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
    },
  },

  vueTsEslintConfig({
    extends: ["recommendedTypeChecked"],
  }),

  {
    files: ["**/*.ts", "**/*.vue"],
    rules: {
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
  }
);
