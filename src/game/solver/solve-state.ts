import { cordToIndex, indexToCord } from "../helpers";
import {
  BoardIssue,
  IndeterminateSolveState,
  SolveState,
  SolveStep,
  TrackedStatesIndexList,
  TileState,
  StateTileEligibility,
  CommunityDataPattern,
} from "../types";
import { calculateStatesCandidates } from "./state-candidates";
import { getIdentifierCandidates } from "./identifier-candidates";
import { lengthEquals } from "../../helpers";

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
  const blocked = new Set<number>();
  const allBlockedIdentified = lengthEquals(identifierCandidates, 1);
  if (allBlockedIdentified) {
    for (const index of identifierCandidates[0].Blocked) {
      blocked.add(index);
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
  // Is everything solved?
  if (mainShapesSolved && userStatesIndexList[TileState.Fox].size > 0) {
    return { solveState: solveState.finalize(SolveStep.Done), issues };
  }

  /**
   * Identify fox candidates
   */

  // If the user has entered a fox, we can skip all of this
  let anyFoxes = false;
  if (userStatesIndexList[TileState.Fox].size === 0) {
    for (const pattern of candidatePatterns) {
      for (const confirmedFox of pattern.ConfirmedFoxes) {
        if (solveState.isEmptyAt(confirmedFox)) {
          anyFoxes = true;
          solveState.addSuggestion(confirmedFox, TileState.Fox, 1);
        }
      }
    }
  }

  if (mainShapesSolved && !anyFoxes) {
    return { solveState: solveState.finalize(SolveStep.Done), issues };
  }

  return { solveState: solveState.finalize(SolveStep.SuggestTiles), issues };
}
