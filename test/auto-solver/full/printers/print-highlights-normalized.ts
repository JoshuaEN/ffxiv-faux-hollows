import { formatter1Place, indent } from "~/test/helpers/print-helpers.js";
import { ExtendedAutoSolveRollups } from "../helpers/generate-rollups.js";
import { DISPLAY_NAME, FoxNoFoxFlag } from "../const.js";
import EasyTable from "easy-table";
import { OnlyFoxNoFox } from "../types/fox-no-fox.js";

export function printHighlightsNormalized(
  lines: string[],
  key: string,
  patternPartitions: OnlyFoxNoFox<Map<string, ExtendedAutoSolveRollups>>
) {
  const blankLeftPadder = EasyTable.leftPadder(" ");
  const table = new EasyTable();
  for (const stat of [
    // Strategies
    "UncoverSwordPresent",
    "UncoverSwordFox",
    "UncoverPresentFox",
    "UncoverAll",
  ] as const) {
    table.cell(key, indent(1) + DISPLAY_NAME[stat]);
    table.cell("Steps", "", blankLeftPadder);
    table.cell("Fox", "", blankLeftPadder);
    calc(FoxNoFoxFlag.Fox, patternPartitions.onlyFox);
    table.cell("No fox", "", blankLeftPadder);
    calc(FoxNoFoxFlag.NoFox, patternPartitions.noFox);
    table.newRow();

    function calc(
      flag: FoxNoFoxFlag,
      patternPartition: Map<string, ExtendedAutoSolveRollups>
    ) {
      let countBefore11 = 0;
      let countAfter11 = 0;
      for (const [, rollup] of patternPartition) {
        let patternCountBefore11 = 0;
        let patternCountAfter11 = 0;
        for (const [steps, count] of Array.from(
          rollup.countPerStepsInSlot[stat]
        ).sort(([a], [b]) => a - b)) {
          if (steps <= 11) {
            patternCountBefore11 += count;
          } else {
            patternCountAfter11 += count;
          }
        }

        countBefore11 += patternCountBefore11 / rollup.itemsInSlot[stat].length;
        countAfter11 += patternCountAfter11 / rollup.itemsInSlot[stat].length;
      }

      table.cell(
        `<=11${flag}`,
        `${formatter1Place.format((countBefore11 / patternPartition.size) * 100)}%`,
        blankLeftPadder
      );
      table.cell(
        `>11${flag}`,
        `${formatter1Place.format((countAfter11 / patternPartition.size) * 100)}%`,
        blankLeftPadder
      );
    }
  }

  lines.push(table.toString());
  lines.push("");
}
