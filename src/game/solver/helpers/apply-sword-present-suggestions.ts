import { IndeterminateSolveState } from "../../types/solve-state.js";
import { TileState } from "../../types/tile-states.js";
import { ProcessedPattern } from "../modules/calculate-state-candidates/community-data-state-candidates/base-fox-omits.js";

export function applySwordPresentSuggestions(
  candidatePatterns: ProcessedPattern[],
  solveState: IndeterminateSolveState
) {
  for (const pattern of candidatePatterns) {
    for (const state of [TileState.Sword, TileState.Present] as const) {
      for (const index of pattern.boundingBox[state].indexes()) {
        if (solveState.isEmptyAt(index)) {
          solveState.addSuggestion(index, TileState[state], 1);
        }
      }
    }
  }
}
