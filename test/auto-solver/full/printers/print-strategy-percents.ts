import EasyTable from "easy-table";
import { ExtendedAutoSolveRollups } from "../helpers/generate-rollups.js";
import {
  formatter,
  formatter1Place,
  getMedian,
  getStandardDeviation,
  indent,
} from "~/test/helpers/print-helpers.js";
import { DISPLAY_NAME } from "../const.js";
import { printTable } from "../helpers/print-table.js";

export function printStrategyPercents(
  lines: string[],
  key: string,
  rollups: ExtendedAutoSolveRollups
) {
  const blankLeftPadder = EasyTable.leftPadder(" ");
  const table = new EasyTable();
  lines.push();
  for (const stat of [
    // Strategies
    "UncoverSwordPresent",
    "UncoverSwordFox",
    "UncoverPresentFox",
    "UncoverAll",
    // Interesting metrics
    "FoundSword",
    "FoundPresent",
    "FoundSwordPresent",
    "FoundFoxCandidates",
    "UncoverSword",
    "UncoverPresent",
    "UncoverFox",
  ] as const) {
    table.cell(key, indent(1) + DISPLAY_NAME[stat]);
    table.cell("Steps", "");
    table.cell("%", "");
    table.cell(
      "Avg",
      formatter.format(
        rollups.totalsInSlot[stat] / rollups.itemsInSlot[stat].length
      ),
      blankLeftPadder
    );
    table.cell("min", rollups.minInSlot[stat], blankLeftPadder);
    table.cell("max", rollups.maxInSlot[stat], blankLeftPadder);
    table.cell(
      "median",
      formatter1Place.format(getMedian(rollups.itemsInSlot[stat])),
      blankLeftPadder
    );
    table.cell(
      "Stdev",
      formatter.format(getStandardDeviation(rollups.itemsInSlot[stat])),
      blankLeftPadder
    );
    table.cell("Count", rollups.itemsInSlot[stat].length, blankLeftPadder);
    table.newRow();
    for (const [steps, count] of Array.from(
      rollups.countPerStepsInSlot[stat]
    ).sort(([a], [b]) => a - b)) {
      table.cell("Steps", steps, blankLeftPadder);
      table.cell(
        "%",
        `${formatter.format((count / rollups.itemsInSlot[stat].length) * 100)}%`,
        blankLeftPadder
      );
      table.cell("Count", count, blankLeftPadder);
      table.newRow();
    }

    table.newRow();
  }

  printTable(table, key, lines);
}
