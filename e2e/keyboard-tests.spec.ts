import { expect, Page } from "playwright/test";
import { TileState } from "~/src/game/types/tile-states.js";
import { test } from "~/test/playwright/fixtures.js";

async function repeatKey(page: Page, key: string, times: number) {
  while (times > 0) {
    times--;
    await page.keyboard.press(key);
  }
}

test.describe("General tile picker", () => {
  test("it should allow tab based navigation to specific tiles", async ({
    page,
    harness,
  }) => {
    // Act
    await repeatKey(page, "Tab", 5);

    // Assert
    await expect(harness.getTile(4).locator).toBeFocused();
  });

  test("it should allow space to open the picker and select tiles", async ({
    page,
    harness,
  }) => {
    // Act
    await page.keyboard.press("Tab");
    await page.keyboard.press("Space");
    await page.keyboard.press("Space");

    // Assert
    expect(await harness.getTile(0).tileState()).toEqual(TileState.Blocked);
  });

  test("it should allow enter to open the picker and select tiles", async ({
    page,
    harness,
  }) => {
    // Act
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");

    // Assert
    expect(await harness.getTile(0).tileState()).toEqual(TileState.Blocked);
  });
});
test.describe("Blocked tile picker", () => {
  test("it should tab to the next tile after reaching the end of the Blocked tile picker", async ({
    page,
    harness,
  }) => {
    // Act
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Assert
    await expect(harness.getTile(1).locator).toBeFocused();
  });

  test("it should close the Blocked tile picker and return to the current tile when tabbing backwards", async ({
    page,
    harness,
  }) => {
    // Act
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Shift+Tab");

    // Assert
    await expect(harness.getTile(0).locator).toBeFocused();
  });

  test("it should close the Blocked tile picker and return to the current tile when tabbing backwards (go backwards twice)", async ({
    page,
    harness,
  }) => {
    // Act
    await repeatKey(page, "Tab", 4);
    await page.keyboard.press("Enter");
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Shift+Tab");

    // Assert
    await expect(harness.getTile(2).locator).toBeFocused();
  });
});

test.describe("Primary tile picker", () => {
  test("it should tab to the next tile after reaching the end of the Primary tile picker", async ({
    page,
    harness,
  }) => {
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
    await harness.getTile(0).locator.focus();

    // Act
    await page.keyboard.press("Enter");
    await expect(harness.getPopover()).toBeVisible();
    await repeatKey(page, "Tab", 5);

    // Assert
    await expect(harness.getTile(1).locator).toBeFocused();
  });

  test("it should close the Primary tile picker and return to the current tile when tabbing backwards", async ({
    page,
    harness,
  }) => {
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
    await harness.getTile(0).locator.focus();

    // Act
    await page.keyboard.press("Enter");
    await expect(harness.getPopover()).toBeVisible();
    await page.keyboard.press("Shift+Tab");

    // Assert
    await expect(harness.getTile(0).locator).toBeFocused();
  });

  test("it should close the Primary tile picker and return to the current tile when tabbing backwards (go backwards twice)", async ({
    page,
    harness,
  }) => {
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
    await harness.getTile(0).locator.focus();

    // Act
    await repeatKey(page, "Tab", 3);
    await page.keyboard.press("Enter");
    await expect(harness.getPopover()).toBeVisible();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Shift+Tab");

    // Assert
    await expect(harness.getTile(2).locator).toBeFocused();
  });
});

