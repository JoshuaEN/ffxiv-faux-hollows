import { expect, Locator, Page } from "playwright/test";
import { TileState } from "~/src/game/types/tile-states.js";
import { test } from "~/test/playwright/fixtures.js";
import { GameBoardHarness } from "~/test/playwright/game-board.harness.js";

async function repeatKey(
  harness: GameBoardHarness,
  key: string,
  focusedAfter: Locator[]
) {
  for (const locator of focusedAfter) {
    await harness.keyPress(key, locator);
  }
}

const tag = "@keyboard";
const focusLost = "body";

test.describe("General tile picker", { tag }, () => {
  test("it should allow tab based navigation to specific tiles", async ({
    harness,
  }) => {
    // Act
    await repeatKey(harness, "Tab", [
      harness.getTileLocator(0),
      harness.getTileLocator(1),
      harness.getTileLocator(2),
      harness.getTileLocator(3),
      harness.getTileLocator(4),
    ]);

    // Assert
    await expect(harness.getTileLocator(4)).toBeFocused();
  });

  test("it should allow space to open the picker and select tiles", async ({
    page,
    harness,
  }) => {
    // Act
    await harness.keyPress("Tab", harness.getTileLocator(0));
    await harness.keyPress(
      "Space",
      harness.getPopoverButton(0, TileState.Blocked)
    );
    await harness.keyPress("Space", page.locator(focusLost));

    // Assert
    expect(await harness.getTile(0).tileState()).toEqual(TileState.Blocked);
  });

  test("it should allow enter to open the picker and select tiles", async ({
    page,
    harness,
  }) => {
    // Act
    await harness.keyPress("Tab", harness.getTileLocator(0));
    await harness.keyPress(
      "Enter",
      harness.getPopoverButton(0, TileState.Blocked)
    );
    await harness.keyPress("Enter", page.locator(focusLost));

    // Assert
    expect(await harness.getTile(0).tileState()).toEqual(TileState.Blocked);
  });
});
test.describe("Blocked tile picker", { tag }, () => {
  test("it should tab to the next tile after reaching the end of the Blocked tile picker", async ({
    harness,
  }) => {
    // Act
    await harness.keyPress("Tab", harness.getTileLocator(0));
    await harness.keyPress(
      "Enter",
      harness.getPopoverButton(0, TileState.Blocked)
    );
    await harness.keyPress(
      "Tab",
      harness.getPopoverButton(0, TileState.Unknown)
    );
    await harness.keyPress("Tab", harness.getTileLocator(1));

    // Assert
    await expect(harness.getTileLocator(1)).toBeFocused();
  });

  test("it should close the Blocked tile picker and return to the current tile when tabbing backwards", async ({
    harness,
  }) => {
    // Act
    await harness.keyPress("Tab", harness.getTileLocator(0));
    await harness.keyPress(
      "Enter",
      harness.getPopoverButton(0, TileState.Blocked)
    );
    await harness.keyPress("Shift+Tab", harness.getTileLocator(0));

    // Assert
    await expect(harness.getTileLocator(0)).toBeFocused();
  });

  test("it should close the Blocked tile picker and return to the current tile when tabbing backwards (go backwards twice)", async ({
    harness,
  }) => {
    // Act
    await repeatKey(harness, "Tab", [
      harness.getTileLocator(0),
      harness.getTileLocator(1),
      harness.getTileLocator(2),
      harness.getTileLocator(3),
    ]);
    await harness.keyPress(
      "Enter",
      harness.getPopoverButton(3, TileState.Blocked)
    );
    await harness.keyPress("Shift+Tab", harness.getTileLocator(3));
    await harness.keyPress("Shift+Tab", harness.getTileLocator(2));

    // Assert
    await expect(harness.getTileLocator(2)).toBeFocused();
  });
});

