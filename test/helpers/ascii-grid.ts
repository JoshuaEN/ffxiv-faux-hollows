import { BOARD_CELLS, BOARD_WIDTH } from "~/src/game/constants.js";
import {
  BoardIssue,
  BoardIssueSeverity,
  SmartFillTileState,
  SuggestTileState,
  TileState,
} from "~/src/game/types/index.js";
import { assertNever } from "~/src/helpers.js";

enum AsciiParts {
  TopLeft = "┌",
  BottomLeft = "└",
  TopRight = "┐",
  BottomRight = "┘",
  TDown = "┬",
  TRight = "├",
  TLeft = "┤",
  TUp = "┴",
  Plus = "┼",
  Horizontal = "─",
  Vertical = "│",
}

enum Slot1Mode {
  UserAction = ">",
  ExistingState = " ",
  Suggestion = "?",
}

const tileStateMap: Record<string, TileState | undefined> = {
  U: TileState.Unknown,
  E: TileState.Empty,
  B: TileState.Blocked,
  S: TileState.Sword,
  P: TileState.Present,
  F: TileState.Fox,
};
const smartFillStateMap: Record<string, SmartFillTileState | undefined> = {
  b: SmartFillTileState.SmartFillBlocked,
  s: SmartFillTileState.SmartFillSword,
  p: SmartFillTileState.SmartFillPresent,
};
const promptTileStateMap: Record<string, SuggestTileState | undefined> = {
  s: SuggestTileState.SuggestSword,
  p: SuggestTileState.SuggestPresent,
  f: SuggestTileState.SuggestFox,
};

export interface CellTestData {
  userSelection?: TileState;
  smartFill?: SmartFillTileState | null;
  suggestions?: {
    Sword: number;
    Present: number;
    Fox: number;
  };
  recommended?: boolean;
  prompt?: SuggestTileState;
}

export interface TestPatternData {
  patternIdentifier: string | null;
  remainingPatterns: number | null;
}

