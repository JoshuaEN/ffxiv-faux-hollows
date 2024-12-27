import { test } from "@playwright/test";
import { allTestData } from "~/test/all-data-tests.js";
import { TestTag } from "~/test/framework.js";
import { GameBoardHarness } from "~/test/playwright/game-board.harness.js";

allTestData(
  (ops, ...states) => {
    const { title, tags } =
      typeof ops === "string" ? { title: ops, tags: [] } : ops;
    const runTest =
      tags.includes(TestTag.ImpossibleUIState) === false &&
      tags.includes(TestTag.InvalidUIState) === false;

    if (runTest !== true) {
      return;
    }

    test(title, async ({ page, request, context }) => {
      await page.goto(".");
      await new GameBoardHarness(page.locator("html"), {
        page,
        request,
        context,
      }).testSequence(states);
    });
  },
  { describe: test.describe }
);
