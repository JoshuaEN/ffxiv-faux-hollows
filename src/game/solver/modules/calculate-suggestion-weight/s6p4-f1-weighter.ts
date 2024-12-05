import { TileSuggestion } from "~/src/game/types/solve-state.js";
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

export function calculateSuggestionWeight(suggestion: TileSuggestion) {
  const finalPresentWeight =
    suggestion[TileState.Present] * PRESENT_WEIGHT_FACTOR;

  const finalSwordWeight = suggestion[TileState.Sword] * SWORD_WEIGHT_FACTOR;

  const finalWeight =
    (finalPresentWeight + finalSwordWeight) * DISAMBIGUATION_FACTOR +
    suggestion[TileState.Fox];

  return finalWeight;
}
