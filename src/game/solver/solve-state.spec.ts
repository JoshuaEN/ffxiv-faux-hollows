import { describe, expect, test } from "vitest";
import { eachIndex } from "../../helpers.js";
import { allTestData } from "~/test/all-data-tests.js";
import {
  BaseSequenceRunner,
  FormatDataSource,
} from "../../../test/framework.js";
import { CellTestData } from "../../../test/helpers/ascii-grid.js";
import {
  SmartFillTileState,
  SuggestTileState,
  TileState,
  TrackedStatesIndexList,
} from "../types/index.js";
import { calculatedSolveState } from "./solve-state.js";
/**
 * Legend:
 *
 * Each grid represents one or more user inputs, and the net result of those moves.
 * For one user input, the cause -> effect is simple:
 * A single user input is performed, and some state results
 * Each tile is divided into four slots:
 * ┼────┼
 * │1234│
 * ├────┼
 *
 * Slot 1 is either:
 * a. User action indicator: >
 * b. A space
 * c. Recommendation indicator: *
 *    Weight indicator: %
 * d. Suggestion indicator: ?
 *
 * if slot 1 is (a), then:
 * - Slot 2 is the tile selection by the user
 * - Slot 3 is an optional sequence number
 * - Slot 4 is unused.
 *
 * If slot 1 is (b), then:
 * - Slot 2 is a previous user selection (or blank indicating "Unknown")
 * - Slot 3 is the smart-fill state (or blank indicating "None")
 * - Slot 4 is unused
 *
 *
 * If slot 1 is (c), then:
 * - Slot 1 is the number of Swords (1 through 12 (c))
 * - Slot 2 is the number of Presents (1 through 4)
 * - Slot 3 is the number of Foxes (1 through ?)
 * - Slot 4 is if this tile is recommended (*)
 *
 * If slot 1 is (d), then:
 * - Slot 2 is if Blocked, Sword, or Present is suggested
 *
 */

describe("calculatedSolveState", () => {
  allTestData(
    (title, ...states) => {
      test(title, async () => {
        await new SolveStateSequenceRunner().testSequence(states);
      });
    },
    { describe }
  );

  class SolveStateSequenceRunner extends BaseSequenceRunner {
    static #smartFillMap = {
      [TileState.Blocked]: SmartFillTileState.SmartFillBlocked,
      [TileState.Sword]: SmartFillTileState.SmartFillSword,
      [TileState.Present]: SmartFillTileState.SmartFillPresent,
    };
    #userSelected: TileState[];

    constructor() {
      super((message) => expect.unreachable(message), expect);
      this.#userSelected = Array.from(this.indexes()).map(
        () => TileState.Unknown
      );
    }

    protected setUserSelection(
      index: number,
      tileState: TileState
    ): void | Promise<void> {
      this.#userSelected[index] = tileState;
    }

    protected formatSuggestions(
      source: FormatDataSource,
      index: number,
      data: { str: string },
      prompt: SuggestTileState | undefined,
      suggestion: { Sword: number; Present: number; Fox: number } | undefined,
      recommended: boolean | undefined
    ): void {
      // We ignore prompts because prompts are generated by the solver, not us.
      super.formatSuggestions(
        source,
        index,
        data,
        undefined,
        suggestion,
        recommended
      );
    }

    protected getState() {
      const { solveState, issues } = this.calculateSolveState();
      const cells: CellTestData[] = [];
      for (const index of this.indexes()) {
        const smartFill = solveState.getSmartFill(index);
        const suggestion = solveState.getSuggestion(index);
        const finalWeight = solveState.getFinalWeight(index);
        const data: CellTestData = {
          userSelection: this.#userSelected[index],
          smartFill:
            smartFill !== null
              ? SolveStateSequenceRunner.#smartFillMap[smartFill]
              : null,
        };
        data.suggestions = suggestion ?? undefined;
        data.recommended =
          finalWeight !== null &&
          finalWeight.value > 0 &&
          solveState.getMaxTileWeight() === finalWeight.value;

        cells.push(data);
      }

      return {
        cells,
        issues,
        debug: `Solve Step: ${
          solveState.solveStep
        } | Pattern: ${solveState.getPatternIdentifier()}`,
      };
    }
    protected calculateSolveState() {
      const userStatesIndexList: TrackedStatesIndexList<Set<number>> = {
        [TileState.Blocked]: new Set<number>(),
        [TileState.Present]: new Set<number>(),
        [TileState.Sword]: new Set<number>(),
        [TileState.Fox]: new Set<number>(),
      };
      for (const [j, cell] of eachIndex(this.#userSelected)) {
        if (cell in userStatesIndexList) {
          userStatesIndexList[
            cell as keyof TrackedStatesIndexList<Set<number>>
          ].add(j);
        }
      }
      return calculatedSolveState(this.#userSelected, userStatesIndexList);
    }
  }
});
