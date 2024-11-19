import { BOARD_CELLS } from "~/src/game/constants.js";
import {
  ProcessedPattern,
  createCommunityDataStateCandidatesFoxOmitsSolver,
} from "./base-fox-omits.js";
import {
  CombinedTileState,
  TileState,
  TrackedStatesIndexList,
} from "~/src/game/types/tile-states.js";
import {
  IndeterminateSolveState,
  SolveState,
  SolveStep,
} from "~/src/game/types/solve-state.js";
import { assert, assertLengthAtLeast } from "~/src/helpers.js";
import { BoardIssue } from "~/src/game/types/board-issue.js";
import { solve } from "../../../solver.js";

function calculateWeight(results: ReturnType<typeof recursiveSolver>) {
  let sumOfAvg = 0;
  let count = 0;
  for (const [, score] of results.entries()) {
    sumOfAvg += score.total / score.count;
    count += 1;
  }

  return sumOfAvg / count;
}

let useSimple = false;
export const calculateStatesCandidates =
  createCommunityDataStateCandidatesFoxOmitsSolver(
    (shapes, filteredPatterns, solveState, userStatesIndexList) => {
      if (useSimple) {
        for (const { state } of shapes) {
          const commonIndexes = new Map<number, number>();
          for (const pattern of filteredPatterns) {
            const indexes = pattern.boundingBox[state].indexes();
            for (const index of indexes) {
              commonIndexes.set(index, (commonIndexes.get(index) ?? 0) + 1);
            }
          }

          for (const [index, count] of commonIndexes) {
            if (count === filteredPatterns.length) {
              solveState.setSmartFill(index, state);
            } else {
              solveState.addSuggestion(index, state, count);
            }
          }
        }
        return;
      }
      const initialBoard = new InternalBoard();
      for (let index = 0; index < BOARD_CELLS; index++) {
        const tileState = solveState.getUserState(index);
        if (tileState !== undefined && tileState !== TileState.Unknown) {
          initialBoard.setUserStateWithoutRecalculation(index, tileState);
        }
      }
      useSimple = true;
      initialBoard.recalculateSolveState();
      useSimple = false;

      const results = recursiveSolver(initialBoard, filteredPatterns);

      for (let i = 0; i < BOARD_CELLS; i++) {
        if (
          filteredPatterns.every((p) =>
            p.boundingBox.Sword.indexes().includes(i)
          )
        ) {
          solveState.setSmartFill(i, TileState.Sword);
        } else if (
          filteredPatterns.every((p) =>
            p.boundingBox.Present.indexes().includes(i)
          )
        ) {
          solveState.setSmartFill(i, TileState.Present);
        } else if (results.has(i)) {
          const result = results.get(i);
          assert(result !== undefined);
          solveState.addSuggestion(
            i,
            TileState.Sword,
            result.total / result.count
          );
        }
      }
    }
  );

function recursiveSolver(
  initialBoard: InternalBoard,
  filteredPatterns: ProcessedPattern[]
) {
  const scoreByIndex = new Map<
    number,
    { min: number; max: number; total: number; count: number }
  >();

  for (const pattern of filteredPatterns) {
    const board = initialBoard.clone();

    suggestionLoop: while (board.solveState.solveStep !== SolveStep.Done) {
      switch (board.solveState.solveStep) {
        case SolveStep.FillBlocked:
          throw new Error("invalid");
        case SolveStep.FillSword:
        case SolveStep.FillPresent:
          throw new Error("invalid");
        case SolveStep.SuggestTiles: {
          const suggestedIndexes: number[] = [];
          for (let i = 0; i < board.tiles.length; i++) {
            if (Array.isArray(board.tiles[i])) {
              suggestedIndexes.push(i);
            }
          }
          assertLengthAtLeast(suggestedIndexes, 1);

          for (const suggestedIndex of suggestedIndexes) {
            assert(board.getUserState(suggestedIndex) === TileState.Unknown);

            const stateVariants: TileState[] = [];
            if (pattern.boundingBox.Sword.indexes().includes(suggestedIndex)) {
              stateVariants.push(TileState.Sword);
            } else if (
              pattern.boundingBox.Present.indexes().includes(suggestedIndex)
            ) {
              stateVariants.push(TileState.Present);
            } else if (
              pattern.pattern.ConfirmedFoxes.includes(suggestedIndex)
            ) {
              for (const foxIndex of pattern.pattern.ConfirmedFoxes) {
                if (board.getUserState(foxIndex) !== TileState.Unknown) {
                  continue;
                }
                stateVariants.push(
                  foxIndex === suggestedIndex ? TileState.Fox : TileState.Empty
                );
              }
            } else {
              stateVariants.push(TileState.Empty);
            }

            assertLengthAtLeast(stateVariants, 1);

            for (const state of stateVariants) {
              const newBoard = board.clone();
              newBoard.setUserStateWithoutRecalculation(suggestedIndex, state);
              if (state === TileState.Sword || state === TileState.Present) {
                for (const index of pattern.boundingBox[state].indexes()) {
                  newBoard.setUserStateWithoutRecalculation(index, state);
                }
              }
              newBoard.recalculateSolveState();
              const val =
                fillFilterRecurse(newBoard, filteredPatterns, pattern) + 1;

              const score = scoreByIndex.get(suggestedIndex) ?? {
                min: Number.MAX_SAFE_INTEGER,
                max: -1,
                total: 0,
                count: 0,
              };
              score.min = Math.min(val, score.min);
              score.max = Math.max(val, score.max);
              score.total += val;
              score.count += 1;
              scoreByIndex.set(suggestedIndex, score);
            }
          }
          break suggestionLoop;
        }
      }
    }

    // for (const suggestions of board.solveState.su)
  }

  return scoreByIndex;
}

