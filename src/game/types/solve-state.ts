import { BOARD_CELLS } from "../constants.js";
import {
  TargetTileState,
  TileState,
  TrackedStatesIndexList,
} from "./../types/tile-states.js";
import { CommunityDataPattern } from "./community-data.js";

export interface TileSuggestion {
  [TileState.Blocked]: number;
  [TileState.Present]: number;
  [TileState.Sword]: number;
  [TileState.Fox]: number;
}

export type SolverWeightMeta = Record<string, string | number>;
export interface SolverWeight {
  value: number;
  meta: Readonly<SolverWeightMeta>;
}

export type SmartFill = TileState.Present | TileState.Sword | TileState.Blocked;

export type Recommendation = TileState.Sword | TileState.Present;

interface FoxOdds {
  confirmedFoxes: number;
  totalFoxesForPatterns: number;
}

export enum SolveStep {
  /**
   * The user should fill in the remaining blocked tiles
   */
  FillBlocked = "FillBlocked",
  /**
   * The user should have enough information to fill in the Sword tiles
   */
  FillSword = "FillSword",
  /**
   * The user should have enough information to fill in the Present tiles
   */
  FillPresent = "FillPresent",
  /**
   * We are offering the user suggestions on which tile to flip next
   */
  SuggestTiles = "SuggestTiles",
  /**
   * The board is solved and we are showing fox locations
   */
  SuggestFoxes = "SuggestFoxes",
  /**
   * Everything has been found
   */
  Done = "Done",
}

export enum StateTileEligibility {
  /**
   * This tile is already taken by another state
   */
  Taken,
  /**
   * This tile is empty
   */
  Empty,
  /**
   * This tile is taken by the given state
   */
  Present,
}

export class SolveState {
  constructor(
    readonly solveState: IndeterminateSolveState,
    readonly suggestions: ReadonlyMap<number, TileSuggestion>,
    readonly finalWeights: ReadonlyMap<number, SolverWeight>,
    readonly maxTileWeight: number,
    readonly solveStep: SolveStep,
    readonly foxOdds: ReadonlyMap<number, FoxOdds>,
    private readonly candidatePatterns: readonly CommunityDataPattern[] | null
  ) {}

  get totalCandidatePatterns() {
    return this.candidatePatterns?.length ?? null;
  }

  getSmartFill(index: number) {
    return this.solveState.getSmartFill(index);
  }

  getSuggestion(index: number): Readonly<TileSuggestion> | null {
    return this.suggestions.get(index) ?? null;
  }

  getFinalWeight(index: number): Readonly<SolverWeight> | null {
    return this.finalWeights.get(index) ?? null;
  }

  getFoxOdds(index: number): Readonly<{
    confirmedFoxes: number;
    odds: number;
  }> | null {
    const foxDetails = this.foxOdds.get(index);
    if (foxDetails === undefined) {
      return null;
    }

    // This is both the number of fox candidates and the number of patterns foxes were present on for this tile (because, for a given pattern, a fox is either confirmed or unconfirmed on a tile)
    const foxesOnIndex = foxDetails.confirmedFoxes;
    // Of all possible patterns (accounting for uncovered Presents/Swords), what percent may have a fox on this tile
    const oddsOfPatternHavingFox =
      foxesOnIndex / (this.totalCandidatePatterns ?? 0);
    // Of all possible foxes given the current possible patterns, what percent of the time will the fox be on this tile.
    const oddsOfTileHavingFoxInPatternsWithFoxes =
      foxesOnIndex / foxDetails.totalFoxesForPatterns;
    return {
      confirmedFoxes: foxDetails.confirmedFoxes,
      odds: oddsOfPatternHavingFox * oddsOfTileHavingFoxInPatternsWithFoxes,
    };
  }

  getMaxTileWeight() {
    return this.maxTileWeight;
  }

  getPatternIdentifier() {
    return this.solveState.getPatternIdentifier();
  }

  getCandidatePatterns() {
    return this.candidatePatterns?.slice() ?? null;
  }
}

/**
 * The indeterminate solve state is created and managed by the solver steps,
 * being converted into a SolveState for use in the game board.
 */
