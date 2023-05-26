import { Board } from "~/src/game/board.js";
import { SolveStep } from "~/src/game/types/solve-state.js";
import {
  CombinedTileState,
  SmartFillTileState,
  TileState,
} from "~/src/game/types/tile-states.js";

const candidateSecondaryStates = [
  TileState.Empty,
  TileState.Blocked,
  TileState.Sword,
  TileState.Present,
  TileState.Fox,
] as const;

export const getPickerOptions = (
  board: Board,
  tileState: CombinedTileState,
  index: number
) => {
  // Note: The `tileState` includes suggestions, but only for the current recommended tile.
  // We want to show accurate suggestions for any tile the user selects, so we get the underlying suggestions from the solve state.
  const suggestions = board.solveState.getSuggestion(index);
  const solveStep = board.solveState.solveStep;
  const userState =
    typeof tileState === "string" && tileState in TileState ? tileState : null;
  const primaryOptions: TileState[] = [];
  // If the title already has user input
  if (
    typeof tileState === "string" &&
    tileState in TileState &&
    tileState !== TileState.Unknown
  ) {
    primaryOptions.push(TileState.Unknown);

    // Special cases: Smart fill
  } else if (typeof tileState === "string" && tileState in SmartFillTileState) {
    switch (tileState) {
      case SmartFillTileState.SmartFillBlocked:
        primaryOptions.push(TileState.Blocked);
        break;
      case SmartFillTileState.SmartFillSword:
        primaryOptions.push(TileState.Sword);
        break;
      case SmartFillTileState.SmartFillPresent:
        primaryOptions.push(TileState.Present);
        break;
    }

    // Special case: Sword/Present fill modes where the current tile could have Sword/Present respectively
  } else if (
    suggestions !== null &&
    ((solveStep === SolveStep.FillSword && suggestions.Sword > 0) ||
      (solveStep === SolveStep.FillPresent && suggestions.Present > 0))
  ) {
    primaryOptions.push(
      solveStep === SolveStep.FillSword ? TileState.Sword : TileState.Present
    );
  } else {
    switch (solveStep) {
      case SolveStep.FillBlocked: {
        primaryOptions.push(TileState.Blocked);
        break;
      }
      case SolveStep.FillSword:
      case SolveStep.FillPresent:
      case SolveStep.SuggestTiles: {
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
  for (const state of candidateSecondaryStates) {
    if (userState !== state && !primaryOptions.includes(state)) {
      secondaryOptions.push(state);
    }
  }
  return { primaryOptions, secondaryOptions };
};
