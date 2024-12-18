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
  const BLOCKED_OPTIONS = Object.freeze([
    TileState.Blocked,
    TileState.Unknown,
  ]) as TileState[];
  const DEFAULT_OPTIONS = Object.freeze([
    TileState.Empty,
    TileState.Sword,
    TileState.Present,
    TileState.Unknown,
    TileState.Fox,
  ]) as TileState[];

  describe("SolveState: FillBlocked", () => {
    test("returns Blocked tile as the primary", () => {
      assertGetPickerOptions(
        {
          solveStep: SolveStep.FillBlocked,
          getSuggestion: null,
        },
        TileState.Unknown,
        testIndex,
        unsetTileOptions(BLOCKED_OPTIONS, [TileState.Blocked])
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
        setTileOptions(BLOCKED_OPTIONS, TileState.Blocked, [TileState.Unknown])
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
        unsetTileOptions(DEFAULT_OPTIONS, [TileState.Sword])
      );
    });
    test(`returns Sword as primary when Sword and Fox is suggested and in solve step FillSword`, () => {
      assertGetPickerOptions(
        {
          solveStep: SolveStep.FillSword,
          getSuggestion: {
            Blocked: 0,
            Sword: 1,
            Present: 0,
            Fox: 1,
          },
        },
        TileState.Unknown,
        testIndex,
        unsetTileOptions(DEFAULT_OPTIONS, [TileState.Sword])
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
        unsetTileOptions(DEFAULT_OPTIONS, [TileState.Sword])
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
        unsetTileOptions(DEFAULT_OPTIONS, [TileState.Empty, TileState.Present])
      );
    });
    test(`returns just Fox (and empty) as primary when only Fox is suggested and in solve step FillSword`, () => {
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
        unsetTileOptions(DEFAULT_OPTIONS, [TileState.Empty, TileState.Fox])
      );
    });
    test(`returns just empty as primary when Sword, Present, and Fox are not suggested and in solve step FillSword`, () => {
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
        unsetTileOptions(DEFAULT_OPTIONS, [TileState.Empty])
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
        setTileOptions(DEFAULT_OPTIONS, TileState.Sword, [TileState.Unknown])
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
        setTileOptions(DEFAULT_OPTIONS, TileState.Present, [TileState.Unknown])
      );
    });
    test("returns Unknown tile as the primary when tile is already marked as Blocked", () => {
      assertGetPickerOptions(
        {
          solveStep: SolveStep.FillSword,
          getSuggestion: null,
        },
        TileState.Blocked,
        testIndex,
        setTileOptions(BLOCKED_OPTIONS, TileState.Blocked, [TileState.Unknown])
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
        unsetTileOptions(DEFAULT_OPTIONS, [TileState.Present])
      );
    });
    test(`returns Present as primary when Fox and Present is suggested and in solve step FillPresent`, () => {
      assertGetPickerOptions(
        {
          solveStep: SolveStep.FillPresent,
          getSuggestion: {
            Blocked: 0,
            Sword: 0,
            Present: 1,
            Fox: 1,
          },
        },
        TileState.Unknown,
        testIndex,
        unsetTileOptions(DEFAULT_OPTIONS, [TileState.Present])
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
        unsetTileOptions(DEFAULT_OPTIONS, [TileState.Empty, TileState.Sword])
      );
    });
    test(`returns just Fox (and empty) as primary when only Fox is suggested and in solve step FillPresent`, () => {
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
        unsetTileOptions(DEFAULT_OPTIONS, [TileState.Empty, TileState.Fox])
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
        unsetTileOptions(DEFAULT_OPTIONS, [TileState.Present])
      );
    });
    test(`returns just empty as primary when Sword, Present, and Fox are not suggested and in solve step FillPresent`, () => {
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
        unsetTileOptions(DEFAULT_OPTIONS, [TileState.Empty])
      );
    });
    test("returns Unknown tile as the primary when Present is suggested but tile is already marked as Present", () => {
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
        TileState.Present,
        testIndex,
        setTileOptions(DEFAULT_OPTIONS, TileState.Present, [TileState.Unknown])
      );
    });
    // Note: Shouldn't really happen. The user's input should be considered unquestionable as far as a the solver is concerned when providing suggestions.
    test("returns Unknown tile as the primary when Present is suggested but tile is already marked as something else", () => {
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
        TileState.Sword,
        testIndex,
        setTileOptions(DEFAULT_OPTIONS, TileState.Sword, [TileState.Unknown])
      );
    });
    test("returns Unknown tile as the primary when tile is already marked as Blocked", () => {
      assertGetPickerOptions(
        {
          solveStep: SolveStep.FillPresent,
          getSuggestion: null,
        },
        TileState.Blocked,
        testIndex,
        setTileOptions(BLOCKED_OPTIONS, TileState.Blocked, [TileState.Unknown])
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
        unsetTileOptions(DEFAULT_OPTIONS, [
          TileState.Empty,
          TileState.Sword,
          TileState.Present,
        ])
      );
    });
    test(`returns Sword and Fox (and empty) as primary when Sword and Fox is suggested`, () => {
      assertGetPickerOptions(
        {
          solveStep: SolveStep.SuggestTiles,
          getSuggestion: {
            Blocked: 0,
            Sword: 1,
            Present: 0,
            Fox: 1,
          },
        },
        TileState.Unknown,
        testIndex,
        unsetTileOptions(DEFAULT_OPTIONS, [
          TileState.Empty,
          TileState.Sword,
          TileState.Fox,
        ])
      );
    });
    test(`returns Present and Fox (and empty) as primary when Present and Fox is suggested`, () => {
      assertGetPickerOptions(
        {
          solveStep: SolveStep.SuggestTiles,
          getSuggestion: {
            Blocked: 0,
            Sword: 0,
            Present: 1,
            Fox: 1,
          },
        },
        TileState.Unknown,
        testIndex,
        unsetTileOptions(DEFAULT_OPTIONS, [
          TileState.Empty,
          TileState.Present,
          TileState.Fox,
        ])
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
        unsetTileOptions(DEFAULT_OPTIONS, [TileState.Empty, TileState.Sword])
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
        unsetTileOptions(DEFAULT_OPTIONS, [TileState.Empty, TileState.Present])
      );
    });
    test(`return just Fox (and empty) as primary when only Fox is suggested`, () => {
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
        unsetTileOptions(DEFAULT_OPTIONS, [TileState.Empty, TileState.Fox])
      );
    });
    test(`returns just empty as primary when Sword, Present, and Fox are not suggested`, () => {
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
        unsetTileOptions(DEFAULT_OPTIONS, [TileState.Empty])
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
        setTileOptions(DEFAULT_OPTIONS, TileState.Empty, [TileState.Unknown])
      );
    });
    test("returns Unknown tile as the primary when tile is already marked as Blocked", () => {
      assertGetPickerOptions(
        {
          solveStep: SolveStep.SuggestTiles,
          getSuggestion: null,
        },
        TileState.Blocked,
        testIndex,
        setTileOptions(BLOCKED_OPTIONS, TileState.Blocked, [TileState.Unknown])
      );
    });
  });

  describe("SolveState: Done", () => {
    test(`returns just Empty when the title state is not set`, () => {
      assertGetPickerOptions(
        {
          solveStep: SolveStep.Done,
          getSuggestion: null,
        },
        TileState.Unknown,
        testIndex,
        unsetTileOptions(DEFAULT_OPTIONS, [TileState.Empty])
      );
    });
    test(`returns just Unknown as primary when the title state is set`, () => {
      assertGetPickerOptions(
        {
          solveStep: SolveStep.Done,
          getSuggestion: null,
        },
        TileState.Empty,
        testIndex,
        setTileOptions(DEFAULT_OPTIONS, TileState.Empty, [TileState.Unknown])
      );
    });
    test("returns Unknown tile as the primary when tile is already marked as Blocked", () => {
      assertGetPickerOptions(
        {
          solveStep: SolveStep.Done,
          getSuggestion: null,
        },
        TileState.Blocked,
        testIndex,
        setTileOptions(BLOCKED_OPTIONS, TileState.Blocked, [TileState.Unknown])
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
    expectedResult: ReturnType<typeof getPickerOptions>
  ) {
    const board: Board = {
      solveState: {
        solveStep,
        getSuggestion(actualIndex: number) {
          expect(actualIndex).toEqual(index);
          return getSuggestion;
        },
      } as SolveState,
    } as Board;

    expect(getPickerOptions(board, tileState, index)).toEqual(expectedResult);
  }

  function getTileOptions(options: TileState[], primaryStates: TileState[]) {
    const primaryOptions = new Set<TileState>(primaryStates);

    return {
      primaryOptions,
      options,
      message: null,
    };
  }

  function unsetTileOptions(options: TileState[], primaryStates: TileState[]) {
    return getTileOptions(options, primaryStates);
  }
  function setTileOptions(
    options: TileState[],
    selectedState: TileState,
    primaryStates: TileState[]
  ) {
    return getTileOptions(
      options,
      primaryStates.filter((state) => state !== selectedState)
    );
  }
});
