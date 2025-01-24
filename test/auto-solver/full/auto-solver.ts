import { BOARD_CELLS } from "~/src/game/constants.js";
import {
  communityDataByIdentifier,
  CommunityDataIdentifiers,
} from "~/src/game/generated-community-data.js";
import { CommunityDataPattern } from "~/src/game/types/community-data.js";
import {
  SmartFillTileState,
  SuggestTileState,
  TileState,
} from "~/src/game/types/tile-states.js";
import { assert, assertDefined, assertUnreachable } from "~/src/helpers.js";
import fs from "node:fs";
import path from "node:path";
import { getActualTileStates } from "~/test/helpers/helpers.js";
import { AutoSolverHarness } from "./types/auto-solver.harness.js";
import { bestBlockedTilesForIdentifier } from "./helpers/best-blocked-tiles.js";
import { patternToPictograph } from "~/test/helpers/print-helpers.js";
import {
  AutoSolveStrategy,
  STRATEGIES,
  STRATEGY_All,
} from "./types/strategies.js";
import {
  AutoSolveStep,
  AutoSolveStrategyResult,
} from "./types/solve-result.js";

async function step<T>(title: string, body: () => T | Promise<T>): Promise<T> {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (import.meta.env?.["LOGGING"] === true) {
    console.log(title);
  }
  const result = await body();
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (import.meta.env?.["LOGGING"] === true) {
    console.log(`Fin`, title);
  }
  return result;
}

export async function autoSolve(
  harness: AutoSolverHarness,
  options: {
    outDir: string;
    identifier: CommunityDataIdentifiers;
    existingFileMode: "overwrite" | "keep" | "error";
  }
) {
  const fileName = path.join(options.outDir, `${options.identifier}.json`);
  const dir = path.dirname(fileName);
  fs.mkdirSync(dir, { recursive: true });

  assertDefined(options.identifier);
  if (fs.existsSync(fileName)) {
    switch (options.existingFileMode) {
      case "error": {
        throw new Error(
          `${fileName} already exists; ${options.outDir} + ${options.identifier} already ran?`
        );
      }
      case "keep": {
        return;
      }
      case "overwrite": {
        break;
      }
      default: {
        assertUnreachable();
      }
    }
  }

  fs.writeFileSync(fileName, "");

  for (const [identifier, data] of Object.entries(communityDataByIdentifier)) {
    if (identifier !== options.identifier) {
      continue;
    }
    for (const pattern of data.Patterns) {
      for (const foxIndex of [...pattern.ConfirmedFoxes, undefined]) {
        await step(
          `${identifier} ${patternToPictograph(pattern)} Fox at ${foxIndex ?? "NoFox"}`,
          async () => {
            const { actualTileMap, actualPatternIndexes } = getActualTileStates(
              pattern,
              foxIndex
            );
            let stepPathCounter = 0;
            for (const strategy of STRATEGIES) {
              const stepPaths: number[][] = [[]];

              while (stepPaths.length > 0) {
                stepPathCounter = await solveSingleStep(
                  fileName,
                  stepPathCounter,
                  stepPaths,
                  strategy,
                  identifier,
                  harness,
                  foxIndex,
                  pattern,
                  actualTileMap,
                  actualPatternIndexes
                );
              }
            }
          }
        );
      }
    }
  }
}

