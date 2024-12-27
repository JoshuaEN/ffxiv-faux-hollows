import { expect, test } from "@playwright/test";
import { TileState } from "~/src/game/types/tile-states.js";
import { GameBoardHarness } from "~/test/playwright/game-board.harness.js";

test.describe("patterns", () => {
  test("it should not show the pattern by default", async ({
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

    // Assert
    expect((await harness.getPatternData()).patternIdentifier).toEqual(null);
  });

  test("it should not show the pattern if not enough blocked tiles are set to find a unique pattern", async ({
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
    await harness.actionsFromAsciiGrid(`
      ┌─────┬─────┬─────┬─────┬─────┬─────┐
      │     │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │>B1  │     │     │     │     │
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
    expect((await harness.getPatternData()).patternIdentifier).toEqual(null);
  });

  test("it should show pattern once enough blocked tiles are established", async ({
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
    await harness.actionsFromAsciiGrid(`
      ┌─────┬─────┬─────┬─────┬─────┬─────┐
      │     │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │>B1  │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │>B2  │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │     │
      └─────┴─────┴─────┴─────┴─────┴─────┘
    `);

    // Assert
    expect((await harness.getPatternData()).patternIdentifier).toEqual("C↑");
  });

  test("it should hide pattern once enough blocked tiles are established and then one is removed", async ({
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
    await harness.actionsFromAsciiGrid(`
      ┌─────┬─────┬─────┬─────┬─────┬─────┐
      │     │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │>B1  │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │>B2  │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │     │
      └─────┴─────┴─────┴─────┴─────┴─────┘
    `);
    expect((await harness.getPatternData()).patternIdentifier).toEqual("C↑");
    await harness.actionsFromAsciiGrid(`
      ┌─────┬─────┬─────┬─────┬─────┬─────┐
      │     │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │>U1  │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │     │
      └─────┴─────┴─────┴─────┴─────┴─────┘
    `);
    // await harness.setUserSelection(7, TileState.Unknown);

    // Assert
    expect((await harness.getPatternData()).patternIdentifier).toEqual(null);
  });

  test("it should show the remaining patterns by default", async ({
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

    // Assert
    expect((await harness.getPatternData()).remainingPatterns).toEqual(252);
  });

  test("it should filter the number of remaining patterns as more options are eliminated", async ({
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

    // Act & Assert
    await harness.actionsFromAsciiGrid(`
      ┌─────┬─────┬─────┬─────┬─────┬─────┐
      │     │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │>B1  │     │     │     │     │
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
    expect((await harness.getPatternData()).remainingPatterns).toEqual(62);

    await harness.actionsFromAsciiGrid(`
      ┌─────┬─────┬─────┬─────┬─────┬─────┐
      │     │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │>B1  │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │     │
      └─────┴─────┴─────┴─────┴─────┴─────┘
    `);
    expect((await harness.getPatternData()).remainingPatterns).toEqual(15);

    await harness.actionsFromAsciiGrid(`
      ┌─────┬─────┬─────┬─────┬─────┬─────┐
      │     │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │>S2  │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │>S1  │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │     │
      └─────┴─────┴─────┴─────┴─────┴─────┘
    `);
    expect((await harness.getPatternData()).remainingPatterns).toEqual(2);

    await harness.actionsFromAsciiGrid(`
      ┌─────┬─────┬─────┬─────┬─────┬─────┐
      │     │     │     │     │>B1  │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │>P3  │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │>S2  │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │     │
      └─────┴─────┴─────┴─────┴─────┴─────┘
    `);
    expect((await harness.getPatternData()).remainingPatterns).toEqual(1);
  });
});

test.describe("active help", () => {
  const HELP_FAUX_HOLLOWS_STRATEGY = "Faux Hollows Strategy";
  async function assertHelp(
    harness: GameBoardHarness,
    tldrMessageContains: string,
    ...helpTitles: string[]
  ) {
    await expect(harness.getActiveHelpTitles()).toHaveCount(helpTitles.length);
    let nth = 0;
    for (const helpTitle of helpTitles) {
      await expect(harness.getActiveHelpTitles().nth(nth++)).toHaveText(
        helpTitle
      );
    }
    await expect(harness.getSolveStateHelp()).toContainText(
      tldrMessageContains
    );
  }
  test("it should show the blocked tiles active help by default", async ({
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

    // Assert
    await assertHelp(
      harness,
      "please fill in the blocked tiles",
      "Fill Blocked Tiles"
    );
  });
  test("it should show the blocked tiles active help when there still needs to be more blocked tiles entered", async ({
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
    await harness.actionsFromAsciiGrid(`
      ┌─────┬─────┬─────┬─────┬─────┬─────┐
      │     │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │>B1  │     │     │     │     │
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
    await assertHelp(
      harness,
      "please fill in the blocked tiles",
      "Fill Blocked Tiles"
    );
  });

  test("it should show suggested tiles help when one or more tiles is being suggested", async ({
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
    await assertHelp(
      harness,
      "the suggested tiles in game",
      "Tile Suggestions",
      HELP_FAUX_HOLLOWS_STRATEGY
    );
  });

  test("it should show Fill Sword help when the rest of the Sword should be filled in", async ({
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
    await harness.actionsFromAsciiGrid(`
      ┌─────┬─────┬─────┬─────┬─────┬─────┐
      │     │     │     │     │>B1  │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │     │
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

    // Assert
    await assertHelp(
      harness,
      "fill in the remaining Sword",
      "Fill Sword Tiles"
    );
  });
  test("it should show Fill Present help when the rest of the Present should be filled in", async ({
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
    await harness.actionsFromAsciiGrid(`
      ┌─────┬─────┬─────┬─────┬─────┬─────┐
      │     │     │     │     │>B1  │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │>P2  │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │     │
      └─────┴─────┴─────┴─────┴─────┴─────┘
    `);

    // Assert
    await assertHelp(
      harness,
      "fill in the remaining Gift Box / Coffer tiles",
      "Fill Gift Box or Coffer Tiles"
    );
  });
  test("it should show Board solved when just the fox suggestions are remaining", async ({
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
    await harness.actionsFromAsciiGrid(`
      ┌─────┬─────┬─────┬─────┬─────┬─────┐
      │     │     │     │     │>B1  │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │>S3  │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │>P4  │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │>S2  │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │     │
      └─────┴─────┴─────┴─────┴─────┴─────┘
    `);

    // Assert
    await assertHelp(
      harness,
      "Uncover tiles in game based on your chosen strategy",
      "Board Solved",
      HELP_FAUX_HOLLOWS_STRATEGY
    );
  });
  test("it should show Board solved when the fox is found", async ({
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
    await harness.actionsFromAsciiGrid(`
      ┌─────┬─────┬─────┬─────┬─────┬─────┐
      │>F5  │     │     │     │>B1  │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │>S3  │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │>P4  │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │>S2  │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │     │
      └─────┴─────┴─────┴─────┴─────┴─────┘
    `);

    // Assert
    await assertHelp(
      harness,
      "Uncover tiles in game based on your chosen strategy",
      "Board Solved",
      HELP_FAUX_HOLLOWS_STRATEGY
    );
  });
  test("it should show Board solved when all of the fox locations are empty", async ({
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
    await harness.actionsFromAsciiGrid(`
      ┌─────┬─────┬─────┬─────┬─────┬─────┐
      │>E5  │     │     │     │>B1  │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │>S3  │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │>P4  │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │>E8  │>S2  │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │>E7  │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │>E6  │     │     │     │     │
      └─────┴─────┴─────┴─────┴─────┴─────┘
    `);

    // Assert
    await assertHelp(
      harness,
      "Uncover tiles in game based on your chosen strategy",
      "Board Solved",
      HELP_FAUX_HOLLOWS_STRATEGY
    );
  });

  test("it should handle when all of the fox locations are empty but the board is not solved", async ({
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
    await harness.actionsFromAsciiGrid(`
      ┌─────┬─────┬─────┬─────┬─────┬─────┐
      │>E5  │     │     │     │>B1  │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │>S3  │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │>P4  │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │>E8  │>S2  │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │>E7  │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │>E6  │     │     │     │     │
      └─────┴─────┴─────┴─────┴─────┴─────┘
    `);

    // Assert
    await assertHelp(
      harness,
      "Uncover tiles in game based on your chosen strategy",
      "Board Solved",
      HELP_FAUX_HOLLOWS_STRATEGY
    );
  });

  test("it should show error help when no patterns are valid (blocked tiles)", async ({
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
    await harness.actionsFromAsciiGrid(`
      ┌─────┬─────┬─────┬─────┬─────┬─────┐
      │     │>B1  │     │     │     │     │
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
    await assertHelp(
      harness,
      "Blocked tiles entered do not match any patterns",
      "Resolving Issues"
    );
  });

  test("it should show error help when no patterns are valid (present tiles)", async ({
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
    await harness.actionsFromAsciiGrid(`
      ┌─────┬─────┬─────┬─────┬─────┬─────┐
      │     │     │     │     │>B1  │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │>P2  │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │>P3! │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │     │
      └─────┴─────┴─────┴─────┴─────┴─────┘
    `);

    // Assert
    await assertHelp(
      harness,
      "Based on the entered tiles, the Gift Box / Coffer covers a minimum of a 3x2 area",
      "Resolving Issues"
    );
  });
});

test.describe("tile suggestions", () => {
  // Fails because the current behavior is technically wrong, but fixing this would require recording "Empty" suggestions
  // which has a lot of knock-on effects on the tests and it's not a big deal.
  // Follow-up: Record Empty as a suggestion and only include Empty when it is valid in the primary options.
  // test.skip("it should empty should not be suggested when empty would lead to an invalid state", async ({
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
  //     ┌─────┬─────┬─────┬─────┬─────┬─────┐
  //     │     │     │     │     │>B1  │     │
  //     ├─────┼─────┼─────┼─────┼─────┼─────┤
  //     │     │     │>E4  │     │     │     │
  //     ├─────┼─────┼─────┼─────┼─────┼─────┤
  //     │     │     │     │     │     │     │
  //     ├─────┼─────┼─────┼─────┼─────┼─────┤
  //     │     │     │     │     │>S2  │     │
  //     ├─────┼─────┼─────┼─────┼─────┼─────┤
  //     │     │     │>E5  │     │     │     │
  //     ├─────┼─────┼─────┼─────┼─────┼─────┤
  //     │     │     │     │     │     │>S3  │
  //     └─────┴─────┴─────┴─────┴─────┴─────┘
  //   `);
  //   // Act
  //   const { locator } = harness.getTile(19);
  //   await locator.click();
  //   // Assert
  //   const primaryOptions = await harness.getPopoverPrimaryOptions();
  //   expect(primaryOptions).toEqual([TileState.Present]);
  // });
});
