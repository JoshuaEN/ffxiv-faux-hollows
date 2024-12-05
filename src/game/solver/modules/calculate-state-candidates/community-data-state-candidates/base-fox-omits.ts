/**
 *
 */

import {
  IndeterminateSolveState,
  SolveStep,
  StateTileEligibility,
} from "~/src/game/types/solve-state.js";
import { cordToIndex } from "../../../../helpers.js";
import {
  BoardIssue,
  BoardIssueSeverity,
  CommunityDataPattern,
  StateCandidatesResult,
  TileState,
} from "../../../../types/index.js";
import {
  BoundingBox,
  getBoundingBox,
  getCommunityDataPatternBoundingBox,
} from "../../../bounding-box.js";

export interface ShapeData {
  readonly state: TileState.Sword | TileState.Present;
  readonly title: string;
  readonly longSide: number;
  readonly shortSide: number;
  readonly boundingBox: BoundingBox | null;
}

export interface ProcessedPattern {
  readonly pattern: CommunityDataPattern;
  readonly boundingBox: {
    [TileState.Sword]: BoundingBox;
    [TileState.Present]: BoundingBox;
  };
}

export function createCommunityDataStateCandidatesFoxOmitsSolver(
  updateSolveState: (
    shapes: readonly ShapeData[],
    only: {
      onlySword: ProcessedPattern | null;
      onlyPresent: ProcessedPattern | null;
    },
    filteredPatterns: ProcessedPattern[],
    solveState: IndeterminateSolveState
  ) => void
) {
  return function calculateStatesCandidates(
    solveState: IndeterminateSolveState,
    patterns: readonly CommunityDataPattern[]
  ): StateCandidatesResult {
    const issues: BoardIssue[] = [];

    const shapes: readonly ShapeData[] = [
      {
        state: TileState.Sword,
        title: "Swords",
        longSide: 3,
        shortSide: 2,
        boundingBox: getBoundingBox(
          solveState.userStatesIndexList[TileState.Sword]
        ),
      },
      {
        state: TileState.Present,
        title: "Present / Box",
        longSide: 2,
        shortSide: 2,
        boundingBox: getBoundingBox(
          solveState.userStatesIndexList[TileState.Present]
        ),
      },
    ] as const;

    /**
     * Identify and Verify Present/Sword selection,
     * and determine candidate positions for each if there is no selection.
     */
    const solved: {
      [TileState.Present]: number;
      [TileState.Sword]: number;
    } = {
      [TileState.Present]: -1,
      [TileState.Sword]: -1,
    } as const;

    for (const shape of shapes) {
      solveState.resetSuggestionsFor(shape.state);
    }

    // Process existing user input data (and potentially smart fill from prior invocations of this recursive function)
    for (const shape of shapes) {
      const { boundingBox } = shape;
      if (boundingBox === null) {
        continue;
      }

      // Make sure the user input is logical
      const { isFatalError, issues: userSelectedIssues } =
        validateUserSelection(shape);

      issues.push(...userSelectedIssues);

      if (isFatalError) {
        return {
          solved,
          solveState: solveState.finalize(
            shape.state === TileState.Sword
              ? SolveStep.FillSword
              : SolveStep.FillPresent
          ),
          issues,
          candidatePatterns: [],
        };
      }
    }

    let filteredPatterns: ProcessedPattern[] = [];
    skipPattern: for (const pattern of patterns) {
      const patternBoundingBox: ProcessedPattern["boundingBox"] = {
        Present: getCommunityDataPatternBoundingBox(pattern, TileState.Present),
        Sword: getCommunityDataPatternBoundingBox(pattern, TileState.Sword),
      };

      const userFoundFox =
        solveState.userStatesIndexList[TileState.Fox].size > 0
          ? Array.from(
              solveState.userStatesIndexList[TileState.Fox].keys()
            )[0] ?? null
          : null;

      for (const shape of shapes) {
        for (const index of patternBoundingBox[shape.state].indexes()) {
          if (
            solveState.getStateEligibility(shape.state, index) ===
            StateTileEligibility.Taken
          ) {
            continue skipPattern;
          }
        }
        if (
          shape.boundingBox !== null &&
          !patternBoundingBox[shape.state].contains(shape.boundingBox)
        ) {
          continue skipPattern;
        }
      }

      let anyConfirmedFoxTilesNotTaken = false;
      let userFoundFoxInPattern = false;
      for (const index of pattern.ConfirmedFoxes) {
        if (userFoundFoxInPattern === false) {
          userFoundFoxInPattern = userFoundFox === index;
        }
        if (
          anyConfirmedFoxTilesNotTaken === false &&
          solveState.getStateEligibility(TileState.Fox, index) !==
            StateTileEligibility.Taken
        ) {
          anyConfirmedFoxTilesNotTaken = true;
        }
      }

      if (userFoundFox !== null && !userFoundFoxInPattern) {
        continue skipPattern;
      }

      if (!anyConfirmedFoxTilesNotTaken) {
        continue skipPattern;
      }

      filteredPatterns.push({ pattern, boundingBox: patternBoundingBox });
    }

    let onlySword: ProcessedPattern | null = filteredPatterns[0] ?? null;
    let onlyPresent: ProcessedPattern | null = filteredPatterns[0] ?? null;

    while (filteredPatterns.length > 1) {
      const loopStartState: {
        [TileState.Sword]: ProcessedPattern | null;
        [TileState.Present]: ProcessedPattern | null;
      } = {
        [TileState.Sword]: onlySword,
        [TileState.Present]: onlyPresent,
      } as const;
      onlySword ??= filteredPatterns[0] ?? null;
      onlyPresent ??= filteredPatterns[0] ?? null;

      for (let i = 1; i < filteredPatterns.length; i++) {
        const pattern = filteredPatterns[i]?.pattern;
        if (
          onlySword?.pattern.Sword !== pattern?.Sword ||
          onlySword?.pattern.Sword3x2 !== pattern?.Sword3x2
        ) {
          onlySword = null;
        }
        if (onlyPresent?.pattern.Present !== pattern?.Present) {
          onlyPresent = null;
        }
      }

      if (
        loopStartState[TileState.Sword] === onlySword &&
        loopStartState[TileState.Present] === onlyPresent
      ) {
        break;
      }

      filteredPatterns = filteredPatterns.filter(
        ({ pattern }) =>
          (onlySword !== null
            ? onlySword.pattern.Sword === pattern.Sword &&
              onlySword.pattern.Sword3x2 === pattern.Sword3x2
            : true) &&
          (onlyPresent !== null
            ? onlyPresent.pattern.Present === pattern.Present
            : true)
      );
    }

    if (filteredPatterns.length === 0) {
      issues.push(
        new BoardIssue(
          BoardIssueSeverity.Error,
          `Tile pattern does not match any known patterns; suggestions are not available.`,
          shapes.reduce(
            (prev, shape) => [
              ...prev,
              ...(shape.boundingBox !== null
                ? shape.boundingBox.indexes()
                : []),
            ],
            [] as number[]
          )
        )
      );
      return {
        solved,
        solveState: solveState.finalize(SolveStep.FillSword),
        issues,
        candidatePatterns: [],
      };
    }

    if (onlySword !== null) {
      solved[TileState.Sword] = onlySword.pattern.Sword;
      solveState.setSolved(TileState.Sword, true);
    }
    if (onlyPresent !== null) {
      solved[TileState.Present] = onlyPresent.pattern.Present;
      solveState.setSolved(TileState.Present, true);
    }

    updateSolveState(
      shapes,
      { onlySword, onlyPresent },
      filteredPatterns,
      solveState
    );

    const candidatePatterns = filteredPatterns.map(({ pattern }) => pattern);

    return {
      solved,
      solveState:
        onlySword === null &&
        solveState.userStatesIndexList[TileState.Sword].size > 0
          ? solveState.finalize(SolveStep.FillSword)
          : onlyPresent === null &&
              solveState.userStatesIndexList[TileState.Present].size > 0
            ? solveState.finalize(SolveStep.FillPresent)
            : null,
      issues,
      candidatePatterns,
    };
  };
}

