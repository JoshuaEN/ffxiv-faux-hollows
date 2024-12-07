/**
 * This solver looks at averaged total number of moves to uncover the Sword, Present, and Fox
 * by exhaustively evaluating every possible move.
 * It is a bit slow and not well optimized, and doesn't work great with the UI, but the intent is to provide
 * a better understanding of what a "perfect" solve looks like.
 */

import { BOARD_CELLS } from "~/src/game/constants.js";
import {
  ProcessedPattern,
  createCommunityDataStateCandidatesFoxOmitsSolver,
} from "./base-fox-omits.js";
import { TileState } from "~/src/game/types/tile-states.js";
import { assert } from "~/src/helpers.js";
import { indexToCord } from "~/src/game/helpers.js";
import { BoundingBox, getBoundingBox } from "../../../bounding-box.js";
import { applyFoxSuggestions } from "../../../helpers/apply-fox-suggestions.js";

function calculateWeight(results: ReturnType<typeof recursiveSolver>) {
  let sumOfAvg = 0;
  let count = 0;
  for (const [, score] of results.entries()) {
    sumOfAvg += score.total / score.count;
    count += 1;
  }

  return sumOfAvg / count;
}

export const calculateStatesCandidates =
  createCommunityDataStateCandidatesFoxOmitsSolver(
    (shapes, _only, filteredPatterns, solveState) => {
      // const patternIdentifier = solveState.getPatternIdentifier();
      // if (patternIdentifier !== null && solveState.anyUserStateSet() !== true) {
      //   switch (patternIdentifier) {
      //     case "C": {
      //       solveState.addSuggestion(22, TileState.Sword, 1);
      //       solveState.addSuggestion(22, TileState.Present, 1);
      //       return;
      //     }
      //   }
      // }
      // Smart fill
      const indexByShapes = getIndexByShapes(filteredPatterns);
      for (const [state, commonIndexes] of indexByShapes) {
        for (const [index, count] of commonIndexes) {
          if (count === filteredPatterns.length) {
            solveState.setSmartFill(index, state);
          }
        }
      }

      const tiles = new Array<TileState>(BOARD_CELLS).fill(TileState.Unknown);
      const userStateCounts = {
        [TileState.Sword]: 0,
        [TileState.Present]: 0,
      };
      for (let index = 0; index < BOARD_CELLS; index++) {
        const tileState = solveState.getUserState(index);
        assert(tileState !== undefined);
        if (tileState !== TileState.Unknown) {
          if (
            tileState === TileState.Sword ||
            tileState === TileState.Present
          ) {
            userStateCounts[tileState] += 1;
          }
          tiles[index] = tileState;
          continue;
        }

        const smartFillState = solveState.getSmartFill(index);
        if (smartFillState !== null) {
          tiles[index] = smartFillState;
        }
      }
      let count = calculateTileStats(tiles);
      let incompleteSword =
        count[TileState.Sword] > 0 && count[TileState.Sword] < 6;
      let incompletePresent =
        count[TileState.Present] > 0 && count[TileState.Present] < 4;

      let recalc = false;
      if (incompleteSword && userStateCounts[TileState.Sword] === 0) {
        incompleteSword = false;
        solveState.resetSmartFillFor(TileState.Sword);
        for (let index = 0; index < BOARD_CELLS; index++) {
          if (tiles[index] === TileState.Sword) {
            tiles[index] = TileState.Unknown;
          }
        }
        recalc = true;
      }
      if (incompletePresent && userStateCounts[TileState.Present] === 0) {
        incompletePresent = false;
        solveState.resetSmartFillFor(TileState.Present);
        for (let index = 0; index < BOARD_CELLS; index++) {
          if (tiles[index] === TileState.Present) {
            tiles[index] = TileState.Unknown;
          }
        }
        recalc = true;
      }

      if (recalc) {
        count = calculateTileStats(tiles);
      }

      const results =
        incompleteSword || incompletePresent
          ? (new Map() as ReturnType<typeof recursiveSolver>)
          : recursiveSolver(count, tiles, filteredPatterns);
      const swordIndexCounts = new Map<number, number>();
      const presentIndexCounts = new Map<number, number>();
      for (const pattern of filteredPatterns) {
        for (const index of pattern.boundingBox.Sword.indexes()) {
          swordIndexCounts.set(index, (swordIndexCounts.get(index) ?? 0) + 1);
        }
        for (const index of pattern.boundingBox.Present.indexes()) {
          presentIndexCounts.set(
            index,
            (presentIndexCounts.get(index) ?? 0) + 1
          );
        }
      }

      for (let index = 0; index < BOARD_CELLS; index++) {
        const swordIndexCount = swordIndexCounts.get(index) ?? 0;
        const presentIndexCount = presentIndexCounts.get(index) ?? 0;
        const result = results.get(index);
        if (result !== undefined) {
          solveState.setFinalWeight(
            index,
            1_000_000 - result.total / result.count,
            result
          );
        }
        if (solveState.isEmptyAt(index)) {
          if (swordIndexCount > 0) {
            solveState.addSuggestion(index, TileState.Sword, swordIndexCount);
          }
          if (presentIndexCount > 0) {
            solveState.addSuggestion(
              index,
              TileState.Present,
              presentIndexCount
            );
          }
          if (result === undefined) {
            if (swordIndexCount === filteredPatterns.length) {
              solveState.setSmartFill(index, TileState.Sword);
            } else if (presentIndexCount === filteredPatterns.length) {
              solveState.setSmartFill(index, TileState.Present);
            }
          }
        }
      }

      applyFoxSuggestions(filteredPatterns, solveState);
    }
  );

