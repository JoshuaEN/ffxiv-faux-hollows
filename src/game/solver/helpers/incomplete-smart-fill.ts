import { IndeterminateSolveState } from "../../types/solve-state.js";
import { TileState } from "../../types/tile-states.js";

export function findIncompleteSmartFills(solveState: IndeterminateSolveState) {
  const suggestSmartFill = {
    [TileState.Sword]: false,
    [TileState.Present]: false,
  };
  const solved = solveState.getSolved();
  for (const state of [TileState.Sword, TileState.Present] as const) {
    if (
      !solved[state] &&
      solveState.getSmartFillReversedCount(state) > 0 &&
      solveState.userStatesIndexList[state].size === 0
    ) {
      suggestSmartFill[state] = true;
    }
  }

  return suggestSmartFill;
}
