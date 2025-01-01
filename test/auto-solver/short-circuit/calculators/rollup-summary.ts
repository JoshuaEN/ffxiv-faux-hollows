import { ShortCircuitAutoSolveExpandedResult } from "../generate-summaries.js";

export interface ShortCircuitAutoSolverRollupSummary {
  total: number;
  totalCount: number;
  min: number;
  max: number;
}

export function calculateRollupSummary(
  summaries: ShortCircuitAutoSolveExpandedResult[],
  lookup:
    | keyof ShortCircuitAutoSolveExpandedResult["stepsTo"]
    | ((summary: ShortCircuitAutoSolveExpandedResult) => number),
  groupByFn: (summary: ShortCircuitAutoSolveExpandedResult) => string | number
) {
  const lookupFn =
    typeof lookup === "string"
      ? (summary: ShortCircuitAutoSolveExpandedResult) =>
          summary.stepsTo[lookup]
      : lookup;

  const byGroup = new Map<
    string | number,
    ShortCircuitAutoSolverRollupSummary
  >();

  for (const summary of summaries) {
    const value = lookupFn(summary);
    const groupKey = groupByFn(summary);

    let groupData = byGroup.get(groupKey);
    if (groupData === undefined) {
      groupData = {
        total: 0,
        totalCount: 0,
        min: value,
        max: value,
      };
      byGroup.set(groupKey, groupData);
    }

    groupData.totalCount += 1;
    groupData.total += value;
    groupData.min = Math.min(groupData.min, value);
    groupData.max = Math.max(groupData.max, value);
  }

  return byGroup;
}
