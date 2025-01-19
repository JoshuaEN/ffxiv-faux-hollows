import { assert, describe, expect, test } from "vitest";
import { assertNever, eachIndex } from "../../helpers.js";
import { allTestData } from "~/test/all-data-tests.js";
import {
  BaseSequenceRunner,
  FormatDataSource,
  TestGameStateSnapshot,
} from "~/test/framework.js";
import { CellTestData } from "~/test/helpers/ascii-grid.js";
import { BOARD_CELLS } from "../constants.js";
import {
  SmartFillTileState,
  SuggestTileState,
  TileState,
  TrackedStatesIndexList,
} from "../types/index.js";
import { solve } from "./solver.js";

describe("solve", () => {
  allTestData(
    (title, ...states) => {
      test(typeof title === "string" ? title : title.title, async () => {
        await new SolverSequenceRunner().testSequence(states);
      });
    },
    { describe }
  );

  class SolverSequenceRunner extends BaseSequenceRunner {
    #userSelected: TileState[];

    constructor() {
      super((message) => expect.unreachable(message), expect);
      this.#userSelected = Array.from(this.indexes()).map(
        () => TileState.Unknown
      );
    }

    protected override formatSuggestions(
      source: FormatDataSource,
      index: number,
      data: { str: string },
      prompt: SuggestTileState | undefined,
      suggestion: { Sword: number; Present: number; Fox: number } | undefined,
      recommended: boolean | undefined
    ): void {
      if (source === FormatDataSource.Expected) {
        super.formatSuggestions(
          source,
          index,
          data,
          prompt,
          // The solver only provides tile suggestions for the recommended tile,
          // and then only provides a Yes or No indication for each possible suggestion for the recommended tiles
          // So, here we map from the suggestion weights to Yes or No indicator (1 or 0) if this tile is recommended,
          // Otherwise, we provide undefined.
          suggestion !== undefined &&
            ((prompt === undefined && recommended === true) ||
              (prompt === SuggestTileState.SuggestFox && recommended !== true))
            ? {
                Sword: suggestion.Sword > 0 ? 1 : 0,
                Present: suggestion.Present > 0 ? 1 : 0,
                Fox: suggestion.Fox > 0 ? 1 : 0,
              }
            : undefined,
          prompt !== undefined ? undefined : recommended
        );
      } else {
        super.formatSuggestions(
          source,
          index,
          data,
          prompt,
          suggestion,
          recommended
        );
      }
    }

    protected setUserSelection(
      index: number,
      tileState: TileState
    ): void | Promise<void> {
      this.#userSelected[index] = tileState;
    }

    protected getState(): TestGameStateSnapshot {
      const { tiles, issues, solveState } = this.#solve();
      assert.lengthOf(tiles, BOARD_CELLS);
      const cells: CellTestData[] = [];
      for (const index of this.indexes()) {
        const tile = tiles[index];
        if (tile === undefined) {
          assert.fail(`Solve returned less tiles than indexes`);
        }

        if (Array.isArray(tile)) {
          const suggestions: CellTestData["suggestions"] = {
            Sword: 0,
            Present: 0,
            Fox: 0,
          };
          for (const suggestion of tile) {
            switch (suggestion) {
              case SuggestTileState.SuggestSword: {
                suggestions.Sword = 1;
                break;
              }
              case SuggestTileState.SuggestPresent: {
                suggestions.Present = 1;
                break;
              }
              case SuggestTileState.SuggestFox: {
                suggestions.Fox = 1;
                break;
              }
              default: {
                assertNever(suggestion);
              }
            }
          }
          cells.push({ suggestions, recommended: true });
          continue;
        }

        switch (tile) {
          case TileState.Blocked:
          case TileState.Empty:
          case TileState.Sword:
          case TileState.Present:
          case TileState.Fox:
          case TileState.Unknown: {
            cells.push({ userSelection: tile });
            continue;
            break; // eslint
          }
          case SmartFillTileState.SmartFillBlocked:
          case SmartFillTileState.SmartFillSword:
          case SmartFillTileState.SmartFillPresent: {
            cells.push({ smartFill: tile });
            continue;
            break; // eslint
          }
          case SuggestTileState.SuggestSword:
          case SuggestTileState.SuggestPresent: {
            cells.push({ prompt: tile });
            continue;
            break;
          }
          case SuggestTileState.SuggestFox: {
            cells.push({
              suggestions: { Sword: 0, Present: 0, Fox: 1 },
              prompt: SuggestTileState.SuggestFox,
            });
            continue;
            // assert.fail(
            //   `Suggest Tile State of fox is not supported in Fill mode (Fox is only valid when suggestions are an array of suggestions)`
            // );
            break; // eslint
          }
          default: {
            assertNever(tile);
          }
        }
      }

      return {
        cells,
        issues,
        patternData: {
          patternIdentifier: solveState.getPatternIdentifier(),
          remainingPatterns: solveState.totalCandidatePatterns,
        },
        debug: `Solve Step: ${solveState.solveStep}`,
      };
    }
    #solve() {
      const userStatesIndexList: TrackedStatesIndexList<Set<number>> = {
        [TileState.Blocked]: new Set<number>(),
        [TileState.Present]: new Set<number>(),
        [TileState.Sword]: new Set<number>(),
        [TileState.Fox]: new Set<number>(),
        [TileState.Empty]: new Set<number>(),
      };
      for (const [j, cell] of eachIndex(this.#userSelected)) {
        if (cell in userStatesIndexList) {
          userStatesIndexList[
            cell as keyof TrackedStatesIndexList<Set<number>>
          ].add(j);
        }
      }
      return solve(this.#userSelected, userStatesIndexList);
    }
  }
});
