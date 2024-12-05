import { AutoSolveExpandedResult } from "../generate-summaries.js";

export interface RollupSummary {
  total: number;
  totalCount: number;
  min: number;
  max: number;
}

export function calculateRollupSummary(
  summaries: AutoSolveExpandedResult[],
  lookup:
    | keyof AutoSolveExpandedResult["stepsTo"]
    | ((summary: AutoSolveExpandedResult) => number),
  groupByFn: (summary: AutoSolveExpandedResult) => string | number
) {
  const lookupFn =
    typeof lookup === "string"
      ? (summary: AutoSolveExpandedResult) => summary.stepsTo[lookup]
      : lookup;

  const byGroup = new Map<string | number, RollupSummary>();

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
