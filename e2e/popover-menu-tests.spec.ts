import { expect } from "@playwright/test";
import { TileState } from "~/src/game/types/tile-states.js";
import { test } from "~/test/playwright/fixtures.js";

test("it should open the menu when clicking on a blank tile", async ({
  harness,
}) => {
  // Act
  await harness.getTileLocator(0).click();

  // Assert
  await harness.assertOnePopoverOpen(0);
});
test("it should focus the first button after opening the menu", async ({
  harness,
}) => {
  // Act
  await harness.getTileLocator(0).click();

  // Assert
  await harness.assertOnePopoverOpen(0);
  await expect(harness.getPopover(0).locator("button").first()).toBeFocused();
});
test("it should close the menu when clicking on a tile when the tile's menu is open", async ({
  harness,
}) => {
  await harness.getTileLocator(0).click();
  await harness.assertOnePopoverOpen(0);

  // Act
  await harness.getTileLocator(0).click();

  // Assert
  await harness.assertPopoverClosed();
});

test("it should close the menu when clicking on the background when the menu is open (regression test)", async ({
  page,
  harness,
}) => {
  await harness.getTileLocator(0).click();
  await harness.assertOnePopoverOpen(0);

  // Act
  await page.locator("body").click({ position: { x: 1, y: 1 } });

  // Assert
  await harness.assertPopoverClosed();
});

test('it should close the menu when clicking on the background after open two different tile menus in a row (tile menu is never really "closed") (regression test)', async ({
  page,
  harness,
}) => {
  await harness.getTileLocator(0).click();
  await harness.assertOnePopoverOpen(0);
  await harness.getTileLocator(5).click();
  await harness.assertOnePopoverOpen(5);

  // Act
  await page.locator("body").click({ position: { x: 1, y: 1 } });

  // Assert
  await harness.assertPopoverClosed();
});

test("it should re-open the menu when clicking on a different tile than the tile of the currently opened menu", async ({
  harness,
}) => {
  await harness.getTileLocator(0).click();
  await harness.assertOnePopoverOpen(0);

  // Act
  await harness.getTileLocator(1).click();

  // Assert
  await harness.assertOnePopoverOpen(1);
});

test("it should re-open the menu when clicking on a different tile than the tile of the currently opened menu when in FillSword (regression test)", async ({
  harness,
}) => {
  await harness.setUserSelection(7, TileState.Blocked);
  await harness.setUserSelection(25, TileState.Blocked);
  await harness.setUserSelection(22, TileState.Sword);

  // Act
  await harness.getTileLocator(22).click();
  await harness.assertOnePopoverOpen(22);
  await harness.getTileLocator(21).click();

  // Assert
  await harness.assertOnePopoverOpen(21);
});
