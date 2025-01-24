import { ciBaseConfig, defineConfig } from "./test/playwright/define-config.js";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig(
  { baseURL: "https://localhost:8788", ignoreHTTPSErrors: true },
  ciBaseConfig,
  {
    /* Run your local dev server before starting the tests */
    webServer: {
      // The wrangler dev server crashes sometimes, hopefully this will fix it.
      command:
        'pnpm concurrently --restart-tries 5 --restart-after 200 "pnpm run preview"',
      url: "https://localhost:8788",
      reuseExistingServer: false,
      ignoreHTTPSErrors: true,
    },
  }
);
