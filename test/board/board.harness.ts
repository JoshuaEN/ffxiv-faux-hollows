import { Board } from "~/src/game/board.js";
import { TileState } from "~/src/game/types/tile-states.js";
import { assertDefined } from "~/src/helpers.js";
import { AutoSolverHarness } from "../auto-solver/full/types/auto-solver.harness.js";
import { patternToPictograph } from "../helpers/print-helpers.js";

export class BoardHarness implements AutoSolverHarness {
  #board = new Board();

  getHarnessName(): string {
    return "BoardHarness";
  }

  getRecommendedTiles() {
    return this.#board.tiles
      .map((tile, i) => ({ tile, index: i }))
      .filter((data) => Array.isArray(data.tile))
      .map((data) => data.index);
  }

  getTileState(index: number) {
    const tile = this.#board.tiles[index];
    assertDefined(tile);
    if (Array.isArray(tile)) {
      return TileState.Unknown;
    }
    return tile;
  }

  setUserSelection(index: number, tileState: TileState) {
    this.#board.setUserState(index, tileState);
  }

  getPatternData() {
    return {
      remainingPatternsIds:
        this.#board.solveState
          .getCandidatePatterns()
          ?.map((p) => patternToPictograph(p)) ?? null,
    };
  }

  reset() {
    this.#board = new Board();
  }
}
