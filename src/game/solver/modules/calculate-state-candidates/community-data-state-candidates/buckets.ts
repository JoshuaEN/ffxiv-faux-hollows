import { BOARD_CELLS } from "~/src/game/constants.js";
import { createCommunityDataStateCandidatesFoxOmitsSolver } from "./base-fox-omits.js";
import { TileState } from "~/src/game/types/tile-states.js";

export const calculateStatesCandidates =
  createCommunityDataStateCandidatesFoxOmitsSolver(
    (shapes, filteredPatterns, solveState) => {
      // for (let i = 0; i < BOARD_CELLS; i++) {
      //   if ()
      // }
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
          if (count === filteredPatterns.length) {
            solveState.setSmartFill(index, state);
          } else {
            // solveState.addSuggestion(index, state, count);
          }
        }
      }

      for (const [index, sets] of indexSets) {
        let min = Number.MAX_SAFE_INTEGER;
        let max = -1;
        for (const [, count] of sets) {
          min = Math.min(min, count);
          max = Math.max(max, count);
        }
        if (solveState.getSmartFill(index) === null) {
          const sdev = getStandardDeviation(Array.from(sets.values()));
          solveState.addSuggestion(
            index,
            TileState.Sword,
            1000 - sdev + sets.size
          );
          // solveState.addSuggestion(index, TileState.Present);
          // console.log(index, sdev, Array.from(sets.values()), sets.size);
          // solveState.addSuggestion(index, TileState.Fox, max);
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