function fillFilterRecurse(
  board: InternalBoard,
  filteredPatterns: ProcessedPattern[],
  pattern: ProcessedPattern
): number {
  board = board.clone();
  while (
    board.solveState.solveStep === SolveStep.FillPresent ||
    board.solveState.solveStep === SolveStep.FillSword
  ) {
    const tileState =
      board.solveState.solveStep === SolveStep.FillSword
        ? TileState.Sword
        : TileState.Present;
    for (const index of pattern.boundingBox[tileState].indexes()) {
      board.setUserStateWithoutRecalculation(index, tileState);
    }
  }

  if (board.solveState.solveStep === SolveStep.Done) {
    if (filteredPatterns.length > 1) {
      throw new Error(`Too many patterns ${filteredPatterns.length}`);
    }
    return 0;
  }

  if (board.solveState.solveStep !== SolveStep.SuggestTiles) {
    throw new Error(`Wrong state ${board.solveState.solveStep}`);
  }

  const newFilteredPatterns: ProcessedPattern[] = [];
  for (const solvedOtherPattern of board.solveState.solveState.getCandidatePatterns()) {
    const ourPattern = filteredPatterns.find(
      (p) => p.pattern === solvedOtherPattern
    );
    if (ourPattern === undefined) {
      throw new Error(`Failed to find pattern`);
    }
    newFilteredPatterns.push(ourPattern);
  }

  if (newFilteredPatterns.length === 0) {
    throw new Error(`Failed to find any matching patterns`);
  }

  if (!newFilteredPatterns.includes(pattern)) {
    throw new Error(`State did not have its own pattern`);
  }

  if (newFilteredPatterns.length > filteredPatterns.length) {
    throw new Error(`Gained patterns`);
  }

  const result = recursiveSolver(
    board,
    newFilteredPatterns
    // getUserStatesIndexList(board)
  );
  return calculateWeight(result);
}

function getUserStatesIndexList(board: InternalBoard) {
  const userStatesIndexList: TrackedStatesIndexList<Set<number>> = {
    [TileState.Blocked]: new Set(),
    [TileState.Sword]: new Set(),
    [TileState.Present]: new Set(),
    [TileState.Fox]: new Set(),
  };
  for (let i = 0; i < board.tiles.length; i++) {
    const tile = board.tiles[i];
    if (
      tile === TileState.Blocked ||
      tile === TileState.Sword ||
      tile === TileState.Present ||
      tile === TileState.Fox
    ) {
      userStatesIndexList[tile].add(i);
    }
  }

  return userStatesIndexList;
}

class InternalBoard {
  userSelectedStates: TileState[] = [];
  tiles: CombinedTileState[] = [];
  solveState: SolveState;
  boardIssues: BoardIssue[] = [];

  readonly trackedUserSelectedStates: TrackedStatesIndexList<Set<number>> = {
    [TileState.Blocked]: new Set<number>(),
    [TileState.Present]: new Set<number>(),
    [TileState.Sword]: new Set<number>(),
    [TileState.Fox]: new Set<number>(),
  };
  constructor() {
    this.userSelectedStates = new Array<TileState>(BOARD_CELLS).fill(
      TileState.Unknown
    );
    this.tiles = new Array<TileState>(BOARD_CELLS).fill(TileState.Unknown);
    this.solveState = new IndeterminateSolveState(
      this.userSelectedStates
    ).finalize(SolveStep.FillBlocked);
  }

  getUserState(index: number): TileState {
    const userState = this.userSelectedStates[index];
    if (import.meta.env.DEV) {
      assert(userState !== undefined, "Out of range");
    }

    return userState ?? TileState.Unknown;
  }

  setUserStateWithoutRecalculation(index: number, state: TileState) {
    const oldState = this.userSelectedStates[index];
    if (oldState === undefined) {
      if (import.meta.env.DEV) {
        console.error(`Index out of range: ${index}`);
      }
      return;
    }
    if (oldState === state) {
      return;
    }

    this.userSelectedStates[index] = state;
    if (this.#isTrackedState(oldState)) {
      this.trackedUserSelectedStates[oldState].delete(index);
    }
    if (this.#isTrackedState(state)) {
      this.trackedUserSelectedStates[state].add(index);
    }
  }

  recalculateSolveState() {
    const { tiles, solveState, issues } = solve(
      this.userSelectedStates,
      this.trackedUserSelectedStates
    );
    this.solveState = solveState;
    this.boardIssues = issues;
    this.tiles = tiles;
  }

  #isTrackedState(
    tileState: TileState
  ): tileState is keyof TrackedStatesIndexList<Set<number>> {
    return Object.hasOwn(this.trackedUserSelectedStates, tileState);
  }

  clone(): InternalBoard {
    const newBoard = new InternalBoard();
    for (let index = 0; index < this.userSelectedStates.length; index++) {
      const state = this.userSelectedStates[index];
      if (state === TileState.Unknown || state === undefined) {
        continue;
      }
      newBoard.setUserStateWithoutRecalculation(index, state);
    }
    newBoard.solveState = this.solveState;
    newBoard.boardIssues = [...this.boardIssues];
    newBoard.tiles = [...this.tiles];
    return newBoard;
  }
}
