import {
  defineConfig as baseDefineConfig,
  devices,
  PlaywrightTestConfig,
} from "@playwright/test";
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
export function defineConfig(
  {
    baseURL,
    ignoreHTTPSErrors,
    version,
  }: { baseURL: string; ignoreHTTPSErrors?: boolean; version?: string },
  ...config: PlaywrightTestConfig[]
) {
  return baseDefineConfig<{ version: string }>(
    {
      testDir: "./e2e/",
      /* Run tests in files in parallel */
      fullyParallel: true,
      /* Fail the build on CI if you accidentally left test.only in the source code. */
      forbidOnly: isCI,
      /* Retry on CI only */
      retries: isCI ? 1 : 0,
      /* Opt out of parallel tests on CI. */
      workers: isCI ? 1 : Math.floor(cpus().length * 0.75),
      /* Reporter to use. See https://playwright.dev/docs/test-reporters */
      reporter: "html",
      /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
      use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL,

        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: "on-first-retry",

        ignoreHTTPSErrors:
          ignoreHTTPSErrors === undefined ? false : ignoreHTTPSErrors,

        version: version === undefined ? "Unknown" : version,
      },

      timeout: 6 * 60 * 1000,

      /* Configure projects for major browsers */
      projects: [
        {
          name: "ChromiumSmokeTest",
          use: { ...devices["Desktop Chrome"] },
          grep: /@smoke-test/,
        },

        {
          name: "Chromium",
          use: { ...devices["Desktop Chrome"] },
          grepInvert: /@smoke-test/,
        },

        {
          name: "Firefox",
          use: { ...devices["Desktop Firefox"] },
          grepInvert: /@smoke-test/,
        },

        {
          name: "Webkit",
          use: { ...devices["Desktop Safari"] },
          grepInvert: /@smoke-test/,
        },

        /* Test against mobile viewports. */
        {
          name: "MobileChrome",
          use: { ...devices["Pixel 5"] },
          grepInvert: /@keyboard|@smoke-test/,
        },
        {
          name: "MobileSafari",
          use: { ...devices["iPhone 12"] },
          grepInvert: /@keyboard|@smoke-test/,
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
      // webServer: {
      //   command: 'npm run start',
      //   url: 'http://127.0.0.1:3000',
      //   reuseExistingServer: !process.env.CI,
      // },
    },
    ...config
  );
}

export const ciBaseConfig: PlaywrightTestConfig = {
  reporter: [["blob"]],
};
