import { expect, test } from "@playwright/test";
import { TileState } from "~/src/game/types/tile-states.js";
import { GameBoardHarness } from "~/test/playwright/game-board.harness.js";

test("it should open the menu when clicking on a blank tile", async ({
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
test("it should focus the first button after opening the menu", async ({
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
  await expect(harness.getPopover().locator("button").first()).toBeFocused();
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
  await harness.getTileLocator(0).click();
  await expect(harness.getPopover()).toBeVisible();

  // Act
  await harness.getTileLocator(0).click();

  // Assert
  await expect(harness.getPopover()).not.toBeVisible();
});

test("it should close the menu when clicking on the background when the menu is open (regression test)", async ({
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
  await harness.getTileLocator(0).click();
  await expect(harness.getPopover()).toBeVisible();

  // Act
  await page.locator("body").click({ position: { x: 1, y: 1 } });

  // Assert
  await expect(harness.getPopover()).not.toBeVisible();
});

test('it should close the menu when clicking on the background after open two different tile menus in a row (tile menu is never really "closed") (regression test)', async ({
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
  await harness.getTileLocator(0).click();
  await expect(harness.getPopover()).toBeVisible();
  await harness.getTileLocator(5).click();
  await expect(harness.getPopover()).toBeVisible();

  // Act
  await page.locator("body").click({ position: { x: 1, y: 1 } });

  // Assert
  await expect(harness.getPopover()).not.toBeVisible();
});

test("it should re-open the menu when clicking on a different tile than the tile of the currently opened menu", async ({
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
  await harness.getTileLocator(0).click();
  await expect(harness.getPopover()).toBeVisible();

  // Act
  await harness.getTileLocator(1).click();

  // Assert
  await expect(harness.getPopover()).toBeVisible();
});

test("it should re-open the menu when clicking on a different tile than the tile of the currently opened menu when in FillSword (regression test)", async ({
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
  await harness.setUserSelection(7, TileState.Blocked);
  await harness.setUserSelection(25, TileState.Blocked);
  await harness.setUserSelection(22, TileState.Sword);

  // Act
  await harness.getTileLocator(22).click();
  await expect(harness.getPopover()).toBeVisible();
  await harness.getTileLocator(21).click();

  // Assert
  await expect(harness.getPopover()).toBeVisible();
});
