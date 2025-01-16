import { expect } from "@playwright/test";
import { test } from "~/test/playwright/fixtures.js";
import { GameBoardHarness } from "~/test/playwright/game-board.harness.js";

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
  await expect(harness.getSolveStateHelp()).toContainText(tldrMessageContains);
}
test("it should show the blocked tiles active help by default", async ({
  harness,
}) => {
  // Assert
  await assertHelp(
    harness,
    "please fill in the blocked tiles",
    "Fill Blocked Tiles"
  );
});
test("it should show the blocked tiles active help when there still needs to be more blocked tiles entered", async ({
  harness,
}) => {
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
  await assertHelp(
    harness,
    "the suggested tiles in game",
    "Tile Suggestions",
    HELP_FAUX_HOLLOWS_STRATEGY
  );
});

test("it should show Fill Sword help when the rest of the Sword should be filled in", async ({
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
      │     │     │     │     │>S2  │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │     │
      └─────┴─────┴─────┴─────┴─────┴─────┘
    `);

  // Assert
  await assertHelp(harness, "fill in the remaining Sword", "Fill Sword Tiles");
});
test("it should show Fill Present help when the rest of the Present should be filled in", async ({
  harness,
}) => {
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
  harness,
}) => {
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
  harness,
}) => {
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
  harness,
}) => {
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
  harness,
}) => {
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
  harness,
}) => {
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
  harness,
}) => {
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
