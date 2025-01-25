import { ciBaseConfig, defineConfig } from "./test/playwright/define-config.js";

const baseURL = process.env["PW_BASE_URL"];
if (baseURL === undefined) {
  throw new Error(`Missing PW_BASE_URL env variable`);
}

console.log("Targeting", baseURL);

const version = process.env["PW_APP_VERSION"];
if (version === undefined) {
  throw new Error(`Missing PW_APP_VERSION env variable`);
}

console.log("Expected version", version);

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({ baseURL, version }, ciBaseConfig);
