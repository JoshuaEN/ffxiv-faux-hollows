import { BoardIssue } from "./board-issue.js";
import { CommunityDataPattern } from "./community-data.js";
import {
  SolveState,
  IndeterminateSolveState,
  PartialTileSuggestion,
} from "./solve-state.js";
import { TrackedStatesIndexList } from "./tile-states.js";

export type StateCandidatesResult =
  | {
      solved: {
        Present: number;
        Sword: number;
      };
      solveState: SolveState;
      issues: BoardIssue[];
      candidatePatterns: CommunityDataPattern[];
    }
  | {
      solved: {
        Present: number;
        Sword: number;
      };
      solveState: null;
      issues: BoardIssue[];
      candidatePatterns: CommunityDataPattern[];
    };
export type CalculateStatesCandidatesFunction = (
  solveState: IndeterminateSolveState,
  userStatesIndexList: TrackedStatesIndexList<ReadonlySet<number>>,
  patterns: readonly CommunityDataPattern[]
) => StateCandidatesResult;

export type CalculateSuggestionWeight = (
  suggestion: PartialTileSuggestion,
  smartFillOverrideWeight: number
) => number;
