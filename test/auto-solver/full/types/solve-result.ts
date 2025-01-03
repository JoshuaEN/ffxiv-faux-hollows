import { CommunityDataIdentifiers } from "~/src/game/generated-community-data.js";
import { CommunityDataPattern } from "~/src/game/types/community-data.js";
import { TileState } from "~/src/game/types/tile-states.js";
import { AutoSolveStrategy } from "./strategies.js";

export interface AutoSolveStep {
  index: number;
  state: TileState;
  stepNumber: number;
  patternsRemaining: number;
  foxCandidates: number;
  solvedSword: boolean;
  solvedPresent: boolean;
  solvedFox: boolean;
}

export interface AutoSolveStrategyResult {
  stepRecommendationIndexes: readonly number[];

  identifier: CommunityDataIdentifiers;
  pattern: string;
  foxIndex: number | undefined;

  strategy: AutoSolveStrategy;

  FoundSword: number;
  FoundPresent: number;
  FoundFox: number;

  UncoverSword: number;
  UncoverPresent: number;
  UncoverFox: number;

  steps: AutoSolveStep[];
}

export interface AutoSolveResult {
  identifier: string;
  pattern: CommunityDataPattern;
  foxIndex: number | undefined;
  SwordPresent: AutoSolveStrategyResult[];
  SwordFox: AutoSolveStrategyResult[];
  PresentFox: AutoSolveStrategyResult[];
  Fox: AutoSolveStrategyResult[];
  All: AutoSolveStrategyResult[];
}

export interface ExtendedAutoSolveStrategyResult
  extends Omit<AutoSolveStrategyResult, "stepRecommendationIndexes"> {
  identifier: CommunityDataIdentifiers;
  patternData: CommunityDataPattern;
}
