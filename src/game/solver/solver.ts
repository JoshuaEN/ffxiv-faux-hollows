import { assertNever } from "../../helpers";
import { BOARD_CELLS } from "../constants";
import {
  CombinedTileState,
  SolveStep,
  TrackedStatesIndexList,
  SuggestTileState,
  TileState,
  SmartFillTileState,
} from "../types";
import { calculatedSolveState } from "./solve-state";

export function solve(
  userSelected: readonly TileState[],
  userStatesIndexList: TrackedStatesIndexList<ReadonlySet<number>>
) {
  const { solveState, issues } = calculatedSolveState(
    userSelected,
    userStatesIndexList
  );

  const tiles: CombinedTileState[] = [];
  const peakSuggestions = solveState.getPeakSuggestions();
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
          tiles[i] = SmartFillTileState.Sword;
          continue;
        }
        case TileState.Present: {
          tiles[i] = SmartFillTileState.Present;
          continue;
        }
        case TileState.Blocked: {
          tiles[i] = SmartFillTileState.Blocked;
          continue;
        }
        default: {
          assertNever(smartFill);
        }
      }
    }

    const suggestion = solveState.getSuggestion(i);

    // For Fill Sword and Fill Present we want to highlight the valid tiles
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
      if (suggestion?.FinalWeight === peakSuggestions.FinalWeight) {
        const tileSuggestions: SuggestTileState[] = [];
        if (suggestion[TileState.Present] > 0) {
          tileSuggestions.push(SuggestTileState.SuggestPresent);
        }
        if (suggestion[TileState.Sword] > 0) {
          tileSuggestions.push(SuggestTileState.SuggestSword);
        }
        if (suggestion[TileState.Fox] > 0) {
          tileSuggestions.push(SuggestTileState.SuggestFox);
        }
        tiles[i] = tileSuggestions;
        continue;
      }
    }

    tiles[i] = TileState.Unknown;
  }

  return { tiles, solveState, issues };
}
