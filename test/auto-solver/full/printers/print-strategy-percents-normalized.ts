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
import { avgOfAvg } from "../helpers/avg-of-avg.js";
import { printTable } from "../helpers/print-table.js";

export function printStrategyPercentsNormalized(
  lines: string[],
  key: string,
  rollups: ExtendedAutoSolveRollups,
  patternPartitions: Map<string, ExtendedAutoSolveRollups>
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
      formatter.format(avgOfAvg(patternPartitions.values(), stat)),
      blankLeftPadder
    );
    table.cell("min", rollups.minInSlot[stat], blankLeftPadder);
    table.cell("max", rollups.maxInSlot[stat], blankLeftPadder);
    table.cell(
      "median",
      formatter1Place.format(
        getMedian(
          Array.from(patternPartitions.values()).map((value) =>
            getMedian(value.itemsInSlot[stat])
          )
        )
      ),
      blankLeftPadder
    );
    table.cell(
      "Stdev",
      formatter.format(
        getStandardDeviation(
          Array.from(patternPartitions.values()).map((value) =>
            getStandardDeviation(value.itemsInSlot[stat])
          )
        )
      ),
      blankLeftPadder
    );
    table.cell("Count", `${patternPartitions.size}`, blankLeftPadder);
    table.cell(
      "pre-normalized",
      `${rollups.itemsInSlot[stat].length}`,
      blankLeftPadder
    );
    table.newRow();

    for (const [steps, count] of Array.from(
      rollups.countPerStepsInSlot[stat]
    ).sort(([a], [b]) => a - b)) {
      table.cell("Steps", steps, blankLeftPadder);
      let totalWeight = 0;
      for (const value of Array.from(patternPartitions.values())) {
        const countForStep = value.countPerStepsInSlot[stat].get(steps);
        if (countForStep === undefined) {
          continue;
        }
        totalWeight += countForStep / value.itemsInSlot[stat].length;
      }
      table.cell(
        "%",
        `${formatter.format((totalWeight / patternPartitions.size) * 100)}%`,
        blankLeftPadder
      );
      table.cell("Count", formatter.format(totalWeight), blankLeftPadder);
      table.cell("pre-normalized", `${count}`, blankLeftPadder);
      table.newRow();
    }

    table.newRow();
  }

  printTable(table, key, lines);
}
