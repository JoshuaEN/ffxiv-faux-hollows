import { expect, test } from "@playwright/test";
import { GameBoardHarness } from "~/test/playwright/game-board.harness.js";

test("it should open the menu when clicking on a tile", async ({
  page,
  request,
  context,
}) => {
  // Arrange
  await page.goto(".");
  const harness = new GameBoardHarness(page.locator("html"), {
    page,
    request,
    context,
  });

  // Act
  await harness.getTileLocator(0).click();

  // Assert
  await expect(harness.getPopover()).toBeVisible();
});
test("it should close the menu when clicking on a tile when the tile's menu is open", async ({
  page,
  request,
  context,
}) => {
  // Arrange
  await page.goto(".");
  const harness = new GameBoardHarness(page.locator("html"), {
    page,
    request,
    context,
  });

  // Act
  await harness.getTileLocator(0).click();
  await expect(harness.getPopover()).toBeVisible();
  await harness.getTileLocator(0).click();

  // Assert
  await expect(harness.getPopover()).not.toBeVisible();
});
