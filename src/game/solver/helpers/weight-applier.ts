import { BOARD_CELLS } from "../../constants.js";
import {
  IndeterminateSolveState,
  TileSuggestion,
} from "../../types/solve-state.js";
import { TileState } from "../../types/tile-states.js";
import { findIncompleteSmartFills } from "./incomplete-smart-fill.js";

/**
 * There is an edge case where there is some smart fill information for a shape, however:
 * 1. Parts of the shape are still unknown
 * 2. The user has not entered any of that shape (if they had, we would be in FillShape mode)
 * In this case, we want to recommend the smart fill tiles for that shape since we know it will
 * uncover information.
 */
const SMART_FILL_WEIGHT_VALUE = 1_000_000;

export function setFinalWeightsFromSuggestions(
  solveState: IndeterminateSolveState,
  calculateSuggestionWeight: (suggestion: TileSuggestion) => number
) {
  const incompleteSmartFills = findIncompleteSmartFills(solveState);

  for (let index = 0; index < BOARD_CELLS; index++) {
    const smartFill = solveState.getSmartFill(index);
    if (
      (smartFill === TileState.Sword || smartFill === TileState.Present) &&
      incompleteSmartFills[smartFill]
    ) {
      solveState.addSuggestion(index, smartFill, 1);
      solveState.setFinalWeight(index, SMART_FILL_WEIGHT_VALUE);
    } else {
      const suggestion = solveState.getSuggestion(index);
      if (suggestion !== null) {
        solveState.setFinalWeight(index, calculateSuggestionWeight(suggestion));
      }
    }
  }
  if (incompleteSmartFills.Sword) {
    solveState.resetSmartFillFor(TileState.Sword);
  }
  if (incompleteSmartFills.Present) {
    solveState.resetSmartFillFor(TileState.Present);
  }
}
