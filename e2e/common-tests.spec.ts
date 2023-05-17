import { test } from "@playwright/test";
import { allTestData } from "~/test/all-data-tests.js";
import { GameBoardHarness } from "~/test/playwright/game-board.harness.js";

test.describe("GameBoard.vue Component Tests", () => {
  test.describe("Common Test Set", () => {
    allTestData(
      (title, ...states) =>
        test(title, async ({ page, request, context }) => {
          await page.goto(".");
          await new GameBoardHarness(page.locator("html"), {
            page,
            request,
            context,
          }).testSequence(states);
        }),
      { describe: test.describe }
    );
  });
});
