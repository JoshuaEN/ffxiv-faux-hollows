import { defineConfig } from "./test/playwright/define-config.js";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({ baseURL: "http://localhost:5173" });
