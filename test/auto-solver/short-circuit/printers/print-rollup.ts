import {
  ShortCircuitAutoSolverRollupSummary,
  calculateRollupSummary,
} from "../calculators/rollup-summary.js";
import {
  formatter,
  formatterPercent,
  indent,
} from "~/test/helpers/print-helpers.js";

export function printRollup(
  lines: string[],
  rollups: ReturnType<typeof calculateRollupSummary>,
  mode: "value" | "count" = "value",
  identLevel = 2
) {
  const keyLen = Array.from(rollups.keys()).reduce(
    (p: number, c) => Math.max(p, `${c}`.length),
    0
  );
  const totalTotalCount = calculateRollupTotalTotalCount(rollups);
  for (const [rollupKey, rollupData] of Array.from(rollups.entries()).sort(
    ([a], [b]) => {
      if (typeof a === "string" && typeof b === "string") {
        return b.localeCompare(a);
      }
      if (typeof a === "number" && typeof b === "number") {
        return b - a;
      }
      if (typeof a === "number") {
        return 1;
      }
      return -1;
    }
  )) {
    lines.push(
      `${indent(identLevel)}${rollupKey.toString().padEnd(keyLen, " ")} -> ${stringifyRollupSummary(mode, totalTotalCount, rollupData)}`
    );
  }
}

function calculateRollupTotalTotalCount(
  rollups: ReturnType<typeof calculateRollupSummary>
) {
  return Array.from(rollups.values()).reduce((p, c) => p + c.totalCount, 0);
}

function stringifyRollupSummary(
  mode: "value" | "count",
  totalTotalCount: number,
  summary: ShortCircuitAutoSolverRollupSummary
) {
  const valueData = `Min ${summary.min} | Max ${summary.max} | Avg ${formatter.format(summary.totalCount / summary.total)}`;
  return (
    (mode === "value" ? valueData + " | " : "") +
    `Total ${formatterPercent.format(summary.totalCount / totalTotalCount).padStart(7, " ")} | Total ${summary.totalCount.toString().padStart(6, " ")}`
  );
}
