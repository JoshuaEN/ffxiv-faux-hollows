import {
  formatter,
  formatter1Place,
  indent,
} from "~/test/helpers/print-helpers.js";
import { ExtendedAutoSolveRollups } from "../helpers/generate-rollups.js";
import { DISPLAY_NAME, FoxNoFoxFlag } from "../const.js";
import EasyTable from "easy-table";

export function printHighlights(
  lines: string[],
  key: string,
  rollupsFox: ExtendedAutoSolveRollups,
  rollupsNoFox: ExtendedAutoSolveRollups
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
    calc(rollupsFox, FoxNoFoxFlag.Fox);
    table.cell("No fox", "", blankLeftPadder);
    calc(rollupsNoFox, FoxNoFoxFlag.NoFox);
    table.newRow();

    function calc(rollups: ExtendedAutoSolveRollups, flag: FoxNoFoxFlag) {
      let countBefore11 = 0;
      let countAfter11 = 0;
      for (const [steps, count] of Array.from(
        rollups.countPerStepsInSlot[stat]
      ).sort(([a], [b]) => a - b)) {
        if (steps <= 11) {
          countBefore11 += count;
        } else {
          countAfter11 += count;
        }
      }

      table.cell(
        `<=11${flag}`,
        `${formatter1Place.format((countBefore11 / rollups.itemsInSlot[stat].length) * 100)}%`,
        blankLeftPadder
      );
      table.cell(
        `>11${flag}`,
        `${formatter1Place.format((countAfter11 / rollups.itemsInSlot[stat].length) * 100)}%`,
        blankLeftPadder
      );
    }
  }

  lines.push(table.toString());
  lines.push("");
}