function getIndexByShapes(filteredPatterns: readonly ProcessedPattern[]) {
  const indexByShapes = new Map<
    TileState.Sword | TileState.Present,
    Map<number, number>
  >();
  for (const state of [TileState.Sword, TileState.Present] as const) {
    const commonIndexes = new Map<number, number>();
    for (const pattern of filteredPatterns) {
      const indexes = pattern.boundingBox[state].indexes();
      for (const index of indexes) {
        commonIndexes.set(index, (commonIndexes.get(index) ?? 0) + 1);
      }
    }

    indexByShapes.set(state, commonIndexes);
  }

  return indexByShapes;
}

function filterForEmpty(
  filteredPatterns: readonly ProcessedPattern[],
  index: number
) {
  const newPatterns: ProcessedPattern[] = [];
  for (const pattern of filteredPatterns) {
    if (
      pattern.boundingBox[TileState.Present].indexes().includes(index) ||
      pattern.boundingBox[TileState.Sword].indexes().includes(index)
    ) {
      continue;
    }

    if (pattern.pattern.ConfirmedFoxes.includes(index)) {
      continue;
    } else {
      newPatterns.push(pattern);
    }
  }
  return newPatterns;
}

function recursiveSolver(
  tilesByState: ReturnType<typeof calculateTileStats>,
  tiles: readonly TileState[],
  filteredPatterns: readonly ProcessedPattern[]
) {
  validateTiles(tilesByState, tiles);
  const scoreByIndex = new Map<
    number,
    { min: number; max: number; total: number; count: number }
  >();
  const patternsByIndexes = new Map<
    number,
    Record<
      TileState.Sword | TileState.Present | TileState.Fox | TileState.Empty,
      ProcessedPattern[]
    >
  >();

  for (let index = 0; index < BOARD_CELLS; index++) {
    if (tiles[index] !== TileState.Unknown) {
      continue;
    }

    const map: Record<
      TileState.Sword | TileState.Present | TileState.Fox | TileState.Empty,
      ProcessedPattern[]
    > = {
      [TileState.Sword]: [],
      [TileState.Present]: [],
      [TileState.Fox]: [],
      [TileState.Empty]: [],
    };
    for (const pattern of filteredPatterns) {
      let match = false;
      if (pattern.boundingBox.Sword.indexes().includes(index)) {
        if (tilesByState.foundSword !== true) {
          map[TileState.Sword].push(pattern);
          match = true;
        }
      } else if (pattern.boundingBox.Present.indexes().includes(index)) {
        if (tilesByState.foundPresent !== true) {
          map[TileState.Present].push(pattern);
          match = true;
        }
      } else if (pattern.pattern.ConfirmedFoxes.includes(index)) {
        if (tilesByState.foundFox !== true) {
          map[TileState.Fox].push(pattern);
          match = true;
        }
      }

      if (!match) {
        map[TileState.Empty].push(pattern);
      }
    }
    if (
      map[TileState.Sword].length > 0 ||
      map[TileState.Present].length > 0 ||
      map[TileState.Fox].length > 0
      // We ignore this index if there are only empty matches because if every pattern results in an empty hit for this index,
      // choosing this index will never result in narrowing down the possible patterns and thus will always be a wasted (less than optimal) move.
      // Further, due to other optimizations later on, this would actually result in an infinite loop.
      //
      // It may seem like we could apply the same logic to if only one of (Sword, Present, or Fox) had any matches.
      // In some cases this is true, but there is often still potential calculations to be performed (e.g. around foxes),
      // and this case only occurs
    ) {
      patternsByIndexes.set(index, map);
    }
  }

  for (const [index, map] of patternsByIndexes) {
    for (const state of [
      TileState.Sword,
      TileState.Present,
      TileState.Fox,
      TileState.Empty,
    ] as const) {
      const patterns = map[state];
      for (const pattern of patterns) {
        assert(tiles[index] === TileState.Unknown);

        let val = 0;
        let moves = 1;
        if (state === TileState.Fox) {
          // Coin flip

          // We want to avoid actually setting the tile to empty because this explodes the possible board states
          // Instead we filter out the patterns which would be excluded by the empty tile showing up
          // and then don't actually set the tile to empty.
          // Since no patterns remaining care about the tile, it won't matter for the calculations.

          const newTilesFoxPresent = [...tiles];
          newTilesFoxPresent[index] = TileState.Fox;
          const newTilesByState = { ...tilesByState };
          newTilesByState[TileState.Fox] += 1;
          newTilesByState.foundFox = true;
          newTilesByState.patternFox = index;

          const newTilesFoxMissing = [...tiles];
          const foxMissingFilteredPatterns = filterForEmpty(
            filteredPatterns,
            index
          );

          val =
            // We are branching into two different paths here

            // This is the fox tile
            fillFilterRecurse(
              newTilesByState,
              newTilesFoxPresent,
              filteredPatterns
            ) +
            1 +
            // This is not the fox tile
            (foxMissingFilteredPatterns.length > 0
              ? fillFilterRecurse(
                  tilesByState,
                  newTilesFoxMissing,
                  foxMissingFilteredPatterns
                ) + 1
              : 0);
          moves = foxMissingFilteredPatterns.length > 0 ? 2 : 1;
        } else if (state === TileState.Empty) {
          const newTiles = [...tiles];
          const newTilesByState = { ...tilesByState };
          const newFilteredPatterns = filterForEmpty(filteredPatterns, index);
          val =
            fillFilterRecurse(newTilesByState, newTiles, newFilteredPatterns) +
            1;
          moves = 1;
        } else {
          const newTiles = [...tiles];
          const newTilesByState = { ...tilesByState };
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          assert(state === TileState.Sword || state === TileState.Present);
          const indexesToFill = pattern.boundingBox[state].indexes();
          for (const index of indexesToFill) {
            newTiles[index] = state;
            // We only do this down here because indexesToFill is all indexes, so doing it above would over-count.
            newTilesByState[state] += 1;
          }
          const newBoundingBox = getBoundingBox(indexesToFill);
          assert(newBoundingBox !== null);
          newTilesByState[`boundingBox${state}`] = newBoundingBox;
          newTilesByState[`found${state}`] = true;
          newTilesByState[`pattern${state}`] = pattern.pattern[state];
          if (state === TileState.Sword) {
            newTilesByState.patternSword3x2 = pattern.pattern.Sword3x2;
          }
          val =
            fillFilterRecurse(newTilesByState, newTiles, filteredPatterns) + 1;
          moves = 1;
        }

        const score = scoreByIndex.get(index) ?? {
          min: Number.MAX_SAFE_INTEGER,
          max: -1,
          total: 0,
          count: 0,
        };
        score.min = Math.min(val, score.min);
        score.max = Math.max(val, score.max);
        score.total += val;
        score.count += moves;
        scoreByIndex.set(index, score);
      }
    }
  }

  return scoreByIndex;
}

