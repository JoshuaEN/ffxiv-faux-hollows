import {
  BoardIssue,
  TrackedStatesIndexList,
  TileState,
} from "../types/index.js";
import { getIdentifierCandidates } from "./identifier-candidates.js";
import { lengthEquals } from "../../helpers.js";
import { calculateStatesCandidates } from "./modules/index.js";
import {
  SolveState,
  IndeterminateSolveState,
  SolveStep,
} from "../types/solve-state.js";

export function calculatedSolveState(
  userSelected: readonly TileState[],
  _userStatesIndexList: TrackedStatesIndexList<ReadonlySet<number>>
): { solveState: SolveState; issues: BoardIssue[] } {
  const issues: BoardIssue[] = [];
  const solveState = new IndeterminateSolveState(
    userSelected,
    _userStatesIndexList
  );

  const {
    identifierCandidates,
    patternIdentifierCandidates,
    error: identifierCandidatesError,
    warning: identifierCandidatesWarning,
  } = getIdentifierCandidates(_userStatesIndexList[TileState.Blocked]);

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
    solveState.setCandidatePatterns(
      identifierCandidates.flatMap((p) => p.Patterns)
    );
    return { solveState: solveState.finalize(SolveStep.FillBlocked), issues };
  }
  const identifierCandidate = identifierCandidates[0];

  solveState.setPatternIdentifier(patternIdentifierCandidates[0] ?? "Missing");

  const {
    solved,
    solveState: calculateStatesCandidatesSolvedState,
    issues: calculateStatesCandidatesIssues,
    candidatePatterns,
  } = calculateStatesCandidates(solveState, identifierCandidate.Patterns);

  issues.push(...calculateStatesCandidatesIssues);
  if (calculateStatesCandidatesSolvedState !== null) {
    return { solveState: calculateStatesCandidatesSolvedState, issues };
  }

  const mainShapesSolved = solved.Present > -1 && solved.Sword > -1;
  solveState.setCandidatePatterns(candidatePatterns);

  if (mainShapesSolved && solveState.anyFoxes() === false) {
    return { solveState: solveState.finalize(SolveStep.Done), issues };
  }

  return {
    solveState: solveState.finalize(
      mainShapesSolved ? SolveStep.SuggestFoxes : SolveStep.SuggestTiles
    ),
    issues,
  };
}
