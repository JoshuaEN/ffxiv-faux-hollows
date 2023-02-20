import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import checker from "vite-plugin-checker";

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    // https://vitest.dev/guide/in-source.html#production-build
    "import.meta.vitest": "undefined",
    "import.meta.env.DEV": "undefined",
  },
  plugins: [vue(), checker({ vueTsc: true, eslint: { lintCommand: "." } })],
  test: {
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
  },
});
