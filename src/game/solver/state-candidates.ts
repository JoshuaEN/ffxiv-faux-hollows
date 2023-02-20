import { assert, assertLengthAtLeast, lengthEquals } from "../../helpers";
import { BOARD_WIDTH, BOARD_HEIGHT } from "../constants";
import { cordToIndex } from "../helpers";
import {
  BoardIssue,
  BoardIssueSeverity,
  CommunityDataPattern,
  IndeterminateSolveState,
  SolveState,
  SolveStep,
  StateTileEligibility,
  TileState,
  TrackedStatesIndexList,
} from "../types";
import { BoundingBox, getBoundingBox } from "./helpers";

interface ShapeData {
  readonly state: TileState.Sword | TileState.Present;
  readonly title: string;
  readonly longSide: number;
  readonly shortSide: number;
  readonly boundingBox: BoundingBox | null;
}

export function calculateStatesCandidates(
  solveState: IndeterminateSolveState,
  userStatesIndexList: TrackedStatesIndexList<ReadonlySet<number>>,
  patterns: readonly CommunityDataPattern[]
):
  | {
      solved: { Present: number; Sword: number };
      solveState: SolveState;
      issues: BoardIssue[];
      candidatePatterns: CommunityDataPattern[];
    }
  | {
      solved: { Present: number; Sword: number };
      solveState: null;
      issues: BoardIssue[];
      candidatePatterns: CommunityDataPattern[];
    } {
  return recursiveCalculateStatesCandidates(
    solveState,
    userStatesIndexList,
    patterns,
    0
  );
}

