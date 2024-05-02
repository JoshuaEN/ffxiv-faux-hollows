import {
  BoardIssue,
  IndeterminateSolveState,
  SolveState,
  SolveStep,
  TrackedStatesIndexList,
  TileState,
} from "../types/index.js";
import { calculateStatesCandidates } from "./state-candidates.js";
import { getIdentifierCandidates } from "./identifier-candidates.js";
import { lengthEquals } from "../../helpers.js";

export function calculatedSolveState(
  userSelected: readonly TileState[],
  userStatesIndexList: TrackedStatesIndexList<ReadonlySet<number>>
): { solveState: SolveState; issues: BoardIssue[] } {
  const issues: BoardIssue[] = [];
  const solveState = new IndeterminateSolveState(userSelected);

  const {
    identifierCandidates,
    patternIdentifierCandidates,
    error: identifierCandidatesError,
    warning: identifierCandidatesWarning,
  } = getIdentifierCandidates(userStatesIndexList[TileState.Blocked]);

  if (identifierCandidatesWarning instanceof BoardIssue) {
    issues.push(identifierCandidatesWarning);
  }

  if (identifierCandidatesError instanceof BoardIssue) {
    issues.push(identifierCandidatesError);
    return { solveState: solveState.finalize(SolveStep.FillBlocked), issues };
  }

  /**
   * Identify and Verify Blocked Tiles
   */
  const allBlockedIdentified = lengthEquals(identifierCandidates, 1);
  if (allBlockedIdentified) {
    for (const index of identifierCandidates[0].Blocked) {
      solveState.setSmartFill(index, TileState.Blocked);
    }
  }

  // If all blocked are not present, we skip trying to find the best spot because there's no value
  if (!allBlockedIdentified) {
    return { solveState: solveState.finalize(SolveStep.FillBlocked), issues };
  }
  const identifierCandidate = identifierCandidates[0];

  solveState.setPatternIdentifier(patternIdentifierCandidates[0] ?? "Missing");

  const {
    solved,
    solveState: calculateStatesCandidatesSolvedState,
    issues: calculateStatesCandidatesIssues,
    candidatePatterns,
  } = calculateStatesCandidates(
    solveState,
    userStatesIndexList,
    identifierCandidate.Patterns
  );

  issues.push(...calculateStatesCandidatesIssues);
  if (calculateStatesCandidatesSolvedState !== null) {
    return { solveState: calculateStatesCandidatesSolvedState, issues };
  }

  const mainShapesSolved = solved.Present > -1 && solved.Sword > -1;
  solveState.setTotalCandidatePatterns(candidatePatterns.length);

  /**
   * Identify fox candidates
   */

  let anyFoxes = false;
  // If the user has entered a fox, we can skip all of this
  if (userStatesIndexList[TileState.Fox].size === 0) {
    for (const pattern of candidatePatterns) {
      for (const confirmedFox of pattern.ConfirmedFoxes) {
        if (solveState.isEmptyAt(confirmedFox)) {
          anyFoxes = true;
          solveState.addSuggestion(confirmedFox, TileState.Fox, 1);
          solveState.addConfirmedFoxOdd(
            confirmedFox,
            pattern.ConfirmedFoxes.length + pattern.UnconfirmedFoxes.length
          );
        }
      }
      for (const unconfirmedFox of pattern.UnconfirmedFoxes) {
        if (solveState.isEmptyAt(unconfirmedFox)) {
          anyFoxes = true;
          solveState.addUnconfirmedFoxOdd(
            unconfirmedFox,
            pattern.ConfirmedFoxes.length + pattern.UnconfirmedFoxes.length
          );
        }
      }
    }
  }

  if (mainShapesSolved && !anyFoxes) {
    return { solveState: solveState.finalize(SolveStep.Done), issues };
  }

  return { solveState: solveState.finalize(SolveStep.SuggestTiles), issues };
}
