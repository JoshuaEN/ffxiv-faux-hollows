import { assertNever } from "../../helpers.js";
import { BOARD_CELLS } from "../constants.js";
import {
  CombinedTileState,
  TrackedStatesIndexList,
  SuggestTileState,
  TileState,
  SmartFillTileState,
} from "../types/index.js";
import { SolveStep } from "../types/solve-state.js";
import { calculatedSolveState } from "./solve-state.js";

export function solve(
  userSelected: readonly TileState[],
  userStatesIndexList: TrackedStatesIndexList<ReadonlySet<number>>
) {
  const { solveState, issues } = calculatedSolveState(
    userSelected,
    userStatesIndexList
  );

  const tiles: CombinedTileState[] = [];
  const maxTileWeight = solveState.getMaxTileWeight();
  for (let i = 0; i < BOARD_CELLS; i++) {
    const userState = userSelected[i];
    if (userState !== undefined && userState !== TileState.Unknown) {
      tiles[i] = userState;
      continue;
    }
    const smartFill = solveState.getSmartFill(i);
    if (smartFill !== null) {
      switch (smartFill) {
        case TileState.Sword: {
          tiles[i] = SmartFillTileState.SmartFillSword;
          continue;
        }
        case TileState.Present: {
          tiles[i] = SmartFillTileState.SmartFillPresent;
          continue;
        }
        case TileState.Blocked: {
          tiles[i] = SmartFillTileState.SmartFillBlocked;
          continue;
        }
        default: {
          assertNever(smartFill);
        }
      }
    }

    // For Fill Sword and Fill Present we want to highlight the valid tiles
    const suggestion = solveState.getSuggestion(i);
    if (solveState.solveStep === SolveStep.FillSword) {
      if ((suggestion?.[TileState.Sword] ?? 0) > 0) {
        tiles[i] = SuggestTileState.SuggestSword;
        continue;
      }
    } else if (solveState.solveStep === SolveStep.FillPresent) {
      if ((suggestion?.[TileState.Present] ?? 0) > 0) {
        tiles[i] = SuggestTileState.SuggestPresent;
        continue;
      }
    } else if (solveState.solveStep === SolveStep.SuggestTiles) {
      const finalWeight = solveState.getFinalWeight(i);
      if (finalWeight?.value === maxTileWeight) {
        const tileSuggestions: SuggestTileState[] = [];
        if (suggestion !== null) {
          if (suggestion[TileState.Present] > 0) {
            tileSuggestions.push(SuggestTileState.SuggestPresent);
          }
          if (suggestion[TileState.Sword] > 0) {
            tileSuggestions.push(SuggestTileState.SuggestSword);
          }
          if (suggestion[TileState.Fox] > 0) {
            tileSuggestions.push(SuggestTileState.SuggestFox);
          }
        }
        if (tileSuggestions.length === 0) {
          if (import.meta.env.DEV) {
            throw new Error(`Failed to generate any suggestions for ${i}`);
          } else {
            tileSuggestions.push(
              SuggestTileState.SuggestSword,
              SuggestTileState.SuggestPresent,
              SuggestTileState.SuggestFox
            );
          }
        }
        tiles[i] = tileSuggestions;
        continue;
      }
    }

    tiles[i] = TileState.Unknown;
  }

  return { tiles, solveState, issues };
}
