import { BOARD_CELLS } from "~/src/game/constants.js";
import { createCommunityDataStateCandidatesFoxOmitsSolver } from "./base-fox-omits.js";
import { TileState } from "~/src/game/types/tile-states.js";
import { BoundingBox } from "../../../helpers.js";

export const calculateStatesCandidates =
  createCommunityDataStateCandidatesFoxOmitsSolver(
    (shapes, { onlySword, onlyPresent }, filteredPatterns, solveState) => {
      // for (let i = 0; i < BOARD_CELLS; i++) {
      //   if ()
      // }

      const indexOpportunityCost = new Map<number, number>();

      for (const pattern of filteredPatterns) {
        for (const index of pattern.pattern.ConfirmedFoxes) {
          for (const otherPattern of filteredPatterns) {
            if (pattern === otherPattern) {
              continue;
            }
            calcOpportunityCost(
              otherPattern.boundingBox.Present,
              index,
              indexOpportunityCost
            );
            calcOpportunityCost(
              otherPattern.boundingBox.Sword,
              index,
              indexOpportunityCost
            );
          }
        }
        // for (const index of pattern.boundingBox.Present.indexes()) {
        //   indexOpportunityCost.set(index, (indexOpportunityCost.get(index)?? 0) + 1)
        // }
        // for (const index of pattern.boundingBox.Sword.indexes()) {
        //   indexOpportunityCost.set(index, (indexOpportunityCost.get(index)?? 0) + 1)
        // }
        // for (const index of pattern.boundingBox.Sword.indexes()) {
        //   indexOpportunityCost.set(index, (indexOpportunityCost.get(index)?? 0) + 1)
        // }
      }

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
            // solveState.addSuggestion(index, state, count);
          }
        }
      }

      let patternSpecialCaseHandling;
      // for (const i of [7, 10, 18, 21, 29]) {
      //   if (solveState.getSmartFill(i) === TileState.Blocked || solveState.getUserState(i) === TileState.Blocked) {
      //     blocked.push(i);
      //   }

      // }
      for (let i = 0; i < BOARD_CELLS; i++) {}

      for (const [index, sets] of indexSets) {
        // let min = Number.MAX_SAFE_INTEGER;
        // let max = -1;
        // for (const [, count] of sets) {
        //   min = Math.min(min, count);
        //   max = Math.max(max, count);
        // }

        if (solveState.getSmartFill(index) === null) {
          const sdev = getStandardDeviation(Array.from(sets.values()));
          solveState.addSuggestion(
            index,
            TileState.Sword,
            10 * (1000 - sdev + sets.size) -
              ((indexOpportunityCost.get(index) ?? 0) > 0 ? 1 : 0)
          );
          // solveState.addSuggestion(index, TileState.Present);
          // console.log(index, sdev, Array.from(sets.values()), sets.size);
          // solveState.addSuggestion(index, TileState.Fox, max);
        }
      }
    }
  );
function calcOpportunityCost(
  boundingBox: BoundingBox,
  index: number,
  indexOpportunityCost: Map<number, number>
) {
  if (boundingBox.contains(index)) {
    for (const otherIndex of boundingBox.indexes()) {
      if (otherIndex !== index) {
        indexOpportunityCost.set(
          otherIndex,
          (indexOpportunityCost.get(otherIndex) ?? 0) + 1
        );
      }
    }
  }
}

function getStandardDeviation(array: number[]) {
  const n = array.length;
  const mean = array.reduce((a, b) => a + b) / n;
  return Math.sqrt(
    array.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n
  );
}
