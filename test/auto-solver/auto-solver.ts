import { communityDataByIdentifier } from "~/src/game/generated-community-data.js";
import {
  CombinedTileState,
  SmartFillTileState,
  SuggestTileState,
  TileState,
} from "~/src/game/types/tile-states.js";
import {
  assert,
  assertLengthAtLeast,
  assertNever,
  assertUnreachable,
} from "~/src/helpers.js";
import { Board } from "~/src/game/board.js";
import { getCommunityDataPatternBoundingBox } from "~/src/game/solver/helpers.js";
import { CommunityDataPattern } from "~/src/game/types/community-data.js";
import { SolveStep } from "~/src/game/types/solve-state.js";

interface IntermediateStepsTo {
  [TileState.Sword]: number | undefined;
  [TileState.Present]: number | undefined;
  [TileState.Fox]: { min: number; max: number } | undefined;
}
export interface AutoSolveResultStepsTo {
  [TileState.Sword]: number;
  [TileState.Present]: number;
  [TileState.Fox]: { min: number; max: number };
  totalSteps: { min: number; max: number };
}
export interface AutoSolveResultStepTaken {
  index: number;
  state: TileState;
  stepNumber: number;
  patternsRemaining: CommunityDataPattern[];
  foxCandidatesRemaining: { index: number; inPatterns: number }[];
  solvedSword: boolean;
  solvedPresent: boolean;
}
interface IntermediateSolveResult {
  steps: AutoSolveResultStepTaken[];
  stepsTo: IntermediateStepsTo;
  foxCandidates: number[];
}
export interface AutoSolveResult {
  stepsTo: AutoSolveResultStepsTo;
  steps: AutoSolveResultStepTaken[];
  foxIndex: number;
  foxCandidates: number[];
}
export interface AutoSolvePatternSet {
  pattern: CommunityDataPattern;
  solveResults: AutoSolveResult[];
}
export interface AutoSolveIdentifierSet {
  readonly blocked: readonly number[];
  patternResults: AutoSolvePatternSet[];
}

export enum AutoSolveMode {
  Full = "full",
  Fast = "fast",
}

export function solveAllPatterns(mode: AutoSolveMode = AutoSolveMode.Fast) {
  const allResults: Record<string, AutoSolveIdentifierSet> = {};
  for (const [identifier, data] of Object.entries(communityDataByIdentifier)) {
    const patternResults: AutoSolvePatternSet[] = [];
    for (const pattern of data.Patterns) {
      const solveResults: AutoSolveResult[] = [];
      for (const foxIndex of pattern.ConfirmedFoxes) {
        const { actualTileMap, actualPatternIndexes } = getActualTileStates(
          pattern,
          foxIndex
        );
        const board = new Board();
        for (const blockedIndex of data.Blocked) {
          board.setUserState(blockedIndex, TileState.Blocked);
        }
        for (const stepCollection of autoSolver(
          board,
          mode,
          pattern,
          data.Blocked,
          actualTileMap,
          actualPatternIndexes,
          foxIndex
        )) {
          solveResults.push(calculateSolveResult(foxIndex, stepCollection));
        }
      }
      patternResults.push({
        pattern,
        solveResults,
      });
    }

    allResults[identifier] = {
      blocked: data.Blocked,
      patternResults,
    };
  }
  return allResults;
}

function calculateSolveResult(
  foxIndex: number,
  {
    steps,
    stepsTo: intermediateStepsTo,
    foxCandidates,
  }: IntermediateSolveResult
): AutoSolveResult {
  const calculatedStepsToMap = new Map<TileState, number>();
  let totalSteps = -1;
  let stepCount = 0;
  for (const step of steps) {
    stepCount++;
    if (
      step.state !== TileState.Empty &&
      calculatedStepsToMap.get(step.state) !== undefined
    ) {
      assertUnreachable();
    }
    assert(stepCount === step.stepNumber);
    calculatedStepsToMap.set(step.state, step.stepNumber);
    totalSteps = Math.max(totalSteps, step.stepNumber);
  }
  assert(totalSteps >= 0);

  const recordedStepsToSword = intermediateStepsTo[TileState.Sword];
  assert(recordedStepsToSword !== undefined);
  const calculatedStepsToSword = calculatedStepsToMap.get(TileState.Sword);
  if (calculatedStepsToSword !== undefined) {
    assert(recordedStepsToSword === calculatedStepsToSword);
  }

  const recordedStepsToPresent = intermediateStepsTo[TileState.Present];
  assert(recordedStepsToPresent !== undefined);
  const calculatedStepsToPresent = calculatedStepsToMap.get(TileState.Present);
  if (calculatedStepsToPresent !== undefined) {
    assert(recordedStepsToPresent === calculatedStepsToPresent);
  }

  const recordedStepsToFox = intermediateStepsTo[TileState.Fox];
  assert(recordedStepsToFox !== undefined);
  const calculatedStepsToFox = calculatedStepsToMap.get(TileState.Fox);
  if (calculatedStepsToFox !== undefined) {
    assert(recordedStepsToFox.min === calculatedStepsToFox);
    assert(recordedStepsToFox.max === calculatedStepsToFox);
  }

  const stepsTo: AutoSolveResultStepsTo = {
    [TileState.Sword]: recordedStepsToSword,
    [TileState.Present]: recordedStepsToPresent,
    [TileState.Fox]: recordedStepsToFox,
    totalSteps: {
      min: Math.max(
        recordedStepsToSword,
        recordedStepsToPresent,
        recordedStepsToFox.min
      ),
      max: Math.max(
        recordedStepsToSword,
        recordedStepsToPresent,
        recordedStepsToFox.max
      ),
    },
  };

  return {
    steps,
    stepsTo,
    foxIndex,
    foxCandidates,
  };
}