export function loadAsciiGrid(str: string) {
  const cells: CellTestData[] = [];
  const actions: {
    tileState: TileState;
    index: number;
    expectInvalidMove: boolean;
  }[] = [];
  const rows = str.split(/\r?\n/);
  let startFound = false;
  let logicalRowIndex = 0;
  const patternData: TestPatternData = {
    patternIdentifier: null,
    remainingPatterns: null,
  };

  // Process the main body of the table
  let i = 0;
  for (; i < rows.length; i++) {
    const row = rows[i]?.trim() ?? "";
    if (!startFound && row.startsWith("ID")) {
      if (patternData.patternIdentifier !== null) {
        throw new Error(`Header ID was already set`);
      }
      patternData.patternIdentifier = row.slice("ID ".length);
      if (patternData.patternIdentifier.length < 0) {
        throw new Error(`Header ID contained no value: ${row}`);
      } else if (patternData.patternIdentifier.length > 2) {
        throw new Error(`Header ID contained too large of a value: ${row}`);
      }
      if (
        patternData.patternIdentifier[0] !== "A" &&
        patternData.patternIdentifier[0] !== "B" &&
        patternData.patternIdentifier[0] !== "C" &&
        patternData.patternIdentifier[0] !== "D"
      ) {
        throw new Error(
          `Header ID did not start  with A, B, C, or D: ${row} | Found pattern char: ${patternData.patternIdentifier[0]}`
        );
      }
      continue;
    } else if (!startFound && row.startsWith("## ")) {
      if (patternData.remainingPatterns !== null) {
        throw new Error(`Header ## (remaining patterns) was already set`);
      }

      patternData.remainingPatterns = parseInt(row.slice("## ".length), 10);
      if (isNaN(patternData.remainingPatterns)) {
        throw new Error(
          `Header ## (remaining patterns) contained an invalid number`
        );
      }
      continue;
    } else if (!startFound && !row.startsWith(AsciiParts.TopLeft)) {
      continue;
    } else if (!startFound) {
      startFound = true;
    }

    if (row.startsWith(AsciiParts.BottomLeft)) {
      i++;
      break;
    }

    const dataRow = rows[i + 1]?.trim() ?? undefined;
    const rowErrorContext = `[Row ${logicalRowIndex}]`;
    logicalRowIndex++;
    if (dataRow === undefined) {
      throw new Error(`${rowErrorContext} Row is undefined`);
    }

    if (!dataRow.startsWith(AsciiParts.Vertical)) {
      throw new Error(
        `${rowErrorContext} Row start with ${dataRow[0]}, not ${AsciiParts.Vertical}`
      );
    }
    if (!dataRow.endsWith(AsciiParts.Vertical)) {
      throw new Error(
        `${rowErrorContext} Row ends with ${dataRow[dataRow.length - 1]}, not ${
          AsciiParts.Vertical
        }`
      );
    }

    // We remove the first and last index because they are empty strings from the edges of the board
    const columns = dataRow.split(AsciiParts.Vertical).slice(1, -1);

    if (columns.length !== BOARD_WIDTH) {
      throw new Error(
        `${rowErrorContext} Found ${columns.length} columns in row, expected ${BOARD_WIDTH}`
      );
    }

    let userActionSequenceId: boolean | null = null;

    // Columns
    for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
      const column = columns[columnIndex];
      const columnErrorContext = `${rowErrorContext}[Col ${columnIndex}]`;

      if (column === undefined) {
        throw new Error(`${columnErrorContext} is undefined`);
      }
      if (column.length !== 5) {
        throw new Error(
          `${columnErrorContext} Should have 5 slots, instead has ${column.length}`
        );
      }

      // Sub-parts of the column
      const [column0, column1, column2, column3, column4] = column;
      if (
        column0 === undefined ||
        column1 === undefined ||
        column2 === undefined ||
        column3 === undefined ||
        column4 === undefined
      ) {
        throw new Error(
          `${columnErrorContext} Should have 5 slots, instead has ${column.length}`
        );
      }

      switch (column0) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        case Slot1Mode.UserAction: {
          const userSelection = tileStateMap[column1];
          if (userSelection === undefined) {
            throw new Error(
              `${columnErrorContext}[Slot 2] Invalid character ${column1}`
            );
          }

          let sequence = column2 !== " " ? parseInt(column2, 16) : undefined;
          if (sequence !== undefined && Number.isNaN(sequence)) {
            throw new Error(
              `${columnErrorContext}[Slot 3] Invalid sequence number ${column2}`
            );
          }

          if (userActionSequenceId === null) {
            userActionSequenceId = sequence === undefined ? false : true;
          }

          if (userActionSequenceId) {
            // Previously (or currently) the sequence IDs have been provided
            if (sequence === undefined) {
              throw new Error(
                `${columnErrorContext}[Slot 3] Invalid mix of sequence numbers and no sequence number ${column2}`
              );
            }
            if (sequence === 0) {
              throw new Error(
                `${columnErrorContext}[Slot 3] Invalid sequence number 0; sequence numbers must start at 1`
              );
            }

            // We actually need the sequences to be zero-based,
            // but we also require the provided sequenceIds to be 1 based
            // so we subtract one here.
            sequence -= 1;
          } else {
            // Previously (or currently) no sequence ID has been provided
            if (sequence !== undefined) {
              throw new Error(
                `${columnErrorContext}[Slot 3] Invalid mix of sequence numbers and no sequence number ${column2}`
              );
            }
            sequence = 0;
          }

          if (actions[sequence] !== undefined) {
            throw new Error(
              `${columnErrorContext}[Slot 3] Sequence number ${sequence} is duplicated`
            );
          }

          const expectInvalidMove =
            column3 === "!" ? true : column3 === " " ? false : null;

          if (expectInvalidMove === null) {
            throw new Error(
              `${columnErrorContext}[Slot 4] Invalid expectInvalidMove flag ${column3}`
            );
          }

          actions[sequence] = {
            tileState: userSelection,
            index: cells.length,
            expectInvalidMove,
          };

          cells.push({
            userSelection,
          });
          continue;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        case Slot1Mode.ExistingState: {
          const userSelection =
            column1 === " " ? TileState.Unknown : tileStateMap[column1];
          if (userSelection === undefined) {
            throw new Error(
              `${columnErrorContext}[Slot 2] Invalid character ${column1}`
            );
          }
          const smartFill = column2 === " " ? null : smartFillStateMap[column2];
          if (smartFill === undefined) {
            throw new Error(
              `${columnErrorContext}[Slot 3] Invalid character ${column2}`
            );
          }

          cells.push({
            userSelection,
            smartFill,
          });
          break;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        case Slot1Mode.Suggestion: {
          if (column1 !== "f") {
            throw new Error(
              `${columnErrorContext}[Slot 1] Invalid character ${column1} (in suggestion mode, only the fox can be suggested)`
            );
          }
          if (column2 !== " ") {
            throw new Error(
              `${columnErrorContext}[Slot 2] Invalid character ${column2} (in suggestion mode, only fox can be set)`
            );
          }
          if (column3 !== " ") {
            throw new Error(
              `${columnErrorContext}[Slot 3] Invalid character ${column3} (in suggestion mode, only fox can be set)`
            );
          }
          const Fox = column4 === " " ? 0 : parseInt(column4, 16);
          if (!Number.isFinite(Fox)) {
            throw new Error(
              `${columnErrorContext}[Slot 4] Invalid character ${column4} (not a valid hex value)`
            );
          }

          cells.push({
            suggestions: {
              Sword: 0,
              Present: 0,
              Fox,
            },
            prompt: SuggestTileState.SuggestFox,
          });
          break;
        }
        default: {
          if (!column.startsWith("*") && !column.startsWith(".")) {
            throw new Error(
              `${columnErrorContext}[Slot 0] Unknown column ${column0}`
            );
          }
          const Sword = column1 === " " ? 0 : parseInt(column1, 16);
          if (!Number.isFinite(Sword)) {
            throw new Error(
              `${columnErrorContext}[Slot 1] Invalid character ${column1} (not a valid hex value)`
            );
          }
          const Present = column2 === " " ? 0 : parseInt(column2, 16);
          if (!Number.isFinite(Present)) {
            throw new Error(
              `${columnErrorContext}[Slot 2] Invalid character ${column2} (not a valid hex value)`
            );
          }
          const Fox = column3 === " " ? 0 : parseInt(column3, 16);
          if (!Number.isFinite(Fox)) {
            throw new Error(
              `${columnErrorContext}[Slot 3] Invalid character ${column3} (not a valid hex value)`
            );
          }
          const prompt = column4 === " " ? null : promptTileStateMap[column4];
          switch (prompt) {
            case SuggestTileState.SuggestSword:
            case SuggestTileState.SuggestPresent: {
              // This is a valid prompt
              break;
            }
            case SuggestTileState.SuggestFox: {
              throw new Error(
                `${columnErrorContext}[Slot 4] Fox is not a valid prompt; a prompt indicates we are in "FillX" mode, and there is no "FillFox" mode (because foxes are 1x1 in size, and FillX is used when the user has entered at least one tile of a shape but there is not enough information given [to us by the user, the user has all the information they need to fill in the shape] to complete the shape)`
              );
            }
            case undefined: {
              throw new Error(
                `${columnErrorContext}[Slot 4] ${column4} is not a valid prompt`
              );
            }
            case null: {
              // No prompt
              break;
            }
            default: {
              assertNever(prompt);
            }
          }
          const recommended = column.startsWith("*");

          cells.push({
            suggestions: {
              Sword,
              Present,
              Fox,
            },
            prompt: prompt ?? undefined,
            recommended,
          });
        }
      }
    }

    // Skip over the data row we just processed
    i++;
  }

  const issues = [] as BoardIssue[];
  for (; i < rows.length; i++) {
    const row = rows[i]?.trim();
    if (row === undefined || row.length === 0) {
      continue;
    }
    const matches =
      /^\[(?<severity>[A-z]+)\] (?<message>[^#]+)( # Issues: (?<issueTilesStr>[0-9, ]+))?$/.exec(
        row
      );

    if (matches?.groups === undefined) {
      throw new Error(`Failed to parse issues row: ${row}; no match or groups`);
    }
    const { severity, message, issueTilesStr } = matches.groups;
    if (severity === undefined || message === undefined) {
      throw new Error(
        `Failed to parse issues row: ${row}; no severity or message`
      );
    }
    const issueTiles =
      issueTilesStr !== undefined
        ? issueTilesStr.split(", ").map((n) => Number.parseInt(n))
        : [];

    if (!(severity in BoardIssueSeverity)) {
      throw new Error(
        `Failed to parse issues row: ${row}; ${severity} is not a BoardIssueSeverity`
      );
    }

    issues.push({
      severity: severity as BoardIssueSeverity,
      message,
      issueTiles,
    });
  }
  issues.sort();

  for (let j = 0; j < actions.length; j++) {
    if (actions[j] === undefined) {
      throw new Error(`Sequence at index ${j} is missing`);
    }
  }
  if (cells.length !== BOARD_CELLS) {
    throw new Error(`Total of ${cells.length} found, expected ${BOARD_CELLS}`);
  }

  return {
    actions,
    expectedDatum: cells,
    expectedPatternData: patternData,
    issues,
  };
}
