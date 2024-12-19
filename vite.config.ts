import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import checker from "vite-plugin-checker";
import { resolve, join } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    // https://vitest.dev/guide/in-source.html#production-build
    "import.meta.vitest": "undefined",
    "import.meta.env.DEV": "undefined",
    "import.meta.env.SOLVER": "'community-data-recursive-fast'",
    "import.meta.env.WEIGHTER": "'s6p4-f1'",
  },
  plugins: [
    vue(),
    checker({
      vueTsc: true,
      // eslint: { lintCommand: "eslint --ext .js,.ts,.vue ./" },
    }),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        // https://vite.dev/config/shared-options#css-preprocessoroptions
        // https://stackoverflow.com/a/79003101
        api: "modern-compiler",
      },
    },
  },
  test: {
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    dir: join(resolve(__dirname), "src"),
  },
  resolve: {
    alias: [{ find: /^~/, replacement: resolve(__dirname) }],
  },
});
