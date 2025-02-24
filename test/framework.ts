import { BOARD_CELLS, BOARD_WIDTH } from "~/src/game/constants.js";
import {
  BoardIssue,
  SmartFillTileState,
  TileState,
} from "~/src/game/types/index.js";
import { eachIndex } from "~/src/helpers.js";
import {
  CellTestData,
  loadAsciiGrid,
  TestPatternData,
} from "./helpers/ascii-grid.js";

export enum TestTag {
  /**
   * A test which it is not possible to enter this state in the UI.
   */
  ImpossibleUIState = "ImpossibleUIState",
  /**
   * A test which is technically possible to create in the UI, but involves choosing a grayed out option in the picker UI, or is trying to load suggestions during fills, which causes issues with the UI tests.
   */
  InvalidUIState = "InvalidUIState",
}

export type RegisterTest = (
  title: string | { title: string; tags: TestTag[] },
  ...states: string[]
) => void;

export enum FormatDataSource {
  Actual = "Actual",
  Expected = "Expected",
}

export interface TestGameStateSnapshot {
  cells: CellTestData[];
  issues: BoardIssue[];
  patternData: TestPatternData;
  debug?: string;
}

export abstract class BaseSequenceRunner {
  constructor(
    private readonly fail: (message: string) => never,
    private readonly expect: <T>(
      actual: T,
      msg?: string
    ) => { toEqual: (expected: T) => void }
  ) {}
  async testSequence(states: string[]) {
    if (states.length < 2) {
      this.fail(
        `There must be at least two states provided; the first state is used as an initial (Arrange) state with no assertions made about it.`
      );
    }
    // Arrange
    {
      const initialState = states.shift();
      if (initialState === undefined) {
        this.fail("No states provided");
      }
      await this.applyInitialState(initialState);
    }

    // Each loop: Act, Assert
    for (const [sequenceIndex, state] of eachIndex(states)) {
      // Add 1 since we shifted off the first index to fill initial state
      const adjustedSequenceIndex = sequenceIndex + 1;

      const {
        expectedDatum,
        expectedPatternData,
        actions,
        issues: expectedBoardIssues,
      } = loadAsciiGrid(state);

      // Act
      for (const action of actions) {
        await this.setUserSelection(
          action.index,
          action.tileState,
          action.expectInvalidMove
        );
      }

      const sequenceIndexStr =
        adjustedSequenceIndex > 0 ? adjustedSequenceIndex : "";

      // Assert
      await this.assertBoardState(
        sequenceIndexStr,
        expectedPatternData,
        expectedDatum,
        expectedBoardIssues
      );
    }
  }

  protected async assertBoardState(
    sequenceIndexStr: string | number,
    expectedPatternData: TestPatternData,
    expectedDatum: CellTestData[],
    expectedBoardIssues: BoardIssue[]
  ) {
    const actualState = await this.getState();
    const actual = {
      str: `\n${this.formatPatterns(FormatDataSource.Actual, actualState.patternData)}\n${sequenceIndexStr}->0`,
    };
    const expected = {
      str: `\n${this.formatPatterns(FormatDataSource.Expected, expectedPatternData)}\n${sequenceIndexStr}->0`,
    };
    const actualDatum = actualState.cells;
    for (const [k, expectedData] of eachIndex(expectedDatum)) {
      if (k > 0 && k % BOARD_WIDTH === 0) {
        actual.str += `|\n\n${sequenceIndexStr}->${Math.floor(
          k / BOARD_WIDTH
        )}|`;
        expected.str += `|\n\n${sequenceIndexStr}->${Math.floor(
          k / BOARD_WIDTH
        )}|`;
      } else {
        actual.str += `|`;
        expected.str += "|";
      }

      const actualData = actualDatum[k];
      if (actualData === undefined) {
        this.fail(`No actual data at index ${k}`);
      }

      this.format(FormatDataSource.Actual, k, actual, actualData);
      this.format(FormatDataSource.Expected, k, expected, expectedData);
    }
    actual.str += "|\n";
    expected.str += "|\n";

    const actualIssues = this.formatIssues(
      FormatDataSource.Actual,
      actualState.issues
    );
    const expectedIssues = this.formatIssues(
      FormatDataSource.Expected,
      expectedBoardIssues
    );
    if (actualIssues.length > 0) {
      actual.str += "\nIssues:\n  " + actualIssues.join("\n  ");
    }
    if (expectedIssues.length > 0) {
      expected.str += "\nIssues:\n  " + expectedIssues.join("\n  ");
    }

    this.expect(
      actual.str,
      actualState.debug !== undefined
        ? // We inject temporal and random data in because vitest merges test failures based on this message, even if the actual/expected values are different.
          `\n\u001b[34mDebug: ${actualState.debug} \u001b[8m | Now: ${Date.now()} | Random Value: ${Math.random()}\u001b[0m\n`
        : undefined
    ).toEqual(expected.str);
  }

