import { PartialTileSuggestion } from "~/src/game/types/solve-state.js";
import { TileState } from "~/src/game/types/tile-states.js";

export function calculateSuggestionWeight(
  suggestion: PartialTileSuggestion,
  smartFillOverrideWeight: number
) {
  if (smartFillOverrideWeight > 0) {
    return smartFillOverrideWeight;
  }

  return suggestion[TileState.Sword] * 1_000 + suggestion[TileState.Present];
}
