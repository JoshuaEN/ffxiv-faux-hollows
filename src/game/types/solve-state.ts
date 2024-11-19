import { BOARD_CELLS } from "../constants.js";
import { calculateSuggestionWeight } from "../solver/modules/index.js";
import { TargetTileState, TileState } from "./../types/tile-states.js";
import { CommunityDataPattern } from "./community-data.js";

export interface TileSuggestion {
  [TileState.Blocked]: number;
  [TileState.Present]: number;
  [TileState.Sword]: number;
  [TileState.Fox]: number;
  FinalWeight: number;
}

export type PartialTileSuggestion = Omit<TileSuggestion, "FinalWeight">;

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

/**
 * There is an edge case where there is some smart fill information for a shape, however:
 * 1. Parts of the shape are still unknown
 * 2. The user has not entered any of that shape (if they had, we would be in FillShape mode)
 * In this case, we want to recommend the smart fill tiles for that shape since we know it will
 * uncover information.
 */
const SMART_FILL_WEIGHT_VALUE = 1_000_000;

export class SolveState {
  constructor(
    readonly solveState: IndeterminateSolveState,
    readonly suggestions: ReadonlyMap<number, TileSuggestion>,
    readonly peakSuggestions: TileSuggestion,
    readonly solveStep: SolveStep,
    readonly foxOdds: ReadonlyMap<number, FoxOdds>,
    readonly totalCandidatePatterns: number
  ) {}

  getSmartFill(index: number) {
    return this.solveState.getSmartFill(index);
  }

  getSuggestion(index: number): Readonly<TileSuggestion> | null {
    return this.suggestions.get(index) ?? null;
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
    const oddsOfPatternHavingFox = foxesOnIndex / this.totalCandidatePatterns;
    // Of all possible foxes given the current possible patterns, what percent of the time will the fox be on this tile.
    const oddsOfTileHavingFoxInPatternsWithFoxes =
      foxesOnIndex / foxDetails.totalFoxesForPatterns;
    return {
      confirmedFoxes: foxDetails.confirmedFoxes,
      odds: oddsOfPatternHavingFox * oddsOfTileHavingFoxInPatternsWithFoxes,
    };
  }

  getPeakSuggestions() {
    return this.peakSuggestions;
  }

  getPatternIdentifier() {
    return this.solveState.getPatternIdentifier();
  }
}

export class IndeterminateSolveState {
  #userStates: readonly TileState[];
  #smartFills = new Map<number, SmartFill>();
  #smartFillsReverse: Record<SmartFill, number[]> = {
    [TileState.Sword]: [],
    [TileState.Present]: [],
    [TileState.Blocked]: [],
  };
  #suggestions = new Map<number, PartialTileSuggestion>();
  #patternIdentifier: string | null = null;
  #foxOdds = new Map<number, FoxOdds>();
  #candidatePatterns: CommunityDataPattern[] = [];
  #solved = {
    [TileState.Sword]: false,
    [TileState.Present]: false,
  };

  constructor(userSelectedStates: readonly TileState[]) {
    this.#userStates = userSelectedStates.slice();
  }

  getUserState(index: number) {
    return this.#userStates[index];
  }

  getSmartFill(index: number) {
    return this.#smartFills.get(index) ?? null;
  }

  getSuggestion(index: number): Readonly<PartialTileSuggestion> | null {
    return this.#suggestions.get(index) ?? null;
  }

  getPatternIdentifier() {
    return this.#patternIdentifier;
  }

  getCandidatePatterns() {
    return [...this.#candidatePatterns];
  }

  getSolved() {
    return { ...this.#solved };
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
    if (this.#smartFills.get(index) !== undefined) {
      throw new Error(
        `${value} is already set to smart fill ${this.#smartFills.get(index)}`
      );
    }

    const suggestion =
      this.#suggestions.get(index) ??
      IndeterminateSolveState.#createTileSuggestion();

    suggestion[state] += value;

    this.#suggestions.set(index, suggestion);
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
  }

  setCandidatePatterns(candidatePatterns: CommunityDataPattern[]) {
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
    const suggestions = new Map<number, TileSuggestion>();
    const peakSuggestions = IndeterminateSolveState.#createTileSuggestion();

    const suggestSmartFill = {
      [TileState.Sword]: false,
      [TileState.Present]: false,
    };
    for (const state of [TileState.Sword, TileState.Present] as const) {
      if (
        !this.#solved[state] &&
        this.#smartFillsReverse[state].length > 0 &&
        this.#userStates.every((tile) => tile !== state)
      ) {
        suggestSmartFill[state] = true;
      }
    }

    for (let index = 0; index < BOARD_CELLS; index++) {
      const suggestion = this.#suggestions.get(index) ?? {
        Blocked: 0,
        Fox: 0,
        Present: 0,
        Sword: 0,
      };

      const processState = (
        state:
          | TileState.Blocked
          | TileState.Sword
          | TileState.Present
          | TileState.Fox
      ) => {
        peakSuggestions[state] = Math.max(
          peakSuggestions[state],
          suggestion[state]
        );
      };

      processState(TileState.Blocked);
      processState(TileState.Sword);
      processState(TileState.Present);
      processState(TileState.Fox);
      const smartFill = this.getSmartFill(index);
      const smartFillOverrideWeight =
        (suggestSmartFill[TileState.Present] &&
          smartFill === TileState.Present) ||
        (suggestSmartFill[TileState.Sword] && smartFill === TileState.Sword)
          ? SMART_FILL_WEIGHT_VALUE
          : 0;

      const finalWeight = calculateSuggestionWeight(
        suggestion,
        smartFillOverrideWeight
      );

      if (finalWeight <= 0) {
        continue;
      }

      peakSuggestions.FinalWeight = Math.max(
        peakSuggestions.FinalWeight,
        finalWeight
      );

      suggestions.set(index, {
        ...suggestion,
        FinalWeight: finalWeight,
      });
    }

    for (const state of [TileState.Sword, TileState.Present] as const) {
      if (suggestSmartFill[state]) {
        this.resetSmartFillFor(state);
      }
    }

    return new SolveState(
      this,
      suggestions,
      peakSuggestions,
      solveStep,
      this.#foxOdds,
      this.#candidatePatterns.length
    );
  }

  static #createTileSuggestion(): TileSuggestion {
    return {
      [TileState.Blocked]: 0,
      [TileState.Present]: 0,
      [TileState.Sword]: 0,
      [TileState.Fox]: 0,
      FinalWeight: 0,
    };
  }
}
