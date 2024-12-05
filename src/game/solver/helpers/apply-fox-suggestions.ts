import { CommunityDataPattern } from "../../types/community-data.js";
import { IndeterminateSolveState } from "../../types/solve-state.js";
import { TileState } from "../../types/tile-states.js";
import { ProcessedPattern } from "../modules/calculate-state-candidates/community-data-state-candidates/base-fox-omits.js";

export function applyFoxSuggestions(
  candidatePatterns: CommunityDataPattern[] | ProcessedPattern[],
  solveState: IndeterminateSolveState
) {
  let anyFoxes = false;
  // If the user has entered a fox, we can skip all of this
  if (solveState.userStatesIndexList[TileState.Fox].size === 0) {
    for (const pattern of candidatePatterns) {
      const confirmedFoxes = isProcessedPattern(pattern)
        ? pattern.pattern.ConfirmedFoxes
        : pattern.ConfirmedFoxes;
      for (const confirmedFox of confirmedFoxes) {
        if (solveState.isEmptyAt(confirmedFox)) {
          anyFoxes = true;
          solveState.addSuggestion(confirmedFox, TileState.Fox, 1);
          solveState.addConfirmedFoxOdd(confirmedFox, confirmedFoxes.length);
        }
      }
    }
  }

  return { anyFoxes };
}

function isProcessedPattern(
  pattern: CommunityDataPattern | ProcessedPattern
): pattern is ProcessedPattern {
  return "pattern" in pattern;
}
