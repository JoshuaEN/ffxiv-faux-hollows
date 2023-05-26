import { Board } from "~/src/game/board.js";
import { SolveStep } from "~/src/game/types/solve-state.js";
import {
  CombinedTileState,
  SmartFillTileState,
  TileState,
} from "~/src/game/types/tile-states.js";

export const getPickerOptions = (
  board: Board,
  tileState: CombinedTileState,
  index: number
) => {
  const states = [
    TileState.Unknown,
    TileState.Empty,
    TileState.Blocked,
    TileState.Sword,
    TileState.Present,
    TileState.Fox,
  ];
  const primaryOptions: TileState[] = [];
  if (
    typeof tileState === "string" &&
    tileState in TileState &&
    tileState !== TileState.Unknown
  ) {
    if (tileState === TileState.Empty) {
      primaryOptions.push(TileState.Unknown);
    } else {
      primaryOptions.push(TileState.Empty);
    }
  } else {
    switch (board.solveState.solveStep) {
      case SolveStep.FillBlocked: {
        primaryOptions.push(TileState.Blocked);
        break;
      }
      case SolveStep.FillSword:
      case SolveStep.FillPresent:
      case SolveStep.SuggestTiles: {
        const suggestions = board.solveState.getSuggestion(index);
        primaryOptions.push(TileState.Empty);
        for (const state of [TileState.Sword, TileState.Present] as const) {
          if ((suggestions?.[state] ?? 0) > 0) {
            primaryOptions.push(state);
          }
        }
        break;
      }
      case SolveStep.Done:
      default: {
        primaryOptions.push(TileState.Empty);
        break;
      }
    }
  }

  const secondaryOptions: TileState[] = [];
  const userState = board.getUserState(index);
  for (const state of states) {
    if (userState !== state && !primaryOptions.includes(state)) {
      secondaryOptions.push(state);
    }
  }
  return { primaryOptions, secondaryOptions };
};
