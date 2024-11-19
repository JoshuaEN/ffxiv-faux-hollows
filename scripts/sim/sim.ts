// import { communityDataByIdentifier } from "../../src/game/generated-community-data.js";
// import {
//   CombinedTileState,
//   SmartFillTileState,
//   TileState,
// } from "../../src/game/types/tile-states.js";
// import { randomInt } from "node:crypto";
// import { assert, assertLengthAtLeast, assertNever } from "../../src/helpers.js";
// import { Board } from "../../src/game/board.js";
// import { getCommunityDataPatternBoundingBox } from "../../src/game/solver/helpers.js";
// import { Decimal } from "decimal.js";
// import { CommunityDataPattern } from "~/src/game/types/community-data.js";
// import { solveAllPatterns } from "~/test/auto-solver/auto-solver.js";
// import { stringifyAutoSolveResults } from "~/test/auto-solver/formatter.js";

// import fs from "node:fs";
// import { join, dirname } from "path";
// import { fileURLToPath } from "url";
// const actual = solveAllPatterns();

// // const SAMPLES = 1000;
// const SAMPLES = 1_000_000;

// // How likely foxes are to appear.
// // 1 = always
// // 4 = 1/4 of the time
// const FOX_FACTOR = 4;

// interface Result {
//   stepsTo: {
//     [TileState.Sword]: number;
//     [TileState.Present]: number;
//     [TileState.Fox]: number | undefined;
//     totalSteps: number;
//   };
//   steps: { index: number; state: TileState; stepNumber: number }[];
//   totalStepsToUncover: number;
//   testCaseKey: string;
//   testPatternIndex: number;
//   testPattern: CommunityDataPattern;
//   testFoxIndex: number | undefined;
// }
// const resultTotals = {
//   [TileState.Sword]: BigInt(0),
//   [TileState.Present]: BigInt(0),
//   [TileState.Fox]: BigInt(0),
//   totalSteps: BigInt(0),
// };
// interface ResultCase {
//   key: string;
//   index: number;
//   resultIndex: number;
// }
// const resultMax = {
//   [TileState.Sword]: { steps: -1, cases: [] as ResultCase[] },
//   [TileState.Present]: { steps: -1, cases: [] as ResultCase[] },
//   [TileState.Fox]: { steps: -1, cases: [] as ResultCase[] },
//   totalSteps: { steps: -1, cases: [] as ResultCase[] },
// };
// const resultMin = {
//   [TileState.Sword]: {
//     steps: Number.MAX_SAFE_INTEGER,
//     cases: [] as ResultCase[],
//   },
//   [TileState.Present]: {
//     steps: Number.MAX_SAFE_INTEGER,
//     cases: [] as ResultCase[],
//   },
//   [TileState.Fox]: {
//     steps: Number.MAX_SAFE_INTEGER,
//     cases: [] as ResultCase[],
//   },
//   totalSteps: { steps: Number.MAX_SAFE_INTEGER, cases: [] as ResultCase[] },
// };

// const results: Result[] = [];

// let resultsLen = 0;
// let resultsWithFoxLen = 0;

// const flattenedCommunityData = Object.entries(
//   communityDataByIdentifier
// ).flatMap(([key, value]) => ({ ...value, key }));

// for (let sample = 0; sample < SAMPLES; sample++) {
//   const chosenTestCaseIndex = randomInt(0, flattenedCommunityData.length);
//   const chosenTestCase = flattenedCommunityData[chosenTestCaseIndex];
//   assert(chosenTestCase !== undefined);
//   const chosenPatternIndex = randomInt(0, chosenTestCase.Patterns.length);
//   const chosenPattern = chosenTestCase.Patterns[chosenPatternIndex];
//   assert(chosenPattern !== undefined);

//   const chosenFoxIndexIndex =
//     chosenPattern.ConfirmedFoxes.length > 0
//       ? randomInt(0, chosenPattern.ConfirmedFoxes.length * FOX_FACTOR)
//       : undefined;
//   const chosenFoxIndex =
//     chosenFoxIndexIndex === undefined
//       ? undefined
//       : chosenPattern.ConfirmedFoxes[chosenFoxIndexIndex];

//   const patternIndexes = {
//     [TileState.Sword]: getCommunityDataPatternBoundingBox(
//       chosenPattern,
//       TileState.Sword
//     ).indexes(),
//     [TileState.Present]: getCommunityDataPatternBoundingBox(
//       chosenPattern,
//       TileState.Present
//     ).indexes(),
//   } as const;