test.describe('Smart Fill "tile picker"', () => {
  // There appears to be a bug (?) with playwright where it is focusing a div inside the popover,
  // even though divs shouldn't be focusable and are not in normal operation.
  // Follow-up: Create a minimal reproduction and report to playwright at some point.
  // test.skip("it should close the Smart Fill tile picker by tabbing forward", async ({
  //   page,
  //   request,
  //   context,
  // }) => {
  //   // Arrange
  //   await page.goto(".");
  //   const harness = new GameBoardHarness(page.locator("html"), {
  //     page,
  //     request,
  //     context,
  //   });
  //   await harness.actionsFromAsciiGrid(`
  //   ┌─────┬─────┬─────┬─────┬─────┬─────┐
  //   │     │     │     │     │>B1  │     │
  //   ├─────┼─────┼─────┼─────┼─────┼─────┤
  //   │     │     │     │     │     │     │
  //   ├─────┼─────┼─────┼─────┼─────┼─────┤
  //   │     │     │     │     │     │     │
  //   ├─────┼─────┼─────┼─────┼─────┼─────┤
  //   │     │     │     │     │     │     │
  //   ├─────┼─────┼─────┼─────┼─────┼─────┤
  //   │     │     │     │     │     │     │
  //   ├─────┼─────┼─────┼─────┼─────┼─────┤
  //   │     │     │     │     │     │     │
  //   └─────┴─────┴─────┴─────┴─────┴─────┘
  // `);
  //   await harness.getTile(0).locator.focus();

  //   // Act
  //   await repeatKey(page, "Tab", 7);
  //   await page.keyboard.press("Space");
  //   await expect(harness.getPopover()).toBeVisible();
  //   await page.keyboard.press("Tab");

  //   // Assert
  //   await expect(harness.getPopover()).not.toBeVisible();
  // });
  test("it should close the Smart Fill tile picker by tabbing backwards", async ({
    page,
    harness,
  }) => {
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
    await harness.getTile(0).locator.focus();

    // Act
    await repeatKey(page, "Tab", 7);
    await page.keyboard.press("Space");
    await expect(harness.getPopover()).toBeVisible();
    await page.keyboard.press("Shift+Tab");

    // Assert
    await expect(harness.getPopover()).not.toBeVisible();
  });
});

test.describe("Reset button", () => {
  const cUpPattern = `
      ID C↑
      ## 15
      ┌─────┬─────┬─────┬─────┬─────┬─────┐
      │.  1 │.  1 │. 1  │. 1  │ B   │.  1 │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │.  1 │  b  │. 11 │. 1  │.111 │.11  │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │.11  │.11  │.111 │  b  │.11  │.111 │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │.11  │.11  │.11  │.111 │*1   │.1   │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │.  1 │  b  │.111 │.111 │.11  │.11  │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │.  1 │.  1 │     │  b  │.111 │.111 │
      └─────┴─────┴─────┴─────┴─────┴─────┘
    `;
  const emptyBoard = `
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
  const filledCUpBlockedTileAndFocusResetButton = async (page: Page) => {
    await repeatKey(page, "Tab", 5);
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await repeatKey(page, "Shift+Tab", 6);
  };
  test("it should reset when using Enter", async ({ page, harness }) => {
    // Arrange
    await filledCUpBlockedTileAndFocusResetButton(page);

    // Act
    await page.keyboard.press("Enter");

    // Assert
    await expect(harness.getResetButton()).toHaveText("Undo");
    await expect(harness.getResetButton()).toBeFocused();
    await harness.assertFromAsciiGrid(emptyBoard);
  });
  test("it should reset when using Space", async ({ page, harness }) => {
    // Arrange
    await filledCUpBlockedTileAndFocusResetButton(page);

    // Act
    await page.keyboard.press("Space");

    // Assert
    await expect(harness.getResetButton()).toHaveText("Undo");
    await expect(harness.getResetButton()).toBeFocused();
    await harness.assertFromAsciiGrid(emptyBoard);
  });
  test("it should restore from reset state", async ({ page, harness }) => {
    // Arrange
    await filledCUpBlockedTileAndFocusResetButton(page);
    await page.keyboard.press("Space");

    // Act
    await page.keyboard.press("Space");

    // Assert
    await expect(harness.getResetButton()).toHaveText("Reset");
    await expect(harness.getResetButton()).toBeFocused();
    await harness.assertFromAsciiGrid(cUpPattern);
  });
  test("it should keep focus on the Reset/Undo button when toggling between them", async ({
    page,
    harness,
  }) => {
    // Arrange
    await filledCUpBlockedTileAndFocusResetButton(page);

    // Act & Assert
    await page.keyboard.press("Enter");
    await expect(harness.getResetButton()).toHaveText("Undo");
    await expect(harness.getResetButton()).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(harness.getResetButton()).toHaveText("Reset");
    await expect(harness.getResetButton()).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(harness.getResetButton()).toHaveText("Undo");
    await expect(harness.getResetButton()).toBeFocused();
    await page.keyboard.press("Enter");
    await harness.assertFromAsciiGrid(cUpPattern);
  });
});
