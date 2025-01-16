import { expect } from "@playwright/test";
import { test } from "~/test/playwright/fixtures.js";

test("it should not show the pattern by default", async ({ harness }) => {
  // Assert
  expect((await harness.getPatternData()).patternIdentifier).toEqual(null);
});

test("it should not show the pattern if not enough blocked tiles are set to find a unique pattern", async ({
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
  expect((await harness.getPatternData()).patternIdentifier).toEqual(null);
});

test("it should show pattern once enough blocked tiles are established", async ({
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
      │     │>B2  │     │     │     │     │
      ├─────┼─────┼─────┼─────┼─────┼─────┤
      │     │     │     │     │     │     │
      └─────┴─────┴─────┴─────┴─────┴─────┘
    `);

  // Assert
  expect((await harness.getPatternData()).patternIdentifier).toEqual("C↑");
});

test("it should hide pattern once enough blocked tiles are established and then one is removed", async ({
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
  harness,
}) => {
  // Assert
  expect((await harness.getPatternData()).remainingPatterns).toEqual(252);
});

test("it should filter the number of remaining patterns as more options are eliminated", async ({
  harness,
}) => {
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