//   const actualTile = new Map<
//     number,
//     TileState.Sword | TileState.Present | TileState.Fox
//   >();
//   if (chosenFoxIndex !== undefined) {
//     actualTile.set(chosenFoxIndex, TileState.Fox);
//   }
//   for (const state of [TileState.Sword, TileState.Present] as const) {
//     for (const index of patternIndexes[state]) {
//       actualTile.set(index, state);
//     }
//   }

//   const board = new Board();
//   for (const blockedIndex of chosenTestCase.Blocked) {
//     board.setUserState(blockedIndex, TileState.Blocked);
//   }

//   let totalStepsToUncover = 0;
//   const stepsTo: Partial<Result["stepsTo"]> = {};
//   const steps: Result["steps"] = [];
//   while (board.solveState.solveStep !== SolveStep.Done) {
//     switch (board.solveState.solveStep) {
//       case SolveStep.FillPresent:
//       case SolveStep.FillSword: {
//         const tileState =
//           board.solveState.solveStep === SolveStep.FillSword
//             ? TileState.Sword
//             : TileState.Present;
//         for (const index of getCommunityDataPatternBoundingBox(
//           chosenPattern,
//           tileState
//         ).indexes()) {
//           board.setUserState(index, tileState);
//         }
//         break;
//       }
//       case SolveStep.FillBlocked: {
//         throw new Error(`Reached fill blocked?`);
//       }
//       case SolveStep.SuggestTiles: {
//         totalStepsToUncover += 1;
//         const suggestedIndexes: number[] = [];
//         for (let i = 0; i < board.tiles.length; i++) {
//           if (Array.isArray(board.tiles[i])) {
//             suggestedIndexes.push(i);
//           }
//         }
//         assertLengthAtLeast(suggestedIndexes, 1);
//         const tileIndex =
//           suggestedIndexes.length === 1
//             ? 0
//             : randomInt(0, suggestedIndexes.length);
//         const targetTileIndex = suggestedIndexes[tileIndex];
//         assert(targetTileIndex !== undefined);
//         assert(board.getUserState(targetTileIndex) === TileState.Unknown);

//         const actualTileState = actualTile.get(targetTileIndex);
//         if (actualTileState === undefined) {
//           board.setUserState(targetTileIndex, TileState.Empty);
//           steps.push({
//             index: targetTileIndex,
//             state: TileState.Empty,
//             stepNumber: totalStepsToUncover,
//           });
//         } else {
//           board.setUserState(targetTileIndex, actualTileState);
//           steps.push({
//             index: targetTileIndex,
//             state: actualTileState,
//             stepNumber: totalStepsToUncover,
//           });

//           assert(stepsTo[actualTileState] === undefined);
//           stepsTo[actualTileState] = totalStepsToUncover;
//         }

//         const solved = board.solveState.solveState.getSolved();
//         for (const state of [TileState.Sword, TileState.Present] as const) {
//           if (solved[state] && stepsTo[state] === undefined) {
//             stepsTo[state] = totalStepsToUncover;
//           }
//         }
//         break;
//       }
//       default: {
//         assertNever(board.solveState.solveStep);
//       }
//     }
//   }
//   const totals = {
//     [TileState.Blocked]: 0,
//     [TileState.Present]: 0,
//     [TileState.Sword]: 0,
//     [TileState.Fox]: 0,
//     [TileState.Empty]: 0,
//     [TileState.Unknown]: 0,
//   };
//   for (let i = 0; i < 6 * 6; i++) {
//     totals[normalizeState(board.tiles[i])] += 1;
//   }

//   assert(totals[TileState.Blocked] === 5);
//   assert(totals[TileState.Sword] === 6);
//   assert(totals[TileState.Present] === 4);
//   assert(totals[TileState.Fox] === (chosenFoxIndex === undefined ? 0 : 1));

//   for (const state of [TileState.Sword, TileState.Present] as const) {
//     for (const index of patternIndexes[state]) {
//       assert(normalizeState(board.tiles[index]) === state);
//     }
//   }
//   if (chosenFoxIndex !== undefined) {
//     assert(normalizeState(board.tiles[chosenFoxIndex]) === TileState.Fox);
//   }

//   assert(stepsTo[TileState.Sword] !== undefined);
//   assert(stepsTo[TileState.Present] !== undefined);

