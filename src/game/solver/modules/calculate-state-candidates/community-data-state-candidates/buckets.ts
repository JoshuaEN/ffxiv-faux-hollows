import { assertLengthAtLeast } from "~/src/helpers.js";
import { applyFoxSuggestions } from "../../../helpers/apply-fox-suggestions.js";
import { createCommunityDataStateCandidatesFoxOmitsSolver } from "./base-fox-omits.js";
import { TileState } from "~/src/game/types/tile-states.js";
import { findIncompleteSmartFills } from "../../../helpers/incomplete-smart-fill.js";

export const calculateStatesCandidates =
  createCommunityDataStateCandidatesFoxOmitsSolver(
    (shapes, { onlySword, onlyPresent }, filteredPatterns, solveState) => {
      const indexSets = new Map<number, Map<string, number>>();
      for (const { state } of shapes) {
        const commonIndexes = new Map<number, number>();
        for (const pattern of filteredPatterns) {
          const indexes = pattern.boundingBox[state].indexes();

          const mapKey =
            state === TileState.Sword
              ? `${pattern.pattern.Sword}${pattern.pattern.Sword3x2}`
              : `${pattern.pattern.Present}`;
          for (const index of indexes) {
            commonIndexes.set(index, (commonIndexes.get(index) ?? 0) + 1);
            let set = indexSets.get(index);
            if (set === undefined) {
              set = new Map();
              indexSets.set(index, set);
            }
            set.set(mapKey, (set.get(mapKey) ?? 0) + 1);
          }
        }

        for (const [index, count] of commonIndexes) {
          if (
            count === filteredPatterns.length &&
            (state === TileState.Sword ? onlySword : onlyPresent) !== null
          ) {
            solveState.setSmartFill(index, state);
          } else {
            solveState.addSuggestion(index, state, count);
          }
        }
      }

      applyFoxSuggestions(filteredPatterns, solveState);

      const incompleteSmartFills = findIncompleteSmartFills(solveState);

      if (incompleteSmartFills.Sword) {
        solveState.resetSmartFillFor(TileState.Sword);
      }
      if (incompleteSmartFills.Present) {
        solveState.resetSmartFillFor(TileState.Present);
      }

      for (const [index, sets] of indexSets) {
        let min = Number.MAX_SAFE_INTEGER;
        let max = -1;
        for (const [, count] of sets) {
          min = Math.min(min, count);
          max = Math.max(max, count);
        }
        if (solveState.isEmptyAt(index)) {
          const sdev = getStandardDeviation(Array.from(sets.values()));
          const foxOdds = solveState.getFoxOdds(index) ?? {
            confirmedFoxes: 0,
            totalFoxesForPatterns: 0,
          };
          solveState.setFinalWeight(
            index,
            1000 * (100 - Math.round(sdev * 1000) / 1000 + sets.size) +
              foxOdds.confirmedFoxes
          );
        }
      }

      if (filteredPatterns.length === 1) {
        assertLengthAtLeast(filteredPatterns, 1);
        for (const index of filteredPatterns[0].pattern.ConfirmedFoxes) {
          solveState.setFinalWeight(index, 1);
        }
      }
    }
  );
function getStandardDeviation(array: number[]) {
  const n = array.length;
  const mean = array.reduce((a, b) => a + b) / n;
  return Math.sqrt(
    array.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n
  );
}