export class IndeterminateSolveState {
  /**
   * User states represent the tiles the user has manually entered.
   */
  #userStates: readonly TileState[];
  /**
   * User states index list is a reverse lookup of tile state to a list of indexes.
   */
  #userStatesIndexList: Readonly<TrackedStatesIndexList<ReadonlySet<number>>>;
  /**
   * Smart fills represent a tile which has a known state based on the tiles the user has entered.
   * For example, if a user enters the top-left and bottom-right of a Sword,
   * the remaining four tiles which make up the Sword could automatically be determined (smart filled).
   * Generally speaking, smart fill can work off of process of elimination. So, a user may have entered none of the tiles of a type being smart filled.
   */
  #smartFills = new Map<number, SmartFill>();
  /**
   * Smart fills reverse is a reverse lookup of smart fill state to a list of indexes.
   */
  #smartFillsReverse: Record<SmartFill, number[]> = {
    [TileState.Sword]: [],
    [TileState.Present]: [],
    [TileState.Blocked]: [],
  };
  /**
   * Suggestions represent the possibility for a tile to be in a particular state.
   * Some solvers use the numeric value of the suggestion as part of the final weight,
   * but there is no intrinsic meaning or unit of measure assigned to the numeric value beyond
   * zero (or absent) meaning the state is not possible, and greater than zero meaning the state is possible.
   */
  #suggestions = new Map<number, TileSuggestion>();
  /**
   * Final weights represent the "score" assigned to each tile by the solver.
   * The tile(s) with the highest final weight will be shown as suggestions in the UI.
   */
  #finalWeights = new Map<number, SolverWeight>();
  /**
   * Identifier of the pattern, e.g. A or C→
   */
  #patternIdentifier: string | null = null;
  /**
   * Fox odds represent the odds of a fox being on a given index.
   */
  #foxOdds = new Map<number, FoxOdds>();
  /**
   * Fox count is a count of the total number of possible foxes across all patterns.
   * Note that really this is currently intended to only be a flag, where greater than zero indicates a fox may still be possible to find.
   */
  #foxCount = 0;
  /**
   * List of patterns which could be present.
   */
  #candidatePatterns: readonly CommunityDataPattern[] | null = null;

  /**
   * Flags indicating if each of the represented shapes have been fully found.
   */
  #solved = {
    [TileState.Sword]: false,
    [TileState.Present]: false,
  };

  constructor(
    userSelectedStates: readonly TileState[],
    userStatesIndexList: Readonly<TrackedStatesIndexList<ReadonlySet<number>>>
  ) {
    this.#userStates = userSelectedStates.slice();
    this.#userStatesIndexList = userStatesIndexList;
  }

  getUserState(index: number) {
    return this.#userStates[index];
  }

  get userStatesIndexList() {
    return this.#userStatesIndexList;
  }

  anyUserStateSet() {
    for (const state of this.#userStates) {
      if (state !== TileState.Blocked && state !== TileState.Unknown) {
        return true;
      }
    }
    return false;
  }

  getSmartFill(index: number) {
    return this.#smartFills.get(index) ?? null;
  }

  getSmartFillReversed(
    state: TileState.Sword | TileState.Present | TileState.Blocked
  ): readonly number[] {
    return this.#smartFillsReverse[state].slice();
  }
  getSmartFillReversedCount(
    state: TileState.Sword | TileState.Present | TileState.Blocked
  ): number {
    return this.#smartFillsReverse[state].length;
  }

  getSuggestion(index: number): Readonly<TileSuggestion> | null {
    return this.#suggestions.get(index) ?? null;
  }

  getFoxOdds(index: number): Readonly<FoxOdds> | null {
    return this.#foxOdds.get(index) ?? null;
  }

  getFinalWeight(index: number): SolverWeight | null {
    return this.#finalWeights.get(index) ?? null;
  }

  getPatternIdentifier() {
    return this.#patternIdentifier;
  }

  getCandidatePatterns() {
    return this.#candidatePatterns === null
      ? null
      : [...this.#candidatePatterns];
  }

  getSolved() {
    return { ...this.#solved };
  }

  anyFoxes() {
    return this.#foxCount > 0;
  }

  setSmartFill(index: number, state: SmartFill) {
    const currentState = this.#smartFills.get(index);
    if (import.meta.env.DEV) {
      if (currentState !== undefined && currentState !== state) {
        console.error(
          `${index} was already set to state ${
            this.#smartFills.get(index) ?? "undefined"
          }`
        );
      }
    }
    const userState = this.#userStates[index];
    if (userState !== TileState.Unknown) {
      if (userState !== state) {
        throw new Error(
          `Attempted to assign smart-fill value to a value in conflict with user's own choice`
        );
      } else {
        // We avoid setting smart fill values when the user state is already set to simplify calculations later
        return false;
      }
    }
    if (currentState === state) {
      return false;
    }
    this.#smartFills.set(index, state);
    if (currentState !== undefined) {
      this.#smartFillsReverse[currentState] = this.#smartFillsReverse[
        currentState
      ].filter((i) => i === index);
    }
    this.#smartFillsReverse[state].push(index);
    return true;
  }

  setSolved(state: TileState.Sword | TileState.Present, solved: boolean) {
    this.#solved[state] = solved;
  }

  addSuggestion(index: number, state: TargetTileState, value: number) {
    if (value < 1) {
      throw new Error(`${value} must be greater than or equal to 1`);
    }

    const suggestion =
      this.#suggestions.get(index) ??
      IndeterminateSolveState.#createTileSuggestion();

    suggestion[state] += value;

    this.#suggestions.set(index, suggestion);
  }

  setFinalWeight(
    index: number,
    value: number,
    meta: Record<string, string | number> = {}
  ) {
    const weight = this.#finalWeights.get(index);
    if (weight !== undefined) {
      throw new Error(
        `Final weight is already set for ${index} (set to ${weight.value}, new value ${value})`
      );
    }

    this.#finalWeights.set(index, { value, meta });
  }

  addConfirmedFoxOdd(index: number, totalFoxesForPattern: number) {
    const prev = this.#foxOdds.get(index) ?? {
      confirmedFoxes: 0,
      totalFoxesForPatterns: 0,
    };
    this.#foxOdds.set(index, {
      confirmedFoxes: prev.confirmedFoxes + 1,
      totalFoxesForPatterns: prev.totalFoxesForPatterns + totalFoxesForPattern,
    });
    this.#foxCount += 1;
  }

  setCandidatePatterns(candidatePatterns: readonly CommunityDataPattern[]) {
    this.#candidatePatterns = candidatePatterns;
  }

  deleteSuggestionsAt(index: number) {
    return this.#suggestions.delete(index);
  }

  resetSuggestionsFor(state: TargetTileState) {
    for (const [, suggestion] of this.#suggestions) {
      suggestion[state] = 0;
    }
  }

  resetSmartFillFor(state: SmartFill) {
    for (const index of this.#smartFillsReverse[state]) {
      this.#smartFills.delete(index);
    }
    this.#smartFillsReverse[state] = [];
  }

  isEmptyAt(index: number) {
    const userSetState = this.getUserState(index);
    const smartFillState = this.getSmartFill(index);

    if (userSetState === TileState.Unknown && smartFillState === null) {
      return true;
    }
    return false;
  }

  getStateEligibility(state: TileState, index: number): StateTileEligibility {
    const userSetState = this.getUserState(index);
    const smartFillState = this.getSmartFill(index);

    if (userSetState === state || smartFillState === state) {
      return StateTileEligibility.Present;
    }
    if (userSetState === TileState.Unknown && smartFillState === null) {
      return StateTileEligibility.Empty;
    }
    return StateTileEligibility.Taken;
  }

  setPatternIdentifier(patternIdentifier: string) {
    if (this.#patternIdentifier !== null) {
      throw new Error(
        `Pattern Identifier has already been set to ${patternIdentifier}`
      );
    }
    this.#patternIdentifier = patternIdentifier;
  }

  finalize(solveStep: SolveStep) {
    let maxWeight = 0;
    for (let index = 0; index < BOARD_CELLS; index++) {
      const finalWeight = this.getFinalWeight(index);
      if (finalWeight !== null && finalWeight.value > maxWeight) {
        maxWeight = finalWeight.value;
      }
    }

    return new SolveState(
      this,
      this.#suggestions,
      this.#finalWeights,
      maxWeight,
      solveStep,
      this.#foxOdds,
      this.#candidatePatterns ?? null
    );
  }

  static #createTileSuggestion(): TileSuggestion {
    return {
      [TileState.Blocked]: 0,
      [TileState.Present]: 0,
      [TileState.Sword]: 0,
      [TileState.Fox]: 0,
    };
  }
}