const RECURSION_LIMIT = 10;
function recursiveCalculateStatesCandidates(
  solveState: IndeterminateSolveState,
  userStatesIndexList: TrackedStatesIndexList<ReadonlySet<number>>,
  patterns: readonly CommunityDataPattern[],
  limitCounter: number
):
  | {
      solved: { Present: number; Sword: number };
      solveState: SolveState;
      issues: BoardIssue[];
      candidatePatterns: CommunityDataPattern[];
    }
  | {
      solved: { Present: number; Sword: number };
      solveState: null;
      issues: BoardIssue[];
      candidatePatterns: CommunityDataPattern[];
    } {
  const issues: BoardIssue[] = [];

  const shapes: readonly ShapeData[] = [
    {
      state: TileState.Sword,
      title: "Swords",
      longSide: 3,
      shortSide: 2,
      boundingBox: getBoundingBox(userStatesIndexList[TileState.Sword]),
    },
    {
      state: TileState.Present,
      title: "Present / Box",
      longSide: 2,
      shortSide: 2,
      boundingBox: getBoundingBox(userStatesIndexList[TileState.Present]),
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

  const candidates = {
    [TileState.Sword]: new Set<string>(),
    [TileState.Present]: new Set<string>(),
  };

  for (const shape of shapes) {
    solveState.resetSuggestionsFor(shape.state);
  }
  for (const shape of shapes) {
    if (shape.boundingBox === null) {
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
    const result = calculateBoundedCandidates(solveState, shape);
    const { repeatPass } = updateStateResult(result, shape.state);
    if (repeatPass !== null && limitCounter < RECURSION_LIMIT) {
      return recursiveCalculateStatesCandidates(
        solveState,
        userStatesIndexList,
        patterns,
        limitCounter + 1
      );
    }
  }

  // Now we are looking for suggestions to give the user based on what they have already entered
  // We do this after the prior loop so we can correctly account for the
  for (const shape of shapes) {
    if (shape.boundingBox !== null || solved[shape.state] > -1) {
      continue;
    }

    const result = calculateUnboundedCandidates(solveState, shape);
    const { repeatPass } = updateStateResult(result, shape.state);
    if (repeatPass !== null && limitCounter < RECURSION_LIMIT) {
      return recursiveCalculateStatesCandidates(
        solveState,
        userStatesIndexList,
        patterns,
        limitCounter + 1
      );
    }
  }

  const candidatePatterns = patterns.filter(
    (p) =>
      (candidates[TileState.Sword].size < 1 ||
        candidates[TileState.Sword].has(`${p.Sword}${p.Sword3x2}`)) &&
      (candidates[TileState.Present].size < 1 ||
        candidates[TileState.Present].has(`${p.Present}`))
  );

  // If the user has entered at least one Sword (or Present), but not enough to fully solve them
  // then the user should input the remaining tiles,
  // as based on the revealed piece they have enough information to fill in the remaining parts of the shape.
  // Note: We calculated suggestions so the UI can provide contextual help to the user.
  if (
    userStatesIndexList[TileState.Sword].size > 0 &&
    solved[TileState.Sword] < 0
  ) {
    return {
      solved,
      solveState: solveState.finalize(SolveStep.FillSword),
      issues,
      candidatePatterns,
    };
  }

  if (
    userStatesIndexList[TileState.Present].size > 0 &&
    solved[TileState.Present] < 0
  ) {
    return {
      solved,
      solveState: solveState.finalize(SolveStep.FillPresent),
      issues,
      candidatePatterns,
    };
  }

  return { solved, solveState: null, issues, candidatePatterns };

  function updateStateResult(
    result: BoardIssue | number[][],
    state: TileState.Sword | TileState.Present
  ) {
    const suggestions = new Map<number, number>();
    let repeatPass = false;
    if (result instanceof BoardIssue) {
      issues.push(result);
    } else {
      const commonIndexes = new Map<number, number>();
      for (const indexSet of result) {
        assertLengthAtLeast(indexSet, 4);
        candidates[state].add(
          `${indexSet[0]}${
            state === TileState.Sword
              ? `${indexSet[2] - indexSet[0] === 2}`
              : ""
          }`
        );
        let prevIndex = -1;
        for (const index of indexSet) {
          if (prevIndex > index) {
            throw new Error(
              `Index sets must have indexes in ascending order; was ${prevIndex} to ${index}`
            );
          }
          prevIndex = index;
          commonIndexes.set(index, (commonIndexes.get(index) ?? 0) + 1);
        }
      }

      for (const [index, count] of commonIndexes) {
        if (count === result.length) {
          solveState.setSmartFill(index, state);
          repeatPass = solveState.deleteSuggestionsAt(index);
        } else {
          suggestions.set(index, (suggestions.get(index) ?? 0) + count);
          solveState.addSuggestion(index, state, count);
        }
      }

      // If there's only 1 option, the state has been solved
      if (lengthEquals(result, 1)) {
        const indexSet = result[0];
        assertLengthAtLeast(indexSet, 4);
        solved[state] = indexSet[0];
      }
    }
    return {
      suggestions,
      repeatPass: repeatPass
        ? state === TileState.Sword
          ? TileState.Present
          : TileState.Sword
        : null,
    };
  }
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

function calculateUnboundedCandidates(
  solveState: IndeterminateSolveState,
  { state, boundingBox, shortSide, longSide }: ShapeData
): number[][] | BoardIssue {
  assert(boundingBox === null);

  const candidates: number[][] = [];

  // Generate suggestions unconstrained by any bounding box
  const addUnboundedCandidates = (w: number, h: number) => {
    for (let y = 0; y + h <= BOARD_HEIGHT; y++) {
      for (let x = 0; x + w <= BOARD_WIDTH; x++) {
        const indexSet = isCandidateLocation(solveState, x, y, w, h, state);

        if (indexSet === false) {
          continue;
        }
        candidates.push(indexSet);
      }
    }
  };
  addUnboundedCandidates(longSide, shortSide);
  if (longSide !== shortSide) {
    addUnboundedCandidates(shortSide, longSide);
  }
  return candidates;
}

function calculateBoundedCandidates(
  solveState: IndeterminateSolveState,
  { state, boundingBox, shortSide, longSide }: ShapeData
): number[][] | BoardIssue {
  assert(boundingBox !== null);

  /**
   * List of candidate index sets
   */
  const candidates: number[][] = [];

  // Generate suggestions constrained around the bounding box
  /*
   * Examples:
   *  Legend:
   *
   *   Tile selected ┌───┐
   *   by user:      │ X │
   *                 └───┘
   *
   *  Example: Present Box with a single square currently selected
   *
   *
   * ┌───────┐
   * │       │
   * │   ┌───┤  ──────►  ┌───┬───┐
   * │   │ X │           │ X │   │
   * └───┴───┘           ├───┘   │
   *                     │       │
   *                     └───────┘
   *
   *  Example: Sword with two squares currently selected
   *
   *  ┌───────────┐
   *  │           │
   *  │   ┌───┬───┤  ───────►  ┌───┬───┬───┐
   *  │   │ X │ X │            │ X │ X │   │
   *  └───┴───┴───┘            ├───┴───┘   │
   *                           │           │
   *                           └───────────┘
   *
   *     (note: later we repeat this for the alterative orientation [2x3 vs. 3x2])
   */
  const addBoundedCandidates = (bBox: BoundingBox, w: number, h: number) => {
    for (let y = Math.max(0, bBox.y - (h - bBox.height)); y <= bBox.y; y++) {
      for (let x = Math.max(0, bBox.x - (w - bBox.width)); x <= bBox.x; x++) {
        const indexSet = isCandidateLocation(solveState, x, y, w, h, state);

        if (indexSet === false) {
          continue;
        }
        candidates.push(indexSet);
      }
    }
  };

  addBoundedCandidates(boundingBox, longSide, shortSide);
  if (longSide !== shortSide) {
    addBoundedCandidates(boundingBox, shortSide, longSide);
  }

  return candidates;
}

function isCandidateLocation(
  solveState: IndeterminateSolveState,
  initialX: number,
  initialY: number,
  width: number,
  height: number,
  tileState: TileState.Present | TileState.Sword
) {
  if (initialX < 0 || initialY < 0) {
    throw new Error(`Index out of range: x,y ${initialX},${initialY}`);
  }
  if (initialX + width > BOARD_WIDTH || initialY + height > BOARD_HEIGHT) {
    return false;
  }
  const indexes: number[] = [];
  for (let y = initialY; y < initialY + height; y++) {
    for (let x = initialX; x < initialX + width; x++) {
      const index = cordToIndex(x, y);
      if (
        solveState.getStateEligibility(tileState, index) ===
        StateTileEligibility.Taken
      ) {
        return false;
      }

      indexes.push(index);
    }
  }
  return indexes;
}
