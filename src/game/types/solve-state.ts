import { BOARD_CELLS } from "../constants.js";
import { TargetTileState, TileState } from "./tile-states.js";

export interface TileSuggestion {
  [TileState.Blocked]: number;
  [TileState.Present]: number;
  [TileState.Sword]: number;
  [TileState.Fox]: number;
  FinalWeight: number;
}

type PartialTileSuggestion = Omit<TileSuggestion, "FinalWeight">;

export type SmartFill = TileState.Present | TileState.Sword | TileState.Blocked;

interface FoxOdds {
  confirmedFoxes: number;
  unconfirmedFoxes: number;
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
 * When calculating the finalWeight of a tile, the Present weight is multiplied by this
 * 4 is used because a present is 2x2
 */
const PRESENT_WEIGHT_FACTOR = 4;
/**
 * When calculating the finalWeight of a tile, the Sword weight is multiplied by this
 * 6 is sued because a sword is 2x3 or 3x2
 */
const SWORD_WEIGHT_FACTOR = 6;
/**
 * When calculating the finalWeight of a tile, the combined Present and Sword weight
 * is multiplied by this prior to adding the Fox weight.
 * This is so the Fox weight is only used as tie-breaks.
 *
 * The maximum value of a Fox weight varies based on the pattern, as different patterns have different
 * amounts of possible Present and Sword arrangements. This number can easily exceed 9, but does not approach 100
 * Thus, 1,000 was chosen to always have at least one 0 between the Present+Sword weight and the Fox weight,
 * for easier debugging.
 */
const DISAMBIGUATION_FACTOR = 1_000;

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
    unconfirmedFoxes: number;
    odds: number;
  }> | null {
    const foxDetails = this.foxOdds.get(index);
    if (foxDetails === undefined) {
      return null;
    }

    // This is both the number of fox candidates and the number of patterns foxes were present on for this tile (because, for a given pattern, a fox is either confirmed or unconfirmed on a tile)
    const foxesOnIndex =
      foxDetails.confirmedFoxes + foxDetails.unconfirmedFoxes;
    // Of all possible patterns (accounting for uncovered Presents/Swords), what percent may have a fox on this tile
    const oddsOfPatternHavingFox = foxesOnIndex / this.totalCandidatePatterns;
    // Of all possible foxes given the current possible patterns, what percent of the time will the fox be on this tile.
    const oddsOfTileHavingFoxInPatternsWithFoxes =
      foxesOnIndex / foxDetails.totalFoxesForPatterns;
    return {
      confirmedFoxes: foxDetails.confirmedFoxes,
      unconfirmedFoxes: foxDetails.unconfirmedFoxes,
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
  #suggestions = new Map<number, PartialTileSuggestion>();
  #patternIdentifier: string | null = null;
  #foxOdds = new Map<number, FoxOdds>();
  #totalCandidatePatterns = -1;

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

  setSmartFill(index: number, state: SmartFill) {
    if (import.meta.env.DEV) {
      const currentState = this.#smartFills.get(index);
      if (currentState !== undefined && currentState !== state) {
        console.error(
          `${index} was already set to state ${
            this.#smartFills.get(index) ?? "undefined"
          }`
        );
      }
    }
    this.#smartFills.set(index, state);
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
      unconfirmedFoxes: 0,
      totalFoxesForPatterns: 0,
    };
    this.#foxOdds.set(index, {
      confirmedFoxes: prev.confirmedFoxes + 1,
      unconfirmedFoxes: prev.unconfirmedFoxes,
      totalFoxesForPatterns: prev.totalFoxesForPatterns + totalFoxesForPattern,
    });
  }

  addUnconfirmedFoxOdd(index: number, totalFoxesForPattern: number) {
    const prev = this.#foxOdds.get(index) ?? {
      confirmedFoxes: 0,
      unconfirmedFoxes: 0,
      totalFoxesForPatterns: 0,
    };
    this.#foxOdds.set(index, {
      confirmedFoxes: prev.confirmedFoxes,
      unconfirmedFoxes: prev.unconfirmedFoxes + 1,
      totalFoxesForPatterns: prev.totalFoxesForPatterns + totalFoxesForPattern,
    });
  }

  setTotalCandidatePatterns(totalCandidatePatterns: number) {
    this.#totalCandidatePatterns = totalCandidatePatterns;
  }

  deleteSuggestionsAt(index: number) {
    return this.#suggestions.delete(index);
  }

  resetSuggestionsFor(state: TargetTileState) {
    for (const [, suggestion] of this.#suggestions) {
      suggestion[state] = 0;
    }
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
    for (let index = 0; index < BOARD_CELLS; index++) {
      const suggestion = this.#suggestions.get(index);
      if (suggestion === undefined) {
        continue;
      }
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
      const finalWeight =
        (suggestion[TileState.Present] * PRESENT_WEIGHT_FACTOR +
          suggestion[TileState.Sword] * SWORD_WEIGHT_FACTOR) *
          DISAMBIGUATION_FACTOR +
        suggestion[TileState.Fox];

      peakSuggestions.FinalWeight = Math.max(
        peakSuggestions.FinalWeight,
        finalWeight
      );

      suggestions.set(index, {
        ...suggestion,
        FinalWeight: finalWeight,
      });
    }
    return new SolveState(
      this,
      suggestions,
      peakSuggestions,
      solveStep,
      this.#foxOdds,
      this.#totalCandidatePatterns
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