const cacheForFillRecursive: Record<string, number> = {};

function fillFilterRecurse(
  tileStats: ReturnType<typeof calculateTileStats>,
  tiles: readonly TileState[],
  filteredPatterns: readonly ProcessedPattern[]
): number {
  validateTiles(tileStats, tiles);

  if (done(tileStats)) {
    return 0;
  }

  const newFilteredPatterns: ProcessedPattern[] = [];
  for (const otherPattern of filteredPatterns) {
    if (tileStats.foundSword) {
      if (
        otherPattern.pattern.Sword !== tileStats.patternSword ||
        otherPattern.pattern.Sword3x2 !== tileStats.patternSword3x2
      ) {
        continue;
      }
    } else if (
      tileStats.boundingBoxSword !== null &&
      otherPattern.boundingBox.Sword.contains(tileStats.boundingBoxSword) !==
        true
    ) {
      continue;
    }

    if (tileStats.foundPresent) {
      if (otherPattern.pattern.Present !== tileStats.patternPresent) {
        continue;
      }
    } else if (
      tileStats.boundingBoxPresent !== null &&
      otherPattern.boundingBox.Present.contains(
        tileStats.boundingBoxPresent
      ) !== true
    ) {
      continue;
    }
    if (
      tileStats.foundFox &&
      otherPattern.pattern.ConfirmedFoxes.find(
        (i) => tiles[i] === TileState.Fox
      ) === undefined
    ) {
      continue;
    }
    if (
      !tileStats.foundFox &&
      otherPattern.pattern.ConfirmedFoxes.every(
        (i) => tiles[i] !== TileState.Unknown
      )
    ) {
      continue;
    }

    newFilteredPatterns.push(otherPattern);
  }

  if (
    tileStats.foundSword &&
    tileStats.foundPresent &&
    newFilteredPatterns.every((p) =>
      p.pattern.ConfirmedFoxes.every((f) => tiles[f] !== TileState.Unknown)
    )
  ) {
    return 0;
  }

  if (import.meta.env.DEV) {
    for (let i = 0; i < newFilteredPatterns.length; i++) {
      const iVal = newFilteredPatterns[i];
      for (let j = 0; j < newFilteredPatterns.length; j++) {
        if (i === j) {
          continue;
        }
        const jVal = newFilteredPatterns[j];
        if (
          iVal?.pattern.Present === jVal?.pattern.Present &&
          iVal?.pattern.Sword === jVal?.pattern.Sword &&
          iVal?.pattern.Sword3x2 === jVal?.pattern.Sword3x2
        ) {
          throw new Error(`Duplicate pattern`);
        }
      }
    }
  }

  if (newFilteredPatterns.length === 0) {
    throw new Error(`Failed to find any matching patterns`);
  }

  if (newFilteredPatterns.length > filteredPatterns.length) {
    throw new Error(`Gained patterns`);
  }

  const postKey = `${tileStats.patternSword}${tileStats.patternSword3x2 ? "w" : "h"} ${tileStats.patternPresent} ${tileStats.patternFox}${getCacheKey(tiles, newFilteredPatterns)}`;
  const postCache = cacheForFillRecursive[postKey];
  if (postCache !== undefined) {
    return postCache;
  }

  const result = recursiveSolver(tileStats, tiles, newFilteredPatterns);
  const weight = calculateWeight(result);
  cacheForFillRecursive[postKey] = weight;
  return weight;
}

