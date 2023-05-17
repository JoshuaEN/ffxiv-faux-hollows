import { BOARD_CELLS, BOARD_WIDTH } from "~/src/game/constants.js";
import {
  BoardIssue,
  SmartFillTileState,
  TileState,
} from "~/src/game/types/index.js";
import { eachIndex } from "~/src/helpers.js";
import { CellTestData, loadAsciiGrid } from "./helpers/ascii-grid.js";

export type RegisterTest = (title: string, ...states: string[]) => void;

export enum FormatDataSource {
  Actual = "Actual",
  Expected = "Expected",
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
      const { expectedDatum, actions, issues } = loadAsciiGrid(initialState);
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
      for (const [i, expectedData] of eachIndex(expectedDatum)) {
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

        await this.setUserSelection(i, expectedData.userSelection);
      }
    }

    // Each loop: Act, Assert
    for (const [sequenceIndex, state] of eachIndex(states)) {
      // Add 1 since we shifted off the first index to fill initial state
      const adjustedSequenceIndex = sequenceIndex + 1;
      const {
        expectedDatum,
        actions,
        issues: expectedBoardIssues,
      } = loadAsciiGrid(state);

      // Act
      for (const action of actions) {
        await this.setUserSelection(action.index, action.tileState);
      }

      // Assert
      const actual = { str: `\n${adjustedSequenceIndex}->0` };
      const expected = { str: `\n${adjustedSequenceIndex}->0` };
      const actualState = await this.getState();
      const actualDatum = actualState.cells;
      for (const [k, expectedData] of eachIndex(expectedDatum)) {
        if (k > 0 && k % BOARD_WIDTH === 0) {
          actual.str += `|\n\n${adjustedSequenceIndex}->${Math.floor(
            k / BOARD_WIDTH
          )}|`;
          expected.str += `|\n\n${adjustedSequenceIndex}->${Math.floor(
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
          ? `\n\u001b[34mDebug: ${actualState.debug}\u001b[31m\n`
          : undefined
      ).toEqual(expected.str);
    }
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
    tileState: TileState
  ): Promise<void> | void;

  protected abstract getState():
    | Promise<{ cells: CellTestData[]; issues: BoardIssue[]; debug?: string }>
    | { cells: CellTestData[]; issues: BoardIssue[]; debug?: string };

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
      data.str += `${userSelected.slice(0, 1).toUpperCase()}`;
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
}
