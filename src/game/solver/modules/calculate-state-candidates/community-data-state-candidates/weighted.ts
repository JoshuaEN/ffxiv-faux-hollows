import { TileState } from "~/src/game/types/tile-states.js";
import { createCommunityDataStateCandidatesFoxOmitsSolver } from "./base-fox-omits.js";

export const calculateStatesCandidates =
  createCommunityDataStateCandidatesFoxOmitsSolver(
    (shapes, _only, filteredPatterns, solveState) => {
      for (const { state } of shapes) {
        const startIndexTracker = new Set<string>();
        const commonIndexes = new Map<number, number>();
        for (const pattern of filteredPatterns) {
          const key = `${state === TileState.Sword ? `${pattern.pattern.Sword}${pattern.pattern.Sword3x2}` : `${pattern.pattern.Present}`}`;
          if (startIndexTracker.has(key)) {
            continue;
          }
          startIndexTracker.add(key);
          const indexes = pattern.boundingBox[state].indexes();
          for (const index of indexes) {
            commonIndexes.set(index, (commonIndexes.get(index) ?? 0) + 1);
          }
        }

        for (const [index, count] of commonIndexes) {
          if (count === startIndexTracker.size) {
            solveState.setSmartFill(index, state);
          } else {
            solveState.addSuggestion(index, state, count);
          }
        }
      }
    }
  );
