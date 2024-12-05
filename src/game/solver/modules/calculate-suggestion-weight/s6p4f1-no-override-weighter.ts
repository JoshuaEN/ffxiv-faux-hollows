import { PartialTileSuggestion } from "~/src/game/types/solve-state.js";
import { TileState } from "~/src/game/types/tile-states.js";

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

export function calculateSuggestionWeight(
  suggestion: PartialTileSuggestion,
  _: number
) {
  const finalPresentWeight =
    suggestion[TileState.Present] * PRESENT_WEIGHT_FACTOR;

  const finalSwordWeight = suggestion[TileState.Sword] * SWORD_WEIGHT_FACTOR;

  const finalWeight =
    finalPresentWeight + finalSwordWeight + suggestion[TileState.Fox];

  return finalWeight;
}
