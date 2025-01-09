import { AutoSolveStep } from "../types/solve-result.js";

export function isFoxCandidatesShownOrFoxFound(step: AutoSolveStep) {
  return step.solvedFox || isFoxCandidatesShown(step);
}

export function isFoxCandidatesShown(step: AutoSolveStep) {
  // The tester doesn't use `null` when there are no fox candidates shown on the board and instead reports 0.
  // So we have to check that fox candidates is greater than 0 in addition to <= 4.
  // (I don't want to rerun the tester because it takes a long time to run)
  return step.foxCandidates > 0 && step.foxCandidates <= 4;
}
