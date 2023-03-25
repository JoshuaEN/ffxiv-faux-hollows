import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import checker from "vite-plugin-checker";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    // https://vitest.dev/guide/in-source.html#production-build
    "import.meta.vitest": "undefined",
    "import.meta.env.DEV": "undefined",
  },
  plugins: [
    vue(),
    checker({
      vueTsc: true,
      eslint: { lintCommand: "eslint --ext .js,.ts,.vue ./" },
    }),
  ],
  test: {
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
  },
  resolve: {
    alias: [{ find: /^~/, replacement: resolve(__dirname) }],
  },
});
