import { describe, expect, test } from "vitest";
import { Board } from "~/src/game/board.js";
import {
  SolveState,
  SolveStep,
  TileSuggestion,
} from "~/src/game/types/solve-state.js";
import { CombinedTileState, TileState } from "~/src/game/types/tile-states.js";
import { getPickerOptions } from "./game-board.utils.js";

describe("getPickerOptions", () => {
  const testIndex = 5;
  describe("SolveState: FillBlocked", () => {
    test("returns Blocked tile as the primary", () => {
      assertGetPickerOptions(
        {
          solveStep: SolveStep.FillBlocked,
          getSuggestion: null,
        },
        TileState.Unknown,
        testIndex,
        blankTileOptions(TileState.Blocked)
      );
    });
    test("returns Unknown tile as the primary when tile is already marked as Blocked", () => {
      assertGetPickerOptions(
        {
          solveStep: SolveStep.FillBlocked,
          getSuggestion: null,
        },
        TileState.Blocked,
        testIndex,
        filledTileOptions(TileState.Blocked, TileState.Unknown)
      );
    });
  });

  describe("SolveState: FillSword", () => {
    test(`returns Sword as primary when Sword and Present is suggested and in solve step FillSword`, () => {
      assertGetPickerOptions(
        {
          solveStep: SolveStep.FillSword,
          getSuggestion: {
            Blocked: 0,
            Sword: 1,
            Present: 1,
            Fox: 0,
          },
        },
        TileState.Unknown,
        testIndex,
        blankTileOptions(TileState.Sword)
      );
    });
    test(`returns just Sword as primary when only Sword is suggested and in solve step FillSword`, () => {
      assertGetPickerOptions(
        {
          solveStep: SolveStep.FillSword,
          getSuggestion: {
            Blocked: 0,
            Sword: 1,
            Present: 0,
            Fox: 0,
          },
        },
        TileState.Unknown,
        testIndex,
        blankTileOptions(TileState.Sword)
      );
    });
    test(`returns just Present (and empty) as primary when only Present is suggested and in solve step FillSword`, () => {
      assertGetPickerOptions(
        {
          solveStep: SolveStep.FillSword,
          getSuggestion: {
            Blocked: 0,
            Sword: 0,
            Present: 1,
            Fox: 0,
          },
        },
        TileState.Unknown,
        testIndex,
        blankTileOptions(TileState.Empty, TileState.Present)
      );
    });
    test(`returns just empty as primary when Sword and Present are not suggested and in solve step FillSword`, () => {
      assertGetPickerOptions(
        {
          solveStep: SolveStep.FillSword,
          getSuggestion: {
            Blocked: 0,
            Sword: 0,
            Present: 0,
            Fox: 0,
          },
        },
        TileState.Unknown,
        testIndex,
        blankTileOptions(TileState.Empty)
      );
    });
    test(`does not return Fox as primary when suggested and in solve step FillSword`, () => {
      assertGetPickerOptions(
        {
          solveStep: SolveStep.FillSword,
          getSuggestion: {
            Blocked: 0,
            Sword: 0,
            Present: 0,
            Fox: 1,
          },
        },
        TileState.Unknown,
        testIndex,
        blankTileOptions(TileState.Empty)
      );
    });
    test("returns Unknown tile as the primary when tile is already marked as Sword", () => {
      assertGetPickerOptions(
        {
          solveStep: SolveStep.FillSword,
          getSuggestion: null,
        },
        TileState.Blocked,
        testIndex,
        filledTileOptions(TileState.Blocked, TileState.Unknown)
      );
    });
    test("returns Unknown tile as the primary when Sword is suggested but tile is already marked as Sword", () => {
      assertGetPickerOptions(
        {
          solveStep: SolveStep.FillSword,
          getSuggestion: {
            Blocked: 0,
            Sword: 1,
            Present: 0,
            Fox: 0,
          },
        },
        TileState.Sword,
        testIndex,
        filledTileOptions(TileState.Sword, TileState.Unknown)
      );
    });
    test("returns Unknown tile as the primary when Sword is suggested but tile is already marked as something else", () => {
      assertGetPickerOptions(
        {
          solveStep: SolveStep.FillSword,
          getSuggestion: {
            Blocked: 0,
            Sword: 1,
            Present: 0,
            Fox: 0,
          },
        },
        TileState.Present,
        testIndex,
        filledTileOptions(TileState.Present, TileState.Unknown)
      );
    });
  });

  describe("SolveState: FillPresent", () => {
    test(`returns Present as primary when Sword and Present is suggested and in solve step FillPresent`, () => {
      assertGetPickerOptions(
        {
          solveStep: SolveStep.FillPresent,
          getSuggestion: {
            Blocked: 0,
            Sword: 1,
            Present: 1,
            Fox: 0,
          },
        },
        TileState.Unknown,
        testIndex,
        blankTileOptions(TileState.Present)
      );
    });
    test(`returns just Sword (and empty) as primary when only Sword is suggested and in solve step FillPresent`, () => {
      assertGetPickerOptions(
        {
          solveStep: SolveStep.FillPresent,
          getSuggestion: {
            Blocked: 0,
            Sword: 1,
            Present: 0,
            Fox: 0,
          },
        },
        TileState.Unknown,
        testIndex,
        blankTileOptions(TileState.Empty, TileState.Sword)
      );
    });
    test(`returns just Present as primary when only Present is suggested and in solve step FillPresent`, () => {
      assertGetPickerOptions(
        {
          solveStep: SolveStep.FillPresent,
          getSuggestion: {
            Blocked: 0,
            Sword: 0,
            Present: 1,
            Fox: 0,
          },
        },
        TileState.Unknown,
        testIndex,
        blankTileOptions(TileState.Present)
      );
    });
    test(`returns just empty as primary when Sword and Present are not suggested and in solve step FillPresent`, () => {
      assertGetPickerOptions(
        {
          solveStep: SolveStep.FillPresent,
          getSuggestion: {
            Blocked: 0,
            Sword: 0,
            Present: 0,
            Fox: 0,
          },
        },
        TileState.Unknown,
        testIndex,
        blankTileOptions(TileState.Empty)
      );
    });
    test(`does not return Fox as primary when suggested and in solve step FillPresent`, () => {
      assertGetPickerOptions(
        {
          solveStep: SolveStep.FillPresent,
          getSuggestion: {
            Blocked: 0,
            Sword: 0,
            Present: 0,
            Fox: 1,
          },
        },
        TileState.Unknown,
        testIndex,
        blankTileOptions(TileState.Empty)
      );
    });
    test("returns Unknown tile as the primary when Present is suggested but tile is already marked as Present", () => {
      assertGetPickerOptions(
        {
          solveStep: SolveStep.FillSword,
          getSuggestion: {
            Blocked: 0,
            Sword: 0,
            Present: 1,
            Fox: 0,
          },
        },
        TileState.Present,
        testIndex,
        filledTileOptions(TileState.Present, TileState.Unknown)
      );
    });
    test("returns Unknown tile as the primary when Present is suggested but tile is already marked as something else", () => {
      assertGetPickerOptions(
        {
          solveStep: SolveStep.FillSword,
          getSuggestion: {
            Blocked: 0,
            Sword: 0,
            Present: 1,
            Fox: 0,
          },
        },
        TileState.Sword,
        testIndex,
        filledTileOptions(TileState.Sword, TileState.Unknown)
      );
    });
  });

  describe("SolveState: SuggestTiles", () => {
    test(`returns Sword and Present (and empty) as primary when Sword and Present is suggested`, () => {
      assertGetPickerOptions(
        {
          solveStep: SolveStep.SuggestTiles,
          getSuggestion: {
            Blocked: 0,
            Sword: 1,
            Present: 1,
            Fox: 0,
          },
        },
        TileState.Unknown,
        testIndex,
        blankTileOptions(TileState.Empty, TileState.Sword, TileState.Present)
      );
    });
    test(`returns just Sword (and empty) as primary when only Sword is suggested`, () => {
      assertGetPickerOptions(
        {
          solveStep: SolveStep.SuggestTiles,
          getSuggestion: {
            Blocked: 0,
            Sword: 1,
            Present: 0,
            Fox: 0,
          },
        },
        TileState.Unknown,
        testIndex,
        blankTileOptions(TileState.Empty, TileState.Sword)
      );
    });
    test(`returns just Present (and empty) as primary when only Present is suggested`, () => {
      assertGetPickerOptions(
        {
          solveStep: SolveStep.SuggestTiles,
          getSuggestion: {
            Blocked: 0,
            Sword: 0,
            Present: 1,
            Fox: 0,
          },
        },
        TileState.Unknown,
        testIndex,
        blankTileOptions(TileState.Empty, TileState.Present)
      );
    });
    test(`returns just empty as primary when Sword and Present are not suggested`, () => {
      assertGetPickerOptions(
        {
          solveStep: SolveStep.SuggestTiles,
          getSuggestion: {
            Blocked: 0,
            Sword: 0,
            Present: 0,
            Fox: 0,
          },
        },
        TileState.Unknown,
        testIndex,
        blankTileOptions(TileState.Empty)
      );
    });
    test(`does not return Fox as primary when suggested`, () => {
      assertGetPickerOptions(
        {
          solveStep: SolveStep.SuggestTiles,
          getSuggestion: {
            Blocked: 0,
            Sword: 0,
            Present: 0,
            Fox: 1,
          },
        },
        TileState.Unknown,
        testIndex,
        blankTileOptions(TileState.Empty)
      );
    });
    test(`returns just Unknown as primary when the title state is set`, () => {
      assertGetPickerOptions(
        {
          solveStep: SolveStep.SuggestTiles,
          getSuggestion: {
            Blocked: 0,
            Sword: 0,
            Present: 0,
            Fox: 1,
          },
        },
        TileState.Empty,
        testIndex,
        filledTileOptions(TileState.Empty, TileState.Unknown)
      );
    });
  });

  describe("SolveState: Done", () => {
    test(`returns just Empty when the title state is not set`, () => {
      assertGetPickerOptions(
        {
          solveStep: SolveStep.SuggestTiles,
          getSuggestion: null,
        },
        TileState.Unknown,
        testIndex,
        blankTileOptions(TileState.Empty)
      );
    });
    test(`returns just Unknown as primary when the title state is set`, () => {
      assertGetPickerOptions(
        {
          solveStep: SolveStep.SuggestTiles,
          getSuggestion: null,
        },
        TileState.Empty,
        testIndex,
        filledTileOptions(TileState.Empty, TileState.Unknown)
      );
    });
  });

  function assertGetPickerOptions(
    {
      solveStep,
      getSuggestion,
    }: {
      solveStep: SolveStep;
      getSuggestion: Readonly<TileSuggestion> | null;
    },
    tileState: CombinedTileState,
    index: number,
    expectedResult: {
      primaryOptions: TileState[];
      secondaryOptions: TileState[];
    }
  ) {
    const board: Board = {
      solveState: {
        solveStep,
        getSuggestion(index: number) {
          expect(index).toEqual(index);
          return getSuggestion;
        },
      } as SolveState,
    } as Board;

    expect(getPickerOptions(board, tileState, index)).toEqual(expectedResult);
  }

  function getTileOptions(allStates: TileState[], primaryStates: TileState[]) {
    const primaryOptions: TileState[] = [];
    const secondaryOptions: TileState[] = [];

    for (const state of allStates) {
      if (primaryStates.includes(state)) {
        primaryOptions.push(state);
      } else {
        secondaryOptions.push(state);
      }
    }
    return {
      primaryOptions,
      secondaryOptions,
    };
  }

  function blankTileOptions(...primaryStates: [TileState, ...TileState[]]) {
    return getTileOptions(
      [
        TileState.Empty,
        TileState.Blocked,
        TileState.Sword,
        TileState.Present,
        TileState.Fox,
      ],
      primaryStates
    );
  }
  function filledTileOptions(
    selectedState: TileState,
    primaryStates: TileState.Unknown
  ) {
    return getTileOptions(
      [
        TileState.Unknown,
        TileState.Empty,
        TileState.Blocked,
        TileState.Sword,
        TileState.Present,
        TileState.Fox,
      ].filter((state) => state !== selectedState),
      [primaryStates]
    );
  }
});