  protected async applyInitialState(initialState: string) {
    const { expectedDatum, actions, expectedPatternData, issues } =
      loadAsciiGrid(initialState);
    if (actions.length > 0) {
      this.fail(
        `Initial state must not have any actions: All cells of the first item in the test sequence must only have prior state`
      );
    }
    if (issues.length > 0) {
      this.fail(
        `Initial state must not have any issues: All cells of the first item in the test sequence must only have prior state`
      );
    }
    if (expectedPatternData.patternIdentifier !== null) {
      this.fail(`Initial state must not have any pattern identifier set.`);
    }
    if (expectedPatternData.remainingPatterns !== null) {
      this.fail(`Initial state must not have any remaining patterns set.`);
    }
    for (const [i, expectedData] of this.eachIndex(expectedDatum)) {
      if (expectedData.prompt !== undefined) {
        this.fail(
          `Cell ${i} has prompt: All cells of the first item in the test sequence must only have prior state`
        );
      }
      if (expectedData.recommended !== undefined) {
        this.fail(
          `Cell ${i} has recommended: All cells of the first item in the test sequence must only have prior state`
        );
      }
      if (expectedData.suggestions !== undefined) {
        this.fail(
          `Cell ${i} has suggestions: All cells of the first item in the test sequence must only have prior state`
        );
      }
      if (expectedData.smartFill !== null) {
        this.fail(
          `Cell ${i} has smartFill: All cells of the first item in the test sequence must only have prior state`
        );
      }

      if (expectedData.userSelection === undefined) {
        this.fail(
          `Cell ${i} does not have a userSelection: All cells of the first item in the test sequence must only have prior state`
        );
      }

      await this.setUserSelection(i, expectedData.userSelection, false);
    }
  }

  protected formatPatterns(
    source: FormatDataSource,
    patternData: TestPatternData
  ) {
    return `ID ${patternData.patternIdentifier ?? "(unavailable)"}\n## ${patternData.remainingPatterns ?? "(unavailable)"}`;
  }

  protected format(
    source: FormatDataSource,
    index: number,
    destination: { str: string },
    data: CellTestData
  ) {
    this.formatConcreteTileStates(
      source,
      index,
      destination,
      data.userSelection ?? TileState.Unknown,
      data.smartFill
    );
    this.formatSuggestions(
      source,
      index,
      destination,
      data.prompt,
      data.suggestions,
      data.recommended
    );
  }

  protected abstract setUserSelection(
    index: number,
    tileState: TileState,
    expectInvalidMove?: boolean
  ): Promise<void> | void;

  protected abstract getState():
    | Promise<TestGameStateSnapshot>
    | TestGameStateSnapshot;

  protected *indexes(): Iterable<number> {
    for (let i = 0; i < BOARD_CELLS; i++) {
      yield i;
    }
  }

  protected formatConcreteTileStates(
    source: FormatDataSource,
    index: number,
    data: { str: string },
    userSelected: TileState,
    smartFill: SmartFillTileState | null | undefined
  ) {
    if (userSelected === TileState.Unknown) {
      data.str += " ";
    } else {
      data.str += userSelected.slice(0, 1).toUpperCase();
    }
    if (
      userSelected !== TileState.Unknown ||
      smartFill === null ||
      smartFill === undefined
    ) {
      data.str += "  ";
    } else {
      this.expect(
        smartFill.startsWith("SmartFill"),
        `${smartFill} must start with SmartFill`
      ).toEqual(true);
      data.str += ` ${smartFill
        .slice("SmartFill".length, "SmartFill".length + 1)
        .toLowerCase()}`;
    }
  }

  protected formatSuggestions(
    source: FormatDataSource,
    index: number,
    data: { str: string },
    prompt: CellTestData["prompt"],
    suggestion: CellTestData["suggestions"],
    recommended: boolean | undefined
  ) {
    if (prompt !== undefined && recommended !== undefined) {
      this.fail(
        `[${source}] Index ${index} has both a prompt (${prompt}) and a recommended (${recommended}); the implementation of BaseSequenceRunner should filter one out depending on what is supported by the code being tested.`
      );
    }

    suggestion ??= {
      Sword: 0,
      Present: 0,
      Fox: 0,
    };
    if (recommended !== undefined) {
      data.str += recommended ? `  *` : `   `;
    } else if (prompt !== undefined) {
      this.expect(
        prompt.startsWith("Suggest"),
        `${prompt} must start with Suggest`
      ).toEqual(true);
      data.str += ` ?${prompt
        .slice("Suggest".length, "Suggest".length + 1)
        .toLowerCase()}`;
    } else {
      data.str += `   `;
    }

    if (suggestion.Sword > 0) {
      data.str += ` S:${suggestion.Sword.toString(16)}`;
    } else {
      data.str += `    `;
    }
    if (suggestion.Present > 0) {
      data.str += ` P:${suggestion.Present.toString(16)}`;
    } else {
      data.str += `    `;
    }
    if (suggestion.Fox > 0) {
      data.str += ` F:${suggestion.Fox.toString(16)}`;
    } else {
      data.str += `    `;
    }
  }

  protected formatIssues(source: FormatDataSource, issues: BoardIssue[]) {
    const issuesStrings = [] as string[];
    for (const issue of issues) {
      const issueTiles = Array.from(issue.issueTiles);
      issuesStrings.push(
        `[${issue.severity}] ${issue.message}${
          issueTiles.length > 0 ? ` # Issues: ${issueTiles.join(", ")}` : ``
        }`
      );
    }
    issuesStrings.sort();
    return issuesStrings;
  }

  protected *eachIndex(
    array: CellTestData[]
  ): Iterable<[number, CellTestData]> {
    for (let i = 0; i < array.length; i++) {
      yield [i, array[i] as CellTestData];
    }
  }
}
