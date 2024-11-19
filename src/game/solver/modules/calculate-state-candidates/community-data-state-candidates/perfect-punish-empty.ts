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
    (shapes, filteredPatterns, solveState) => {
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
      for (let index = 0; index < BOARD_CELLS; index++) {
        const tileState = solveState.getUserState(index);
        assert(tileState !== undefined);
        if (tileState !== TileState.Unknown) {
          tiles[index] = tileState;
          continue;
        }

        const smartFillState = solveState.getSmartFill(index);
        if (smartFillState !== null) {
          tiles[index] = smartFillState;
        }
      }
      const count = countTiles(tiles);
      if (count[TileState.Sword] > 0 && count[TileState.Sword] < 6) {
        return;
      }
      if (count[TileState.Present] > 0 && count[TileState.Present] < 4) {
        return;
      }
      const found = validateTiles(tiles);
      if (done(found)) {
        return;
      }

      const results = recursiveSolver(tiles, filteredPatterns);

      for (let i = 0; i < BOARD_CELLS; i++) {
        if (
          filteredPatterns.every((p) =>
            p.boundingBox.Sword.indexes().includes(i)
          )
        ) {
          solveState.setSmartFill(i, TileState.Sword);
        } else if (
          filteredPatterns.every((p) =>
            p.boundingBox.Present.indexes().includes(i)
          )
        ) {
          solveState.setSmartFill(i, TileState.Present);
        } else if (results.has(i)) {
          const result = results.get(i);
          assert(result !== undefined);
          solveState.addSuggestion(
            i,
            TileState.Sword,
            1_000_000 - result.total / result.count
          );
        }
      }
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

function recursiveSolver(
  tiles: readonly TileState[],
  filteredPatterns: readonly ProcessedPattern[]
) {
  const found = validateTiles(tiles);
  const patternsByIndex = new Map<
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
      if (pattern.boundingBox.Sword.indexes().includes(index)) {
        if (found[TileState.Sword] !== true) {
          map[TileState.Sword].push(pattern);
        }
      } else if (pattern.boundingBox.Present.indexes().includes(index)) {
        if (found[TileState.Present] !== true) {
          map[TileState.Present].push(pattern);
        }
      } else if (pattern.pattern.ConfirmedFoxes.includes(index)) {
        if (found[TileState.Fox] !== true) {
          map[TileState.Fox].push(pattern);
        }
      }
    }
    if (
      map[TileState.Sword].length > 0 ||
      map[TileState.Present].length > 0 ||
      map[TileState.Fox].length > 0 ||
      map[TileState.Empty].length > 0
    ) {
      patternsByIndex.set(index, map);
    }
  }

  // Fill in any gaps
  for (const [, map] of patternsByIndex) {
    const foundPatterns = [
      ...map[TileState.Sword],
      ...map[TileState.Present],
      ...map[TileState.Fox],
    ];
    for (const pattern of filteredPatterns) {
      if (foundPatterns.includes(pattern) !== true) {
        map[TileState.Empty].push(pattern);
      }
    }
  }

  const scoreByIndex = new Map<
    number,
    { min: number; max: number; total: number; count: number }
  >();

  for (const [index, map] of patternsByIndex) {
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
        if (
          state === TileState.Fox &&
          found[TileState.Sword] &&
          found[TileState.Present]
        ) {
          assert(filteredPatterns.length === 1);
          const remainingFoxCandidates = pattern.pattern.ConfirmedFoxes.filter(
            (f) => tiles[f] === TileState.Unknown
          ).length;
          // Simulate multiple calls to resolve foxes
          if (remainingFoxCandidates === 1) {
            val = 1;
            moves = 1;
          } else if (remainingFoxCandidates === 2) {
            val = 1 + 2;
            moves = 2;
          } else if (remainingFoxCandidates === 3) {
            val = 1 + 2 + 2 + 3 + 3;
            moves = 5;
          } else if (remainingFoxCandidates === 4) {
            val = 1 + 2 + 2 + 2 + 3 + 3 + 3 + 3 + 3 + 3 + 4 + 4 + 4 + 4 + 4 + 4;
            moves = 16;
          } else {
            throw new Error(
              `Unexpected remaining fox candidates ${remainingFoxCandidates}`
            );
          }
        } else if (state === TileState.Fox) {
          // Coin flip

          // We want to avoid actually setting the tile to empty because this explodes the possible board states
          // Instead we filter out the patterns which would be excluded by the empty tile showing up
          // and then don't actually set the tile to empty.
          // Since no patterns remaining care about the tile, it won't matter for the calculations.

          const newTilesFoxPresent = [...tiles];
          newTilesFoxPresent[index] = TileState.Fox;

          const newTilesFoxMissing = [...tiles];
          const foxMissingFilteredPatterns = filteredPatterns.filter(
            (p) =>
              (p.boundingBox[TileState.Present].indexes().includes(index) ||
                p.boundingBox[TileState.Sword].indexes().includes(index) ||
                p.pattern.ConfirmedFoxes.includes(index)) !== true
          );

          val =
            fillFilterRecurse(newTilesFoxPresent, filteredPatterns) +
            1 +
            (foxMissingFilteredPatterns.length > 0
              ? fillFilterRecurse(
                  newTilesFoxMissing,
                  foxMissingFilteredPatterns
                ) + 1
              : 0);
          moves = foxMissingFilteredPatterns.length > 0 ? 2 : 1;
        } else if (state === TileState.Empty) {
          const newTiles = [...tiles];
          const newFilteredPatterns = filteredPatterns.filter(
            (p) =>
              (p.boundingBox[TileState.Present].indexes().includes(index) ||
                p.boundingBox[TileState.Sword].indexes().includes(index) ||
                p.pattern.ConfirmedFoxes.includes(index)) !== true
          );
          val = fillFilterRecurse(newTiles, newFilteredPatterns) + 1;
          moves = 1;
        } else {
          const newTiles = [...tiles];
          newTiles[index] = state;
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          assert(state === TileState.Sword || state === TileState.Present);
          const indexesToFill = pattern.boundingBox[state].indexes();
          for (const index of indexesToFill) {
            newTiles[index] = state;
          }
          val = fillFilterRecurse(newTiles, filteredPatterns) + 1;
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

  // const indexByShapes = getIndexByShapes(filteredPatterns);

  // const suggestedIndexes = new Map<number, Map<TileState, ProcessedPattern>>(); //: { index: number; tileState: TileState }[] = [];
  // for (const pattern of filteredPatterns) {
  //   const patternIndexes = new Map([
  //     [TileState.Sword, pattern.boundingBox.Sword.indexes()],
  //     [TileState.Present, pattern.boundingBox.Present.indexes()],
  //     // [TileState.Fox, pattern.pattern.ConfirmedFoxes],
  //   ] as const);
  //   for (let index = 0; index < tiles.length; index++) {
  //     if (tiles[index] !== TileState.Unknown) {
  //       continue;
  //     }

  //     for (const [tileState, indexes] of patternIndexes) {
  //       if (found[tileState]) {
  //         continue;
  //       }
  //       if (indexes.includes(index)) {
  //         suggestedIndexes.push({ index, tileState });
  //         const countAtIndex = indexByShapes.get(tileState)?.get(index);
  //         assert(countAtIndex !== undefined);
  //         if (countAtIndex !== filteredPatterns.length) {
  //           suggestedIndexes.push({ index, tileState: TileState.Empty });
  //         }
  //         // if (tileState === TileState.Fox) {
  //         //   suggestedIndexes.push({ index, tileState: TileState.Empty });
  //         // }
  //         break;
  //       }
  //     }
  //   }
  // }

  //   assertLengthAtLeast(suggestedIndexes, 1);
  //   for (const {
  //     index: suggestedIndex,
  //     tileState: suggestedTileState,
  //   } of suggestedIndexes) {
  //     assert(tiles[suggestedIndex] === TileState.Unknown);

  //     const newTiles = [...tiles];
  //     newTiles[suggestedIndex] = suggestedTileState;
  //     if (
  //       suggestedTileState === TileState.Sword ||
  //       suggestedTileState === TileState.Present
  //     ) {
  //       const indexesToFill = patternIndexes.get(suggestedTileState);
  //       assert(indexesToFill !== undefined);
  //       for (const index of indexesToFill) {
  //         newTiles[index] = suggestedTileState;
  //       }
  //     }
  //     const val = fillFilterRecurse(newTiles, filteredPatterns) + 1;

  //     const score = scoreByIndex.get(suggestedIndex) ?? {
  //       min: Number.MAX_SAFE_INTEGER,
  //       max: -1,
  //       total: 0,
  //       count: 0,
  //     };
  //     score.min = Math.min(val, score.min);
  //     score.max = Math.max(val, score.max);
  //     score.total += val;
  //     score.count += 1;
  //     scoreByIndex.set(suggestedIndex, score);
  //   }

  return scoreByIndex;
}

const cacheForFillRecursive = new Map<string, number>();
const cacheForSolver = new Map<
  string,
  Map<number, { min: number; max: number; total: number; count: number }>
>();

function fillFilterRecurse(
  tiles: readonly TileState[],
  filteredPatterns: readonly ProcessedPattern[]
): number {
  const { key, cachedValue } = checkCache(tiles, filteredPatterns);

  if (cachedValue !== undefined) {
    return cachedValue;
  }

  const found = validateTiles(tiles);

  if (done(found)) {
    return 0;
  }
  if (
    found[TileState.Sword] &&
    found[TileState.Present] &&
    found[TileState.Fox]
  ) {
    return 0;
  }

  const newFilteredPatterns: ProcessedPattern[] = [];
  for (const otherPattern of filteredPatterns) {
    if (
      found[TileState.Sword] &&
      otherPattern.boundingBox.Sword.indexes().some(
        (i) => tiles[i] !== TileState.Sword
      )
    ) {
      continue;
    }
    if (
      !found[TileState.Sword] &&
      otherPattern.boundingBox.Sword.indexes().some(
        (i) => tiles[i] !== TileState.Sword && tiles[i] !== TileState.Unknown
      )
    ) {
      continue;
    }
    if (
      found[TileState.Present] &&
      otherPattern.boundingBox.Present.indexes().some(
        (i) => tiles[i] !== TileState.Present
      )
    ) {
      continue;
    }
    if (
      !found[TileState.Present] &&
      otherPattern.boundingBox.Present.indexes().some(
        (i) => tiles[i] !== TileState.Present && tiles[i] !== TileState.Unknown
      )
    ) {
      continue;
    }
    if (
      found[TileState.Fox] &&
      otherPattern.pattern.ConfirmedFoxes.find(
        (i) => tiles[i] === TileState.Fox
      ) === undefined
    ) {
      continue;
    }
    if (
      !found[TileState.Fox] &&
      otherPattern.pattern.ConfirmedFoxes.every(
        (i) => tiles[i] !== TileState.Unknown
      )
    ) {
      continue;
    }

    newFilteredPatterns.push(otherPattern);
  }

  if (
    found[TileState.Sword] &&
    found[TileState.Present] &&
    newFilteredPatterns.every((p) =>
      p.pattern.ConfirmedFoxes.every((f) => tiles[f] !== TileState.Unknown)
    )
  ) {
    return 0;
  }

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

  if (newFilteredPatterns.length === 0) {
    throw new Error(`Failed to find any matching patterns`);
  }

  // if (!newFilteredPatterns.includes(pattern)) {
  //   throw new Error(`State did not have its own pattern`);
  // }

  if (newFilteredPatterns.length > filteredPatterns.length) {
    throw new Error(`Gained patterns`);
  }

  const { key: postKey, cachedValue: postCachedValue } = checkCache(
    tiles,
    newFilteredPatterns
  );

  const result = recursiveSolver(tiles, newFilteredPatterns);
  const weight = calculateWeight(result);
  cacheForFillRecursive.set(key, weight);
  cacheForFillRecursive.set(postKey, weight);
  return weight;
}

function checkCache(
  tiles: readonly TileState[],
  filteredPatterns: readonly ProcessedPattern[]
) {
  const key = `T${tiles.join(",")}P${filteredPatterns
    .toSorted((a, b) => {
      const sDiff = a.pattern.Sword - b.pattern.Sword;
      const sODiff =
        (a.pattern.Sword3x2 ? 0 : 1) - (b.pattern.Sword3x2 ? 0 : 1);
      const pDiff = a.pattern.Present - b.pattern.Present;

      if (sDiff !== 0) {
        return sDiff;
      }
      if (sODiff !== 0) {
        return sODiff;
      }
      return pDiff;
    })
    .map(
      (p) =>
        `${p.pattern.Sword}${p.pattern.Sword3x2 ? "w" : "t"}${p.pattern.Present}`
    )
    .join(",")}`; //F${pattern.pattern.ConfirmedFoxes.join(",")}`;
  const cachedValue = cacheForFillRecursive.get(key);
  const cachedValueForSolver = cacheForSolver.get(key);
  return { key, cachedValue, cachedValueForSolver };
}

function validateTiles(tiles: readonly TileState[]) {
  const tilesByState = countTiles(tiles);

  assert(tiles.length === BOARD_CELLS);
  assert(tilesByState[TileState.Blocked] === 5);
  assert(
    tilesByState[TileState.Sword] === 0 || tilesByState[TileState.Sword] === 6
  );
  assert(
    tilesByState[TileState.Present] === 0 ||
      tilesByState[TileState.Present] === 4
  );
  assert(
    tilesByState[TileState.Fox] === 0 || tilesByState[TileState.Fox] === 1
  );

  return {
    [TileState.Sword]: tilesByState[TileState.Sword] === 6,
    [TileState.Present]: tilesByState[TileState.Present] === 4,
    [TileState.Fox]: tilesByState[TileState.Fox] === 1,
  };
}

function countTiles(tiles: readonly TileState[]) {
  const tilesByState = {
    [TileState.Blocked]: 0,
    [TileState.Empty]: 0,
    [TileState.Unknown]: 0,
    [TileState.Sword]: 0,
    [TileState.Present]: 0,
    [TileState.Fox]: 0,
  };
  for (const tileState of tiles) {
    tilesByState[tileState] += 1;
  }

  return tilesByState;
}

function done(found: ReturnType<typeof countTiles | typeof validateTiles>) {
  return (
    (found[TileState.Sword] === true || found[TileState.Sword] === 6) &&
    (found[TileState.Present] === true || found[TileState.Present] === 4)
  );
}
