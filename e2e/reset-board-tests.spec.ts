import { expect } from "@playwright/test";
import { test } from "~/test/playwright/fixtures.js";
const EMPTY_BOARD = `
    ## 252
    ┌─────┬─────┬─────┬─────┬─────┬─────┐
    │     │     │     │     │     │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │     │     │     │     │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │     │     │     │     │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │     │     │     │     │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │     │     │     │     │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │     │     │     │     │     │
    └─────┴─────┴─────┴─────┴─────┴─────┘
  `;
test("it should not show the reset button by default", async ({ harness }) => {
  // Assert
  await expect(harness.getResetButton()).not.toBeVisible();
});

test("it should show the reset button after selecting a tile", async ({
  harness,
}) => {
  // Act
  await harness.actionsFromAsciiGrid(`
    ┌─────┬─────┬─────┬─────┬─────┬─────┐
    │     │     │     │     │>B1  │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │     │     │     │     │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │     │     │     │     │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │     │     │     │     │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │     │     │     │     │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │     │     │     │     │     │
    └─────┴─────┴─────┴─────┴─────┴─────┘
  `);

  // Assert
  await expect(harness.getResetButton()).toHaveText("Reset");
});

test("it should reset game state when clicking the reset button and change the reset button to undo", async ({
  harness,
}) => {
  // Arrange
  await harness.actionsFromAsciiGrid(`
    ┌─────┬─────┬─────┬─────┬─────┬─────┐
    │     │     │     │     │>B1  │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │     │     │     │     │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │     │     │     │     │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │     │     │     │     │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │     │     │     │     │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │     │     │     │     │     │
    └─────┴─────┴─────┴─────┴─────┴─────┘
  `);

  // Act
  await harness.getResetButton().click();

  // Assert
  await harness.assertFromAsciiGrid(EMPTY_BOARD);
  await expect(harness.getResetButton()).toHaveText("Undo");
});

test("it should return to the original state and return the reset button after Undoing the reset", async ({
  harness,
}) => {
  // Arrange
  const filledBoard = `
    ID C↑
    ## 2
    ┌─────┬─────┬─────┬─────┬─────┬─────┐
    │?f  1│     │     │     │ B   │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │  b  │     │     │  s  │ S   │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │* 1  │* 1  │     │  b  │  s  │  s  │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │* 1  │* 1  │     │?f  1│ S   │  s  │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │  b  │     │?f  1│* 1  │* 1  │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │?f  1│     │  b  │* 1  │* 1  │
    └─────┴─────┴─────┴─────┴─────┴─────┘
  `;
  await harness.actionsFromAsciiGrid(`
    ┌─────┬─────┬─────┬─────┬─────┬─────┐
    │     │     │     │     │>B1  │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │     │     │     │     │>S3  │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │     │     │     │     │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │     │     │     │>S2  │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │     │     │     │     │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │     │     │     │     │     │
    └─────┴─────┴─────┴─────┴─────┴─────┘
  `);
  await harness.assertFromAsciiGrid(filledBoard);

  await harness.getResetButton().click();
  await harness.assertFromAsciiGrid(EMPTY_BOARD);

  // Act
  await expect(harness.getResetButton()).toHaveText("Undo");
  await harness.getResetButton().click();

  // Assert
  await harness.assertFromAsciiGrid(filledBoard);
  await expect(harness.getResetButton()).toHaveText("Reset");
});

test("it should switch back to Reset after undoing and then taking an action", async ({
  harness,
}) => {
  // Arrange
  const expectedState = `
    ID C↑
    ## 2
    ┌─────┬─────┬─────┬─────┬─────┬─────┐
    │?f  1│     │     │     │ B   │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │  b  │     │     │  s  │ S   │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │* 1  │* 1  │     │  b  │  s  │  s  │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │* 1  │* 1  │     │?f  1│ S   │  s  │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │  b  │     │?f  1│* 1  │* 1  │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │?f  1│     │  b  │* 1  │* 1  │
    └─────┴─────┴─────┴─────┴─────┴─────┘
  `;
  await harness.actionsFromAsciiGrid(`
    ┌─────┬─────┬─────┬─────┬─────┬─────┐
    │     │     │     │     │>B1  │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │     │     │     │     │>S3  │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │     │     │     │     │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │     │     │     │>S2  │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │     │     │     │     │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │     │     │     │     │     │
    └─────┴─────┴─────┴─────┴─────┴─────┘
  `);
  await harness.assertFromAsciiGrid(expectedState);

  await harness.getResetButton().click();
  await harness.assertFromAsciiGrid(EMPTY_BOARD);

  // Act
  await harness.getResetButton().click();

  // Assert
  await harness.assertFromAsciiGrid(expectedState);
  await expect(harness.getResetButton()).toHaveText("Reset");
});

test("it should work correctly when repeatedly resetting and then undoing", async ({
  harness,
}) => {
  // Arrange
  const expectedStateBeforeReset = `
    ID C↑
    ## 2
    ┌─────┬─────┬─────┬─────┬─────┬─────┐
    │?f  1│     │     │     │ B   │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │  b  │     │     │  s  │ S   │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │* 1  │* 1  │     │  b  │  s  │  s  │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │* 1  │* 1  │     │?f  1│ S   │  s  │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │  b  │     │?f  1│* 1  │* 1  │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │?f  1│     │  b  │* 1  │* 1  │
    └─────┴─────┴─────┴─────┴─────┴─────┘
  `;
  await harness.actionsFromAsciiGrid(`
    ┌─────┬─────┬─────┬─────┬─────┬─────┐
    │     │     │     │     │>B1  │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │     │     │     │     │>S3  │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │     │     │     │     │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │     │     │     │>S2  │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │     │     │     │     │     │
    ├─────┼─────┼─────┼─────┼─────┼─────┤
    │     │     │     │     │     │     │
    └─────┴─────┴─────┴─────┴─────┴─────┘
  `);

  // Act & Assert
  for (let i = 0; i < 3; i++) {
    await harness.assertFromAsciiGrid(expectedStateBeforeReset);
    await harness.getResetButton().click();
    await harness.assertFromAsciiGrid(EMPTY_BOARD);
    await harness.getResetButton().click();
  }
  await harness.assertFromAsciiGrid(expectedStateBeforeReset);
});
