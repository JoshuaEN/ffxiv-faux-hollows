import { expect, test } from "@playwright/test";
import { TileState } from "~/src/game/types/tile-states.js";
import { GameBoardHarness } from "~/test/playwright/game-board.harness.js";

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
  await harness.setUserSelection(7, TileState.Blocked);

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
  await harness.setUserSelection(7, TileState.Blocked);
  await harness.setUserSelection(25, TileState.Blocked);

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
  await harness.setUserSelection(7, TileState.Blocked);
  await harness.setUserSelection(25, TileState.Blocked);
  expect((await harness.getPatternData()).patternIdentifier).toEqual("C↑");
  await harness.setUserSelection(7, TileState.Unknown);

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
  await harness.setUserSelection(7, TileState.Blocked);
  expect((await harness.getPatternData()).remainingPatterns).toEqual(62);
  await harness.setUserSelection(25, TileState.Blocked);
  expect((await harness.getPatternData()).remainingPatterns).toEqual(15);
  await harness.setUserSelection(11, TileState.Sword);
  expect((await harness.getPatternData()).remainingPatterns).toEqual(2);
  await harness.setUserSelection(12, TileState.Present);
  expect((await harness.getPatternData()).remainingPatterns).toEqual(1);
});