test.describe("Primary tile picker", { tag }, () => {
  test("it should tab to the next tile after reaching the end of the Primary tile picker", async ({
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
    await harness.getTileLocator(0).focus();

    // Act
    await harness.keyPress(
      "Enter",
      harness.getPopoverButton(0, TileState.Empty)
    );
    await harness.assertOnePopoverOpen(0);
    await repeatKey(harness, "Tab", [
      harness.getPopoverButton(0, TileState.Sword),
      harness.getPopoverButton(0, TileState.Present),
      harness.getPopoverButton(0, TileState.Unknown),
      harness.getPopoverButton(0, TileState.Fox),
      harness.getTileLocator(1),
    ]);

    // Assert
    await expect(harness.getTileLocator(1)).toBeFocused();
  });

  test("it should close the Primary tile picker and return to the current tile when tabbing backwards", async ({
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
    await harness.getTileLocator(0).focus();

    // Act
    await harness.keyPress(
      "Enter",
      harness.getPopoverButton(0, TileState.Empty)
    );
    await harness.assertOnePopoverOpen(0);
    await harness.keyPress("Shift+Tab", harness.getTileLocator(0));

    // Assert
    await expect(harness.getTileLocator(0)).toBeFocused();
  });

  test("it should close the Primary tile picker and return to the current tile when tabbing backwards (go backwards twice)", async ({
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
    await harness.getTileLocator(0).focus();

    // Act
    await repeatKey(harness, "Tab", [
      harness.getTileLocator(1),
      harness.getTileLocator(2),
      harness.getTileLocator(3),
    ]);
    await harness.keyPress(
      "Enter",
      harness.getPopoverButton(3, TileState.Empty)
    );
    await harness.assertOnePopoverOpen(3);
    await harness.keyPress("Shift+Tab", harness.getTileLocator(3));
    await harness.keyPress("Shift+Tab", harness.getTileLocator(2));

    // Assert
    await expect(harness.getTileLocator(2)).toBeFocused();
  });
});

test.describe('Smart Fill "tile picker"', { tag }, () => {
  // There appears to be a bug (?) with playwright where it is focusing a div inside the popover,
  // even though divs shouldn't be focusable and are not in normal operation.
  // Follow-up: Create a minimal reproduction and report to playwright at some point.
  test("it should close the Smart Fill tile picker by tabbing forward", async ({
    page,
    request,
    context,
  }, testInfo) => {
    // Works correctly in webkit
    test.fail(testInfo.project.name !== "Webkit");

    // Arrange
    await page.goto(".");
    const harness = new GameBoardHarness(page.locator("html"), {
      page,
      request,
      context,
    });
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
    await harness.getTileLocator(0).focus();

    // Act
    await repeatKey(harness, "Tab", [
      harness.getTileLocator(1),
      harness.getTileLocator(2),
      harness.getTileLocator(3),
      harness.getTileLocator(4),
      harness.getTileLocator(5),
      harness.getTileLocator(6),
      harness.getTileLocator(7),
    ]);
    await harness.keyPress("Space", harness.getPopover(7));
    await harness.assertOnePopoverOpen(7);
    await harness.keyPress("Tab", harness.getTileLocator(8));

    // Assert
    await harness.assertPopoverClosed();
  });
  test("it should close the Smart Fill tile picker by tabbing backwards", async ({
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
    await harness.getTileLocator(0).focus();

    // Act
    await repeatKey(harness, "Tab", [
      harness.getTileLocator(1),
      harness.getTileLocator(2),
      harness.getTileLocator(3),
      harness.getTileLocator(4),
      harness.getTileLocator(5),
      harness.getTileLocator(6),
      harness.getTileLocator(7),
    ]);
    await harness.keyPress("Space", harness.getPopover(7));
    await harness.assertOnePopoverOpen(7);
    await harness.keyPress("Shift+Tab", harness.getTileLocator(7));

    // Assert
    await harness.assertPopoverClosed();
  });
});

test.describe("Reset button", { tag }, () => {
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
  const filledCUpBlockedTileAndFocusResetButton = async (
    page: Page,
    harness: GameBoardHarness
  ) => {
    await repeatKey(harness, "Tab", [
      harness.getTileLocator(0),
      harness.getTileLocator(1),
      harness.getTileLocator(2),
      harness.getTileLocator(3),
      harness.getTileLocator(4),
    ]);
    await harness.keyPress(
      "Enter",
      harness.getPopoverButton(4, TileState.Blocked)
    );
    await harness.assertOnePopoverOpen(4);
    await harness.keyPress("Enter", page.locator(focusLost));
    await repeatKey(harness, "Shift+Tab", [
      harness.getTileLocator(4),
      harness.getTileLocator(3),
      harness.getTileLocator(2),
      harness.getTileLocator(1),
      harness.getTileLocator(0),
      harness.getResetButton(),
    ]);
  };
  test("it should reset when using Enter", async ({ page, harness }) => {
    // Arrange
    await filledCUpBlockedTileAndFocusResetButton(page, harness);

    // Act
    await harness.keyPress("Enter", harness.getResetButton());

    // Assert
    await expect(harness.getResetButton()).toHaveText("Undo");
    await expect(harness.getResetButton()).toBeFocused();
    await harness.assertFromAsciiGrid(emptyBoard);
  });
  test("it should reset when using Space", async ({ page, harness }) => {
    // Arrange
    await filledCUpBlockedTileAndFocusResetButton(page, harness);

    // Act
    await harness.keyPress("Space", harness.getResetButton());

    // Assert
    await expect(harness.getResetButton()).toHaveText("Undo");
    await expect(harness.getResetButton()).toBeFocused();
    await harness.assertFromAsciiGrid(emptyBoard);
  });
  test("it should restore from reset state", async ({ page, harness }) => {
    // Arrange
    await filledCUpBlockedTileAndFocusResetButton(page, harness);
    await harness.keyPress("Space", harness.getResetButton());

    // Act
    await harness.keyPress("Space", harness.getResetButton());

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
    await filledCUpBlockedTileAndFocusResetButton(page, harness);

    // Act & Assert
    await harness.keyPress("Enter", harness.getResetButton());
    await expect(harness.getResetButton()).toHaveText("Undo");
    await harness.keyPress("Enter", harness.getResetButton());
    await expect(harness.getResetButton()).toHaveText("Reset");
    await harness.keyPress("Enter", harness.getResetButton());
    await expect(harness.getResetButton()).toHaveText("Undo");
    await harness.keyPress("Enter", harness.getResetButton());
    await harness.assertFromAsciiGrid(cUpPattern);
  });
});