function autoSolver(
  board: Board,
  mode: AutoSolveMode,
  chosenPattern: CommunityDataPattern,
  actualBlocked: readonly number[],
  actualTileMap: Map<number, TileState>,
  actualPatternIndexes: {
    [TileState.Sword]: number[];
    [TileState.Present]: number[];
  },
  actualFoxIndex: number,
  {
    totalStepsToUncover,
    stepsSoFar,
    stepsToSoFar,
  }: {
    totalStepsToUncover: number;
    stepsSoFar: AutoSolveResultStepTaken[];
    stepsToSoFar: IntermediateStepsTo;
  } = {
    totalStepsToUncover: 0,
    stepsSoFar: [],
    stepsToSoFar: {
      [TileState.Sword]: undefined,
      [TileState.Present]: undefined,
      [TileState.Fox]: undefined,
    },
  }
): IntermediateSolveResult[] {
  const solved = board.solveState.solveState.getSolved();
  for (const state of [TileState.Sword, TileState.Present] as const) {
    if (solved[state]) {
      assert(stepsToSoFar[state] !== undefined);
    }
  }

  const steps: AutoSolveResultStepTaken[] = [...stepsSoFar];
  let foxCandidates: number[] = [];
  while (board.solveState.solveStep !== SolveStep.Done) {
    switch (board.solveState.solveStep) {
      case SolveStep.FillPresent:
      case SolveStep.FillSword: {
        throw new Error(`Reached fill`);
        break;
      }
      case SolveStep.FillBlocked: {
        throw new Error(`Reached fill blocked?`);
      }
      case SolveStep.SuggestTiles: {
        totalStepsToUncover += 1;

        const suggestedIndexes: number[] = [];
        for (let i = 0; i < board.tiles.length; i++) {
          if (Array.isArray(board.tiles[i])) {
            suggestedIndexes.push(i);
          }
        }
        assertLengthAtLeast(suggestedIndexes, 1);

        if (mode === AutoSolveMode.Fast) {
          const solved = board.solveState.solveState.getSolved();
          if (solved.Present && solved.Sword) {
            assert(
              suggestedIndexes.every(
                (i) =>
                  board.tiles[i]?.length === 1 &&
                  board.tiles[i]?.[0] === SuggestTileState.SuggestFox
              )
            );

            stepsToSoFar[TileState.Fox] ??= {
              min: totalStepsToUncover,
              max: totalStepsToUncover + suggestedIndexes.length - 1,
            };
            foxCandidates = suggestedIndexes;
            board.setUserState(actualFoxIndex, TileState.Fox);
            assert(board.issues.length === 0);
            assert(
              board.solveState.solveStep.toString() ===
                SolveStep.Done.toString()
            );
            break;
          }
        }

        // Recursive branching (when there are more than 1 tile suggested)
        const results: IntermediateSolveResult[] = [];
        for (const suggestedIndex of suggestedIndexes) {
          assert(board.getUserState(suggestedIndex) === TileState.Unknown);

          const actualTileState = actualTileMap.get(suggestedIndex);
          const placedState = actualTileState ?? TileState.Empty;

          const newBoard = board.clone();
          const newStepsToSoFar = { ...stepsToSoFar };
          newBoard.setUserState(suggestedIndex, placedState);
          while (
            newBoard.solveState.solveStep === SolveStep.FillPresent ||
            newBoard.solveState.solveStep === SolveStep.FillSword
          ) {
            fillBoard(newBoard);
          }
          const solved = newBoard.solveState.solveState.getSolved();
          for (const state of [TileState.Sword, TileState.Present] as const) {
            if (solved[state]) {
              assert(totalStepsToUncover > 0);
              newStepsToSoFar[state] ??= totalStepsToUncover;
            }
          }
          if (placedState === TileState.Fox) {
            newStepsToSoFar[placedState] ??= {
              min: totalStepsToUncover,
              max: totalStepsToUncover,
            };
          }

          const patternsRemaining =
            newBoard.solveState.solveState.getCandidatePatterns();
          const foxCandidatesRemainingMap = new Map<number, number>();
          for (const pattern of patternsRemaining) {
            for (const foxIndex of pattern.ConfirmedFoxes) {
              if (newBoard.getUserState(foxIndex) === TileState.Unknown) {
                foxCandidatesRemainingMap.set(
                  foxIndex,
                  (foxCandidatesRemainingMap.get(foxIndex) ?? 0) + 1
                );
              }
            }
          }
          const foxCandidatesRemaining =
            newStepsToSoFar[TileState.Fox] !== undefined
              ? []
              : Array.from(foxCandidatesRemainingMap.entries()).map(
                  ([index, inPatterns]) => ({ index, inPatterns })
                );
          assert(
            foxCandidatesRemaining.length > 0 ||
              newStepsToSoFar[TileState.Fox] !== undefined
          );

          results.push(
            ...autoSolver(
              newBoard,
              mode,
              chosenPattern,
              actualBlocked,
              actualTileMap,
              actualPatternIndexes,
              actualFoxIndex,
              {
                totalStepsToUncover,
                stepsSoFar: [
                  ...steps,
                  {
                    index: suggestedIndex,
                    state: placedState,
                    stepNumber: totalStepsToUncover,
                    patternsRemaining: [...patternsRemaining],
                    foxCandidatesRemaining,
                    solvedSword: solved[TileState.Sword],
                    solvedPresent: solved[TileState.Present],
                  },
                ],
                stepsToSoFar: newStepsToSoFar,
              }
            )
          );
        }
        return results;
      }
      default: {
        assertNever(board.solveState.solveStep);
      }
    }
  }
  assert(board.issues.length === 0);
  const totals = {
    [TileState.Blocked]: 0,
    [TileState.Present]: 0,
    [TileState.Sword]: 0,
    [TileState.Fox]: 0,
    [TileState.Empty]: 0,
    [TileState.Unknown]: 0,
  };
  for (let i = 0; i < 6 * 6; i++) {
    totals[normalizeState(board.tiles[i])] += 1;
  }

  assert(totals[TileState.Blocked] === 5);
  assert(totals[TileState.Sword] === 6);
  assert(totals[TileState.Present] === 4);
  assert(totals[TileState.Fox] === 1);

  for (const state of [TileState.Sword, TileState.Present] as const) {
    for (const index of actualPatternIndexes[state]) {
      assert(normalizeState(board.tiles[index]) === state);
    }
  }
  assert(normalizeState(board.tiles[actualFoxIndex]) === TileState.Fox);

  return [{ steps, stepsTo: stepsToSoFar, foxCandidates }];

  function fillBoard(boardToFill: Board) {
    const tileState =
      boardToFill.solveState.solveStep === SolveStep.FillSword
        ? TileState.Sword
        : TileState.Present;
    for (const index of actualPatternIndexes[tileState]) {
      boardToFill.setUserState(index, tileState);
    }
  }
}

