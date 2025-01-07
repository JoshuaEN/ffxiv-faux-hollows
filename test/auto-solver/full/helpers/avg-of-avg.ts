import { AutoSolveExpandedResultStepsTo } from "../types/expanded-result.js";
import { ExtendedAutoSolveRollups } from "./generate-rollups.js";

export function avgOfAvg(
  rollups: Iterable<ExtendedAutoSolveRollups>,
  stat: keyof AutoSolveExpandedResultStepsTo
) {
  let reducer = 0;
  let count = 0;
  for (const rollup of rollups) {
    reducer += rollup.totalsInSlot[stat] / rollup.itemsInSlot[stat].length;
    count++;
  }
  return reducer / count;
}
