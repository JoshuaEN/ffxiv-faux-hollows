import { getCommunityDataPatternBoundingBox } from "~/src/game/solver/bounding-box.js";
import { CommunityDataPattern } from "~/src/game/types/community-data.js";
import {
  CombinedTileState,
  SmartFillTileState,
  TileState,
} from "~/src/game/types/tile-states.js";

export function getActualTileStates(
  chosenPattern: CommunityDataPattern,
  actualFoxIndex: number | undefined
) {
  const actualPatternIndexes = {
    [TileState.Sword]: getCommunityDataPatternBoundingBox(
      chosenPattern,
      TileState.Sword
    ).indexes(),
    [TileState.Present]: getCommunityDataPatternBoundingBox(
      chosenPattern,
      TileState.Present
    ).indexes(),
  } as const;

  const actualTileMap = new Map<
    number,
    TileState.Sword | TileState.Present | TileState.Fox
  >();
  if (actualFoxIndex !== undefined) {
    actualTileMap.set(actualFoxIndex, TileState.Fox);
  }
  for (const state of [TileState.Sword, TileState.Present] as const) {
    for (const index of actualPatternIndexes[state]) {
      actualTileMap.set(index, state);
    }
  }
  return { actualTileMap, actualPatternIndexes };
}

export function normalizeState(state: CombinedTileState | undefined) {
  switch (state) {
    case TileState.Sword:
    case SmartFillTileState.SmartFillSword: {
      return TileState.Sword;
    }
    case TileState.Present:
    case SmartFillTileState.SmartFillPresent: {
      return TileState.Present;
    }
    case TileState.Fox: {
      return TileState.Fox;
    }
    case TileState.Blocked:
    case SmartFillTileState.SmartFillBlocked: {
      return TileState.Blocked;
    }
    case TileState.Unknown:
    case TileState.Empty: {
      return state;
    }
    default: {
      throw new Error(`Cannot convert ${state?.toString()} into a TileState`);
    }
  }
}
