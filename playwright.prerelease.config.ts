import { defineConfig, devices } from "@playwright/test";
import { cpus } from "os";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

const isCI = "CI" in process.env;

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./e2e/",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: true,
  /* Retry on CI only */
  retries: 1,
  /* Opt out of parallel tests on CI. */
  workers: isCI ? 1 : Math.floor(cpus().length * 0.75),
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [["line"], ["blob"]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "https://localhost:8788",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",

    ignoreHTTPSErrors: true,
  },

  timeout: 3 * 60 * 1000,

  /* Configure projects for major browsers */
  projects: [
    {
      name: "Chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    {
      name: "Firefox",
      use: { ...devices["Desktop Firefox"] },
    },

    {
      name: "Webkit",
      use: { ...devices["Desktop Safari"] },
    },

    /* Test against mobile viewports. */
    {
      name: "MobileChrome",
      use: { ...devices["Pixel 5"] },
      grepInvert: /@keyboard/,
    },
    {
      name: "MobileSafari",
      use: { ...devices["iPhone 12"] },
      grepInvert: /@keyboard/,
    },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ..devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command:
      // The wrangler dev server crashes sometimes, hopefully this will fix it.
      'pnpm concurrently --restart-tries 5 --restart-after 200 "pnpm run preview"',
    url: "https://localhost:8788",
    reuseExistingServer: false,
    ignoreHTTPSErrors: true,
  },
});
