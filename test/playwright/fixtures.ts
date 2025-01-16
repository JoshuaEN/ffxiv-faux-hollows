import { test as base } from "@playwright/test";
import { GameBoardHarness } from "./game-board.harness.js";

interface Fixtures {
  harness: GameBoardHarness;
}

export const test = base.extend<Fixtures>({
  harness: async ({ page, request, context }, use) => {
    await page.goto(".");
    const harness = new GameBoardHarness(page.locator("html"), {
      page,
      request,
      context,
    });
    await use(harness);
  },
});