function getActualTileStates(
  chosenPattern: CommunityDataPattern,
  actualFoxIndex: number | undefined
) {
  const actualPatternIndexes = {
    [TileState.Sword]: getCommunityDataPatternBoundingBox(
      chosenPattern,
      TileState.Sword
    ).indexes(),
    [TileState.Present]: getCommunityDataPatternBoundingBox(
      chosenPattern,
      TileState.Present
    ).indexes(),
  } as const;

  const actualTileMap = new Map<
    number,
    TileState.Sword | TileState.Present | TileState.Fox
  >();
  if (actualFoxIndex !== undefined) {
    actualTileMap.set(actualFoxIndex, TileState.Fox);
  }
  for (const state of [TileState.Sword, TileState.Present] as const) {
    for (const index of actualPatternIndexes[state]) {
      actualTileMap.set(index, state);
    }
  }
  return { actualTileMap, actualPatternIndexes };
}

function normalizeState(state: CombinedTileState | undefined) {
  switch (state) {
    case TileState.Sword:
    case SmartFillTileState.SmartFillSword: {
      return TileState.Sword;
    }
    case TileState.Present:
    case SmartFillTileState.SmartFillPresent: {
      return TileState.Present;
    }
    case TileState.Fox: {
      return TileState.Fox;
    }
    case TileState.Blocked:
    case SmartFillTileState.SmartFillBlocked: {
      return TileState.Blocked;
    }
    case TileState.Unknown:
    case TileState.Empty: {
      return state;
    }
    default: {
      throw new Error(`Cannot convert ${state?.toString()} into a TileState`);
    }
  }
}
