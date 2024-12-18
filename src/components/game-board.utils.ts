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
  if (
    tileState === SmartFillTileState.SmartFillSword ||
    tileState === SmartFillTileState.SmartFillPresent ||
    tileState === SmartFillTileState.SmartFillBlocked
  ) {
    return {
      message: {
        identifier: "SMART_FILL",
        tileState: tileState,
      } as const,
      primaryOptions: new Set<TileState>(),
      options: [],
    };
  }

  // Note: The `tileState` includes suggestions, but only for the current recommended tile.
  // We want to show accurate suggestions for any tile the user selects, so we get the underlying suggestions from the solve state.
  const suggestions = board.solveState.getSuggestion(index);
  const solveStep = board.solveState.solveStep;
  const userState =
    typeof tileState === "string" && tileState in TileState ? tileState : null;

  const primaryOptions = new Set<TileState>();
  const options: TileState[] = [];
  // If the title already has user input
  if (solveStep === SolveStep.FillBlocked || userState === TileState.Blocked) {
    primaryOptions.add(
      userState === TileState.Blocked ? TileState.Unknown : TileState.Blocked
    );
    options.push(TileState.Blocked, TileState.Unknown);
  } else if (userState !== null && tileState !== TileState.Unknown) {
    primaryOptions.add(TileState.Unknown);

    // Special cases: Smart fill
  } else if (
    suggestions !== null &&
    ((solveStep === SolveStep.FillSword && suggestions.Sword > 0) ||
      (solveStep === SolveStep.FillPresent && suggestions.Present > 0))
  ) {
    primaryOptions.add(
      solveStep === SolveStep.FillSword ? TileState.Sword : TileState.Present
    );
  } else {
    switch (solveStep) {
      case SolveStep.FillSword:
      case SolveStep.FillPresent:
      case SolveStep.SuggestTiles:
      case SolveStep.SuggestFoxes: {
        primaryOptions.add(TileState.Empty);
        for (const state of [
          TileState.Sword,
          TileState.Present,
          TileState.Fox,
        ] as const) {
          if ((suggestions?.[state] ?? 0) > 0) {
            primaryOptions.add(state);
          }
        }
        break;
      }
      case SolveStep.Done:
      default: {
        primaryOptions.add(TileState.Empty);
        break;
      }
    }
  }

  if (options.length === 0) {
    options.push(
      TileState.Empty,
      TileState.Sword,
      TileState.Present,
      TileState.Unknown,
      TileState.Fox
    );
  }
  return { primaryOptions, options, message: null };
};
