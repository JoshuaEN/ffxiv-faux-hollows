import { ShortCircuitAutoSolveExpandedResult } from "./generate-summaries.js";
import { assert } from "~/src/helpers.js";

export function deduplicateSummaries(
  summaries: ShortCircuitAutoSolveExpandedResult[]
) {
  const deduplicatedSummaries: ShortCircuitAutoSolveExpandedResult[] = [];

  {
    const deduplicatedSummariesMap = new Map<
      string,
      ShortCircuitAutoSolveExpandedResult
    >();

    for (const summary of summaries) {
      const key = `
      ${summary.blocked.join(",")}
      ${summary.pattern.Sword}${summary.pattern.Sword3x2}
      ${summary.pattern.Present}
      ${summary.foxIndex}
      |
      ${summary.stepsTo.FoundAll}
      ${summary.stepsTo.FoundSword}
      ${summary.stepsTo.FoundPresent}
      ${summary.stepsTo.UncoverSword}
      ${summary.stepsTo.UncoverPresent}
      ${summary.stepsTo.FoundFox}
      ${summary.stepsTo.UncoverFox}
      ${summary.stepsTo.UncoverSwordFox}
      ${summary.stepsTo.UncoverPresentFox}`;

      const existing = deduplicatedSummariesMap.get(key);
      if (existing !== undefined) {
        assert(existing.stepsTo.FoundSword === summary.stepsTo.FoundSword);
        assert(existing.stepsTo.FoundPresent === summary.stepsTo.FoundPresent);
        assert(existing.stepsTo.FoundFox === summary.stepsTo.FoundFox);
        assert(existing.stepsTo.FoundAll === summary.stepsTo.FoundAll);
        assert(
          existing.stepsTo.UncoverSwordPresent ===
            summary.stepsTo.UncoverSwordPresent
        );
        assert(existing.stepsTo.UncoverAll === summary.stepsTo.UncoverAll);
      } else {
        deduplicatedSummariesMap.set(key, summary);
        deduplicatedSummaries.push(summary);
      }
    }
  }
  return deduplicatedSummaries;
}
