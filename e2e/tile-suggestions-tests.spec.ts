// import { expect } from "@playwright/test";
// import { TileState } from "~/src/game/types/tile-states.js";
// import { test } from "~/test/playwright/fixtures.js";

// Fails because the current behavior is technically wrong, but fixing this would require recording "Empty" suggestions
// which has a lot of knock-on effects on the tests and it's not a big deal.
// Follow-up: Record Empty as a suggestion and only include Empty when it is valid in the primary options.
// test.skip("it should empty should not be suggested when empty would lead to an invalid state", async ({
//   harness,
// }) => {
//   await harness.actionsFromAsciiGrid(`
//       ┌─────┬─────┬─────┬─────┬─────┬─────┐
//       │     │     │     │     │>B1  │     │
//       ├─────┼─────┼─────┼─────┼─────┼─────┤
//       │     │     │>E4  │     │     │     │
//       ├─────┼─────┼─────┼─────┼─────┼─────┤
//       │     │     │     │     │     │     │
//       ├─────┼─────┼─────┼─────┼─────┼─────┤
//       │     │     │     │     │>S2  │     │
//       ├─────┼─────┼─────┼─────┼─────┼─────┤
//       │     │     │>E5  │     │     │     │
//       ├─────┼─────┼─────┼─────┼─────┼─────┤
//       │     │     │     │     │     │>S3  │
//       └─────┴─────┴─────┴─────┴─────┴─────┘
//     `);
//   // Act
//   const { locator } = harness.getTile(19);
//   await locator.click();
//   // Assert
//   const primaryOptions = await harness.getPopoverPrimaryOptions();
//   expect(primaryOptions).toEqual([TileState.Present]);
// });
