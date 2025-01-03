import { CommunityDataPattern } from "~/src/game/types/community-data.js";
import { ExtendedAutoSolveStrategyResult } from "./solve-result.js";

export interface AutoSolverCollapsedPossibilityItem {
  SwordPresent: ExtendedAutoSolveStrategyResult[];
  SwordFox: ExtendedAutoSolveStrategyResult[];
  PresentFox: ExtendedAutoSolveStrategyResult[];
  Fox: ExtendedAutoSolveStrategyResult[];
  All: ExtendedAutoSolveStrategyResult[];
  Everything: ExtendedAutoSolveStrategyResult[];
}
export type AutoSolverCollapsedPossibilities = Map<
  CommunityDataPattern,
  AutoSolverCollapsedPossibilityItem
>;
