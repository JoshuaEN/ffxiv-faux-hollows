import { applyFoxSuggestions } from "../../../helpers/apply-fox-suggestions.js";
import { setFinalWeightsFromSuggestions } from "../../../helpers/weight-applier.js";
import { calculateSuggestionWeight } from "../../index.js";
import { createCommunityDataStateCandidatesFoxOmitsSolver } from "./base-fox-omits.js";

export const calculateStatesCandidates =
  createCommunityDataStateCandidatesFoxOmitsSolver(
    (shapes, _only, filteredPatterns, solveState) => {
      for (const { state } of shapes) {
        const commonIndexes = new Map<number, number>();
        for (const pattern of filteredPatterns) {
          const indexes = pattern.boundingBox[state].indexes();
          for (const index of indexes) {
            commonIndexes.set(index, (commonIndexes.get(index) ?? 0) + 1);
          }
        }

        for (const [index, count] of commonIndexes) {
          if (count === filteredPatterns.length) {
            solveState.setSmartFill(index, state);
          } else {
            solveState.addSuggestion(index, state, count);
          }
        }
      }

      applyFoxSuggestions(filteredPatterns, solveState);
      setFinalWeightsFromSuggestions(solveState, calculateSuggestionWeight);
    }
  );
