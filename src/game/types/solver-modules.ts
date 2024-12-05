import { BoardIssue } from "./board-issue.js";
import { CommunityDataPattern } from "./community-data.js";
import {
  SolveState,
  IndeterminateSolveState,
  TileSuggestion,
} from "./solve-state.js";

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
  patterns: readonly CommunityDataPattern[]
) => StateCandidatesResult;

export type CalculateSuggestionWeight = (suggestion: TileSuggestion) => number;