/**
 * This validates the user entered tiles (which generated the bounding box) for this state
 * are logical, specifically:
 * 1. They do not exceed the shortSide/longSide requirements for the state
 * 2. The bounding box does not overlap any other user-entered tiles (aside from Unknown)
 * @returns
 * - isSolved - If the boundingBox the correct side and there are not issues,
 *              then the state is solved and does not need to be searched for further.
 *              isSolved is the index of the top-left tile of the state (or -1 if it is not solved).
 * - isFatalError - If there is a issue with the user input which prevents further reasoning about the game state.
 *                  In other words, if true, we give up trying to evaluate the board any further.
 * - issues - List of issues
 */
function validateUserSelection({
  title,
  boundingBox,
  shortSide,
  longSide,
}: ShapeData): { isFatalError: boolean; issues: BoardIssue[] } {
  const issues: BoardIssue[] = [];
  if (boundingBox === null) {
    return { isFatalError: false, issues };
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment, @typescript-eslint/prefer-ts-expect-error
  // @ts-ignore
  if (import.meta.env.DEV) {
    if (shortSide > longSide) {
      throw new Error(
        `${title} defined shortSide ${shortSide} is > longSide ${longSide}`
      );
    }

    if (boundingBox.shortSide > boundingBox.longSide) {
      throw new Error(
        `${title} BoundingBox shortSide ${shortSide} is > longSide ${longSide}`
      );
    }
  }

  // Bounding box is too large, the user's input is invalid
  if (boundingBox.shortSide > shortSide || boundingBox.longSide > longSide) {
    issues.push(
      new BoardIssue(
        BoardIssueSeverity.Error,
        `Based on entered tiles, the ${title} covers a minium of a ${
          boundingBox.width
        }x${
          boundingBox.height
        } area, but should only be ${shortSide}x${longSide}${
          shortSide !== longSide ? ` or ${longSide}x${shortSide}` : ""
        }.`,
        [
          cordToIndex(boundingBox.x, boundingBox.y),
          cordToIndex(
            boundingBox.x + boundingBox.width,
            boundingBox.y + boundingBox.height
          ),
        ]
      )
    );
    return { isFatalError: true, issues };
  }

  return { isFatalError: false, issues };
}