function getCacheKey(
  tiles: readonly TileState[],
  filteredPatterns: readonly ProcessedPattern[]
) {
  let result = "";
  for (const p of filteredPatterns) {
    const pattern = p.pattern;
    result += `${pattern.Sword}${pattern.Sword3x2 ? "w" : "t"}${pattern.Present}z`;
  }
  return result;
}

function validateTiles(
  tileStats: ReturnType<typeof calculateTileStats>,
  tiles: readonly TileState[]
) {
  if (import.meta.env.DEV) {
    assert(tiles.length === BOARD_CELLS);
    assert(tileStats[TileState.Blocked] === 5);
    assert(
      tileStats[TileState.Sword] === 0 || tileStats[TileState.Sword] === 6
    );
    assert(
      tileStats[TileState.Present] === 0 || tileStats[TileState.Present] === 4
    );
    assert(tileStats[TileState.Fox] === 0 || tileStats[TileState.Fox] === 1);
  }
}

function calculateTileStats(tiles: readonly TileState[]) {
  const tilesByState = {
    [TileState.Blocked]: 0,
    [TileState.Empty]: 0,
    [TileState.Unknown]: 0,
    [TileState.Sword]: 0,
    [TileState.Present]: 0,
    [TileState.Fox]: 0,
  };
  let Sword = -1;
  let swordMax = -1;
  let Present = -1;
  let presentMax = -1;
  let Fox = -1;
  for (let i = 0; i < tiles.length; i++) {
    const tileState = tiles[i];
    assert(tileState !== undefined);
    tilesByState[tileState] += 1;
    if (tileState === TileState.Sword) {
      if (Sword === -1) {
        Sword = i;
      }
      swordMax = i;
    } else if (tileState === TileState.Present) {
      if (Present === -1) {
        Present = i;
      }
      presentMax = i;
    } else if (tileState === TileState.Fox) {
      Fox = i;
    }
  }

  const SwordMin = Sword > -1 ? indexToCord(Sword) : null;
  const SwordMax = Sword > -1 ? indexToCord(swordMax) : null;
  const SwordBoundingBox =
    SwordMin !== null && SwordMax !== null
      ? BoundingBox.fromPoints(SwordMin, SwordMax)
      : null;
  const Sword3x2 =
    SwordMin !== null && SwordMax !== null && SwordMax.x - SwordMin.x === 2;
  const PresentBoundingBox =
    Present > -1
      ? BoundingBox.fromPoints(indexToCord(Present), indexToCord(presentMax))
      : null;

  return {
    ...tilesByState,

    foundSword: tilesByState[TileState.Sword] === 6,
    foundPresent: tilesByState[TileState.Present] === 4,
    foundFox: tilesByState[TileState.Fox] === 1,

    patternSword: Sword,
    patternSword3x2: Sword3x2,
    patternPresent: Present,
    patternFox: Fox,

    boundingBoxSword: SwordBoundingBox,
    boundingBoxPresent: PresentBoundingBox,
  };
}

function done(tileStats: ReturnType<typeof calculateTileStats>) {
  return tileStats.foundSword === true && tileStats.foundPresent === true;
}
