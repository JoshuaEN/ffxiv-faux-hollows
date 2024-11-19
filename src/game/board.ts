import { assert } from "../helpers.js";
import { BOARD_CELLS } from "./constants.js";
import { solve } from "./solver/index.js";
import {
  BoardIssue,
  CombinedTileState,
  TrackedStatesIndexList,
  TileState,
} from "./types/index.js";
import {
  IndeterminateSolveState,
  SolveState,
  SolveStep,
} from "./types/solve-state.js";

export class Board {
  readonly #userSelectedStates: TileState[] = [];
  #tiles: CombinedTileState[] = [];
  #solveState: SolveState;
  #boardIssues: BoardIssue[] = [];

  readonly #trackedUserSelectedStates: TrackedStatesIndexList<Set<number>> = {
    [TileState.Blocked]: new Set<number>(),
    [TileState.Present]: new Set<number>(),
    [TileState.Sword]: new Set<number>(),
    [TileState.Fox]: new Set<number>(),
  };
  constructor() {
    this.#userSelectedStates = new Array<TileState>(BOARD_CELLS).fill(
      TileState.Unknown
    );
    this.#tiles = new Array<TileState>(BOARD_CELLS).fill(TileState.Unknown);
    this.#solveState = new IndeterminateSolveState(
      this.#userSelectedStates
    ).finalize(SolveStep.FillBlocked);
  }

  get tiles(): readonly CombinedTileState[] {
    return this.#tiles;
  }

  get solveState() {
    return this.#solveState;
  }

  get issues(): readonly BoardIssue[] {
    return this.#boardIssues;
  }

  getUserState(index: number): TileState {
    const userState = this.#userSelectedStates[index];
    if (import.meta.env.DEV) {
      assert(userState !== undefined, "Out of range");
    }

    return userState ?? TileState.Unknown;
  }

  setUserState(index: number, state: TileState): void {
    this.#setUserStateWithoutRecalculation(index, state);
    this.#recalculateSolveState();
  }

  #setUserStateWithoutRecalculation(index: number, state: TileState) {
    const oldState = this.#userSelectedStates[index];
    if (oldState === undefined) {
      if (import.meta.env.DEV) {
        console.error(`Index out of range: ${index}`);
      }
      return;
    }
    if (oldState === state) {
      return;
    }

    this.#userSelectedStates[index] = state;
    if (this.#isTrackedState(oldState)) {
      this.#trackedUserSelectedStates[oldState].delete(index);
    }
    if (this.#isTrackedState(state)) {
      this.#trackedUserSelectedStates[state].add(index);
    }
  }

  #recalculateSolveState() {
    const { tiles, solveState, issues } = solve(
      this.#userSelectedStates,
      this.#trackedUserSelectedStates
    );
    this.#solveState = solveState;
    this.#boardIssues = issues;
    this.#tiles = tiles;
  }

  #isTrackedState(
    tileState: TileState
  ): tileState is keyof TrackedStatesIndexList<Set<number>> {
    return Object.hasOwn(this.#trackedUserSelectedStates, tileState);
  }

  clone(): Board {
    const newBoard = new Board();
    for (let index = 0; index < this.#userSelectedStates.length; index++) {
      const state = this.#userSelectedStates[index];
      if (state === TileState.Unknown || state === undefined) {
        continue;
      }
      newBoard.#setUserStateWithoutRecalculation(index, state);
    }
    newBoard.#recalculateSolveState();
    return newBoard;
  }
}