async function solveSingleStep(
  fileName: string,
  stepPathCounter: number,
  stepPaths: number[][],
  strategy: AutoSolveStrategy,
  identifier: CommunityDataIdentifiers,
  harness: AutoSolverHarness,
  foxIndex: number | undefined,
  pattern: CommunityDataPattern,
  actualTileMap: Map<
    number,
    TileState.Present | TileState.Sword | TileState.Fox
  >,
  actualPatternIndexes: { readonly Sword: number[]; readonly Present: number[] }
) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (import.meta.env?.["LOGGING"] === true) {
    console.log(`Count`, stepPathCounter, `Remaining`, stepPaths.length);
  }
  stepPathCounter++;
  const stepRecommendationIndexes: readonly number[] | undefined =
    stepPaths.pop();
  assertDefined(stepRecommendationIndexes);

  await step(
    `[${stepPathCounter}] Strategy: ${strategy.join(",")}`,
    async () => {
      await harness.reset();

      // Fill in the blocked tiles
      await step(`Fill Blocked Tiles`, async () => {
        const bestBlockedTiles = bestBlockedTilesForIdentifier.get(identifier);
        assertDefined(bestBlockedTiles);
        for (const blockedIndex of bestBlockedTiles) {
          await harness.setUserSelection(blockedIndex, TileState.Blocked);
        }
      });

      // State
      let lastCountByState: Record<
        TileState | SuggestTileState.SuggestFox,
        number
      > = {
        [TileState.Blocked]: 0,
        [TileState.Empty]: 0,
        [TileState.Fox]: 0,
        [TileState.Unknown]: 0,
        [TileState.Present]: 0,
        [TileState.Sword]: 0,
        [SuggestTileState.SuggestFox]: 0,
      };
      let lastSmartFillCountByState: Record<
        TileState.Present | TileState.Sword,
        number
      > = {
        [TileState.Present]: 0,
        [TileState.Sword]: 0,
      };
      function resetLastCounts() {
        lastCountByState = {
          [TileState.Blocked]: 0,
          [TileState.Empty]: 0,
          [TileState.Fox]: 0,
          [TileState.Unknown]: 0,
          [TileState.Present]: 0,
          [TileState.Sword]: 0,
          [SuggestTileState.SuggestFox]: 0,
        };
        lastSmartFillCountByState = {
          [TileState.Present]: 0,
          [TileState.Sword]: 0,
        };
      }
      let lastFoxSuggestions: number[] = [];
      const steps: AutoSolveStep[] = [];
      const stepsTo: Partial<AutoSolveStrategyResult> = {
        stepRecommendationIndexes,
        strategy,
        steps,
        identifier,
        foxIndex,
        pattern: patternToPictograph(pattern),
      };
      let foundAllStrategyStates: boolean = false;
      let foxSuggestionStatus: "notShown" | "shown" | "previouslyShown" =
        "notShown";
      let stepsTaken = 0;
      let stepNumber = 0;
      try {
        let stepRecommendationIndex = 0;
        const additionalMoves: number[] = [];
        while (
          stepsTo.UncoverFox === undefined ||
          stepsTo.UncoverPresent === undefined ||
          stepsTo.UncoverSword === undefined
        ) {
          const stepRecommendations = await harness.getRecommendedTiles();
          let stepGoals: number[];
          // Detect when its time to fill in foxes based on suggestions
          if (
            stepRecommendations.length === 0 ||
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            (foundAllStrategyStates ? STRATEGY_All : strategy).every(
              (tileState) =>
                tileState === TileState.Fox
                  ? stepsTo.UncoverFox === undefined &&
                    lastCountByState.SuggestFox > 0
                  : stepsTo[`Found${tileState}`] !== undefined
            )
          ) {
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (import.meta.env?.["LOGGING"] === true) {
              console.log(
                "\tlastFoxSuggestions",
                lastFoxSuggestions.length,
                lastFoxSuggestions
              );
            }
            assert(lastFoxSuggestions.length > 0);
            stepGoals = lastFoxSuggestions;
          } else {
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (import.meta.env?.["LOGGING"] === true) {
              console.log(
                "\tstepRecommendations",
                stepRecommendations.length,
                stepRecommendations
              );
            }
            assert(stepRecommendations.length > 0);
            stepGoals = stepRecommendations;
          }

          const stepGoalPredetermined: number | undefined =
            stepRecommendationIndexes[stepRecommendationIndex++];

          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (import.meta.env?.["LOGGING"] === true) {
            console.log(
              "\t\tpredetermined",
              stepGoalPredetermined,
              "index into lookup",
              stepRecommendationIndex - 1,
              "all indexes",
              stepRecommendationIndexes
            );
          }
          const index: number | undefined =
            stepGoalPredetermined === undefined
              ? stepGoals[0]
              : stepGoals[stepGoalPredetermined];
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (import.meta.env?.["LOGGING"] === true) {
            console.log("\t\t\tresulting index to set", index);
          }
          assertDefined(index);
          stepsTaken = await setIndexToActualAndUpdate(index);

          if (stepGoalPredetermined === undefined) {
            for (let i = 1; i < stepGoals.length; i++) {
              // Push the alternative options onto the stack
              const stepPath = [
                ...stepRecommendationIndexes,
                ...additionalMoves,
                i,
              ];
              // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
              if (import.meta.env?.["LOGGING"] === true) {
                console.log(`\t\tAdded step path`, stepPath);
              }
              stepPaths.push(stepPath);
            }
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (import.meta.env?.["LOGGING"] === true) {
              console.log(`\t\tUpdated current path`, [
                ...stepRecommendationIndexes,
                ...additionalMoves,
              ]);
            }
            // Record the path we took
            additionalMoves.push(0);
          } else {
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (import.meta.env?.["LOGGING"] === true) {
              console.log(`\t\tPredetermined, nothing to add to step paths`);
            }
          }
        }

        await step(`Finalize result`, async () => {
          const stepRecommendations = await harness.getRecommendedTiles();
          assert(stepRecommendations.length === 0);
          assert(
            (await harness.getPatternData()).remainingPatternsIds?.length === 1
          );

          stepsTo.steps = steps;
          assertAutoSolveStrategyResult(stepsTo);
          fs.appendFileSync(fileName, JSON.stringify(stepsTo) + "\n");
        });

        async function setIndexToActualAndUpdate(index: number) {
          stepsTaken++;
          stepNumber++;

          // Set tile and fill shapes
          const tileState = actualTileMap.get(index) ?? TileState.Empty;
          switch (tileState) {
            case TileState.Sword:
            case TileState.Present: {
              for (const shapeIndex of actualPatternIndexes[tileState]) {
                await harness.setUserSelection(shapeIndex, tileState);
              }
              // stepsTo[`Found${tileState}`] = stepsTaken;
              // stepsTo[`Uncover${tileState}`] =
              //   stepsTaken + (tileState === TileState.Sword ? 5 : 3);
              break;
            }
            case TileState.Fox:
            case TileState.Empty: {
              await harness.setUserSelection(index, tileState);
              // if (tileState === TileState.Fox) {
              //   stepsTo[`Found${tileState}`] = stepsTaken;
              //   stepsTo[`Uncover${tileState}`] = stepsTaken;
              // }
              break;
            }
            default: {
              assertUnreachable();
            }
          }

          // Update state
          resetLastCounts();
          lastFoxSuggestions = [];
          for (let index = 0; index < BOARD_CELLS; index++) {
            const state = await harness.getTileState(index);
            assert(
              state !== SuggestTileState.SuggestPresent &&
                state !== SuggestTileState.SuggestSword
            );
            const normalizedState =
              state === SmartFillTileState.SmartFillBlocked
                ? TileState.Blocked
                : state === SmartFillTileState.SmartFillSword
                  ? TileState.Sword
                  : state === SmartFillTileState.SmartFillPresent
                    ? TileState.Present
                    : state;
            lastCountByState[normalizedState] += 1;
            if (
              state === SmartFillTileState.SmartFillPresent ||
              state === SmartFillTileState.SmartFillSword
            ) {
              assert(
                normalizedState === TileState.Sword ||
                  normalizedState === TileState.Present
              );
              lastSmartFillCountByState[normalizedState] += 1;
            }
            if (normalizedState === SuggestTileState.SuggestFox) {
              lastFoxSuggestions.push(index);
            }
          }

          stepsTo.FoundSword ??=
            lastCountByState.Sword > 0 ? stepsTaken : undefined;
          stepsTo.FoundPresent ??=
            lastCountByState.Present > 0 ? stepsTaken : undefined;
          stepsTo.FoundFoxCandidates ??=
            lastCountByState.Fox > 0 || lastCountByState.SuggestFox > 0
              ? stepsTaken
              : undefined;
          stepsTo.UncoverFox ??=
            lastCountByState.Fox > 0 ? stepsTaken : undefined;

          if (
            foxSuggestionStatus === "notShown" &&
            lastCountByState.SuggestFox > 0
          ) {
            foxSuggestionStatus = "shown";
          } else if (
            foxSuggestionStatus === "shown" &&
            lastCountByState.SuggestFox <= 0
          ) {
            foxSuggestionStatus = "previouslyShown";
          }
          if (
            foxSuggestionStatus === "previouslyShown" &&
            stepsTo.UncoverFox === undefined
          ) {
            stepsTo.FoundFoxCandidates ??= stepsTaken;
            stepsTo.UncoverFox = stepsTaken;
          }

          if (foundAllStrategyStates === false && updateUncovered(strategy)) {
            foundAllStrategyStates = true;
          }

          if (foundAllStrategyStates) {
            updateUncovered(STRATEGY_All);
          }

          steps.push({
            index,
            state: tileState,
            foxCandidates: lastCountByState.SuggestFox,
            patternsRemaining: (await harness.getPatternData())
              .remainingPatternsIds,
            solvedFox: stepsTo.UncoverFox !== undefined,
            solvedPresent: stepsTo.FoundPresent !== undefined,
            solvedSword: stepsTo.FoundSword !== undefined,
            stepNumber,
          });

          return stepsTaken;

          function updateUncovered(
            strategy: readonly (typeof STRATEGY_All)[number][]
          ) {
            if (
              !strategy.every((tileState) =>
                tileState === TileState.Fox
                  ? stepsTo.UncoverFox !== undefined && stepsTo.UncoverFox > 0
                  : stepsTo[`Found${tileState}`] !== undefined
              )
            ) {
              return false;
            }
            for (const tileState of strategy) {
              const tileArea =
                tileState === TileState.Sword
                  ? 6
                  : tileState === TileState.Present
                    ? 4
                    : 1;
              switch (tileState) {
                case TileState.Fox: {
                  stepsTo.UncoverFox ??= stepsTaken;
                  break;
                }
                case TileState.Sword:
                case TileState.Present: {
                  if (stepsTo[`Uncover${tileState}`] === undefined) {
                    const additionalStepsToUncover =
                      lastSmartFillCountByState[tileState] === tileArea
                        ? tileArea
                        : tileArea - 1;
                    stepsTaken += additionalStepsToUncover;
                    stepsTo[`Uncover${tileState}`] = stepsTaken;
                  }
                  break;
                }
                default: {
                  assertUnreachable();
                }
              }
            }
            return true;
          }
        }
      } catch (e) {
        fs.appendFileSync(
          fileName,
          "FAILED\n" + JSON.stringify(stepsTo) + "\n"
        );
        throw e;
      }
    }
  );
  return stepPathCounter;
}

function assertAutoSolveStrategyResult(
  stepsTo: Partial<AutoSolveStrategyResult>
): asserts stepsTo is AutoSolveStrategyResult {
  assertDefined(stepsTo.FoundFoxCandidates);
  assertDefined(stepsTo.FoundPresent);
  assertDefined(stepsTo.FoundSword);
  assertDefined(stepsTo.strategy);
  assertDefined(stepsTo.UncoverFox);
  assertDefined(stepsTo.UncoverPresent);
  assertDefined(stepsTo.UncoverSword);
  assertDefined(stepsTo.steps);
  assertDefined(stepsTo.identifier);
  assertDefined(stepsTo.pattern);
}
