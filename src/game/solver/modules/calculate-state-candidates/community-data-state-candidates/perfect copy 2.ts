import { BOARD_CELLS } from "~/src/game/constants.js";
import {
  ProcessedPattern,
  ShapeData,
  createCommunityDataStateCandidatesFoxOmitsSolver,
} from "./base-fox-omits.js";
import { TileState } from "~/src/game/types/tile-states.js";
import { assert, assertLengthAtLeast } from "~/src/helpers.js";
import { IndeterminateSolveState } from "~/src/game/types/solve-state.js";

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
            result.total / result.count
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
  const scoreByIndex = new Map<
    number,
    { min: number; max: number; total: number; count: number }
  >();
  const found = validateTiles(tiles);
  const indexByShapes = getIndexByShapes(filteredPatterns);

  for (const pattern of filteredPatterns) {
    const suggestedIndexes: { index: number; tileState: TileState }[] = [];
    const patternIndexes = new Map([
      [TileState.Sword, pattern.boundingBox.Sword.indexes()],
      [TileState.Present, pattern.boundingBox.Present.indexes()],
      // [TileState.Fox, pattern.pattern.ConfirmedFoxes],
    ] as const);
    for (let index = 0; index < tiles.length; index++) {
      if (tiles[index] !== TileState.Unknown) {
        continue;
      }

      for (const [tileState, indexes] of patternIndexes) {
        if (found[tileState]) {
          continue;
        }
        if (indexes.includes(index)) {
          suggestedIndexes.push({ index, tileState });
          const countAtIndex = indexByShapes.get(tileState)?.get(index);
          assert(countAtIndex !== undefined);
          if (countAtIndex !== filteredPatterns.length) {
            suggestedIndexes.push({ index, tileState: TileState.Empty });
          }
          // if (tileState === TileState.Fox) {
          //   suggestedIndexes.push({ index, tileState: TileState.Empty });
          // }
          break;
        }
      }
    }

    assertLengthAtLeast(suggestedIndexes, 1);
    for (const {
      index: suggestedIndex,
      tileState: suggestedTileState,
    } of suggestedIndexes) {
      assert(tiles[suggestedIndex] === TileState.Unknown);

      const newTiles = [...tiles];
      newTiles[suggestedIndex] = suggestedTileState;
      if (
        suggestedTileState === TileState.Sword ||
        suggestedTileState === TileState.Present
      ) {
        const indexesToFill = patternIndexes.get(suggestedTileState);
        assert(indexesToFill !== undefined);
        for (const index of indexesToFill) {
          newTiles[index] = suggestedTileState;
        }
      }
      const val = fillFilterRecurse(newTiles, filteredPatterns, pattern) + 1;

      const score = scoreByIndex.get(suggestedIndex) ?? {
        min: Number.MAX_SAFE_INTEGER,
        max: -1,
        total: 0,
        count: 0,
      };
      score.min = Math.min(val, score.min);
      score.max = Math.max(val, score.max);
      score.total += val;
      score.count += 1;
      scoreByIndex.set(suggestedIndex, score);
    }
  }

  return scoreByIndex;
}

const cacheForFillRecursive = new Map<string, number>();
const cacheForSolver = new Map<
  string,
  Map<number, { min: number; max: number; total: number; count: number }>
>();

function fillFilterRecurse(
  tiles: readonly TileState[],
  filteredPatterns: readonly ProcessedPattern[],
  pattern: ProcessedPattern
): number {
  const { key, cachedValue } = checkCache(tiles, filteredPatterns, pattern);

  if (cachedValue !== undefined) {
    return cachedValue;
  }

  const found = validateTiles(tiles);

  if (done(found)) {
    return 0;
  }
  if (
    found[TileState.Sword] &&
    found[TileState.Present] // &&
    // (found[TileState.Fox] ||
    //   pattern.pattern.ConfirmedFoxes.every(
    //     (i) => tiles[i] !== TileState.Unknown
    //   ))
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

  const result = recursiveSolver(tiles, newFilteredPatterns);
  const weight = calculateWeight(result);
  cacheForFillRecursive.set(key, weight);
  return weight;
}

function checkCache(
  tiles: readonly TileState[],
  filteredPatterns: readonly ProcessedPattern[],
  pattern: ProcessedPattern
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
    .join(",")}`; // F${pattern.pattern.ConfirmedFoxes.join(",")}`;
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