//   const finalStepsTo = {
//     ...stepsTo,
//     totalSteps: totalStepsToUncover,
//   } as Result["stepsTo"];
//   // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
//   if (SAMPLES < 10_000) {
//     results.push({
//       stepsTo: stepsTo as Result["stepsTo"],
//       steps,
//       totalStepsToUncover,
//       testCaseKey: chosenTestCase.key,
//       testPatternIndex: chosenPatternIndex,
//       testPattern: chosenPattern,
//       testFoxIndex: chosenFoxIndex,
//     });
//   }
//   resultsLen += 1;
//   if (chosenFoxIndex !== undefined) {
//     resultsWithFoxLen += 1;
//   }
//   for (const state of [
//     TileState.Sword,
//     TileState.Present,
//     TileState.Fox,
//     "totalSteps",
//   ] as const) {
//     if (finalStepsTo[state] === undefined) {
//       continue;
//     }
//     resultTotals[state] += BigInt(finalStepsTo[state] ?? 0);
//     const kase = {
//       key: chosenTestCase.key,
//       index: chosenPatternIndex,
//       resultIndex: resultsLen - 1,
//     } satisfies ResultCase;
//     if (resultMax[state].steps < (finalStepsTo[state] ?? 0)) {
//       resultMax[state].steps = finalStepsTo[state] ?? 0;
//       resultMax[state].cases = [kase];
//     } else if (resultMax[state].steps === (finalStepsTo[state] ?? 0)) {
//       resultMax[state].cases.push(kase);
//     }
//     if (
//       resultMin[state].steps > (finalStepsTo[state] ?? Number.MAX_SAFE_INTEGER)
//     ) {
//       resultMin[state].steps = finalStepsTo[state] ?? 0;
//       resultMin[state].cases = [kase];
//     } else if (resultMin[state].steps === (finalStepsTo[state] ?? 0)) {
//       resultMin[state].cases.push(kase);
//     }
//   }
// }

// const averages = {
//   [TileState.Sword]: new Decimal(resultTotals[TileState.Sword].toString()).div(
//     resultsLen
//   ),
//   [TileState.Present]: new Decimal(
//     resultTotals[TileState.Present].toString()
//   ).div(resultsLen),
//   [TileState.Fox]: new Decimal(resultTotals[TileState.Fox].toString()).div(
//     resultsWithFoxLen
//   ),
//   totalSteps: new Decimal(resultTotals.totalSteps.toString()).div(resultsLen),
// };

// function logResult(result: typeof averages | typeof resultTotals) {
//   console.log(`  Sword:`, result[TileState.Sword]);
//   console.log(`Present:`, result[TileState.Present]);
//   console.log(`    Fox:`, result[TileState.Fox]);
//   console.log(`Overall:`, result.totalSteps);
// }

// function logMinMax(result: typeof resultMax) {
//   function logStep(title: string, step: (typeof result)[TileState.Sword]) {
//     console.log(title, step.steps);
//     const groups = new Map<string, Map<string, number>>();
//     for (const kase of step.cases) {
//       const patternId = kase.key[0];
//       assert(patternId !== undefined);
//       const patternSet = groups.get(patternId) ?? new Map<string, number>();
//       groups.set(patternId, patternSet);

//       patternSet.set(kase.key, (patternSet.get(kase.key) ?? 0) + 1);
//     }

//     for (const [key, value] of Array.from(groups).sort((a, b) =>
//       a[0].localeCompare(b[0])
//     )) {
//       console.log(
//         " ".repeat(title.length),
//         `${key}: ${Array.from(value.entries())
//           .sort((a, b) => a[0].localeCompare(b[0]))
//           .map(
//             ([label, count]) =>
//               `${label.padEnd(2, " ")} ${("x" + count.toString()).padStart(5, " ")}`
//           )
//           .join(" | ")}`
//       );
//     }
//   }

//   logStep(`  Sword:`, result[TileState.Sword]);
//   logStep(`Present:`, result[TileState.Present]);
//   logStep(`    Fox:`, result[TileState.Fox]);
//   logStep(`Overall:`, result.totalSteps);
// }

// console.log("Max");
// logMinMax(resultMax);
// console.log("Min");
// logMinMax(resultMin);

// console.log(`Averages`);
// logResult(averages);

// console.log("Total");
// console.log(`Without foxes:`, resultsLen);
// console.log(`   With foxes:`, resultsWithFoxLen);

// function normalizeState(state: CombinedTileState | undefined) {
//   switch (state) {
//     case TileState.Sword:
//     case SmartFillTileState.SmartFillSword: {
//       return TileState.Sword;
//     }
//     case TileState.Present:
//     case SmartFillTileState.SmartFillPresent: {
//       return TileState.Present;
//     }
//     case TileState.Fox: {
//       return TileState.Fox;
//     }
//     case TileState.Blocked:
//     case SmartFillTileState.SmartFillBlocked: {
//       return TileState.Blocked;
//     }
//     case TileState.Unknown:
//     case TileState.Empty: {
//       return state;
//     }
//     default: {
//       throw new Error(`Cannot convert ${state?.toString()} into a TileState`);
//     }
//   }
// }
