import {
  SmartFillTileState,
  SuggestTileState,
  TileState,
} from "~/src/game/types/tile-states.js";
import { MaybePromise } from "~/src/types/maybe-promise.js";

export interface AutoSolverHarness {
  getHarnessName(): string;

  /**
   * Returns array of recommended tile indexes
   */
  getRecommendedTiles(): MaybePromise<number[]>;

  getTileState(
    index: number
  ): MaybePromise<TileState | SmartFillTileState | SuggestTileState>;

  setUserSelection(index: number, tileState: TileState): MaybePromise<void>;

  getPatternData(): MaybePromise<{ remainingPatternsIds: string[] | null }>;

  /**
   * Resets the board
   */
  reset(): MaybePromise<void>;
}
