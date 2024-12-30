import { AutoSolveExpandedResult } from "../generate-summaries.js";
import { printExpandedResultSummary } from "./print-expanded-result-summary.js";

export function printFullExpandedResultSummary(
  lines: string[],
  groups: { title: string; summaries: AutoSolveExpandedResult[] }[]
) {
  for (const identifier of [null, "A", "B", "C", "D"] as const) {
    for (const { title, summaries } of groups) {
      const formattedTitle =
        title.length === 0
          ? identifier === null
            ? ""
            : `${identifier} - `
          : identifier === null
            ? `${title} `
            : `${identifier} - ${title} `;
      const filteredSummaries =
        identifier === null
          ? summaries
          : summaries.filter((p) => p.identifier === identifier);
      printExpandedResultSummary(
        lines,
        formattedTitle,
        filteredSummaries.map((r) => r.stepsTo)
      );
    }
  }
}
